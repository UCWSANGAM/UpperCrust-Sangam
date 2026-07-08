import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { FieldEncryptionService } from '../common/crypto/field-encryption.service';

@Injectable()
export class ImportService {
  private readonly logger = new Logger('ImportService');

  constructor(private prisma: PrismaService, private crypto: FieldEncryptionService) {}

  // Investor list export: one row per investor, rich AUM/XIRR fields
  async importInvestorList(buffer: Buffer, ownerId: string) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    let created = 0;
    let updated = 0;

    for (const row of rows) {
      const name = row['Investor'];
      if (!name) continue;

      const ucc = row['UCC'] ? String(row['UCC']) : undefined;
      const pan = row['PAN'] ? String(row['PAN']) : undefined;
      const mobile = row['Investor Mobile No.'] ? String(row['Investor Mobile No.']) : undefined;

      const data = {
        name,
        familyGroup: row['Group'] ? String(row['Group']) : undefined,
        taxStatus: row['Tax Status'] ? String(row['Tax Status']) : undefined,
        gender: row['Gender'] ? String(row['Gender']) : undefined,
        totalMfAum: toDecimal(row['Total MF AUM (₹)']),
        equityAum: toDecimal(row['Equity AUM (₹)']),
        debtAum: toDecimal(row['Debt AUM (₹)']),
        xirrEquity: toDecimal(row['Investor XIRR - MF Equity']),
        xirrDebt: toDecimal(row['Investor XIRR - MF Debt']),
        xirrTotal: toDecimal(row['Investor XIRR - MF Total']),
        panEncrypted: pan ? this.crypto.encrypt(pan) : undefined,
        mobileEncrypted: mobile ? this.crypto.encrypt(mobile) : undefined,
        ownerId,
      };

      const existing = ucc ? await this.prisma.investor.findUnique({ where: { ucc } }) : null;

      if (existing) {
        await this.prisma.investor.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await this.prisma.investor.create({ data: { ...data, ucc } });
        created++;
      }
    }

    this.logger.log(`Investor list import: ${created} created, ${updated} updated`);
    return { created, updated, total: rows.length };
  }

  // Live Folio Report: one row per folio, linked to investor by name (fallback) or UCC
  async importFolioReport(buffer: Buffer) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    // First row is a title row in this export — header is row 2
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null, range: 1 });

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const investorName = row['Investor'];
      const folioNumber = row['Folio No'];
      if (!investorName || !folioNumber) continue;

      const investor = await this.prisma.investor.findFirst({ where: { name: investorName } });
      if (!investor) {
        skipped++;
        continue;
      }

      const cleanFolioNo = String(folioNumber).replace(/^'/, '');

      const existing = await this.prisma.folio.findFirst({
        where: { investorId: investor.id, folioNumber: cleanFolioNo, scheme: row['Scheme'] },
      });
      if (existing) continue;

      await this.prisma.folio.create({
        data: {
          investorId: investor.id,
          folioNumber: cleanFolioNo,
          amc: row['AMC'] || 'Unknown',
          scheme: row['Scheme'] || 'Unknown',
          option: row['Option'],
          status: row['Folio Status'],
          balanceUnits: toDecimal(String(row['Balance Units'] || '').replace(/^'/, '')),
          currentValue: toDecimal(String(row['Current Value'] || '').replace(/^'|,/g, '')),
        },
      });
      created++;
    }

    this.logger.log(`Folio report import: ${created} created, ${skipped} skipped (investor not found)`);
    return { created, skipped, total: rows.length };
  }
}

function toDecimal(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(n) ? undefined : n;
}
