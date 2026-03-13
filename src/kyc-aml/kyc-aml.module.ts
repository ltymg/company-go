import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import { KycAmlService } from './kyc-aml.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [KycAmlService],
  exports: [KycAmlService],
})
export class KycAmlModule {}
