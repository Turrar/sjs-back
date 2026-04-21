import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SkillBadgeEntity,
  SkillTestEntity,
  SkillTestQuestionEntity,
  SkillTestResultEntity,
} from '../../database/entities';
import { PointEventType } from '../../database/entities/user-points.entity';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class SkillTestsService {
  constructor(
    @InjectRepository(SkillTestEntity)
    private readonly tests: Repository<SkillTestEntity>,
    @InjectRepository(SkillTestQuestionEntity)
    private readonly questions: Repository<SkillTestQuestionEntity>,
    @InjectRepository(SkillTestResultEntity)
    private readonly results: Repository<SkillTestResultEntity>,
    @InjectRepository(SkillBadgeEntity)
    private readonly badges: Repository<SkillBadgeEntity>,
    private readonly gamification: GamificationService,
  ) {}

  /** Список активных тестов */
  async listTests() {
    return this.tests.find({
      where: { isActive: true },
      order: { skill: 'ASC' },
    });
  }

  /** Тест с вопросами (правильные ответы скрыты) */
  async getTest(testId: string) {
    const test = await this.tests.findOne({
      where: { id: testId, isActive: true },
      relations: ['questions'],
    });
    if (!test) throw new NotFoundException('Test not found');
    return {
      id: test.id,
      skill: test.skill,
      description: test.description,
      passThreshold: test.passThreshold,
      questions: (test.questions ?? [])
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
        })),
    };
  }

  /** Отправить ответы и получить результат */
  async submit(
    studentUserId: string,
    testId: string,
    answers: Record<string, string>,
  ) {
    const test = await this.tests.findOne({
      where: { id: testId, isActive: true },
      relations: ['questions'],
    });
    if (!test) throw new NotFoundException('Test not found');
    if (!test.questions?.length) throw new BadRequestException('Test has no questions');

    // Подсчёт правильных ответов
    const total = test.questions.length;
    const correct = test.questions.filter(
      (q) => answers[q.id] === q.correctOptionId,
    ).length;
    const scorePercent = Math.round((correct / total) * 100);
    const passed = scorePercent >= test.passThreshold;

    // Сохраняем результат
    const result = await this.results.save(
      this.results.create({
        studentUserId,
        testId,
        answers,
        scorePercent,
        passed,
      }),
    );

    if (passed) {
      // Обновляем или создаём бейдж (upsert)
      const existing = await this.badges.findOne({
        where: { studentUserId, testId },
      });
      if (!existing || existing.scorePercent < scorePercent) {
        await this.badges.save(
          this.badges.create({
            ...( existing ? { id: existing.id } : {}),
            studentUserId,
            testId,
            skill: test.skill,
            scorePercent,
          }),
        );
      }
      this.gamification
        .award(studentUserId, PointEventType.SKILL_TEST_PASSED, { testId, skill: test.skill })
        .catch(() => null);
    }

    return {
      scorePercent,
      passed,
      correct,
      total,
      resultId: result.id,
    };
  }

  /** Бейджи студента (публичные, без ответов) */
  async getBadges(studentUserId: string) {
    return this.badges.find({
      where: { studentUserId },
      order: { earnedAt: 'DESC' },
    });
  }

  /** История попыток студента по конкретному тесту */
  async myResults(studentUserId: string, testId?: string) {
    return this.results.find({
      where: { studentUserId, ...(testId ? { testId } : {}) },
      order: { createdAt: 'DESC' },
    });
  }
}
