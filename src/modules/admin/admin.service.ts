import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { NameI18nDto } from '../../common/dto/name-i18n.dto';
import type { NameI18n } from '../../common/types/name-i18n.type';
import { normalizeNameI18n } from '../../common/utils/catalog-i18n.util';
import { slugify } from '../../common/utils/slug.util';
import { EmployerVerificationStatus } from '../../common/enums/employer-verification-status.enum';
import { JobStatus } from '../../common/enums/job-status.enum';
import {
  CityEntity,
  EmployerProfileEntity,
  JobCategoryEntity,
  JobEntity,
  TagEntity,
  UserEntity,
} from '../../database/entities';
import { CreateCityDto } from './dto/create-city.dto';
import { CreateJobCategoryDto } from './dto/create-job-category.dto';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { UpdateJobCategoryDto } from './dto/update-job-category.dto';
import { UpdateTagDto } from './dto/update-tag.dto';

@Injectable()
export class AdminService {
  private readonly log = new Logger(AdminService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employers: Repository<EmployerProfileEntity>,
    @InjectRepository(JobEntity)
    private readonly jobs: Repository<JobEntity>,
    @InjectRepository(CityEntity)
    private readonly cities: Repository<CityEntity>,
    @InjectRepository(JobCategoryEntity)
    private readonly jobCategories: Repository<JobCategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tags: Repository<TagEntity>,
  ) {}

  async listUsers(page = 1, limit = 20) {
    const take = Math.min(limit, 100);
    const skip = (page - 1) * take;
    const [rows, total] = await this.users.findAndCount({
      order: { createdAt: 'DESC' },
      skip,
      take,
      select: ['id', 'email', 'role', 'isActive', 'createdAt'],
    });
    return { data: rows, total, page, limit: take };
  }

  /** Все города (включая неактивные), для админки. */
  async listCities() {
    const rows = await this.cities.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((r) => normalizeNameI18n(r));
  }

  /** Все категории вакансий (включая неактивные). */
  async listJobCategories() {
    const rows = await this.jobCategories.find({
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((r) => normalizeNameI18n(r));
  }

  /** Все теги (включая неактивные). */
  async listTags() {
    const rows = await this.tags.find({
      order: { name: 'ASC' },
    });
    return rows.map((r) => normalizeNameI18n(r));
  }

  private resolveNameAndI18n(dto: {
    name?: string;
    nameI18n?: NameI18nDto;
  }): { name: string; nameI18n: NameI18n | null } {
    if (dto.nameI18n) {
      const ru = dto.nameI18n.ru.trim();
      const kk = dto.nameI18n.kk.trim();
      const en = dto.nameI18n.en.trim();
      return {
        name: ru,
        nameI18n: { ru, kk, en },
      };
    }
    const n = dto.name?.trim();
    if (!n) {
      throw new BadRequestException('name or nameI18n (ru, kk, en) is required');
    }
    return { name: n, nameI18n: null };
  }

  async setEmployerVerification(
    employerUserId: string,
    status: EmployerVerificationStatus,
  ) {
    const profile = await this.employers.findOne({
      where: { userId: employerUserId },
    });
    if (!profile) {
      throw new NotFoundException();
    }
    profile.verificationStatus = status;
    return this.employers.save(profile);
  }

  async moderateJob(
    jobId: string,
    status: JobStatus.PAUSED | JobStatus.ARCHIVED,
  ) {
    const job = await this.jobs.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException();
    }
    job.status = status;
    return this.jobs.save(job);
  }

  async createCity(dto: CreateCityDto) {
    const { name, nameI18n } = this.resolveNameAndI18n(dto);
    const slug = dto.slug?.trim() || slugify(name);
    const dup = await this.cities.findOne({ where: { slug } });
    if (dup) {
      throw new ConflictException('City slug already exists');
    }
    const city = await this.cities.save(
      this.cities.create({
        name,
        nameI18n,
        slug,
        imageStorageKey: dto.imageStorageKey ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      }),
    );
    this.log.log(`City created id=${city.id} slug=${city.slug}`);
    return city;
  }

  async updateCity(id: string, dto: UpdateCityDto) {
    const row = await this.cities.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException();
    }
    if (dto.name !== undefined) {
      row.name = dto.name.trim();
      if (row.nameI18n) {
        row.nameI18n = { ...row.nameI18n, ru: row.name };
      }
    }
    if (dto.nameI18n) {
      const ru = dto.nameI18n.ru.trim();
      const kk = dto.nameI18n.kk.trim();
      const en = dto.nameI18n.en.trim();
      row.nameI18n = { ru, kk, en };
      row.name = ru;
    }
    if (dto.slug !== undefined) {
      const nextSlug = dto.slug?.trim() || slugify(row.name);
      const dup = await this.cities.findOne({ where: { slug: nextSlug } });
      if (dup && dup.id !== id) {
        throw new ConflictException('City slug already exists');
      }
      row.slug = nextSlug;
    }
    if (dto.imageStorageKey !== undefined) {
      row.imageStorageKey = dto.imageStorageKey;
    }
    if (dto.sortOrder !== undefined) {
      row.sortOrder = dto.sortOrder;
    }
    if (dto.isActive !== undefined) {
      row.isActive = dto.isActive;
    }
    return this.cities.save(row);
  }

  async removeCity(id: string) {
    const row = await this.cities.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException();
    }
    await this.cities.remove(row);
  }

  async createJobCategory(dto: CreateJobCategoryDto) {
    const { name, nameI18n } = this.resolveNameAndI18n(dto);
    const slug = dto.slug?.trim() || slugify(name);
    const dup = await this.jobCategories.findOne({ where: { slug } });
    if (dup) {
      throw new ConflictException('Category slug already exists');
    }
    if (dto.parentId) {
      const parent = await this.jobCategories.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent category not found');
      }
    }
    const cat = await this.jobCategories.save(
      this.jobCategories.create({
        name,
        nameI18n,
        slug,
        parentId: dto.parentId ?? null,
        imageStorageKey: dto.imageStorageKey ?? null,
        sortOrder: dto.sortOrder ?? 0,
        isActive: dto.isActive ?? true,
      }),
    );
    this.log.log(`JobCategory created id=${cat.id} slug=${cat.slug}`);
    return cat;
  }

  async updateJobCategory(id: string, dto: UpdateJobCategoryDto) {
    const row = await this.jobCategories.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException();
    }
    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new ConflictException('Category cannot be its own parent');
      }
      if (dto.parentId) {
        const parent = await this.jobCategories.findOne({
          where: { id: dto.parentId },
        });
        if (!parent) {
          throw new NotFoundException('Parent category not found');
        }
      }
      row.parentId = dto.parentId;
    }
    if (dto.name !== undefined) {
      row.name = dto.name.trim();
      if (row.nameI18n) {
        row.nameI18n = { ...row.nameI18n, ru: row.name };
      }
    }
    if (dto.nameI18n) {
      const ru = dto.nameI18n.ru.trim();
      const kk = dto.nameI18n.kk.trim();
      const en = dto.nameI18n.en.trim();
      row.nameI18n = { ru, kk, en };
      row.name = ru;
    }
    if (dto.slug !== undefined) {
      const nextSlug = dto.slug?.trim() || slugify(row.name);
      const dup = await this.jobCategories.findOne({ where: { slug: nextSlug } });
      if (dup && dup.id !== id) {
        throw new ConflictException('Category slug already exists');
      }
      row.slug = nextSlug;
    }
    if (dto.imageStorageKey !== undefined) {
      row.imageStorageKey = dto.imageStorageKey;
    }
    if (dto.sortOrder !== undefined) {
      row.sortOrder = dto.sortOrder;
    }
    if (dto.isActive !== undefined) {
      row.isActive = dto.isActive;
    }
    return this.jobCategories.save(row);
  }

  async removeJobCategory(id: string) {
    const row = await this.jobCategories.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException();
    }
    await this.jobCategories.remove(row);
  }

  async createTag(dto: CreateTagDto) {
    const { name, nameI18n } = this.resolveNameAndI18n(dto);
    const slug = dto.slug?.trim() || slugify(name);
    const dup = await this.tags.findOne({ where: { slug } });
    if (dup) {
      throw new ConflictException('Tag slug already exists');
    }
    const tag = await this.tags.save(
      this.tags.create({
        name,
        nameI18n,
        slug,
        isActive: dto.isActive ?? true,
      }),
    );
    this.log.log(`Tag created id=${tag.id} slug=${tag.slug}`);
    return tag;
  }

  async updateTag(id: string, dto: UpdateTagDto) {
    const row = await this.tags.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException();
    }
    if (dto.name !== undefined) {
      row.name = dto.name.trim();
      if (row.nameI18n) {
        row.nameI18n = { ...row.nameI18n, ru: row.name };
      }
    }
    if (dto.nameI18n) {
      const ru = dto.nameI18n.ru.trim();
      const kk = dto.nameI18n.kk.trim();
      const en = dto.nameI18n.en.trim();
      row.nameI18n = { ru, kk, en };
      row.name = ru;
    }
    if (dto.slug !== undefined) {
      const nextSlug = dto.slug?.trim() || slugify(row.name);
      const dup = await this.tags.findOne({ where: { slug: nextSlug } });
      if (dup && dup.id !== id) {
        throw new ConflictException('Tag slug already exists');
      }
      row.slug = nextSlug;
    }
    if (dto.isActive !== undefined) {
      row.isActive = dto.isActive;
    }
    return this.tags.save(row);
  }

  async removeTag(id: string) {
    const row = await this.tags.findOne({ where: { id } });
    if (!row) {
      throw new NotFoundException();
    }
    await this.tags.remove(row);
  }
}
