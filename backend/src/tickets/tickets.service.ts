import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';

const INCLUDE = {
  assignedTo: { select: { name: true } },
  createdBy: { select: { name: true } },
};

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTicketDto, createdById: string) {
    return this.prisma.ticket.create({
      data: {
        workType: dto.workType,
        title: dto.title,
        description: dto.description,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        assignedToId: dto.assignedToId,
        createdById,
      },
      include: INCLUDE,
    });
  }

  // Admins/managers see every ticket. Everyone else sees only tickets they raised
  // or were assigned — never the whole team's queue.
  async findAll(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    return this.prisma.ticket.findMany({
      where: isPrivileged ? {} : { OR: [{ assignedToId: user.id }, { createdById: user.id }] },
      include: INCLUDE,
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
    });
  }

  async update(id: string, dto: UpdateTicketDto, user: { id: string; role: string }) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    if (!isPrivileged && ticket.assignedToId !== user.id && ticket.createdById !== user.id) {
      throw new NotFoundException('Ticket not found');
    }

    return this.prisma.ticket.update({ where: { id }, data: { status: dto.status }, include: INCLUDE });
  }
}
