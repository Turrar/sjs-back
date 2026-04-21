import { IsObject, IsUUID } from 'class-validator';

export class SubmitTestDto {
  @IsUUID()
  testId!: string;

  /** { [questionId]: selectedOptionId } */
  @IsObject()
  answers!: Record<string, string>;
}
