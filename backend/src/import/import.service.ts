import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { FieldEncryptionService } from '../common/crypto/field-encryption.service';

@Injectable()
export class ImportService {
  private readonly logger = new Logger('ImportService');

  constructor(private prisma: PrismaService, private crypto: FieldEncryptionService) {}

  // Single-source daily export: one row per investor, covers profile, AUM, sales,
  // and needs-gap data all at once. RM ownership comes from "Partner/Employee",
  // matched against real User accounts — never from whoever uploaded the file.
  // Processes in parallel batches (not one row at a time) — files can be 5,000+ rows.
  async importInvestorList(buffer: Buffer, fallbackOwnerId: string) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: null });

    const activeUsers = await this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    });

    const uccList = rows.map((r) => cleanValue(r['UCC'])).filter(Boolean) as string[];
    const existingByUccList = await this.prisma.investor.findMany({
      where: { ucc: { in: uccList } },
      select: { id: true, ucc: true },
    });
    const existingByUcc = new Map(existingByUccList.map((i) => [i.ucc, i.id]));

    // Fallback for the many investors with no real UCC in this export — match by name
    // so a daily re-upload updates them instead of creating duplicates every time.
    const existingByNameList = await this.prisma.investor.findMany({
      where: { ucc: null },
      select: { id: true, name: true },
    });
    const existingByName = new Map(existingByNameList.map((i) => [i.name.trim().toLowerCase(), i.id]));

    const unmatchedNames = new Set<string>();
    const resolveOwner = (partnerField: string | null): string | undefined => {
      if (!partnerField) return undefined;
      const haystack = partnerField.toLowerCase();
      const match = activeUsers.find((u) => haystack.includes(u.name.toLowerCase()));
      if (match) return match.id;
      unmatchedNames.add(partnerField.trim());
      return undefined;
    };

    const now = new Date();
    let created = 0;
    let updated = 0;

    const BATCH_SIZE = 100;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (row) => {
          const name = row['Investor'];
          if (!name) return;

          const ucc = cleanValue(row['UCC']);
          const pan = cleanValue(row['PAN']);
          const mobile = cleanValue(row['Investor Mobile No.']);
          const matchedOwnerId = resolveOwner(row['Partner/Employee'] ? String(row['Partner/Employee']) : null);

          const data = {
            name,
            email: row['Investor E-Mail Id.'] ? String(row['Investor E-Mail Id.']) : undefined,
            location: row['Location'] ? String(row['Location']) : undefined,
            familyGroup: row['Group'] ? String(row['Group']) : undefined,
            taxStatus: row['Tax Status'] ? String(row['Tax Status']) : undefined,
            gender: row['Gender'] ? String(row['Gender']) : undefined,
            dateOfBirth: parseDate(row['Date of Birth']),

            totalMfAum: toDecimal(row['Total MF AUM (₹)']),
            equityAum: toDecimal(row['Equity AUM (₹)']),
            debtAum: toDecimal(row['Debt AUM (₹)']),
            cashAum: toDecimal(row['Cash AUM (₹)']),
            goldAum: toDecimal(row['Gold  AUM (₹)']),
            pmsAum: toDecimal(row['PMS AUM (₹)']),
            totalAumMfPms: toDecimal(row['Total AUM - MF + PMS (₹)']),

            xirrEquity: toDecimal(row['Investor XIRR - MF Equity']),
            xirrDebt: toDecimal(row['Investor XIRR - MF Debt']),
            xirrTotal: toDecimal(row['Investor XIRR - MF Total']),

            netSalesFY: toDecimal(row['MF Net Sales (FY) (₹)']),
            grossSalesFY: toDecimal(row['MF Gross Sales (FY) (₹)']),
            redemptionsFY: toDecimal(row['MF Redemptions (FY) (₹)']),
            netSalesCY: toDecimal(row['MF Net Sales (CY) (₹)']),
            grossSalesCY: toDecimal(row['MF Gross Sales (CY) (₹)']),
            redemptionsCY: toDecimal(row['MF Redemptions(CY) (₹)']),
            liveSipAmount: toDecimal(row['Live SIP Amount']),
            liveSipCount: toInt(row['No. of Live SIPs']),

            totalNeedsIdentified: toInt(row['Total needs Identified']),
            mappedNeedWithGap: toInt(row['No. of Mapped Need with gap']),
            totalLumpsumGapAmount: toDecimal(row['Total Lumpsum Gap Amount (₹)']),
            totalSipGapAmount: toDecimal(row['Total SIP Gap Amount (₹)']),

            panEncrypted: pan ? this.crypto.encrypt(pan) : undefined,
            mobileEncrypted: mobile ? this.crypto.encrypt(mobile) : undefined,
            lastImportedAt: now,
            ...(matchedOwnerId ? { ownerId: matchedOwnerId } : {}),
          };

          const existingId = ucc ? existingByUcc.get(ucc) : existingByName.get(String(name).trim().toLowerCase());

          if (existingId) {
            await this.prisma.investor.update({ where: { id: existingId }, data });
            updated++;
          } else {
            await this.prisma.investor.create({
              data: { ...data, ucc, ownerId: matchedOwnerId || fallbackOwnerId },
            });
            created++;
          }
        }),
      );

      this.logger.log(`Import progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} rows`);
    }

    this.logger.log(`Investor import: ${created} created, ${updated} updated, ${unmatchedNames.size} unmatched RM names`);
    return { created, updated, total: rows.length, unmatchedRMs: Array.from(unmatchedNames) };
  }

  // Kept for legacy folio-level detail if a separate folio export is ever uploaded again
  async importFolioReport(buffer: Buffer) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheet = wb.Sheets[wb.SheetNames[0]];
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

    return { created, skipped, total: rows.length };
  }
}

// Source file uses "-" as a placeholder for "no value" in text fields — treat it as null,
// not as a literal value (this was crashing UCC/PAN uniqueness on import).
function cleanValue(value: any): string | undefined {
  if (value === null || value === undefined) return undefined;
  const str = String(value).trim();
  if (str === '' || str === '-') return undefined;
  return str;
}

function toDecimal(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = parseFloat(String(value).replace(/,/g, ''));
  return isNaN(n) ? undefined : n;
}

function toInt(value: any): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? undefined : n;
}

function parseDate(value: any): Date | undefined {
  if (!value || value === '-') return undefined;
  // Source format is DD-MM-YYYY
  const parts = String(value).split('-');
  if (parts.length !== 3) return undefined;
  const [dd, mm, yyyy] = parts;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return isNaN(date.getTime()) ? undefined : date;
}
