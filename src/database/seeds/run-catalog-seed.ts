import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import dataSource from '../data-source';
import {
  CityEntity,
  JobCategoryEntity,
  TagEntity,
} from '../entities';
import { KZ_CITIES_SEED } from './data/kz-cities';
import { STUDENT_JOB_CATEGORIES_SEED } from './data/student-categories';
import { STUDENT_TAGS_SEED } from './data/student-tags';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function seedCities() {
  const repo = dataSource.getRepository(CityEntity);
  let created = 0;
  let updated = 0;
  for (const row of KZ_CITIES_SEED) {
    const name = row.nameI18n.ru;
    const existing = await repo.findOne({ where: { slug: row.slug } });
    const payload = {
      name,
      nameI18n: row.nameI18n,
      slug: row.slug,
      sortOrder: row.sortOrder,
      isActive: true,
    };
    if (existing) {
      Object.assign(existing, payload);
      await repo.save(existing);
      updated += 1;
    } else {
      await repo.save(repo.create(payload));
      created += 1;
    }
  }
  return { created, updated, total: KZ_CITIES_SEED.length };
}

async function seedJobCategories() {
  const repo = dataSource.getRepository(JobCategoryEntity);
  const slugToId = new Map<string, string>();
  let created = 0;
  let updated = 0;
  const roots = STUDENT_JOB_CATEGORIES_SEED.filter((r) => !r.parentSlug);
  const children = STUDENT_JOB_CATEGORIES_SEED.filter((r) => r.parentSlug);

  for (const row of roots) {
    const name = row.nameI18n.ru;
    const existing = await repo.findOne({ where: { slug: row.slug } });
    const payload = {
      name,
      nameI18n: row.nameI18n,
      slug: row.slug,
      parentId: null as string | null,
      sortOrder: row.sortOrder,
      isActive: true,
    };
    let saved: JobCategoryEntity;
    if (existing) {
      Object.assign(existing, payload);
      saved = await repo.save(existing);
      updated += 1;
    } else {
      saved = await repo.save(repo.create(payload));
      created += 1;
    }
    slugToId.set(row.slug, saved.id);
  }

  for (const row of children) {
    const parentId = slugToId.get(row.parentSlug!);
    if (!parentId) {
      throw new Error(`Seed: parent category not found for slug ${row.parentSlug}`);
    }
    const name = row.nameI18n.ru;
    const existing = await repo.findOne({ where: { slug: row.slug } });
    const payload = {
      name,
      nameI18n: row.nameI18n,
      slug: row.slug,
      parentId,
      sortOrder: row.sortOrder,
      isActive: true,
    };
    let saved: JobCategoryEntity;
    if (existing) {
      Object.assign(existing, payload);
      saved = await repo.save(existing);
      updated += 1;
    } else {
      saved = await repo.save(repo.create(payload));
      created += 1;
    }
    slugToId.set(row.slug, saved.id);
  }

  return {
    created,
    updated,
    total: STUDENT_JOB_CATEGORIES_SEED.length,
  };
}

async function seedTags() {
  const repo = dataSource.getRepository(TagEntity);
  let created = 0;
  let updated = 0;
  for (const row of STUDENT_TAGS_SEED) {
    const name = row.nameI18n.ru;
    const existing = await repo.findOne({ where: { slug: row.slug } });
    const payload = {
      name,
      nameI18n: row.nameI18n,
      slug: row.slug,
      isActive: true,
    };
    if (existing) {
      Object.assign(existing, payload);
      await repo.save(existing);
      updated += 1;
    } else {
      await repo.save(repo.create(payload));
      created += 1;
    }
  }
  return { created, updated, total: STUDENT_TAGS_SEED.length };
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  await dataSource.initialize();
  try {
    console.log('Seeding cities...');
    console.log(await seedCities());
    console.log('Seeding job categories...');
    console.log(await seedJobCategories());
    console.log('Seeding tags...');
    console.log(await seedTags());
    console.log('Catalog seed done.');
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
