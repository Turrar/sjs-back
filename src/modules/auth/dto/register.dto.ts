import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.EMPLOYER)
  @IsString()
  @IsNotEmpty()
  companyName?: string;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.STUDENT)
  @IsOptional()
  @IsString()
  firstName?: string;

  @ValidateIf((o: RegisterDto) => o.role === UserRole.STUDENT)
  @IsOptional()
  @IsString()
  lastName?: string;
}
