import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizeNameI18n } from '../../common/utils/catalog-i18n.util';
import {
  CityEntity,
  JobCategoryEntity,
  TagEntity,
} from '../../database/entities';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(CityEntity)
    private readonly cities: Repository<CityEntity>,
    @InjectRepository(JobCategoryEntity)
    private readonly categories: Repository<JobCategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tags: Repository<TagEntity>,
    private readonly upload: UploadService,
  ) {}

  private async mapImageRow<
    T extends { name: string; nameI18n?: import('../../common/types/name-i18n.type').NameI18n | null; imageStorageKey?: string | null },
  >(row: T) {
    const base = normalizeNameI18n(row);
    const imageUrl = await this.upload.resolvePublicUrl(row.imageStorageKey);
    return { ...base, imageUrl };
  }

  async listCities() {
    const rows = await this.cities.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return Promise.all(rows.map((r) => this.mapImageRow(r)));
  }

  /** Плоский список активных категорий; фронт строит дерево по parentId. */
  async listJobCategories() {
    const rows = await this.categories.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return Promise.all(rows.map((r) => this.mapImageRow(r)));
  }

  async listTags() {
    const rows = await this.tags.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
    return rows.map((r) => normalizeNameI18n(r));
  }

  /** Один запрос для формы создания вакансии: города, категории, теги (как у отдельных GET). */
  async jobFormCatalog() {
    const [cities, jobCategories, tags] = await Promise.all([
      this.listCities(),
      this.listJobCategories(),
      this.listTags(),
    ]);
    return { cities, jobCategories, tags };
  }
}
