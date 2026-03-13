import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { CompanyService } from './company.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateCompanyDto } from './dto/create-company.dto';

@UseGuards(JwtAuthGuard)
@Controller('companies')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  async list(@Request() req: any) {
    return this.companyService.findAll(req.user.sub);
  }

  @Post()
  async create(@Request() req: any, @Body() dto: CreateCompanyDto) {
    return this.companyService.create(req.user.sub, dto);
  }
}
