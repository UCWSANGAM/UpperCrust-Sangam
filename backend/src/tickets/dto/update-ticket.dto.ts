import { IsEnum, IsOptional } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;
}
