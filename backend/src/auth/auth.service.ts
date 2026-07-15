import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { authenticator } from 'otplib';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async validateUser(email: string, password: string, totpCode?: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Constant response shape whether user exists or not — avoid user enumeration
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials');

    const passwordOk = await argon2.verify(user.passwordHash, password);
    if (!passwordOk) throw new UnauthorizedException('Invalid credentials');

    if (user.twoFactorEnabled) {
      if (!totpCode || !authenticator.check(totpCode, user.twoFactorSecret!)) {
        throw new UnauthorizedException('Invalid or missing 2FA code');
      }
    }
    return user;
  }

  async issueTokens(userId: string, role: string, ipAddress: string, deviceInfo: string) {
    const jti = crypto.randomUUID();
    const accessToken = this.jwt.sign(
      { sub: userId, role, jti },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: '15m' },
    );
    const refreshToken = this.jwt.sign(
      { sub: userId, jti },
      { secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d' },
    );

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: this.hashToken(refreshToken),
        userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.prisma.deviceSession.create({
      data: { userId, ipAddress, deviceInfo },
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    let payload: any;
    try {
      payload = this.jwt.verify(refreshToken, { secret: process.env.JWT_REFRESH_SECRET });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
    });
    // Persistent revocation check — this is what makes logout actually permanent
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Session has been revoked, please log in again');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid session');

    // Rotate: revoke old, issue new
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
    return this.issueTokens(user.id, user.role, 'rotated', 'refresh');
  }

  async logout(refreshToken: string) {
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(refreshToken) },
      data: { revoked: true },
    });
  }

  // Force logout everywhere — used by admins or on password change
  async revokeAllSessions(userId: string) {
    await this.prisma.refreshToken.updateMany({ where: { userId }, data: { revoked: true } });
  }
}
