import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as argon2 from 'argon2';
import { Queue } from 'bullmq';
import { In } from 'typeorm';
import dataSource from '../data-source';
import {
  CityEntity,
  EmployerProfileEntity,
  JobCategoryEntity,
  JobEntity,
  TagEntity,
  UserEntity,
} from '../entities';
import { UserRole } from '../../common/enums/user-role.enum';
import { JobStatus } from '../../common/enums/job-status.enum';
import { buildJobEmbeddingText } from '../../modules/ai/embedding-text.util';
import { AI_QUEUE_EMBEDDINGS } from '../../modules/ai/queues/ai-queue.constants';
import type { EmbeddingJobPayload } from '../../modules/ai/contracts/ai-contracts';
import {
  DEMO_EMPLOYERS_SEED,
  JOBS_SEED,
  seedExternalId,
  type DemoEmployerKey,
} from './data/jobs-seed';

dotenv.config({ path: path.join(process.cwd(), '.env') });

type EmployerContext = {
  key: DemoEmployerKey;
  userId: string;
  profileId: string;
};

async function ensureCatalogPresent() {
  const cities = dataSource.getRepository(CityEntity);
  const count = await cities.count();
  if (count === 0) {
    throw new Error(
      'Catalog is empty. Run npm run seed:catalog before npm run seed:jobs',
    );
  }
}

async function ensureDemoEmployers(
  password: string,
): Promise<Map<DemoEmployerKey, EmployerContext>> {
  const users = dataSource.getRepository(UserEntity);
  const profiles = dataSource.getRepository(EmployerProfileEntity);
  const map = new Map<DemoEmployerKey, EmployerContext>();

  for (const row of DEMO_EMPLOYERS_SEED) {
    const email = process.env[row.emailEnv]?.trim().toLowerCase();
    if (!email) {
      console.log(`Skip employer ${row.key}: set ${row.emailEnv}`);
      continue;
    }

    let user = await users.findOne({
      where: { email },
      relations: ['employerProfile'],
    });

    if (!user) {
      user = await users.save(
        users.create({
          email,
          passwordHash: await argon2.hash(password),
          role: UserRole.EMPLOYER,
          isActive: true,
        }),
      );
      console.log(`Demo employer created: ${row.key} ${email} id=${user.id}`);
    } else {
      console.log(`Demo employer exists: ${row.key} ${email} id=${user.id}`);
    }

    let profile = user.employerProfile;
    if (!profile) {
      profile = await profiles.save(
        profiles.create({
          userId: user.id,
          companyName: row.companyName,
          description: row.description,
          website: row.website,
          verificationStatus: row.verificationStatus,
        }),
      );
    } else {
      profile.companyName = row.companyName;
      profile.description = row.description;
      profile.website = row.website;
      profile.verificationStatus = row.verificationStatus;
      profile = await profiles.save(profile);
    }

    map.set(row.key, {
      key: row.key,
      userId: user.id,
      profileId: profile.id,
    });
  }

  return map;
}

async function resolveSlugs() {
  const cities = await dataSource.getRepository(CityEntity).find();
  const categories = await dataSource.getRepository(JobCategoryEntity).find();
  const tags = await dataSource.getRepository(TagEntity).find();

  const cityBySlug = new Map(cities.map((c) => [c.slug, c.id]));
  const categoryBySlug = new Map(categories.map((c) => [c.slug, c.id]));
  const tagBySlug = new Map(tags.map((t) => [t.slug, t.id]));

  return { cityBySlug, categoryBySlug, tagBySlug };
}

async function seedJobs(employers: Map<DemoEmployerKey, EmployerContext>) {
  const jobsRepo = dataSource.getRepository(JobEntity);
  const { cityBySlug, categoryBySlug, tagBySlug } = await resolveSlugs();

  let created = 0;
  let updated = 0;
  let skipped = 0;
  const publishedForEmbed: JobEntity[] = [];

  for (const row of JOBS_SEED) {
    const employer = employers.get(row.employerKey);
    if (!employer) {
      skipped += 1;
      continue;
    }

    const cityId = cityBySlug.get(row.citySlug);
    if (!cityId) {
      throw new Error(`Seed: city slug not found: ${row.citySlug}`);
    }

    const categoryIds = row.categorySlugs.map((slug) => {
      const id = categoryBySlug.get(slug);
      if (!id) throw new Error(`Seed: category slug not found: ${slug}`);
      return id;
    });

    const tagIds = row.tagSlugs.map((slug) => {
      const id = tagBySlug.get(slug);
      if (!id) throw new Error(`Seed: tag slug not found: ${slug}`);
      return id;
    });

    const externalId = seedExternalId(row.seedKey);
    let job = await jobsRepo.findOne({
      where: { externalId },
      relations: ['categories', 'tags'],
    });

    const payload = {
      employerUserId: employer.userId,
      employerProfileId: employer.profileId,
      title: row.title,
      description: row.description,
      status: row.status,
      location: row.location ?? null,
      cityId,
      salaryMin: row.salaryMin ?? null,
      salaryMax: row.salaryMax ?? null,
      currency: row.currency ?? 'KZT',
      requiredWeeklyHours: row.requiredWeeklyHours ?? null,
      workWindows: row.workWindows ?? null,
      isPremium: row.isPremium ?? false,
      requiresResume: row.requiresResume ?? false,
      requiresCoverLetter: row.requiresCoverLetter ?? false,
      source: 'manual',
      externalId,
    };

    if (job) {
      Object.assign(job, payload);
      job = await jobsRepo.save(job);
      updated += 1;
    } else {
      job = await jobsRepo.save(jobsRepo.create(payload));
      created += 1;
    }

    job.categories = categoryIds.length
      ? await dataSource.getRepository(JobCategoryEntity).findBy({ id: In(categoryIds) })
      : [];
    job.tags = tagIds.length
      ? await dataSource.getRepository(TagEntity).findBy({ id: In(tagIds) })
      : [];
    job = await jobsRepo.save(job);

    if (job.status === JobStatus.PUBLISHED) {
      publishedForEmbed.push(job);
    }
  }

  return { created, updated, skipped, total: JOBS_SEED.length, publishedForEmbed };
}

async function enqueueEmbeddings(jobs: JobEntity[]): Promise<number> {
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const redisHost = process.env.REDIS_HOST?.trim() || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT ?? '6379', 10);

  if (!openaiKey) {
    console.log(
      'Skip embeddings: OPENAI_API_KEY not set (matchScore/recommended need worker or PATCH publish)',
    );
    return 0;
  }

  const queue = new Queue(AI_QUEUE_EMBEDDINGS, {
    connection: { host: redisHost, port: redisPort },
  });

  let enqueued = 0;
  for (const job of jobs) {
    const payload: EmbeddingJobPayload = {
      target: 'job',
      entityId: job.id,
      textChunks: [buildJobEmbeddingText(job)],
    };
    await queue.add('embed', payload, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    });
    enqueued += 1;
  }

  await queue.close();
  return enqueued;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const password = process.env.BOOTSTRAP_DEMO_PASSWORD?.trim();
  if (!password) {
    console.error(
      'Set BOOTSTRAP_DEMO_PASSWORD and at least one employer email:\n' +
        '  BOOTSTRAP_DEMO_IT_EMAIL, BOOTSTRAP_DEMO_RETAIL_EMAIL, BOOTSTRAP_DEMO_HORECA_EMAIL,\n' +
        '  BOOTSTRAP_DEMO_AGENCY_EMAIL, BOOTSTRAP_DEMO_EDU_EMAIL',
    );
    process.exit(1);
  }

  await dataSource.initialize();
  try {
    await ensureCatalogPresent();
    const employers = await ensureDemoEmployers(password);
    if (employers.size === 0) {
      console.error('No demo employers created — set BOOTSTRAP_DEMO_*_EMAIL env vars');
      process.exit(1);
    }

    const result = await seedJobs(employers);
    const enqueued = await enqueueEmbeddings(result.publishedForEmbed);

    console.log('Jobs seed:', {
      employers: employers.size,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      total: result.total,
      published: result.publishedForEmbed.length,
      embeddingsEnqueued: enqueued,
    });
  } finally {
    await dataSource.destroy();
  }
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
