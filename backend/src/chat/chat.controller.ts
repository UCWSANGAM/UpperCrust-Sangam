import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ChatService } from './chat.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Roles } from '../rbac/roles.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const ALL_ROLES = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.BRANCH_MANAGER,
  Role.RELATIONSHIP_MANAGER,
  Role.OPERATIONS,
  Role.RESEARCH,
  Role.COMPLIANCE,
];

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('chat')
export class ChatController {
  constructor(private chat: ChatService) {}

  @Roles(...ALL_ROLES)
  @Get('messages')
  list() {
    return this.chat.listRecent();
  }

  @Roles(...ALL_ROLES)
  @Post('messages')
  post(@Body() dto: CreateMessageDto, @CurrentUser() user: { id: string }) {
    return this.chat.post(user.id, dto.content);
  }
}
