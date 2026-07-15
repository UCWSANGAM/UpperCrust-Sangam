import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const SAFE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  isActive: true,
  twoFactorEnabled: true,
  createdAt: true,
};

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({ select: SAFE_SELECT, orderBy: { createdAt: 'asc' } });
  }

  async create(dto: CreateUserDto, createdBy: string) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('A user with this email already exists');

    const passwordHash = await argon2.hash(dto.password);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, role: dto.role, passwordHash },
      select: SAFE_SELECT,
    });

    await this.prisma.auditLog.create({
      data: { userId: createdBy, action: 'USER_CREATED', entity: 'User', entityId: user.id },
    });

    return user;
  }

  async update(id: string, dto: UpdateUserDto, updatedBy: string) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');

    const user = await this.prisma.user.update({
      where: { id },
      data: { role: dto.role, isActive: dto.isActive },
      select: SAFE_SELECT,
    });

    await this.prisma.auditLog.create({
      data: {
        userId: updatedBy,
        action: dto.isActive === false ? 'USER_DEACTIVATED' : 'USER_UPDATED',
        entity: 'User',
        entityId: id,
      },
    });

    return user;
  }
}
