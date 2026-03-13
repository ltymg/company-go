import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { SuperAdminGuard } from '../auth/super-admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

// 所有 /admin/users 接口都要求登录且至少是 ADMIN
@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin/users')
export class AdminUserController {
  constructor(private prisma: PrismaService) {}

  // 所有管理员都可以查看用户列表
  @Get()
  async getAllUsers() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuperAdmin: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 所有管理员都可以查看管理员列表（只读）
  @Get('admins')
  async getAdmins() {
    return this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isSuperAdmin: true,
        createdAt: true,
      },
    });
  }

  // 仅超级管理员可以创建/升级管理员
  @UseGuards(SuperAdminGuard)
  @Post('admins')
  async createAdmin(@Body() data: { email: string; password?: string; name?: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    
    if (existing) {
      // 如果用户存在，升级其角色为 ADMIN（但不自动设为超级管理员）
      return this.prisma.user.update({
        where: { id: existing.id },
        data: { role: 'ADMIN' },
      });
    } else {
      // 如果用户不存在，创建新管理员（非超级管理员）
      if (!data.password) throw new Error('Password is required for new admin');
      const hashedPassword = await bcrypt.hash(data.password, 10);
      return this.prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          name: data.name || 'Admin User',
          role: 'ADMIN',
          isSuperAdmin: false,
        },
      });
    }
  }

  // 修改用户角色（升级/降级管理员）——仅超级管理员
  @UseGuards(SuperAdminGuard)
  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body('role') role: string) {
    return this.prisma.user.update({
      where: { id: Number(id) },
      data: { role: role as any },
    });
  }

  // 删除用户 —— 推荐只允许超级管理员执行
  @UseGuards(SuperAdminGuard)
  @Delete(':id')
  async deleteUser(@Param('id') id: string) {
    return this.prisma.user.delete({
      where: { id: Number(id) },
    });
  }
}
