import { IsEnum, IsOptional, IsNumber } from 'class-validator';
import { ProductStatus } from '@prisma/client';

export class UpdateHoldingDto {
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @IsOptional()
  @IsNumber()
  amount?: number;
}
