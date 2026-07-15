import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
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
@Controller('tickets')
export class TicketsController {
  constructor(private tickets: TicketsService) {}

  @Roles(...ALL_ROLES)
  @Post()
  create(@Body() dto: CreateTicketDto, @CurrentUser() user: { id: string }) {
    return this.tickets.create(dto, user.id);
  }

  @Roles(...ALL_ROLES)
  @Get()
  findAll(@CurrentUser() user: { id: string; role: string }) {
    return this.tickets.findAll(user);
  }

  @Roles(...ALL_ROLES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTicketDto, @CurrentUser() user: { id: string; role: string }) {
    return this.tickets.update(id, dto, user);
  }
}
