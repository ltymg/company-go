import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class ChPublicService {
  private client: AxiosInstance;
  private baseUrl: string;
  private apiKey: string | undefined;

  constructor(private readonly config: ConfigService) {
    // 默认指向 Companies House API（可通过 CH_BASE_URL 覆盖，例如指向 sandbox）
    this.baseUrl =
      this.config.get<string>('CH_BASE_URL') ||
      'https://api.company-information.service.gov.uk';
    this.apiKey = this.config.get<string>('CH_API_KEY');

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 10_000,
    });
  }

  private getAuthHeader() {
    if (!this.apiKey) return {};
    // Companies House public API uses HTTP Basic with API key as username and blank password.
    const token = Buffer.from(`${this.apiKey}:`).toString('base64');
    return { Authorization: `Basic ${token}` };
  }

  async getCompanyProfile(companyNumber: string) {
    const res = await this.client.get(`/company/${companyNumber}`, {
      headers: this.getAuthHeader(),
    });
    return res.data;
  }

  async searchCompanies(query: string) {
    const res = await this.client.get('/search/companies', {
      params: { q: query },
      headers: this.getAuthHeader(),
    });
    return res.data;
  }

  async getOfficers(companyNumber: string) {
    const res = await this.client.get(`/company/${companyNumber}/officers`, {
      headers: this.getAuthHeader(),
    });
    return res.data;
  }

  async getFilingHistory(companyNumber: string) {
    const res = await this.client.get(
      `/company/${companyNumber}/filing-history`,
      {
        headers: this.getAuthHeader(),
      },
    );
    return res.data;
  }
}
