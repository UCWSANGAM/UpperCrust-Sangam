import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
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
@Controller('reviews')
export class ReviewsController {
  constructor(private reviews: ReviewsService) {}

  @Roles(...ALL_ROLES)
  @Get('due')
  dueThisQuarter(@CurrentUser() user: { id: string; role: string }) {
    return this.reviews.dueThisQuarter(user);
  }

  @Roles(...ALL_ROLES)
  @Get('compliance')
  compliance(@CurrentUser() user: { id: string; role: string }) {
    return this.reviews.complianceReport(user);
  }

  @Roles(...ALL_ROLES)
  @Get('aging')
  aging(@CurrentUser() user: { id: string; role: string }) {
    return this.reviews.agingReport(user);
  }

  @Roles(...ALL_ROLES)
  @Get('investor/:investorId')
  listForInvestor(@Param('investorId') investorId: string, @CurrentUser() user: { id: string; role: string }) {
    return this.reviews.listForInvestor(investorId, user);
  }

  @Roles(...ALL_ROLES)
  @Post('investor/:investorId')
  create(
    @Param('investorId') investorId: string,
    @Body() dto: CreateReviewDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.reviews.create(investorId, dto, user);
  }
}
