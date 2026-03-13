import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { SecurityService } from './security.service';
import { Response } from 'express';

@Controller('security')
export class SecurityController {
  constructor(private readonly securityService: SecurityService) {}

  // 检查密码强度
  @Post('password-strength')
  async checkPasswordStrength(
    @Body('password') password: string,
    @Res() res: Response,
  ) {
    try {
      const result = this.securityService.checkPasswordStrength(password);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 生成2FA密钥
  @UseGuards(AuthGuard('jwt'))
  @Post('two-factor/generate')
  async generateTwoFactorSecret(@Res() res: Response) {
    try {
      const userId = res.locals.user.id;
      const { secret, qrCodeUrl } = this.securityService.generateTwoFactorSecret(userId);
      return res.status(HttpStatus.OK).json({ secret, qrCodeUrl });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 验证2FA代码
  @UseGuards(AuthGuard('jwt'))
  @Post('two-factor/verify')
  async verifyTwoFactorCode(
    @Body('secret') secret: string,
    @Body('code') code: string,
    @Res() res: Response,
  ) {
    try {
      const isValid = this.securityService.verifyTwoFactorCode(secret, code);
      return res.status(HttpStatus.OK).json({ isValid });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 获取用户安全日志
  @UseGuards(AuthGuard('jwt'))
  @Get('logs')
  async getUserSecurityLogs(
    @Query('limit') limit: number = 50,
    @Res() res: Response,
  ) {
    try {
      const userId = res.locals.user.id;
      const logs = await this.securityService.getUserSecurityLogs(userId, limit);
      return res.status(HttpStatus.OK).json({ logs });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 禁止IP（管理员）
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post('ip-ban')
  async banIp(
    @Body('ip') ip: string,
    @Body('reason') reason: string,
    @Body('expiresAt') expiresAt: Date,
    @Res() res: Response,
  ) {
    try {
      await this.securityService.banIp(ip, reason, expiresAt);
      return res.status(HttpStatus.OK).json({ message: 'IP banned successfully' });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 解除IP禁止（管理员）
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Delete('ip-ban/:ip')
  async unbanIp(
    @Param('ip') ip: string,
    @Res() res: Response,
  ) {
    try {
      await this.securityService.unbanIp(ip);
      return res.status(HttpStatus.OK).json({ message: 'IP unbanned successfully' });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 检查IP是否被禁止
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Get('ip-ban/:ip')
  async checkIpBan(
    @Param('ip') ip: string,
    @Res() res: Response,
  ) {
    try {
      const isBanned = await this.securityService.isIpBanned(ip);
      return res.status(HttpStatus.OK).json({ isBanned });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 清理旧的登录尝试（管理员）
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @Post('cleanup-login-attempts')
  async cleanupLoginAttempts(@Res() res: Response) {
    try {
      await this.securityService.cleanupLoginAttempts();
      return res.status(HttpStatus.OK).json({ message: 'Login attempts cleaned up successfully' });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }
}
