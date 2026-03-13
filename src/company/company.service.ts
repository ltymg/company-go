import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(userId: number) {
    return this.prisma.company.findMany({ where: { userId } });
  }

  async create(userId: number, dto: CreateCompanyDto) {
    return this.prisma.company.create({
      data: {
        legalName: dto.legalName,
        jurisdiction: dto.jurisdiction,
        userId,
      },
    });
  }
}
