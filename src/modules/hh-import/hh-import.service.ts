import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { JobStatus } from '../../common/enums/job-status.enum';
import {
  CityEntity,
  EmployerProfileEntity,
  JobEntity,
} from '../../database/entities';

interface HhVacancy {
  id: string;
  name: string;
  alternate_url: string;
  description?: string;
  snippet?: { requirement?: string; responsibility?: string };
  salary?: { from?: number; to?: number; currency?: string } | null;
  area?: { name?: string } | null;
  employer?: { name?: string; id?: string } | null;
}

interface HhSearchResponse {
  items: HhVacancy[];
  pages: number;
  page: number;
  found: number;
}

/**
 * Импортирует вакансии с HH.kz (api.hh.ru) в базу приложения.
 * Вакансии сохраняются со status=PUBLISHED, source='hh'.
 * Для работы нужен системный пользователь-работодатель с EMPLOYER_ID=<uuid> в .env.
 * Без него импорт пропускается (warn в логах).
 */
@Injectable()
export class HhImportService {
  private readonly log = new Logger(HhImportService.name);
  private readonly hhApiUrl = 'https://api.hh.ru';
  private readonly systemEmployerUserId: string | null;
  private readonly enabled: boolean;
  /**
   * HH требует пару заголовков User-Agent и HH-User-Agent в формате
   * `ИмяПриложения/версия (реальный@email)` — см. https://github.com/hhru/api
   * Без этого часто 400 bad_user_agent или 403 forbidden; «чужие» и шаблонные
   * строки могут попадать в blacklist.
   */
  private readonly hhUserAgent: string;

  constructor(
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employerProfiles: Repository<EmployerProfileEntity>,
    @InjectRepository(CityEntity)
    private readonly cities: Repository<CityEntity>,
    private readonly config: ConfigService,
  ) {
    this.systemEmployerUserId =
      this.config.get<string>('HH_SYSTEM_EMPLOYER_USER_ID')?.trim() ?? null;
    this.enabled = this.config.get<string>('HH_IMPORT_ENABLED') === 'true';
    this.hhUserAgent =
      this.config.get<string>('HH_API_USER_AGENT')?.trim() ||
      'SJS-Back/1.0 (please-set-HH_API_USER_AGENT-in-env)';

    if (!this.enabled) {
      this.log.log('HH import disabled (HH_IMPORT_ENABLED != true)');
    } else if (!this.systemEmployerUserId) {
      this.log.warn('HH_SYSTEM_EMPLOYER_USER_ID not set — HH import will be skipped');
    }
    if (this.enabled && this.hhUserAgent.includes('please-set-HH_API_USER_AGENT')) {
      this.log.warn(
        'HH_API_USER_AGENT is not set — HH may return 403/forbidden or blacklist this agent. ' +
          'Set HH_API_USER_AGENT to "YourApp/1.0 (you@company.com)" per https://github.com/hhru/api',
      );
    }
  }

  /** Запускается раз в 6 часов. */
  @Cron(CronExpression.EVERY_6_HOURS)
  async runScheduled(): Promise<void> {
    if (!this.enabled) return;
    await this.importVacancies();
  }

  /** Ручной запуск (из Admin-контроллера). */
  async importVacancies(text = 'стажировка OR internship', area = '160'): Promise<{ imported: number; skipped: number }> {
    if (!this.systemEmployerUserId) {
      this.log.warn('HH import skipped — HH_SYSTEM_EMPLOYER_USER_ID not configured');
      return { imported: 0, skipped: 0 };
    }

    const employerProfile = await this.employerProfiles.findOne({
      where: { userId: this.systemEmployerUserId },
    });
    if (!employerProfile) {
      this.log.error(`System employer profile not found for userId=${this.systemEmployerUserId}`);
      return { imported: 0, skipped: 0 };
    }

    let imported = 0;
    let skipped = 0;
    const perPage = 50;

    try {
      const firstPage = await this.fetchPage(text, area, 0, perPage);
      const totalPages = Math.min(firstPage.pages, 3); // максимум 150 вакансий за раз

      const allItems = [...firstPage.items];
      for (let page = 1; page < totalPages; page++) {
        const p = await this.fetchPage(text, area, page, perPage);
        allItems.push(...p.items);
      }

      for (const item of allItems) {
        const result = await this.upsertVacancy(item, employerProfile);
        if (result === 'imported') imported++;
        else skipped++;
      }

      this.log.log(`HH import done: imported=${imported} skipped=${skipped}`);
    } catch (e) {
      this.log.error(
        `HH import failed: ${e instanceof Error ? e.message : String(e)}`,
      );
    }

    return { imported, skipped };
  }

  private async fetchPage(
    text: string,
    area: string,
    page: number,
    perPage: number,
  ): Promise<HhSearchResponse> {
    const { data } = await axios.get<HhSearchResponse>(`${this.hhApiUrl}/vacancies`, {
      params: {
        text,
        area,
        page,
        per_page: perPage,
        only_with_salary: false,
        schedule: 'remote,flexible,part',
      },
      headers: {
        'User-Agent': this.hhUserAgent,
        'HH-User-Agent': this.hhUserAgent,
      },
      timeout: 15000,
    });
    return data;
  }

  private async upsertVacancy(
    item: HhVacancy,
    employerProfile: EmployerProfileEntity,
  ): Promise<'imported' | 'skipped'> {
    const existing = await this.jobs.findOne({
      where: { source: 'hh', externalId: item.id },
    });
    if (existing) return 'skipped';

    const description =
      item.snippet
        ? [item.snippet.requirement, item.snippet.responsibility]
            .filter(Boolean)
            .join('\n\n') ||
          item.name
        : item.name;

    const cityId = item.area?.name
      ? await this.resolveCityId(item.area.name)
      : null;

    const salaryMin = item.salary?.from ?? null;
    const salaryMax = item.salary?.to ?? null;
    const currency = this.normalizeCurrency(item.salary?.currency);

    await this.jobs.save(
      this.jobs.create({
        title: item.name,
        description,
        status: JobStatus.PUBLISHED,
        source: 'hh',
        externalId: item.id,
        employerProfileId: employerProfile.id,
        employerUserId: employerProfile.userId,
        cityId,
        salaryMin,
        salaryMax,
        currency,
      }),
    );
    return 'imported';
  }

  private cityCache = new Map<string, string | null>();

  private async resolveCityId(cityName: string): Promise<string | null> {
    if (this.cityCache.has(cityName)) return this.cityCache.get(cityName)!;
    const city = await this.cities
      .createQueryBuilder('c')
      .where('c.name ILIKE :name', { name: `%${cityName}%` })
      .getOne();
    const id = city?.id ?? null;
    this.cityCache.set(cityName, id);
    return id;
  }

  private normalizeCurrency(hhCurrency?: string): string {
    const map: Record<string, string> = {
      KZT: 'KZT',
      RUR: 'RUB',
      RUB: 'RUB',
      USD: 'USD',
      EUR: 'EUR',
    };
    return hhCurrency ? (map[hhCurrency] ?? 'KZT') : 'KZT';
  }
}
