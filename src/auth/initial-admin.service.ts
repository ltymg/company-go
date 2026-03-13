import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class InitialAdminService implements OnModuleInit {
  private readonly logger = new Logger(InitialAdminService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    const email = this.config.get<string>('INITIAL_ADMIN_EMAIL');
    const password = this.config.get<string>('INITIAL_ADMIN_PASSWORD');

    if (!email || !password) {
      this.logger.warn('INITIAL_ADMIN_EMAIL or INITIAL_ADMIN_PASSWORD not set. Skipping initial admin check.');
      return;
    }

    const adminExists = await this.prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminExists) {
      this.logger.log(`No admin found. Creating initial admin: ${email}`);
      const hashedPassword = await bcrypt.hash(password, 10);
      await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name: 'System Admin',
          role: 'ADMIN',
          isSuperAdmin: true,
        },
      });
      this.logger.log('Initial admin created successfully.');
    } else {
      this.logger.log('Admin account already exists.');
    }
  }
}
