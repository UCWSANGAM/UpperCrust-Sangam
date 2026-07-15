import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TicketWorkType } from '@prisma/client';

export class CreateTicketDto {
  @IsEnum(TicketWorkType)
  workType: TicketWorkType;

  @IsString()
  @MinLength(1)
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsString()
  assignedToId: string;
}
