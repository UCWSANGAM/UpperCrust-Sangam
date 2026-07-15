import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async listRecent() {
    const messages = await this.prisma.message.findMany({
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return messages.reverse();
  }

  async post(authorId: string, content: string) {
    return this.prisma.message.create({
      data: { authorId, content },
      include: { author: { select: { name: true } } },
    });
  }
}
