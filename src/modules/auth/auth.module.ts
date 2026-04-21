import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  EmployerProfileEntity,
  RefreshTokenEntity,
  StudentProfileEntity,
  UserEntity,
} from '../../database/entities';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserEntity,
      StudentProfileEntity,
      EmployerProfileEntity,
      RefreshTokenEntity,
    ]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRES_IN', '15m') as
            | `${number}m`
            | `${number}s`
            | `${number}h`
            | `${number}d`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard, RolesGuard],
  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
