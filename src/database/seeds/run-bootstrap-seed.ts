import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as argon2 from 'argon2';
import dataSource from '../data-source';
import {
  EmployerProfileEntity,
  UserEntity,
} from '../entities';
import { UserRole } from '../../common/enums/user-role.enum';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function ensureAdmin() {
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD?.trim();
  if (!email || !password) {
    console.log('Skip admin: set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD');
    return null;
  }
  const users = dataSource.getRepository(UserEntity);
  let user = await users.findOne({ where: { email } });
  if (user) {
    console.log(`Admin already exists: ${email} id=${user.id}`);
    return user.id;
  }
  user = await users.save(
    users.create({
      email,
      passwordHash: await argon2.hash(password),
      role: UserRole.ADMIN,
      isActive: true,
    }),
  );
  console.log(`Admin created: ${email} id=${user.id}`);
  return user.id;
}

async function ensureHhSystemEmployer() {
  const email = process.env.BOOTSTRAP_HH_EMPLOYER_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_HH_EMPLOYER_PASSWORD?.trim();
  const companyName =
    process.env.BOOTSTRAP_HH_EMPLOYER_COMPANY?.trim() || 'SJS HH Import';
  if (!email || !password) {
    console.log(
      'Skip HH employer: set BOOTSTRAP_HH_EMPLOYER_EMAIL and BOOTSTRAP_HH_EMPLOYER_PASSWORD',
    );
    return null;
  }
  const users = dataSource.getRepository(UserEntity);
  const employers = dataSource.getRepository(EmployerProfileEntity);
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
    await employers.save(
      employers.create({
        userId: user.id,
        companyName,
      }),
    );
    console.log(`HH system employer created: ${email} id=${user.id}`);
  } else {
    if (!user.employerProfile) {
      await employers.save(
        employers.create({
          userId: user.id,
          companyName,
        }),
      );
    }
    console.log(`HH system employer exists: ${email} id=${user.id}`);
  }
  console.log(`Add to .env: HH_SYSTEM_EMPLOYER_USER_ID=${user.id}`);
  return user.id;
}

async function main() {
  await dataSource.initialize();
  try {
    await ensureAdmin();
    await ensureHhSystemEmployer();
    console.log('Bootstrap seed done.');
  } finally {
    await dataSource.destroy();
  }
}

void main();
