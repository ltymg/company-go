import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ChFilingService } from './ch-filing.service';

@Controller('ch/filing')
export class ChFilingController {
  constructor(private readonly service: ChFilingService) {}

  // Create a local draft for an incorporation request
  @Post('draft')
  createDraft(@Body() body: any) {
    return this.service.createIncorporationDraft(body);
  }

  // Submit a previously created draft to Companies House (sandbox or prod)
  @Post('submit/:draftId')
  submit(@Param('draftId') draftId: string) {
    return this.service.submitIncorporation(draftId);
  }

  // Check status of a submission/transaction
  @Get('status/:txId')
  status(@Param('txId') txId: string) {
    return this.service.getSubmissionStatus(txId);
  }

  // Auto submit using Software Filing API
  @Post('auto-submit/:draftId')
  autoSubmit(@Param('draftId') draftId: string, @Body('accessToken') accessToken: string) {
    return this.service.autoSubmitIncorporation(draftId, accessToken);
  }

  // Update submission status (for polling)
  @Post('update-status/:txId')
  updateStatus(@Param('txId') txId: string, @Body('status') status: string, @Body('companyNumber') companyNumber?: string) {
    return this.service.updateSubmissionStatus(txId, status, companyNumber);
  }

  // Get OAuth authorization URL
  @Get('oauth/authorize')
  getAuthorizationUrl(@Query('state') state: string) {
    return {
      authorizationUrl: this.service.getAuthorizationUrl(state),
    };
  }

  // Exchange OAuth code for access token
  @Post('oauth/exchange')
  exchangeCode(@Body('code') code: string) {
    return this.service.exchangeCodeForToken(code);
  }

  // Perform KYC/AML check for filing
  @Post('kyc-aml/:filingId')
  performKycAmlCheck(@Param('filingId') filingId: string) {
    return this.service.performKycAmlCheck(filingId);
  }

  // Update KYC status
  @Post('kyc-status/:filingId')
  updateKycStatus(@Param('filingId') filingId: string, @Body('status') status: string) {
    return this.service.updateKycStatus(filingId, status);
  }
}
