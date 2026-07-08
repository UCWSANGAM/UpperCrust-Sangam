import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { InvestorsService } from './investors.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { Roles } from '../rbac/roles.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('investors')
export class InvestorsController {
  constructor(private investors: InvestorsService) {}

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER)
  @Post()
  create(@Body() dto: CreateInvestorDto, @CurrentUser() user: { id: string }) {
    return this.investors.create(dto, user.id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER, Role.OPERATIONS, Role.COMPLIANCE, Role.RESEARCH)
  @Get()
  findAll(@CurrentUser() user: { id: string; role: string }) {
    return this.investors.findAll(user);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER, Role.OPERATIONS, Role.COMPLIANCE)
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.investors.findOne(id, user);
  }
}
