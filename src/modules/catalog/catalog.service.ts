import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { normalizeNameI18n } from '../../common/utils/catalog-i18n.util';
import {
  CityEntity,
  JobCategoryEntity,
  TagEntity,
} from '../../database/entities';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(CityEntity)
    private readonly cities: Repository<CityEntity>,
    @InjectRepository(JobCategoryEntity)
    private readonly categories: Repository<JobCategoryEntity>,
    @InjectRepository(TagEntity)
    private readonly tags: Repository<TagEntity>,
  ) {}

  async listCities() {
    const rows = await this.cities.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((r) => normalizeNameI18n(r));
  }

  /** Плоский список активных категорий; фронт строит дерево по parentId. */
  async listJobCategories() {
    const rows = await this.categories.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', name: 'ASC' },
    });
    return rows.map((r) => normalizeNameI18n(r));
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
