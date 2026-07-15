import { Body, Controller, Get, Param, Put, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ProductsService } from './products.service';
import { UpdateHoldingDto } from './dto/update-holding.dto';
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
@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Roles(...ALL_ROLES)
  @Get()
  list() {
    return this.products.listProducts();
  }

  @Roles(...ALL_ROLES)
  @Get('cross-sell-board')
  crossSellBoard(@CurrentUser() user: { id: string; role: string }) {
    return this.products.crossSellBoard(user);
  }

  @Roles(...ALL_ROLES)
  @Get('conversions')
  conversions(@CurrentUser() user: { id: string; role: string }) {
    return this.products.conversionsThisMonth(user);
  }

  @Roles(...ALL_ROLES)
  @Get('investor/:investorId')
  matrix(@Param('investorId') investorId: string, @CurrentUser() user: { id: string; role: string }) {
    return this.products.matrixForInvestor(investorId, user);
  }

  @Roles(...ALL_ROLES)
  @Put('investor/:investorId/product/:productId')
  update(
    @Param('investorId') investorId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateHoldingDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    return this.products.updateHolding(investorId, productId, dto, user);
  }
}
