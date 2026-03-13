import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ChFilingService } from '../ch-filing/ch-filing.service';

import { AdminGuard } from '../auth/admin.guard';
import { AuthGuard } from '@nestjs/passport';

@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin/ch/filing')
export class AdminChFilingController {
  constructor(private readonly chFilingService: ChFilingService) {}

  // 获取所有 Filing 列表（支持简单分页/过滤）
  @Get()
  async getAllFilings() {
    return this.chFilingService.findAll();
  }

  // 获取单个 Filing 详情
  @Get(':id')
  async getFilingDetail(@Param('id') id: string) {
    return this.chFilingService.findOne(id);
  }

  // Admin / 运营：人工回填 Companies House company number
  @Post(':id/company-number')
  async backfillCompanyNumber(
    @Param('id') id: string,
    @Body('companyNumber') companyNumber: string,
  ) {
    return this.chFilingService.backfillCompanyNumber(id, companyNumber);
  }

  // Admin：使用 Software Filing API 自动提交
  @Post(':id/auto-submit')
  async autoSubmit(
    @Param('id') id: string,
    @Body('accessToken') accessToken: string,
  ) {
    return this.chFilingService.autoSubmitIncorporation(id, accessToken);
  }

  // Admin：更新提交状态
  @Post(':id/update-status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('companyNumber') companyNumber?: string,
  ) {
    return this.chFilingService.updateSubmissionStatus(id, status, companyNumber);
  }

  // Admin：获取 OAuth 授权 URL
  @Get('oauth/authorize')
  async getAuthorizationUrl(@Query('state') state: string) {
    return {
      authorizationUrl: this.chFilingService.getAuthorizationUrl(state),
    };
  }

  // Admin：兑换 OAuth 授权码
  @Post('oauth/exchange')
  async exchangeCode(@Body('code') code: string) {
    return this.chFilingService.exchangeCodeForToken(code);
  }

  // Admin：执行KYC/AML检查
  @Post(':id/kyc-aml')
  async performKycAmlCheck(@Param('id') id: string) {
    return this.chFilingService.performKycAmlCheck(id);
  }

  // Admin：更新KYC状态
  @Post(':id/kyc-status')
  async updateKycStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.chFilingService.updateKycStatus(id, status);
  }
}
