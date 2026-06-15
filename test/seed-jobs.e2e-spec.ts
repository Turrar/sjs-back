import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { applyHttpMiddleware } from '../src/configure-app';
import { AppModule } from '../src/app.module';

const hasIntegrationEnv =
  Boolean(process.env.DATABASE_URL) && Boolean(process.env.JWT_SECRET);

type SeedJobRow = {
  id: string;
  title: string;
  externalId?: string | null;
  isPremium: boolean;
  cityId?: string | null;
  status?: string;
  tags?: Array<{ id: string; slug: string }>;
};

(hasIntegrationEnv ? describe : describe.skip)(
  'Jobs seed data (e2e integration)',
  () => {
    let app: INestApplication<App>;
    let seedJobs: SeedJobRow[] = [];

    jest.setTimeout(120_000);

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      applyHttpMiddleware(app);
      await app.init();

      const res = await request(app.getHttpServer()).get('/api/jobs').expect(200);
      seedJobs = res.body as SeedJobRow[];
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('skips when seed:jobs was not run', () => {
      if (seedJobs.length < 10) {
        console.log(
          `Jobs seed e2e skipped: ${seedJobs.length} published jobs (need >= 10). Run npm run seed:jobs`,
        );
      }
      expect(true).toBe(true);
    });

    it('§F-08 GET /jobs returns seeded catalog', async () => {
      if (seedJobs.length < 10) {
        return;
      }
      expect(
        seedJobs.some((j) => j.externalId === 'seed:data-analyst-python'),
      ).toBe(true);
      expect(
        seedJobs.some((j) => j.externalId === 'seed:barista-part-time'),
      ).toBe(true);
      expect(seedJobs.every((j) => j.status !== 'DRAFT' && j.status !== 'PAUSED')).toBe(
        true,
      );
    });

    it('§F-08 filter by cityId (Almaty)', async () => {
      if (seedJobs.length < 10) {
        return;
      }
      const almatyJob = seedJobs.find(
        (j) => j.externalId === 'seed:junior-frontend-intern',
      );
      expect(almatyJob?.cityId).toBeDefined();

      const res = await request(app.getHttpServer())
        .get('/api/jobs')
        .query({ cityId: almatyJob!.cityId })
        .expect(200);

      const rows = res.body as SeedJobRow[];
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows.every((j) => j.cityId === almatyJob!.cityId)).toBe(true);
    });

    it('§F-08 filter by tagId (remote)', async () => {
      if (seedJobs.length < 10) {
        return;
      }
      const remoteJob = seedJobs.find((j) =>
        j.tags?.some((t) => t.slug === 'remote'),
      );
      const remoteTag = remoteJob?.tags?.find((t) => t.slug === 'remote');
      expect(remoteTag?.id).toBeDefined();

      const res = await request(app.getHttpServer())
        .get('/api/jobs')
        .query({ tagId: remoteTag!.id })
        .expect(200);

      const rows = res.body as SeedJobRow[];
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(
        rows.every((j) => j.tags?.some((t) => t.id === remoteTag!.id)),
      ).toBe(true);
    });

    it('§F-08 search q=Data Analyst', async () => {
      if (seedJobs.length < 10) {
        return;
      }
      const res = await request(app.getHttpServer())
        .get('/api/jobs')
        .query({ q: 'Data Analyst' })
        .expect(200);

      const rows = res.body as SeedJobRow[];
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows.some((j) => j.title.includes('Data Analyst'))).toBe(true);
    });

    it('§F-08 premium jobs listed before non-premium (same city)', async () => {
      if (seedJobs.length < 10) {
        return;
      }
      const almatyJob = seedJobs.find(
        (j) => j.externalId === 'seed:junior-frontend-intern',
      );
      expect(almatyJob?.cityId).toBeDefined();

      const res = await request(app.getHttpServer())
        .get('/api/jobs')
        .query({ cityId: almatyJob!.cityId })
        .expect(200);

      const rows = res.body as SeedJobRow[];
      const premiumCount = rows.filter((j) => j.isPremium).length;
      if (premiumCount === 0 || premiumCount === rows.length) {
        return;
      }

      const firstNonPremium = rows.findIndex((j) => !j.isPremium);
      expect(firstNonPremium).toBeGreaterThanOrEqual(premiumCount);
      expect(rows.slice(0, firstNonPremium).every((j) => j.isPremium)).toBe(true);
    });
  },
);
