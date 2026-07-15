import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTaskDto, createdById: string) {
    return this.prisma.task.create({
      data: {
        title: dto.title,
        notes: dto.notes,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
        type: dto.type,
        investorId: dto.investorId,
        assigneeId: dto.assigneeId || createdById,
        createdById,
      },
      include: { assignee: { select: { name: true } }, investor: { select: { name: true } } },
    });
  }

  // Everyone sees tasks assigned to them; managers+ see everything
  async findAll(user: { id: string; role: string }) {
    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    return this.prisma.task.findMany({
      where: isPrivileged ? {} : { assigneeId: user.id },
      include: { assignee: { select: { name: true } }, investor: { select: { name: true } } },
      orderBy: [{ status: 'asc' }, { dueAt: 'asc' }],
    });
  }

  async findForInvestor(investorId: string) {
    return this.prisma.task.findMany({
      where: { investorId },
      include: { assignee: { select: { name: true } } },
      orderBy: { dueAt: 'asc' },
    });
  }

  async update(id: string, dto: UpdateTaskDto, user: { id: string; role: string }) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('Task not found');

    const isPrivileged = ['SUPER_ADMIN', 'ADMIN', 'BRANCH_MANAGER'].includes(user.role);
    if (!isPrivileged && task.assigneeId !== user.id) {
      throw new NotFoundException('Task not found');
    }

    return this.prisma.task.update({
      where: { id },
      data: { status: dto.status },
      include: { assignee: { select: { name: true } }, investor: { select: { name: true } } },
    });
  }
}
