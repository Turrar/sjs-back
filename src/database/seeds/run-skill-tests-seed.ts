import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import dataSource from '../data-source';
import {
  SkillTestEntity,
  SkillTestQuestionEntity,
} from '../entities';
import { SKILL_TESTS_SEED } from './data/skill-tests-seed';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function seedSkillTests() {
  const testsRepo = dataSource.getRepository(SkillTestEntity);
  const questionsRepo = dataSource.getRepository(SkillTestQuestionEntity);
  let created = 0;
  let skipped = 0;

  for (const row of SKILL_TESTS_SEED) {
    const existing = await testsRepo.findOne({ where: { skill: row.skill } });
    if (existing) {
      skipped += 1;
      continue;
    }
    const test = await testsRepo.save(
      testsRepo.create({
        skill: row.skill,
        description: row.description,
        passThreshold: row.passThreshold,
        isActive: true,
      }),
    );
    for (const q of row.questions) {
      await questionsRepo.save(
        questionsRepo.create({
          testId: test.id,
          question: q.question,
          options: q.options,
          correctOptionId: q.correctOptionId,
          sortOrder: q.sortOrder,
        }),
      );
    }
    created += 1;
  }
  return { created, skipped, total: SKILL_TESTS_SEED.length };
}

async function main() {
  await dataSource.initialize();
  try {
    const result = await seedSkillTests();
    console.log('Skill tests seed:', result);
  } finally {
    await dataSource.destroy();
  }
}

void main();
