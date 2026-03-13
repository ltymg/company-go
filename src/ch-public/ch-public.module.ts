import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChPublicService } from './ch-public.service';
import { ChPublicController } from './ch-public.controller';

@Module({
  imports: [ConfigModule],
  providers: [ChPublicService],
  controllers: [ChPublicController],
  exports: [ChPublicService],
})
export class ChPublicModule {}
