import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { randomBytes } from 'crypto';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import {
  EmployerProfileEntity,
  RefreshTokenEntity,
  StudentProfileEntity,
  UserEntity,
} from '../../database/entities';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

@Injectable()
export class AuthService {
  private readonly log = new Logger(AuthService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly users: Repository<UserEntity>,
    @InjectRepository(StudentProfileEntity)
    private readonly students: Repository<StudentProfileEntity>,
    @InjectRepository(EmployerProfileEntity)
    private readonly employers: Repository<EmployerProfileEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokens: Repository<RefreshTokenEntity>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    if (dto.role === UserRole.ADMIN) {
      throw new ConflictException('Cannot register as admin');
    }
    const existing = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existing) {
      throw new ConflictException('Email already registered');
    }
    const passwordHash = await argon2.hash(dto.password);
    const user = this.users.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      role: dto.role,
    });
    await this.users.save(user);
    if (dto.role === UserRole.STUDENT) {
      await this.students.save(
        this.students.create({
          userId: user.id,
          firstName: dto.firstName ?? null,
          lastName: dto.lastName ?? null,
        }),
      );
    } else if (dto.role === UserRole.EMPLOYER) {
      await this.employers.save(
        this.employers.create({
          userId: user.id,
          companyName: dto.companyName!,
        }),
      );
    }
    this.log.log(`User registered id=${user.id} role=${dto.role}`);
    return this.issueTokensForUser(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (!user?.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const ok = await argon2.verify(user.passwordHash, dto.password);
    if (!ok) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.issueTokensForUser(user);
  }

  async refresh(refreshTokenPlain: string): Promise<AuthTokens> {
    const row = await this.refreshTokens.findOne({
      where: { token: refreshTokenPlain },
      relations: ['user'],
    });
    if (!row || row.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    const user = row.user;
    if (!user?.isActive) {
      throw new UnauthorizedException();
    }
    await this.refreshTokens.delete({ id: row.id });
    return this.issueTokensForUser(user);
  }

  async logout(refreshTokenPlain: string): Promise<void> {
    await this.refreshTokens.delete({ token: refreshTokenPlain });
  }

  private async issueTokensForUser(user: UserEntity): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const expiresIn = this.config.get<string>('JWT_EXPIRES_IN', '15m');
    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: expiresIn as
        | `${number}m`
        | `${number}s`
        | `${number}h`
        | `${number}d`,
    });
    const decodedUnknown: unknown = this.jwt.decode(accessToken);
    let expiresInSec = 900;
    if (
      decodedUnknown &&
      typeof decodedUnknown === 'object' &&
      'exp' in decodedUnknown &&
      'iat' in decodedUnknown
    ) {
      const d = decodedUnknown as { exp: number; iat: number };
      expiresInSec = d.exp - d.iat;
    }

    const refreshPlain = randomBytes(48).toString('hex');
    const days = Number(this.config.get('REFRESH_TOKEN_DAYS', '30'));
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId: user.id,
        token: refreshPlain,
        expiresAt,
      }),
    );

    return {
      accessToken,
      refreshToken: refreshPlain,
      expiresIn: expiresInSec,
    };
  }
}
