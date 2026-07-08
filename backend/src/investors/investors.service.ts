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

  // Row-level scoping: RMs see only their own book; managers/admins see all.
  // Enforced at the query layer, not just the UI.
  async findAll(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    return this.prisma.investor.findMany({
      where: isPrivileged ? {} : { ownerId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async findOne(id: string, user: { id: string; role: string }) {
    const investor = await this.prisma.investor.findUnique({ where: { id }, include: { folios: true } });
    if (!investor) throw new NotFoundException('Investor not found');

    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER', 'OPERATIONS', 'COMPLIANCE'].includes(user.role);
    if (!isPrivileged && investor.ownerId !== user.id) {
      throw new NotFoundException('Investor not found'); // don't leak existence to unauthorized users
    }

    // Decrypt only at the point of authorized display
    return {
      ...investor,
      pan: investor.panEncrypted ? this.crypto.decrypt(investor.panEncrypted) : null,
      mobile: investor.mobileEncrypted ? this.crypto.decrypt(investor.mobileEncrypted) : null,
      panEncrypted: undefined,
      mobileEncrypted: undefined,
    };
  }
}
