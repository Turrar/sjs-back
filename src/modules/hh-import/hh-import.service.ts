import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosError } from 'axios';
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
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Injectable()
export class HhImportService {
  private readonly log = new Logger(HhImportService.name);
  private readonly hhApiUrl = 'https://api.hh.ru';
  private readonly enabled: boolean;
  /**
   * HH требует пару заголовков User-Agent и HH-User-Agent в формате
   * `ИмяПриложения/версия (реальный@email)` — см. https://github.com/hhru/api
   * Без этого часто 400 bad_user_agent или 403 forbidden; «чужие» и шаблонные
   * строки могут попадать в blacklist.
   */
  private readonly hhUserAgent: string;
  private readonly hhAppAccessToken: string | null;
  private readonly hhAppClientId: string | null;
  private readonly hhAppClientSecret: string | null;
  private cachedClientCredentialsToken: string | null = null;

  constructor(
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employerProfiles: Repository<EmployerProfileEntity>,
    @InjectRepository(CityEntity)
    private readonly cities: Repository<CityEntity>,
    private readonly config: ConfigService,
  ) {
    this.enabled = this.config.get<string>('HH_IMPORT_ENABLED') === 'true';
    this.hhUserAgent =
      this.config.get<string>('HH_API_USER_AGENT')?.trim() ||
      'SJS-Back/1.0 (please-set-HH_API_USER_AGENT-in-env)';
    this.hhAppAccessToken =
      this.config.get<string>('HH_APP_ACCESS_TOKEN')?.trim() ?? null;
    this.hhAppClientId = this.config.get<string>('HH_APP_CLIENT_ID')?.trim() ?? null;
    this.hhAppClientSecret =
      this.config.get<string>('HH_APP_CLIENT_SECRET')?.trim() ?? null;

    const systemEmployerUserId = this.getSystemEmployerUserId();
    const hasHhOAuth =
      !!this.hhAppAccessToken || !!(this.hhAppClientId && this.hhAppClientSecret);

    if (!this.enabled) {
      this.log.log('HH import disabled (HH_IMPORT_ENABLED != true)');
    } else if (!systemEmployerUserId) {
      this.log.warn('HH_SYSTEM_EMPLOYER_USER_ID not set — HH import will be skipped');
    } else if (!UUID_RE.test(systemEmployerUserId)) {
      this.log.error(
        `HH_SYSTEM_EMPLOYER_USER_ID is invalid at startup (got "${systemEmployerUserId}"). ` +
          'Use UUID from npm run seed:bootstrap, update .env, then restart the server',
      );
    } else if (!hasHhOAuth) {
      this.log.warn(
        'HH OAuth app token not configured — GET /vacancies returns 403 from api.hh.ru. ' +
          'Register app at https://dev.hh.ru/admin and set HH_APP_ACCESS_TOKEN ' +
          'or HH_APP_CLIENT_ID + HH_APP_CLIENT_SECRET',
      );
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

  private getSystemEmployerUserId(): string | null {
    return this.config.get<string>('HH_SYSTEM_EMPLOYER_USER_ID')?.trim() ?? null;
  }

  /** Ручной запуск (из Admin-контроллера). */
  async importVacancies(text = 'стажировка OR internship', area = '160'): Promise<{ imported: number; skipped: number }> {
    const systemEmployerUserId = this.getSystemEmployerUserId();

    if (!systemEmployerUserId) {
      throw new BadRequestException(
        'HH_SYSTEM_EMPLOYER_USER_ID is not set. Run npm run seed:bootstrap and copy the UUID to .env',
      );
    }
    if (!UUID_RE.test(systemEmployerUserId)) {
      throw new BadRequestException(
        `HH_SYSTEM_EMPLOYER_USER_ID must be a valid UUID from seed:bootstrap (not area code or HH user id). ` +
          `Server sees "${systemEmployerUserId}" — update .env and restart npm run start:dev`,
      );
    }

    const employerProfile = await this.employerProfiles.findOne({
      where: { userId: systemEmployerUserId },
    });
    if (!employerProfile) {
      throw new BadRequestException(
        `Employer profile not found for HH_SYSTEM_EMPLOYER_USER_ID=${systemEmployerUserId}. Re-run seed:bootstrap`,
      );
    }

    await this.resolveAccessToken();

    let imported = 0;
    let skipped = 0;
    const perPage = 50;

    try {
      const firstPage = await this.fetchPage(text, area, 0, perPage);
      const totalPages = Math.min(firstPage.pages ?? 0, 3);
      const allItems = [...(firstPage.items ?? [])];
      for (let page = 1; page < totalPages; page++) {
        const p = await this.fetchPage(text, area, page, perPage);
        allItems.push(...(p.items ?? []));
      }

      for (const item of allItems) {
        try {
          const result = await this.upsertVacancy(item, employerProfile);
          if (result === 'imported') imported++;
          else skipped++;
        } catch (e) {
          this.log.warn(
            `Skip HH vacancy id=${item.id}: ${e instanceof Error ? e.message : String(e)}`,
          );
          skipped++;
        }
      }

      this.log.log(`HH import done: imported=${imported} skipped=${skipped}`);
      return { imported, skipped };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.log.error(`HH import failed: ${msg}`);
      if (axios.isAxiosError(e)) {
        throw new ServiceUnavailableException(this.describeHhApiError(e));
      }
      throw e;
    }
  }

  private buildHhHeaders(accessToken?: string): Record<string, string> {
    const headers: Record<string, string> = {
      'User-Agent': this.hhUserAgent,
      'HH-User-Agent': this.hhUserAgent,
    };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
  }

  private hasHhOAuthConfig(): boolean {
    return (
      !!this.hhAppAccessToken || !!(this.hhAppClientId && this.hhAppClientSecret)
    );
  }

  private async resolveAccessToken(): Promise<string> {
    if (this.hhAppAccessToken) {
      return this.hhAppAccessToken;
    }

    if (this.hhAppClientId && this.hhAppClientSecret) {
      if (this.cachedClientCredentialsToken) {
        return this.cachedClientCredentialsToken;
      }

      try {
        const body = new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.hhAppClientId,
          client_secret: this.hhAppClientSecret,
        });
        const { data } = await axios.post<{ access_token: string }>(
          `${this.hhApiUrl}/token`,
          body.toString(),
          {
            headers: {
              ...this.buildHhHeaders(),
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            timeout: 15000,
          },
        );
        this.cachedClientCredentialsToken = data.access_token;
        return data.access_token;
      } catch (e) {
        if (axios.isAxiosError(e)) {
          throw new ServiceUnavailableException(
            `HeadHunter OAuth token request failed: ${this.describeHhApiError(e)}`,
          );
        }
        throw e;
      }
    }

    throw new BadRequestException(
      'HeadHunter API requires application OAuth token. Register at https://dev.hh.ru/admin, ' +
        'copy access_token to HH_APP_ACCESS_TOKEN (or set HH_APP_CLIENT_ID + HH_APP_CLIENT_SECRET), then restart the server',
    );
  }

  private describeHhApiError(error: AxiosError): string {
    const status = error.response?.status;
    const errors = (
      error.response?.data as { errors?: Array<{ type?: string; value?: string }> }
    )?.errors;
    const errType = errors?.[0]?.type;
    const errValue = errors?.[0]?.value;

    if (status === 403 && errType === 'forbidden' && !errValue && !this.hasHhOAuthConfig()) {
      return (
        'HeadHunter API error (403): application OAuth token required. ' +
        'Register at https://dev.hh.ru/admin and set HH_APP_ACCESS_TOKEN in .env'
      );
    }
    if (status === 403 && errType === 'oauth') {
      return (
        'HeadHunter API error (403): invalid OAuth token — refresh HH_APP_ACCESS_TOKEN ' +
        'from https://dev.hh.ru/admin or check HH_APP_CLIENT_ID / HH_APP_CLIENT_SECRET'
      );
    }
    if (status === 400 && errType === 'bad_user_agent') {
      return (
        'HeadHunter API error (400): invalid User-Agent — set HH_API_USER_AGENT to ' +
        '"App/1.0 (you@email.com)" per https://github.com/hhru/api'
      );
    }

    return `HeadHunter API error${status ? ` (${status})` : ''}: check HH_APP_ACCESS_TOKEN, HH_API_USER_AGENT, and https://dev.hh.ru/admin`;
  }

  private async fetchPage(
    text: string,
    area: string,
    page: number,
    perPage: number,
  ): Promise<HhSearchResponse> {
    const accessToken = await this.resolveAccessToken();
    const { data } = await axios.get<HhSearchResponse>(`${this.hhApiUrl}/vacancies`, {
      params: {
        text,
        area,
        page,
        per_page: perPage,
        only_with_salary: false,
        schedule: 'remote,flexible,part',
      },
      headers: this.buildHhHeaders(accessToken),
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

    const salaryMin =
      item.salary?.from != null ? Math.round(item.salary.from) : null;
    const salaryMax =
      item.salary?.to != null ? Math.round(item.salary.to) : null;
    const currency = this.normalizeCurrency(item.salary?.currency);

    await this.jobs.save(
      this.jobs.create({
        title: item.name.slice(0, 512),
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
