import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService, private prisma: PrismaService) {}

  // Rate-limited: 5 attempts per minute per IP — brute-force mitigation
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.auth.validateUser(dto.email, dto.password, dto.totpCode);
    const tokens = await this.auth.issueTokens(
      user.id,
      user.role,
      req.ip || 'unknown',
      req.headers['user-agent'] || 'unknown',
    );
    await this.prisma.auditLog.create({
      data: { userId: user.id, action: 'LOGIN', entity: 'User', entityId: user.id, ipAddress: req.ip },
    });
    return { ...tokens, user: { name: user.name, role: user.role } };
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.auth.refresh(refreshToken);
  }

  @Post('logout')
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.auth.logout(refreshToken);
    return { success: true };
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('logout-all')
  async logoutAll(@CurrentUser() user: { id: string }) {
    await this.auth.revokeAllSessions(user.id);
    return { success: true };
  }
}
