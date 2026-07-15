import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

// AES-256-GCM field-level encryption for PII (PAN, mobile numbers).
// Key comes from env (Railway variable), never committed to the repo.
@Injectable()
export class FieldEncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    const secret = process.env.FIELD_ENCRYPTION_KEY;
    if (!secret || secret.length < 32) {
      throw new Error('FIELD_ENCRYPTION_KEY must be set and at least 32 chars');
    }
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  encrypt(plaintext: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return [iv.toString('base64'), tag.toString('base64'), encrypted.toString('base64')].join('.');
  }

  decrypt(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split('.');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, Buffer.from(ivB64, 'base64'));
    decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
    return decrypted.toString('utf8');
  }
}
