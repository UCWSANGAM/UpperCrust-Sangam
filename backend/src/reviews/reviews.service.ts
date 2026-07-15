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
}
