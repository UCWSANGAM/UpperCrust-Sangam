import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateReviewDto {
  @IsInt()
  @Min(2020)
  year: number;

  @IsInt()
  @Min(1)
  @Max(4)
  quarter: number;

  @IsOptional()
  @IsBoolean()
  contactMade?: boolean;

  @IsOptional()
  @IsBoolean()
  riskProfileReviewed?: boolean;

  @IsOptional()
  @IsBoolean()
  crossSellDiscussed?: boolean;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  actionItems?: string;
}
