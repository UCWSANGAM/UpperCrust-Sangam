import { Module } from '@nestjs/common';
import { InvestorsController } from './investors.controller';
import { InvestorsService } from './investors.service';
import { FieldEncryptionService } from '../common/crypto/field-encryption.service';

@Module({
  controllers: [InvestorsController],
  providers: [InvestorsService, FieldEncryptionService],
})
export class InvestorsModule {}
