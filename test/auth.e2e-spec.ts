import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { applyHttpMiddleware } from '../src/configure-app';
import { AppModule } from '../src/app.module';

const hasIntegrationEnv =
  Boolean(process.env.DATABASE_URL) && Boolean(process.env.JWT_SECRET);

(hasIntegrationEnv ? describe : describe.skip)('Auth (e2e integration)', () => {
  let app: INestApplication<App>;

  jest.setTimeout(60_000);

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

  it('registers and logs in a student', async () => {
    const email = `e2e-student-${Date.now()}@test.local`;
    const password = 'password12';

    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        role: 'STUDENT',
      })
      .expect(201);

    const regBody = reg.body as {
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };
    expect(regBody.accessToken).toBeDefined();
    expect(regBody.refreshToken).toBeDefined();
    expect(regBody.expiresIn).toBeDefined();

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const loginBody = login.body as {
      accessToken: string;
      refreshToken: string;
    };
    expect(loginBody.accessToken).toBeDefined();
    expect(loginBody.refreshToken).toBeDefined();
  });

  it('registers an employer with company name', async () => {
    const email = `e2e-employer-${Date.now()}@test.local`;

    const reg = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'password12',
        role: 'EMPLOYER',
        companyName: 'E2E Corp',
      })
      .expect(201);

    expect((reg.body as { accessToken: string }).accessToken).toBeDefined();
  });
});
