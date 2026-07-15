import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateHoldingDto } from './dto/update-holding.dto';

// The firm's standard product shelf — seeded once on startup if not already present.
const DEFAULT_PRODUCTS: { name: string; category: string; sortOrder: number }[] = [
  { name: 'Mutual Funds', category: 'Core', sortOrder: 1 },
  { name: 'Portfolio Management Services (PMS)', category: 'Core', sortOrder: 2 },
  { name: 'Health Insurance', category: 'Insurance', sortOrder: 3 },
  { name: 'Life Insurance', category: 'Insurance', sortOrder: 4 },
  { name: 'Fixed Income / Bonds', category: 'Fixed Income', sortOrder: 5 },
  { name: 'Gold / Sovereign Gold Bonds', category: 'Alternative', sortOrder: 6 },
  { name: 'Direct Equity', category: 'Core', sortOrder: 7 },
  { name: 'Alternative Investment Funds (AIF)', category: 'Alternative', sortOrder: 8 },
  { name: 'Fixed Deposits', category: 'Fixed Income', sortOrder: 9 },
  { name: 'Estate Planning / Will Services', category: 'Advisory', sortOrder: 10 },
];

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    for (const p of DEFAULT_PRODUCTS) {
      await this.prisma.product.upsert({
        where: { name: p.name },
        update: {},
        create: p,
      });
    }
  }

  async listProducts() {
    return this.prisma.product.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  private async assertAccess(investorId: string, user: { id: string; role: string }) {
    const investor = await this.prisma.investor.findUnique({ where: { id: investorId }, select: { ownerId: true } });
    if (!investor) throw new NotFoundException('Investor not found');
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'OPERATIONS', 'COMPLIANCE'].includes(user.role);
    if (!isPrivileged && investor.ownerId !== user.id) throw new NotFoundException('Investor not found');
  }

  // Full holding matrix for one investor — every product, with current status
  async matrixForInvestor(investorId: string, user: { id: string; role: string }) {
    await this.assertAccess(investorId, user);

    const [products, holdings] = await Promise.all([
      this.prisma.product.findMany({ orderBy: { sortOrder: 'asc' } }),
      this.prisma.investorProduct.findMany({ where: { investorId } }),
    ]);

    const holdingByProduct = new Map(holdings.map((h) => [h.productId, h]));

    return products.map((p) => {
      const h = holdingByProduct.get(p.id);
      return {
        productId: p.id,
        productName: p.name,
        category: p.category,
        status: h?.status || 'NOT_HOLDING',
        amount: h?.amount ? Number(h.amount) : null,
      };
    });
  }

  async updateHolding(investorId: string, productId: string, dto: UpdateHoldingDto, user: { id: string; role: string }) {
    await this.assertAccess(investorId, user);

    return this.prisma.investorProduct.upsert({
      where: { investorId_productId: { investorId, productId } },
      update: { status: dto.status, amount: dto.amount, updatedById: user.id },
      create: { investorId, productId, status: dto.status, amount: dto.amount, updatedById: user.id },
    });
  }

  // Firm-wide cross-sell opportunity board: which investors are NOT_HOLDING each product,
  // ranked by AUM so the highest-value gaps surface first.
  async crossSellBoard(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    const investorWhere = isPrivileged ? {} : { ownerId: user.id };

    const products = await this.prisma.product.findMany({ orderBy: { sortOrder: 'asc' } });
    const investors = await this.prisma.investor.findMany({
      where: investorWhere,
      select: { id: true, name: true, totalMfAum: true, productHoldings: true },
      orderBy: { totalMfAum: 'desc' },
      take: 200,
    });

    return products.map((p) => {
      const gaps = investors
        .filter((inv) => {
          const h = inv.productHoldings.find((x) => x.productId === p.id);
          return !h || h.status === 'NOT_HOLDING';
        })
        .slice(0, 20)
        .map((inv) => ({ investorId: inv.id, name: inv.name, aum: Number(inv.totalMfAum) || 0 }));

      return { productId: p.id, productName: p.name, category: p.category, gapCount: gaps.length, topGaps: gaps };
    });
  }

  // Cross-sell conversions this month — products flipped to HOLDS, proving the
  // opportunity board is actually driving sales, not just flagging gaps.
  async conversionsThisMonth(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const conversions = await this.prisma.investorProduct.findMany({
      where: {
        status: 'HOLDS',
        updatedAt: { gte: monthStart },
        ...(isPrivileged ? {} : { investor: { ownerId: user.id } }),
      },
      include: {
        product: { select: { name: true } },
        investor: { select: { name: true } },
        updatedBy: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const byProduct = new Map<string, number>();
    for (const c of conversions) {
      byProduct.set(c.product.name, (byProduct.get(c.product.name) || 0) + 1);
    }

    return {
      total: conversions.length,
      byProduct: Array.from(byProduct.entries()).map(([name, count]) => ({ name, count })),
      recent: conversions.slice(0, 15).map((c) => ({
        investorName: c.investor.name,
        productName: c.product.name,
        by: c.updatedBy?.name || 'Unknown',
        date: c.updatedAt,
      })),
    };
  }
}
