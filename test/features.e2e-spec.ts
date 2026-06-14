import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { applyHttpMiddleware } from '../src/configure-app';
import { AppModule } from '../src/app.module';

const hasIntegrationEnv =
  Boolean(process.env.DATABASE_URL) && Boolean(process.env.JWT_SECRET);

(hasIntegrationEnv ? describe : describe.skip)(
  'Feature matrix (e2e integration)',
  () => {
    let app: INestApplication<App>;
    let employerToken: string;
    let studentToken: string;
    let employerUserId: string;
    let studentUserId: string;
    let jobId: string;
    let applicationId: string;
    let internshipId: string;

    jest.setTimeout(120_000);

    beforeAll(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      applyHttpMiddleware(app);
      await app.init();

      const ts = Date.now();
      const empReg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `e2e-feat-emp-${ts}@test.local`,
          password: 'password12',
          role: 'EMPLOYER',
          companyName: 'Feature Corp',
        })
        .expect(201);
      employerToken = (empReg.body as { accessToken: string }).accessToken;

      const empMe = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);
      employerUserId = (empMe.body as { id: string }).id;

      const stuReg = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `e2e-feat-stu-${ts}@test.local`,
          password: 'password12',
          role: 'STUDENT',
          firstName: 'Feature',
          lastName: 'Student',
        })
        .expect(201);
      studentToken = (stuReg.body as { accessToken: string }).accessToken;

      const stuMe = await request(app.getHttpServer())
        .get('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      studentUserId = (stuMe.body as { id: string }).id;

      const create = await request(app.getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ title: 'Feature Test Job', description: 'E2E feature matrix' })
        .expect(201);
      jobId = (create.body as { id: string }).id;

      await request(app.getHttpServer())
        .patch(`/api/jobs/${jobId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ status: 'PUBLISHED' })
        .expect(200);

      const apply = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ jobId, coverLetter: 'E2E apply' })
        .expect(201);
      applicationId = (apply.body as { id: string }).id;
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('§F-10 GET /applications/:id — student and employer', async () => {
      const studentView = await request(app.getHttpServer())
        .get(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const body = studentView.body as {
        id: string;
        job?: { title: string };
        student?: { email: string };
        studentProfile?: { firstName: string };
      };
      expect(body.id).toBe(applicationId);
      expect(body.job?.title).toBeDefined();
      expect(body.student?.email).toBeDefined();
      expect(body.studentProfile?.firstName).toBeDefined();
      expect(body.student).not.toHaveProperty('passwordHash');

      await request(app.getHttpServer())
        .get(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);
    });

    it('P0 PATCH /applications/:id/withdraw — student', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/jobs')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ title: 'Withdraw Test Job', description: 'E2E withdraw' })
        .expect(201);
      const withdrawJobId = (create.body as { id: string }).id;

      await request(app.getHttpServer())
        .patch(`/api/jobs/${withdrawJobId}`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ status: 'PUBLISHED' })
        .expect(200);

      const apply = await request(app.getHttpServer())
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ jobId: withdrawJobId })
        .expect(201);
      const withdrawAppId = (apply.body as { id: string }).id;

      const withdrawn = await request(app.getHttpServer())
        .patch(`/api/applications/${withdrawAppId}/withdraw`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect((withdrawn.body as { status: string }).status).toBe('WITHDRAWN');
    });

    it('P1 GET /applications/job/:jobId?status= filter', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/applications/job/${jobId}?status=SUBMITTED`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const list = res.body as Array<{ id: string; status: string }>;
      expect(Array.isArray(list)).toBe(true);
      expect(list.some((a) => a.id === applicationId)).toBe(true);
      expect(list.every((a) => a.status === 'SUBMITTED')).toBe(true);
    });

    it('P2 GET /notifications/unread-count', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/notifications/unread-count')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          unreadCount: expect.any(Number),
        }),
      );
    });

    it('§F-04 GET /media/url — requires JWT', async () => {
      await request(app.getHttpServer()).get('/api/media/url').expect(401);
    });

    it('§F-14 job-alerts CRUD', async () => {
      const create = await request(app.getHttpServer())
        .post('/api/job-alerts')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ q: 'intern' })
        .expect(201);

      const alertId = (create.body as { id: string }).id;

      const list = await request(app.getHttpServer())
        .get('/api/job-alerts')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      expect(Array.isArray(list.body)).toBe(true);

      await request(app.getHttpServer())
        .patch(`/api/job-alerts/${alertId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ isActive: false })
        .expect(200);

      await request(app.getHttpServer())
        .delete(`/api/job-alerts/${alertId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
    });

    it('§F-11 schedule sources and slots', async () => {
      await request(app.getHttpServer())
        .post('/api/schedule/sources')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          storageKey: `uploads/${studentUserId}/e2e/schedule-${Date.now()}.pdf`,
          mimeType: 'application/pdf',
        })
        .expect(201);

      const sources = await request(app.getHttpServer())
        .get('/api/schedule/sources')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      expect(Array.isArray(sources.body)).toBe(true);

      const slots = await request(app.getHttpServer())
        .get('/api/schedule/slots')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);
      expect(Array.isArray(slots.body)).toBe(true);
    });

    it('§F-23 chat messages roundtrip', async () => {
      await request(app.getHttpServer())
        .post(`/api/chat/applications/${applicationId}/messages`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ body: 'Hello from employer e2e' })
        .expect(201);

      const list = await request(app.getHttpServer())
        .get(`/api/chat/applications/${applicationId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const messages = list.body as Array<{ body: string }>;
      expect(messages.some((m) => m.body === 'Hello from employer e2e')).toBe(true);
    });

    it('§F-25 internship open + §F-18 totalHours', async () => {
      await request(app.getHttpServer())
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ status: 'REVIEWING' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ status: 'INTERVIEW' })
        .expect(200);

      await request(app.getHttpServer())
        .patch(`/api/applications/${applicationId}/status`)
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ status: 'OFFER' })
        .expect(200);

      const open = await request(app.getHttpServer())
        .post('/api/internships')
        .set('Authorization', `Bearer ${employerToken}`)
        .send({ applicationId })
        .expect(201);

      internshipId = (open.body as { id: string }).id;

      await request(app.getHttpServer())
        .post(`/api/internships/${internshipId}/log`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ date: '2026-06-01', hours: 4, description: 'Day 1' })
        .expect(201);

      const hours = await request(app.getHttpServer())
        .get(`/api/internships/${internshipId}/total-hours`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(hours.body).toEqual({ totalHours: 4 });
    });

    it('§F-18 total-hours forbidden for non-participant', async () => {
      const stranger = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: `e2e-stranger-hours-${Date.now()}@test.local`,
          password: 'password12',
          role: 'STUDENT',
          firstName: 'Stranger',
        })
        .expect(201);

      const strangerToken = (stranger.body as { accessToken: string }).accessToken;

      await request(app.getHttpServer())
        .get(`/api/internships/${internshipId}/total-hours`)
        .set('Authorization', `Bearer ${strangerToken}`)
        .expect(403);
    });

    it('§F-23 chat messages without passwordHash in sender', async () => {
      const list = await request(app.getHttpServer())
        .get(`/api/chat/applications/${applicationId}/messages`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const messages = list.body as Array<{ sender?: Record<string, unknown> }>;
      expect(Array.isArray(messages)).toBe(true);
      if (messages.length > 0 && messages[0].sender) {
        expect(messages[0].sender).not.toHaveProperty('passwordHash');
      }
    });

    it('§F-17 POST /reviews + §F-26 GET employer reviews', async () => {
      const review = await request(app.getHttpServer())
        .post('/api/reviews')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          employerUserId,
          rating: 5,
          comment: 'Great company',
          isAnonymous: false,
        })
        .expect(201);

      expect(review.body).toHaveProperty('id');

      const list = await request(app.getHttpServer())
        .get(`/api/reviews/employer/${employerUserId}`)
        .expect(200);

      const body = list.body as { reviewCount: number; avgRating: number };
      expect(body.reviewCount).toBeGreaterThanOrEqual(1);
      expect(body.avgRating).toBeGreaterThanOrEqual(1);
    });

    it('P0 GET /reviews/me + hasReviewed on application', async () => {
      const mine = await request(app.getHttpServer())
        .get('/api/reviews/me')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const reviews = (mine.body as { reviews: Array<{ employerUserId: string }> }).reviews;
      expect(Array.isArray(reviews)).toBe(true);
      expect(reviews.some((r) => r.employerUserId === employerUserId)).toBe(true);

      const appRes = await request(app.getHttpServer())
        .get(`/api/applications/${applicationId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect((appRes.body as { hasReviewed: boolean }).hasReviewed).toBe(true);
    });

    it('P1 GET /profiles/employer/:userId — public company page', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/profiles/employer/${employerUserId}`)
        .expect(200);

      const body = res.body as {
        userId: string;
        companyName: string;
        reviewCount: number;
        avgRating: number | null;
        logoUrl: string | null;
        publishedJobs: unknown[];
        publishedJobsCount: number;
        recentReviews: unknown[];
      };
      expect(body.userId).toBe(employerUserId);
      expect(body.companyName).toBeDefined();
      expect(body.reviewCount).toBeGreaterThanOrEqual(1);
      expect(body).toHaveProperty('avgRating');
      expect(Array.isArray(body.publishedJobs)).toBe(true);
      expect(typeof body.publishedJobsCount).toBe('number');
      expect(Array.isArray(body.recentReviews)).toBe(true);
      expect(body).not.toHaveProperty('logoStorageKey');
      expect(body).not.toHaveProperty('telegramChatId');
    });

    it('§F-22 GET kaspi premium status', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/payments/kaspi/premium/${jobId}/status`)
        .set('Authorization', `Bearer ${employerToken}`)
        .expect(200);

      const body = res.body as { jobId: string; isPremium: boolean; title: string };
      expect(body.jobId).toBe(jobId);
      expect(typeof body.isPremium).toBe('boolean');
      expect(body.title).toBeDefined();
    });

    it('§F-16 skill test submit + §F-15 badges in public profile', async () => {
      const tests = await request(app.getHttpServer()).get('/api/skill-tests').expect(200);
      const testList = tests.body as Array<{ id: string }>;

      if (testList.length === 0) {
        return;
      }

      const testDetail = await request(app.getHttpServer())
        .get(`/api/skill-tests/${testList[0].id}`)
        .expect(200);

      const detail = testDetail.body as {
        id: string;
        questions: Array<{ id: string; options: Array<{ id: string }> }>;
      };

      if (!detail.questions?.length) {
        return;
      }

      const answers: Record<string, string> = {};
      for (const q of detail.questions) {
        answers[q.id] = q.options[0]?.id ?? 'a';
      }

      const submit = await request(app.getHttpServer())
        .post('/api/skill-tests/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ testId: detail.id, answers })
        .expect(201);

      const result = submit.body as { passed: boolean };
      if (!result.passed) {
        return;
      }

      const profile = await request(app.getHttpServer())
        .get(`/api/profiles/${studentUserId}`)
        .expect(200);

      const prof = profile.body as { badges: Array<{ skill: string }> };
      expect(Array.isArray(prof.badges)).toBe(true);
      expect(prof.badges.length).toBeGreaterThan(0);
    });
  },
);

(hasIntegrationEnv && process.env.E2E_ADMIN_EMAIL ? describe : describe.skip)(
  'Admin features matrix (e2e integration)',
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

    it('§F-28 GET /admin/users?role=EMPLOYER with verificationStatus', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/users?role=EMPLOYER&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as {
        data: Array<{ role: string; verificationStatus?: string; companyName?: string | null }>;
        total: number;
      };
      expect(Array.isArray(body.data)).toBe(true);
      if (body.data.length > 0) {
        expect(body.data[0].role).toBe('EMPLOYER');
        expect(body.data[0].verificationStatus).toBeDefined();
        expect(body.data[0]).toHaveProperty('companyName');
      }
    });

    it('§F-28 GET /admin/jobs with employerEmail', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/admin/jobs?status=PUBLISHED&limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const body = res.body as {
        data: Array<{ employerEmail?: string | null; title: string }>;
      };
      expect(Array.isArray(body.data)).toBe(true);
      if (body.data.length > 0) {
        expect(body.data[0]).toHaveProperty('employerEmail');
        expect(body.data[0].title).toBeDefined();
      }
    });
  },
);
