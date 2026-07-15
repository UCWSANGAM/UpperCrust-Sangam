import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

export function currentQuarter(): { year: number; quarter: number } {
  const now = new Date();
  return { year: now.getFullYear(), quarter: Math.floor(now.getMonth() / 3) + 1 };
}

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  private async assertAccess(investorId: string, user: { id: string; role: string }) {
    const investor = await this.prisma.investor.findUnique({ where: { id: investorId }, select: { ownerId: true } });
    if (!investor) throw new NotFoundException('Investor not found');
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    if (!isPrivileged && investor.ownerId !== user.id) throw new NotFoundException('Investor not found');
  }

  async create(investorId: string, dto: CreateReviewDto, user: { id: string; role: string }) {
    await this.assertAccess(investorId, user);

    return this.prisma.quarterlyReview.upsert({
      where: { investorId_year_quarter: { investorId, year: dto.year, quarter: dto.quarter } },
      update: {
        contactMade: dto.contactMade,
        riskProfileReviewed: dto.riskProfileReviewed,
        crossSellDiscussed: dto.crossSellDiscussed,
        notes: dto.notes,
        actionItems: dto.actionItems,
      },
      create: {
        investorId,
        reviewerId: user.id,
        year: dto.year,
        quarter: dto.quarter,
        contactMade: dto.contactMade ?? false,
        riskProfileReviewed: dto.riskProfileReviewed ?? false,
        crossSellDiscussed: dto.crossSellDiscussed ?? false,
        notes: dto.notes,
        actionItems: dto.actionItems,
      },
      include: { reviewer: { select: { name: true } } },
    });
  }

  async listForInvestor(investorId: string, user: { id: string; role: string }) {
    await this.assertAccess(investorId, user);
    return this.prisma.quarterlyReview.findMany({
      where: { investorId },
      include: { reviewer: { select: { name: true } } },
      orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
    });
  }

  // The RM's review queue: investors in their book with no review logged for the current quarter
  async dueThisQuarter(user: { id: string; role: string }) {
    const { year, quarter } = currentQuarter();
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);

    const investors = await this.prisma.investor.findMany({
      where: isPrivileged ? {} : { ownerId: user.id },
      select: {
        id: true,
        name: true,
        totalMfAum: true,
        quarterlyReviews: { where: { year, quarter }, select: { id: true } },
      },
      orderBy: { totalMfAum: 'desc' },
    });

    return {
      year,
      quarter,
      pending: investors.filter((i) => i.quarterlyReviews.length === 0).map((i) => ({ id: i.id, name: i.name, aum: i.totalMfAum })),
      completed: investors.filter((i) => i.quarterlyReviews.length > 0).length,
      total: investors.length,
    };
  }

  // Firm-wide compliance snapshot: for managers/admins, how each RM is tracking against
  // the "review every client once a quarter" mandate.
  async complianceReport(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    if (!isPrivileged) {
      const own = await this.dueThisQuarter(user);
      return [{ rmId: user.id, rmName: 'You', total: own.total, completed: own.completed, pending: own.pending.length }];
    }

    const { year, quarter } = currentQuarter();
    const rms = await this.prisma.user.findMany({
      where: { isActive: true, role: { in: ['RELATIONSHIP_MANAGER', 'BRANCH_MANAGER'] } },
      select: { id: true, name: true },
    });

    const rows = await Promise.all(
      rms.map(async (rm) => {
        const investors = await this.prisma.investor.findMany({
          where: { ownerId: rm.id },
          select: { quarterlyReviews: { where: { year, quarter }, select: { id: true } } },
        });
        const total = investors.length;
        const completed = investors.filter((i) => i.quarterlyReviews.length > 0).length;
        return { rmId: rm.id, rmName: rm.name, total, completed, pending: total - completed };
      }),
    );

    return rows.sort((a, b) => b.total - a.total);
  }

  // Aging: how many consecutive quarters an investor has gone without a review —
  // surfaces the worst-neglected relationships, not just this quarter's pending list.
  async agingReport(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    const where = isPrivileged ? {} : { ownerId: user.id };
    const { year, quarter } = currentQuarter();

    const investors = await this.prisma.investor.findMany({
      where,
      select: {
        id: true,
        name: true,
        totalMfAum: true,
        quarterlyReviews: { orderBy: [{ year: 'desc' }, { quarter: 'desc' }], take: 1, select: { year: true, quarter: true } },
      },
    });

    function quartersSince(lastYear: number, lastQuarter: number): number {
      return (year - lastYear) * 4 + (quarter - lastQuarter);
    }

    const aged = investors
      .map((inv) => {
        const last = inv.quarterlyReviews[0];
        const quartersOverdue = last ? quartersSince(last.year, last.quarter) : 99; // never reviewed
        return { investorId: inv.id, name: inv.name, aum: Number(inv.totalMfAum) || 0, quartersOverdue };
      })
      .filter((i) => i.quartersOverdue >= 1)
      .sort((a, b) => b.quartersOverdue - a.quartersOverdue || b.aum - a.aum);

    const histogram = [
      { label: '1 quarter', count: aged.filter((a) => a.quartersOverdue === 1).length },
      { label: '2 quarters', count: aged.filter((a) => a.quartersOverdue === 2).length },
      { label: '3+ quarters', count: aged.filter((a) => a.quartersOverdue >= 3 && a.quartersOverdue < 99).length },
      { label: 'Never reviewed', count: aged.filter((a) => a.quartersOverdue >= 99).length },
    ];

    return { list: aged.slice(0, 30), histogram };
  }
}
