import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import json2xml from 'json2xml';

@Injectable()
export class ChFilingSoftwareService {
  private readonly oauthClient: AxiosInstance;
  private readonly filingClient: AxiosInstance;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly redirectUri: string;
  private readonly env: string;

  constructor(private readonly config: ConfigService) {
    this.env = this.config.get<string>('CH_ENV') || 'sandbox';
    this.clientId = this.config.get<string>('CH_OAUTH_CLIENT_ID') || '';
    this.clientSecret = this.config.get<string>('CH_OAUTH_CLIENT_SECRET') || '';
    this.redirectUri = this.config.get<string>('CH_OAUTH_REDIRECT_URI') || 'http://localhost:3000/ch/filing/oauth/callback';

    const oauthBaseUrl = this.env === 'sandbox'
      ? 'https://identity-sandbox.company-information.service.gov.uk'
      : 'https://identity.company-information.service.gov.uk';

    const filingBaseUrl = this.env === 'sandbox'
      ? 'https://api-sandbox.company-information.service.gov.uk'
      : 'https://api.company-information.service.gov.uk';

    this.oauthClient = axios.create({
      baseURL: oauthBaseUrl,
      timeout: 10000,
    });

    this.filingClient = axios.create({
      baseURL: filingBaseUrl,
      timeout: 10000,
    });
  }

  // 获取OAuth 2.0授权URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'https://api.company-information.service.gov.uk/scope/filing',
      state,
    });

    return `${this.oauthClient.defaults.baseURL}/oauth2/authorize?${params.toString()}`;
  }

  // 使用授权码获取访问令牌
  async getAccessToken(code: string): Promise<{ access_token: string; expires_in: number; refresh_token: string }> {
    try {
      const response = await this.oauthClient.post('/oauth2/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: this.redirectUri,
      });

      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to get access token: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 刷新访问令牌
  async refreshAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    try {
      const response = await this.oauthClient.post('/oauth2/token', {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      });

      return response.data;
    } catch (error) {
      throw new HttpException(
        'Failed to refresh access token: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 将JSON转换为Companies House TIS XML格式
  buildIncorporationXml(payload: any): string {
    const data = {
      CompanyIncorporation: {
        CompanyName: payload.companyName,
        RegisteredOfficeAddress: {
          AddressLine1: payload.registeredOfficeAddress.split(',')[0] || '',
          AddressLine2: payload.registeredOfficeAddress.split(',').slice(1).join(',').trim() || '',
          PostCode: this.extractPostcode(payload.registeredOfficeAddress),
        },
        SICCode: payload.sicCode,
        ShareCapital: {
          TotalNominalValue: payload.shareCapital,
          ShareClasses: {
            ShareClass: {
              Name: 'Ordinary',
              TotalNominalValue: payload.shareCapital,
              NumberOfShares: payload.shareCapital,
            },
          },
        },
        Directors: {
          Director: payload.directors.map((director: any) => ({
            FullName: director.fullName,
            DateOfBirth: director.dateOfBirth,
            Nationality: director.nationality,
            ResidentialAddress: {
              AddressLine1: director.residentialAddress.split(',')[0] || '',
              AddressLine2: director.residentialAddress.split(',').slice(1).join(',').trim() || '',
            },
            ServiceAddress: {
              AddressLine1: director.serviceAddress.split(',')[0] || '',
              AddressLine2: director.serviceAddress.split(',').slice(1).join(',').trim() || '',
            },
          })),
        },
        Shareholders: {
          Shareholder: payload.shareholders.map((shareholder: any) => ({
            FullName: shareholder.fullName,
            ShareholdingPercentage: shareholder.shareholdingPercentage,
          })),
        },
      },
    };

    return json2xml(data, { header: true });
  }

  // 提交公司注册申请
  async submitIncorporation(xml: string, accessToken: string): Promise<{ transactionId: string; status: string }> {
    try {
      const response = await this.filingClient.post('/transaction', xml, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/xml',
        },
      });

      return {
        transactionId: response.data.transaction_id,
        status: 'FILED_WITH_CH',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to submit incorporation: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 检查提交状态
  async checkSubmissionStatus(transactionId: string, accessToken: string): Promise<{ status: string; companyNumber?: string }> {
    try {
      const response = await this.filingClient.get(`/transaction/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const status = response.data.status;
      let companyNumber;

      if (status === 'accepted' && response.data.company_number) {
        companyNumber = response.data.company_number;
      }

      return {
        status,
        companyNumber,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to check submission status: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 辅助方法：从地址中提取邮政编码
  private extractPostcode(address: string): string {
    // 简单的邮政编码提取逻辑，实际应用中可能需要更复杂的正则表达式
    const postcodeMatch = address.match(/[A-Z]{1,2}[0-9R][0-9A-Z]?\s?[0-9][A-Z]{2}/i);
    return postcodeMatch ? postcodeMatch[0] : '';
  }
}
