import { IsDateString, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TicketWorkType, TicketPriority } from '@prisma/client';

export class CreateTicketDto {
  @IsEnum(TicketWorkType)
  workType: TicketWorkType;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

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
