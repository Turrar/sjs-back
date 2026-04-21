import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule as NestScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { ApplicationsModule } from './modules/applications/applications.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ChatModule } from './modules/chat/chat.module';
import { EmployerReviewsModule } from './modules/employer-reviews/employer-reviews.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { HealthModule } from './modules/health/health.module';
import { InternshipModule } from './modules/internship/internship.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SkillTestsModule } from './modules/skill-tests/skill-tests.module';
import { SmsModule } from './modules/sms/sms.module';
import { VideoModule } from './modules/video/video.module';
import { JobAlertsModule } from './modules/job-alerts/job-alerts.module';
import { JobsModule } from './modules/jobs/jobs.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ResumeModule } from './modules/resume/resume.module';
import { ScheduleModule } from './modules/schedule/schedule.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { UploadModule } from './modules/upload/upload.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    NestScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },   // 20 req/s
      { name: 'long', ttl: 60000, limit: 300 },   // 300 req/min
    ]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    JobsModule,
    ApplicationsModule,
    ScheduleModule,
    AiModule,
    ChatModule,
    NotificationsModule,
    UploadModule,
    AdminModule,
    AnalyticsModule,
    ResumeModule,
    TelegramModule,
    SmsModule,
    JobAlertsModule,
    ProfilesModule,
    EmployerReviewsModule,
    GamificationModule,
    InternshipModule,
    SkillTestsModule,
    VideoModule,
    CalendarModule,
    PaymentsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
