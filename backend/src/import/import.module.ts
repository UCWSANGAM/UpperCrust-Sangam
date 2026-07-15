import { Module } from '@nestjs/common';
import { ImportController } from './import.controller';
import { ImportService } from './import.service';
import { FieldEncryptionService } from '../common/crypto/field-encryption.service';

@Module({
  controllers: [ImportController],
  providers: [ImportService, FieldEncryptionService],
})
export class ImportModule {}
