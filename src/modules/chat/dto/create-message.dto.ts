import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateMessageBodyDto {
  @IsString()
  @MinLength(1)
  @MaxLength(8000)
  body!: string;
}
