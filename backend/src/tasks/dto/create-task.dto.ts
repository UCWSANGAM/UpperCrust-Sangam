import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TaskType } from '@prisma/client';

export class CreateTaskDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsEnum(TaskType)
  type?: TaskType;

  @IsOptional()
  @IsString()
  investorId?: string;

  @IsOptional()
  @IsString()
  assigneeId?: string;
}
