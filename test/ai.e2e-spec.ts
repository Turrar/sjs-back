import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { applyHttpMiddleware } from '../src/configure-app';
import { AppModule } from '../src/app.module';

const hasIntegrationEnv =
  Boolean(process.env.DATABASE_URL) && Boolean(process.env.JWT_SECRET);

(hasIntegrationEnv ? describe : describe.skip)(
  'AiModule (e2e integration)',
  () => {
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

    it('GET /ai/health returns module and embedding settings', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/ai/health')
        .expect(200);
      const body = res.body as {
        module: string;
        openaiEmbeddings: { configured: boolean; model: string };
      };
      expect(body.module).toBe('AiModule');
      expect(body.openaiEmbeddings).toBeDefined();
      expect(typeof body.openaiEmbeddings.configured).toBe('boolean');
      expect(typeof body.openaiEmbeddings.model).toBe('string');
    });
  },
);
