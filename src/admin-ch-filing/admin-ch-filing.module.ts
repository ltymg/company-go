import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChFilingModule } from '../ch-filing/ch-filing.module';
import { AdminChFilingController } from './admin-ch-filing.controller';
import { AdminUserController } from './admin-user.controller';

@Module({
  imports: [PrismaModule, ChFilingModule],
  controllers: [AdminChFilingController, AdminUserController],
})
export class AdminChFilingModule {}
