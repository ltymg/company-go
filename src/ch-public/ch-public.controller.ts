import { Controller, Get, Param, Query } from '@nestjs/common';
import { ChPublicService } from './ch-public.service';

@Controller('ch/public')
export class ChPublicController {
  constructor(private readonly service: ChPublicService) {}

  @Get('company/:number')
  getCompanyProfile(@Param('number') number: string) {
    return this.service.getCompanyProfile(number);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.service.searchCompanies(q);
  }

  @Get('company/:number/officers')
  officers(@Param('number') number: string) {
    return this.service.getOfficers(number);
  }

  @Get('company/:number/filing-history')
  filingHistory(@Param('number') number: string) {
    return this.service.getFilingHistory(number);
  }
}
