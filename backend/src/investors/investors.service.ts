import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FieldEncryptionService } from '../common/crypto/field-encryption.service';
import { CreateInvestorDto } from './dto/create-investor.dto';

@Injectable()
export class InvestorsService {
  constructor(private prisma: PrismaService, private crypto: FieldEncryptionService) {}

  async create(dto: CreateInvestorDto, ownerId: string) {
    return this.prisma.investor.create({
      data: {
        name: dto.name,
        familyGroup: dto.familyGroup,
        panEncrypted: dto.pan ? this.crypto.encrypt(dto.pan) : undefined,
        mobileEncrypted: dto.mobile ? this.crypto.encrypt(dto.mobile) : undefined,
        ownerId,
      },
    });
  }

  // Aggregate figures for the dashboard — respects the same row-level scoping as findAll
  async stats(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    const where = isPrivileged ? {} : { ownerId: user.id };

    const [count, aggregate, folioCount, topInvestors, familyGroups, genderGroups] = await Promise.all([
      this.prisma.investor.count({ where }),
      this.prisma.investor.aggregate({
        where,
        _sum: { totalMfAum: true, equityAum: true, debtAum: true, cashAum: true, goldAum: true, pmsAum: true },
        _avg: { xirrTotal: true },
      }),
      this.prisma.folio.count({ where: isPrivileged ? {} : { investor: { ownerId: user.id } } }),
      this.prisma.investor.findMany({
        where,
        orderBy: { totalMfAum: 'desc' },
        take: 8,
        select: { name: true, totalMfAum: true, xirrTotal: true, familyGroup: true },
      }),
      this.prisma.investor.groupBy({
        by: ['familyGroup'],
        where: { ...where, familyGroup: { not: null } },
        _sum: { totalMfAum: true },
        orderBy: { _sum: { totalMfAum: 'desc' } },
        take: 8,
      }),
      this.prisma.investor.groupBy({
        by: ['gender'],
        where: { ...where, gender: { not: null } },
        _count: { _all: true },
      }),
    ]);

    // XIRR distribution — separate counts per band, cheap since each is an indexed count query
    const xirrBands = [
      { label: '< 0%', min: -Infinity, max: 0 },
      { label: '0-8%', min: 0, max: 8 },
      { label: '8-12%', min: 8, max: 12 },
      { label: '12-18%', min: 12, max: 18 },
      { label: '18%+', min: 18, max: Infinity },
    ];
    const xirrCounts = await Promise.all(
      xirrBands.map((band) =>
        this.prisma.investor.count({
          where: {
            ...where,
            xirrTotal: {
              gte: band.min === -Infinity ? undefined : band.min,
              lt: band.max === Infinity ? undefined : band.max,
            },
          },
        }),
      ),
    );

    return {
      totalInvestors: count,
      totalFolios: folioCount,
      totalAum: Number(aggregate._sum.totalMfAum) || 0,
      equityAum: Number(aggregate._sum.equityAum) || 0,
      debtAum: Number(aggregate._sum.debtAum) || 0,
      cashAum: Number(aggregate._sum.cashAum) || 0,
      goldAum: Number(aggregate._sum.goldAum) || 0,
      pmsAum: Number(aggregate._sum.pmsAum) || 0,
      avgXirr: Number(aggregate._avg.xirrTotal) || 0,
      topInvestors: topInvestors.map((i) => ({
        name: i.name,
        aum: Number(i.totalMfAum) || 0,
        xirr: i.xirrTotal ? Number(i.xirrTotal) : null,
        familyGroup: i.familyGroup,
      })),
      familyGroups: familyGroups.map((g) => ({
        name: g.familyGroup || 'Unassigned',
        aum: Number(g._sum.totalMfAum) || 0,
      })),
      xirrDistribution: xirrBands.map((band, i) => ({ label: band.label, count: xirrCounts[i] })),
      genderSplit: genderGroups.map((g) => ({ name: g.gender || 'Unknown', count: g._count._all })),
    };
  }

  // Row-level scoping: RMs see only their own book; managers/admins see all.
  // Enforced at the query layer, not just the UI.
  async findAll(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    const investors = await this.prisma.investor.findMany({
      where: isPrivileged ? {} : { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    // Prisma Decimal fields serialize as strings — convert to numbers so the frontend can call .toFixed()
    return investors.map((inv) => ({
      ...inv,
      totalMfAum: inv.totalMfAum ? Number(inv.totalMfAum) : null,
      xirrTotal: inv.xirrTotal ? Number(inv.xirrTotal) : null,
    }));
  }

  async findOne(id: string, user: { id: string; role: string }) {
    const investor = await this.prisma.investor.findUnique({ where: { id }, include: { folios: true } });
    if (!investor) throw new NotFoundException('Investor not found');

    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'OPERATIONS', 'COMPLIANCE'].includes(user.role);
    if (!isPrivileged && investor.ownerId !== user.id) {
      throw new NotFoundException('Investor not found'); // don't leak existence to unauthorized users
    }

    // Decrypt only at the point of authorized display; also convert Decimal fields to numbers
    return {
      ...investor,
      pan: investor.panEncrypted ? this.crypto.decrypt(investor.panEncrypted) : null,
      mobile: investor.mobileEncrypted ? this.crypto.decrypt(investor.mobileEncrypted) : null,
      panEncrypted: undefined,
      mobileEncrypted: undefined,
      totalMfAum: investor.totalMfAum ? Number(investor.totalMfAum) : null,
      equityAum: investor.equityAum ? Number(investor.equityAum) : null,
      debtAum: investor.debtAum ? Number(investor.debtAum) : null,
      xirrTotal: investor.xirrTotal ? Number(investor.xirrTotal) : null,
      folios: investor.folios.map((f) => ({
        ...f,
        currentValue: f.currentValue ? Number(f.currentValue) : null,
        balanceUnits: f.balanceUnits ? Number(f.balanceUnits) : null,
      })),
    };
  }

  private async assertAccess(id: string, user: { id: string; role: string }) {
    const investor = await this.prisma.investor.findUnique({ where: { id }, select: { ownerId: true } });
    if (!investor) throw new NotFoundException('Investor not found');
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'OPERATIONS', 'COMPLIANCE'].includes(user.role);
    if (!isPrivileged && investor.ownerId !== user.id) {
      throw new NotFoundException('Investor not found');
    }
  }

  async addNote(investorId: string, content: string, user: { id: string; role: string }) {
    await this.assertAccess(investorId, user);

    const note = await this.prisma.note.create({
      data: { investorId, authorId: user.id, content },
      include: { author: { select: { name: true } } },
    });

    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'NOTE_ADDED', entity: 'Investor', entityId: investorId },
    });

    return note;
  }

  // Merges manual notes with the audit trail tied to this investor into one timeline
  async activity(investorId: string, user: { id: string; role: string }) {
    await this.assertAccess(investorId, user);

    const [notes, logs] = await Promise.all([
      this.prisma.note.findMany({
        where: { investorId },
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.findMany({
        where: { entity: 'Investor', entityId: investorId },
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    const timeline = [
      ...notes.map((n) => ({
        type: 'note' as const,
        id: n.id,
        content: n.content,
        actor: n.author?.name || 'Unknown',
        createdAt: n.createdAt,
      })),
      ...logs
        .filter((l) => l.action !== 'NOTE_ADDED') // avoid double-listing the note-add event
        .map((l) => ({
          type: 'event' as const,
          id: l.id,
          content: l.action,
          actor: l.user?.name || 'System',
          createdAt: l.createdAt,
        })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return timeline;
  }

  // Sales performance grouped by RM — feeds the Sales tab
  async salesByRm(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    const where = isPrivileged ? {} : { ownerId: user.id };

    const grouped = await this.prisma.investor.groupBy({
      by: ['ownerId'],
      where: { ...where, ownerId: { not: null } },
      _sum: {
        netSalesFY: true,
        grossSalesFY: true,
        redemptionsFY: true,
        netSalesCY: true,
        grossSalesCY: true,
        redemptionsCY: true,
        totalMfAum: true,
        sipGrossSalesFY: true,
        sipNetSalesFY: true,
        nfoGrossSalesFY: true,
      },
      _count: { _all: true },
    });

    const ownerIds = grouped.map((g) => g.ownerId).filter(Boolean) as string[];
    const owners = await this.prisma.user.findMany({
      where: { id: { in: ownerIds } },
      select: { id: true, name: true },
    });
    const nameById = new Map(owners.map((o) => [o.id, o.name]));

    return grouped
      .map((g) => ({
        rmId: g.ownerId,
        rmName: nameById.get(g.ownerId!) || 'Unknown',
        investorCount: g._count._all,
        totalAum: Number(g._sum.totalMfAum) || 0,
        netSalesFY: Number(g._sum.netSalesFY) || 0,
        grossSalesFY: Number(g._sum.grossSalesFY) || 0,
        redemptionsFY: Number(g._sum.redemptionsFY) || 0,
        netSalesCY: Number(g._sum.netSalesCY) || 0,
        grossSalesCY: Number(g._sum.grossSalesCY) || 0,
        redemptionsCY: Number(g._sum.redemptionsCY) || 0,
        sipGrossSalesFY: Number(g._sum.sipGrossSalesFY) || 0,
        sipNetSalesFY: Number(g._sum.sipNetSalesFY) || 0,
        lumpsumGrossSalesFY: Math.max(0, (Number(g._sum.grossSalesFY) || 0) - (Number(g._sum.sipGrossSalesFY) || 0)),
        nfoGrossSalesFY: Number(g._sum.nfoGrossSalesFY) || 0,
      }))
      .sort((a, b) => b.netSalesFY - a.netSalesFY);
  }

  // AUM history for trend charts — starts accumulating from the first import onward
  async aumTrend() {
    return this.prisma.dailySnapshot.findMany({
      orderBy: { date: 'asc' },
      take: 180,
      select: { date: true, totalAum: true, investorCount: true },
    });
  }

  // Rules-based cross-sell detection using AUM composition and needs-gap data
  async opportunities(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    const where = isPrivileged ? {} : { ownerId: user.id };

    const investors = await this.prisma.investor.findMany({
      where,
      select: {
        id: true,
        name: true,
        totalMfAum: true,
        pmsAum: true,
        goldAum: true,
        totalLumpsumGapAmount: true,
        totalSipGapAmount: true,
        mappedNeedWithGap: true,
      },
    });

    const PMS_THRESHOLD = 5000000; // 50L — large-AUM clients with no PMS exposure
    const GOLD_THRESHOLD = 1000000; // 10L

    const results: { investorId: string; name: string; reasons: string[] }[] = [];

    for (const inv of investors) {
      const reasons: string[] = [];
      const totalAum = Number(inv.totalMfAum) || 0;
      const pmsAum = Number(inv.pmsAum) || 0;
      const goldAum = Number(inv.goldAum) || 0;
      const lumpsumGap = Number(inv.totalLumpsumGapAmount) || 0;
      const sipGap = Number(inv.totalSipGapAmount) || 0;

      if (totalAum >= PMS_THRESHOLD && pmsAum === 0) {
        reasons.push('Large AUM, no PMS exposure');
      }
      if (totalAum >= GOLD_THRESHOLD && goldAum === 0) {
        reasons.push('No Gold allocation');
      }
      if (lumpsumGap > 0) {
        reasons.push(`Lumpsum need gap of ₹${(lumpsumGap / 100000).toFixed(1)}L identified`);
      }
      if (sipGap > 0) {
        reasons.push(`SIP need gap of ₹${(sipGap / 100000).toFixed(1)}L identified`);
      }
      if ((inv.mappedNeedWithGap || 0) > 0) {
        reasons.push(`${inv.mappedNeedWithGap} mapped need(s) with unresolved gap`);
      }

      if (reasons.length > 0) {
        results.push({ investorId: inv.id, name: inv.name, reasons });
      }
    }

    return results;
  }

  // Birthdays and anniversaries in the next 30 days — respects row-level scoping
  async upcomingOccasions(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    const where = isPrivileged ? {} : { ownerId: user.id };

    const investors = await this.prisma.investor.findMany({
      where: {
        ...where,
        OR: [{ dateOfBirth: { not: null } }, { anniversaryDate: { not: null } }],
      },
      select: { id: true, name: true, dateOfBirth: true, anniversaryDate: true },
    });

    const today = new Date();
    const todayMonthDay = today.getMonth() * 100 + today.getDate();

    function daysUntil(date: Date): number {
      const monthDay = date.getMonth() * 100 + date.getDate();
      const thisYear = new Date(today.getFullYear(), date.getMonth(), date.getDate());
      let diff = Math.round((thisYear.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
      if (diff < 0) diff += 365; // roll to next year
      return diff;
    }

    const results: { investorId: string; name: string; type: 'birthday' | 'anniversary'; date: Date; daysUntil: number }[] = [];

    for (const inv of investors) {
      if (inv.dateOfBirth) {
        const d = daysUntil(inv.dateOfBirth);
        if (d <= 30) results.push({ investorId: inv.id, name: inv.name, type: 'birthday', date: inv.dateOfBirth, daysUntil: d });
      }
      if (inv.anniversaryDate) {
        const d = daysUntil(inv.anniversaryDate);
        if (d <= 30) results.push({ investorId: inv.id, name: inv.name, type: 'anniversary', date: inv.anniversaryDate, daysUntil: d });
      }
    }

    return results.sort((a, b) => a.daysUntil - b.daysUntil).slice(0, 30);
  }

  // Book composition by tax status (Individual, HUF, NRI, etc.) — used on the Investors page
  async taxStatusBreakdown(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    const where = isPrivileged ? {} : { ownerId: user.id };

    const groups = await this.prisma.investor.groupBy({
      by: ['taxStatus'],
      where: { ...where, taxStatus: { not: null } },
      _count: { _all: true },
      _sum: { totalMfAum: true },
    });

    return groups
      .map((g) => ({ name: g.taxStatus || 'Unknown', count: g._count._all, aum: Number(g._sum.totalMfAum) || 0 }))
      .sort((a, b) => b.count - a.count);
  }
}
