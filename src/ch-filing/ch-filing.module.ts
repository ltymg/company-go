import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { ChPublicModule } from '../ch-public/ch-public.module';
import { KycAmlModule } from '../kyc-aml/kyc-aml.module';
import { EmailModule } from '../email/email.module';
import { DocumentModule } from '../document/document.module';
import { ChFilingService } from './ch-filing.service';
import { ChFilingSoftwareService } from './ch-filing-software.service';
import { ChFilingController } from './ch-filing.controller';

// 避免循环依赖，暂时移除 StatusUpdateModule 的导入
@Module({
  imports: [ConfigModule, PrismaModule, ChPublicModule, KycAmlModule, EmailModule, DocumentModule],
  providers: [ChFilingService, ChFilingSoftwareService],
  controllers: [ChFilingController],
  exports: [ChFilingService, ChFilingSoftwareService],
})
export class ChFilingModule {}
