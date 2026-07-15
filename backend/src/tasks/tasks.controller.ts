import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
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
@Controller('tasks')
export class TasksController {
  constructor(private tasks: TasksService) {}

  @Roles(...ALL_ROLES)
  @Post()
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: { id: string }) {
    return this.tasks.create(dto, user.id);
  }

  @Roles(...ALL_ROLES)
  @Get()
  findAll(@CurrentUser() user: { id: string; role: string }) {
    return this.tasks.findAll(user);
  }

  @Roles(...ALL_ROLES)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto, @CurrentUser() user: { id: string; role: string }) {
    return this.tasks.update(id, dto, user);
  }
}
