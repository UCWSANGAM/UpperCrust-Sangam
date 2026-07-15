import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { InvestorsService } from './investors.service';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { CreateNoteDto } from './dto/create-note.dto';
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
  @Get('stats')
  stats(@CurrentUser() user: { id: string; role: string }) {
    return this.investors.stats(user);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER, Role.OPERATIONS, Role.COMPLIANCE, Role.RESEARCH)
  @Get('trend')
  trend() {
    return this.investors.aumTrend();
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER, Role.OPERATIONS, Role.COMPLIANCE, Role.RESEARCH)
  @Get('sales-by-rm')
  salesByRm(@CurrentUser() user: { id: string; role: string }) {
    return this.investors.salesByRm(user);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER, Role.OPERATIONS, Role.COMPLIANCE, Role.RESEARCH)
  @Get('opportunities')
  opportunities(@CurrentUser() user: { id: string; role: string }) {
    return this.investors.opportunities(user);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER, Role.OPERATIONS, Role.COMPLIANCE, Role.RESEARCH)
  @Get('occasions')
  occasions(@CurrentUser() user: { id: string; role: string }) {
    return this.investors.upcomingOccasions(user);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER, Role.OPERATIONS, Role.COMPLIANCE, Role.RESEARCH)
  @Get('tax-status')
  taxStatus(@CurrentUser() user: { id: string; role: string }) {
    return this.investors.taxStatusBreakdown(user);
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

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER)
  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.investors.addNote(id, dto.content, user);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.BRANCH_MANAGER, Role.RELATIONSHIP_MANAGER, Role.OPERATIONS, Role.COMPLIANCE)
  @Get(':id/activity')
  activity(@Param('id') id: string, @CurrentUser() user: { id: string; role: string }) {
    return this.investors.activity(id, user);
  }
}
