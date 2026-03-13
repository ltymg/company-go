import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: number) {
    return this.prisma.order.findMany({ where: { userId } });
  }

  async createDemoOrder(userId: number, companyId: number) {
    return this.prisma.order.create({
      data: {
        type: 'FORMATION',
        amount: 999.0,
        currency: 'USD',
        stripeSession: 'demo_session',
        state: 'PENDING',
        userId,
        companyId,
      },
    });
  }

  async markPaid(id: number) {
    return this.prisma.order.update({ where: { id }, data: { state: 'PAID' } });
  }
}
