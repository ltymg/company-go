import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class KycAmlService {
  private readonly env: string;
  private readonly amlApiKey: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.env = this.config.get<string>('CH_ENV') || 'sandbox';
    this.amlApiKey = this.config.get<string>('AML_API_KEY') || '';
  }

  // KYC文档验证
  async verifyKycDocument(documentId: number): Promise<{ verified: boolean; message: string }> {
    try {
      const document = await this.prisma.kycDocument.findUnique({ where: { id: documentId } });
      if (!document) {
        throw new Error('KYC document not found');
      }

      // 这里应该集成真实的OCR和文档验证服务
      // 例如：Symphony, Onfido, Jumio等
      // 现在只是模拟验证
      const isVerified = Math.random() > 0.1; // 90%的概率验证通过

      await this.prisma.kycDocument.update({
        where: { id: documentId },
        data: { verified: isVerified },
      });

      return {
        verified: isVerified,
        message: isVerified ? 'Document verified successfully' : 'Document verification failed',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to verify KYC document: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // AML制裁筛查
  async screenForSanctions(fullName: string, dateOfBirth?: string): Promise<{ sanctioned: boolean; matches: any[] }> {
    try {
      // 这里应该集成真实的制裁筛查服务
      // 例如：World-Check, LexisNexis, Refinitiv等
      // 现在只是模拟筛查
      const isSanctioned = Math.random() > 0.95; // 5%的概率被制裁

      return {
        sanctioned: isSanctioned,
        matches: isSanctioned ? [{ name: fullName, source: 'OFAC' }] : [],
      };
    } catch (error) {
      throw new HttpException(
        'Failed to screen for sanctions: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // PEP（政治公众人物）筛查
  async screenForPep(fullName: string, dateOfBirth?: string): Promise<{ isPep: boolean; matches: any[] }> {
    try {
      // 这里应该集成真实的PEP筛查服务
      // 例如：World-Check, LexisNexis, Refinitiv等
      // 现在只是模拟筛查
      const isPep = Math.random() > 0.98; // 2%的概率是PEP

      return {
        isPep: isPep,
        matches: isPep ? [{ name: fullName, position: 'Government Official' }] : [],
      };
    } catch (error) {
      throw new HttpException(
        'Failed to screen for PEP: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 综合KYC/AML检查
  async performKycAmlCheck(userId: number, fullName: string, dateOfBirth?: string): Promise<{ passed: boolean; details: any }> {
    try {
      // 执行制裁筛查
      const sanctionsResult = await this.screenForSanctions(fullName, dateOfBirth);
      
      // 执行PEP筛查
      const pepResult = await this.screenForPep(fullName, dateOfBirth);

      // 检查用户的KYC文档
      const kycDocuments = await this.prisma.kycDocument.findMany({ where: { userId } });
      const allDocumentsVerified = kycDocuments.length > 0 && kycDocuments.every(doc => doc.verified);

      // 综合结果
      const passed = !sanctionsResult.sanctioned && !pepResult.isPep && allDocumentsVerified;

      return {
        passed,
        details: {
          sanctions: sanctionsResult,
          pep: pepResult,
          kycDocuments: kycDocuments.length,
          allDocumentsVerified,
        },
      };
    } catch (error) {
      throw new HttpException(
        'Failed to perform KYC/AML check: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 为公司注册申请执行KYC/AML检查
  async performKycAmlForFiling(filingId: number): Promise<{ passed: boolean; details: any }> {
    try {
      // 获取申请信息
      const filing = await this.prisma.chFiling.findUnique({ where: { id: filingId } });
      if (!filing) {
        throw new Error('Filing not found');
      }

      // 解析申请信息
      const payload = JSON.parse(filing.payloadJson);

      // 对所有董事执行KYC/AML检查
      const directorChecks = [];
      let allDirectorsPassed = true;

      for (const director of payload.directors || []) {
        const checkResult = await this.performKycAmlCheck(
          filing.userId,
          director.fullName,
          director.dateOfBirth,
        );
        directorChecks.push({
          name: director.fullName,
          result: checkResult,
        });
        if (!checkResult.passed) {
          allDirectorsPassed = false;
        }
      }

      // 对所有股东执行KYC/AML检查
      const shareholderChecks = [];
      let allShareholdersPassed = true;

      for (const shareholder of payload.shareholders || []) {
        const checkResult = await this.performKycAmlCheck(
          filing.userId,
          shareholder.fullName,
        );
        shareholderChecks.push({
          name: shareholder.fullName,
          result: checkResult,
        });
        if (!checkResult.passed) {
          allShareholdersPassed = false;
        }
      }

      // 综合结果
      const passed = allDirectorsPassed && allShareholdersPassed;

      // 更新申请状态
      await this.prisma.chFiling.update({
        where: { id: filingId },
        data: {
          status: passed ? 'KYC_PASSED' : 'KYC_PENDING',
        },
      });

      return {
        passed,
        details: {
          directors: directorChecks,
          shareholders: shareholderChecks,
        },
      };
    } catch (error) {
      throw new HttpException(
        'Failed to perform KYC/AML check for filing: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
