import { Body, Controller, Get, Param, Post, Request, UseGuards } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  async list(@Request() req: any) {
    return this.orderService.findAll(req.user.sub);
  }

  // create demo order for a company id sent in body
  @Post('demo')
  async createDemo(@Request() req: any, @Body('companyId') companyId: number) {
    return this.orderService.createDemoOrder(req.user.sub, companyId);
  }

  // simulate payment success
  @Post(':id/pay')
  async simulatePay(@Param('id') id: number) {
    return this.orderService.markPaid(+id);
  }
}
