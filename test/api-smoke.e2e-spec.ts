import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { applyHttpMiddleware } from '../src/configure-app';
import { AppModule } from '../src/app.module';

const hasIntegrationEnv =
  Boolean(process.env.DATABASE_URL) && Boolean(process.env.JWT_SECRET);

(hasIntegrationEnv ? describe : describe.skip)(
  'API smoke (e2e integration)',
  () => {
    let app: INestApplication<App>;

    jest.setTimeout(120_000);

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      applyHttpMiddleware(app);
      await app.init();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('GET /health — Terminus', async () => {
      const res = await request(app.getHttpServer()).get('/api/health');
      expect([200, 503]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toHaveProperty('status');
      }
    });

    it('GET /catalog/job-form — cities + categories + tags', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/catalog/job-form')
        .expect(200);
      const body = res.body as {
        cities: unknown[];
        jobCategories: unknown[];
        tags: unknown[];
      };
      expect(Array.isArray(body.cities)).toBe(true);
      expect(Array.isArray(body.jobCategories)).toBe(true);
      expect(Array.isArray(body.tags)).toBe(true);
      if (body.cities.length > 0) {
        expect(body.cities[0]).toHaveProperty('imageUrl');
      }
      if (body.jobCategories.length > 0) {
        expect(body.jobCategories[0]).toHaveProperty('imageUrl');
      }
    });

    it('GET /jobs — published list', async () => {
      const res = await request(app.getHttpServer()).get('/api/jobs').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('GET /skill-tests — list', async () => {
      const res = await request(app.getHttpServer()).get('/api/skill-tests').expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('auth + GET /users/me for new student', async () => {
      const email = `e2e-smoke-${Date.now()}@test.local`;
      const password = 'password12';

      const reg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          role: 'STUDENT',
          firstName: 'E2E',
          lastName: 'Smoke',
        })
        .expect(201);

      const { accessToken } = reg.body as { accessToken: string };

      const me = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const meBody = me.body as { role: string; profile?: { firstName?: string } };
      expect(meBody.role).toBe('STUDENT');
      expect(meBody.profile?.firstName).toBe('E2E');
    });

    it('POST /auth/refresh returns new tokens', async () => {
      const email = `e2e-refresh-${Date.now()}@test.local`;

      const reg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password: 'password12',
          role: 'STUDENT',
        })
        .expect(201);

      const { refreshToken } = reg.body as { refreshToken: string };

      const refreshed = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      const body = refreshed.body as {
        accessToken: string;
        refreshToken: string;
      };
      expect(body.accessToken).toBeDefined();
      expect(body.refreshToken).toBeDefined();
    });
  },
);
