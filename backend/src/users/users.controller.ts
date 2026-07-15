import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../rbac/roles.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

// User provisioning is admin-only by design — SANGAM has no public signup route
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get()
  findAll() {
    return this.users.findAll();
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post()
  create(@Body() dto: CreateUserDto, @CurrentUser() user: { id: string }) {
    return this.users.create(dto, user.id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto, @CurrentUser() user: { id: string }) {
    return this.users.update(id, dto, user.id);
  }
}
