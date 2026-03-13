import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { CompanyModule } from './company/company.module';
import { AuthModule } from './auth/auth.module';
import { OrderModule } from './order/order.module';
import { DocumentModule } from './document/document.module';
import { ChPublicModule } from './ch-public/ch-public.module';
import { ChFilingModule } from './ch-filing/ch-filing.module';
import { AdminChFilingModule } from './admin-ch-filing/admin-ch-filing.module';
import { AiModule } from './ai/ai.module';
import { SecurityModule } from './security/security.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    CompanyModule,
    AuthModule,
    OrderModule,
    DocumentModule,
    ChPublicModule,
    ChFilingModule,
    AdminChFilingModule,
    AiModule,
    SecurityModule,
  ],
})
export class AppModule {}
