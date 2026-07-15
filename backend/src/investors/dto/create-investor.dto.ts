import { IsOptional, IsString } from 'class-validator';

export class CreateInvestorDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  pan?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsOptional()
  @IsString()
  familyGroup?: string;
}
