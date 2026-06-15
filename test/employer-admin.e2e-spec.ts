import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { applyHttpMiddleware } from '../src/configure-app';
import { AppModule } from '../src/app.module';

const hasIntegrationEnv =
  Boolean(process.env.DATABASE_URL) && Boolean(process.env.JWT_SECRET);

(hasIntegrationEnv ? describe : describe.skip)(
  'Employer and Admin flows (e2e integration)',
  () => {
    let app: INestApplication<App>;
    let employerToken: string;
    let studentToken: string;
    let adminToken: string;
    let jobId: string;
    let applicationId: string;

    jest.setTimeout(120_000);

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      applyHttpMiddleware(app);
      await app.init();

      const ts = Date.now();
      const employerEmail = `e2e-emp-${ts}@test.local`;
      const studentEmail = `e2e-stu-${ts}@test.local`;
      const adminEmail = `e2e-adm-${ts}@test.local`;

      const empReg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: employerEmail,
          password: 'password12',
          role: 'EMPLOYER',
          companyName: 'E2E Corp',
        })
        .expect(201);
      employerToken = (empReg.body as { accessToken: string }).accessToken;

      const stuReg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: studentEmail,
          password: 'password12',
          role: 'STUDENT',
          firstName: 'E2E',
          lastName: 'Student',
        })
        .expect(201);
      studentToken = (stuReg.body as { accessToken: string }).accessToken;

      // Admin via direct DB would need seed; register fails for ADMIN — skip admin tests
      // if bootstrap not run. Create admin by registering employer pattern won't work.
      // Use env BOOTSTRAP or skip admin block when no admin exists.
      adminToken = '';
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('employer creates and publishes a job', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({
          title: 'E2E Intern',
          description: 'Test job for e2e',
        })
        .expect(201);

      jobId = (create.body as { id: string }).id;

      await request(app.getHttpServer())
        .patch(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ status: 'PUBLISHED' })
        .expect(200);
    });

    it('student applies and employer lists applications without passwordHash', async () => {
      const apply = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ jobId })
        .expect(201);

      applicationId = (apply.body as { id: string }).id;

      const list = await request(app.getHttpServer())
        .get(`/api/applications/job/${jobId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const body = list.body as Array<{ student?: Record<string, unknown> }>;
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      const student = body[0].student;
      expect(student).toBeDefined();
      expect(student).not.toHaveProperty('passwordHash');
    });

    it('GET /applications/:id returns expanded application', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const body = res.body as {
        id: string;
        job?: { title: string };
        studentProfile?: { firstName: string };
      };
      expect(body.id).toBe(applicationId);
      expect(body.job?.title).toBeDefined();
      expect(body.studentProfile?.firstName).toBeDefined();
    });

    it('employer updates application status', async () => {
      await request(app.getHttpServer())
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ status: 'REVIEWING' })
        .expect(200);
    });

    it('employer cannot set isPremium via PATCH job', async () => {
      await request(app.getHttpServer())
        .patch(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ isPremium: true })
        .expect(400);
    });

    it('video room requires participant access', async () => {
      const ok = await request(app.getHttpServer())
        .post(`/api/video/rooms/${applicationId}`)
        .set('Authorization', `Bearer ${employerToken}`);

      expect([200, 201]).toContain(ok.status);

      const stranger = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `e2e-stranger-${Date.now()}@test.local`,
          password: 'password12',
          role: 'STUDENT',
        })
        .expect(201);

      const strangerToken = (stranger.body as { accessToken: string }).accessToken;

      await request(app.getHttpServer())
        .post(`/api/video/rooms/${applicationId}`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .expect(403);
    });

    it('employer analytics summary', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/analytics/employer/me')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const body = res.body as { jobs: number; applications: number };
      expect(body.jobs).toBeGreaterThanOrEqual(1);
      expect(body.applications).toBeGreaterThanOrEqual(1);
    });

    it('kaspi premium init returns paymentUrl (demo without keys)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/payments/kaspi/premium/${jobId}`)
        .set('Authorization', `Bearer ${employerToken}`);

      expect([200, 201]).toContain(res.status);
      const body = res.body as { orderId: string; paymentUrl: string };
      expect(body.orderId).toBeDefined();
      expect(body.paymentUrl).toContain('http');
    });

    it('telegram link-token + webhook binds chat_id', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/telegram/link-token')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 201]).toContain(res.status);

      const body = res.body as { deepLink: string; linkCode: string };
      expect(body.deepLink).toContain('t.me/');
      expect(body.linkCode).toBeDefined();
      expect(body.linkCode.length).toBeLessThanOrEqual(64);
      expect(body.deepLink).toContain(`start=${body.linkCode}`);

      const webhook = request(app.getHttpServer())
        .post('/api/telegram/webhook')
        .send({
          message: {
            chat: { id: 900001 },
            text: `/start ${body.linkCode}`,
          },
        });
      if (process.env.TELEGRAM_WEBHOOK_SECRET) {
        webhook.set(
          'X-Telegram-Bot-Api-Secret-Token',
          process.env.TELEGRAM_WEBHOOK_SECRET,
        );
      }
      await webhook.expect((res) => {
        expect([200, 201]).toContain(res.status);
      });

      const me = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const profile = (me.body as { profile?: { telegramChatId?: string | null } }).profile;
      expect(profile?.telegramChatId).toBe('***linked***');
    });
  },
);

(hasIntegrationEnv && process.env.E2E_ADMIN_EMAIL ? describe : describe.skip)(
  'Admin API (e2e integration)',
  () => {
    let app: INestApplication<App>;
    let adminToken: string;

    jest.setTimeout(120_000);

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      applyHttpMiddleware(app);
      await app.init();

      const login = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: process.env.E2E_ADMIN_EMAIL,
          password: process.env.E2E_ADMIN_PASSWORD ?? 'password12',
        });

      if (login.status !== 200) {
        throw new Error('E2E admin login failed — run npm run seed:bootstrap first');
      }
      adminToken = (login.body as { accessToken: string }).accessToken;
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('GET /admin/skill-tests lists tests', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/skill-tests')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('POST /admin/skill-tests creates a test', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/admin/skill-tests')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          skill: `E2E Skill ${Date.now()}`,
          passThreshold: 70,
          questions: [
            {
              question: '2+2?',
              options: [
                { id: 'a', text: '4' },
                { id: 'b', text: '5' },
              ],
              correctOptionId: 'a',
            },
          ],
        })
        .expect(201);
      expect(res.body).toHaveProperty('id');
    });
  },
);
