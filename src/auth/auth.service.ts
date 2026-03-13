import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  async signup(data: SignupDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Email already registered');

    const hashed = await bcrypt.hash(data.password, 10);
    const fullName = `${data.firstName} ${data.lastName}`.trim();
    const user = await this.prisma.user.create({
      data: { email: data.email, password: hashed, name: fullName },
    });
    // 注册用户默认不是超级管理员
    return this.signToken(user.id, user.email, user.role, user.isSuperAdmin);
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const match = await bcrypt.compare(data.password, user.password);
    if (!match) throw new UnauthorizedException('Invalid credentials');
    return this.signToken(user.id, user.email, user.role, user.isSuperAdmin);
  }

  private async signToken(userId: number, email: string, role: string, isSuperAdmin: boolean) {
    const payload = { sub: userId, email, role, isSuperAdmin };
    return { access_token: await this.jwt.signAsync(payload) };
  }
}
