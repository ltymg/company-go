import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChPublicService } from '../ch-public/ch-public.service';
import { ChFilingSoftwareService } from './ch-filing-software.service';
import { KycAmlService } from '../kyc-aml/kyc-aml.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class ChFilingService {
  private readonly env: string;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly chPublicService: ChPublicService,
    private readonly chFilingSoftwareService: ChFilingSoftwareService,
    private readonly kycAmlService: KycAmlService,
    private readonly emailService: EmailService,
  ) {
    this.env = this.config.get<string>('CH_ENV') || 'sandbox';
  }

  // 创建公司注册草稿：写入数据库，返回草稿记录
  async createIncorporationDraft(body: any) {
    // 这里不强校验结构，只是原样存为 JSON 字符串，后续可根据需要增加 DTO/验证
    const payloadJson = JSON.stringify(body ?? {});

    const userId = body.userId ?? 1; // TODO: 从认证上下文获取真实 userId

    const filing = await this.prisma.chFiling.create({
      data: {
        userId,
        status: 'DRAFT',
        payloadJson,
        env: this.env,
      },
    });

    return filing;
  }

  // Admin 用：获取所有 Filing 列表（简单按时间倒序）
  async findAll() {
    return this.prisma.chFiling.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Admin 用：获取单个 Filing 详情
  async findOne(idParam: string) {
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      throw new Error('Invalid filing id');
    }
    return this.prisma.chFiling.findUnique({ where: { id } });
  }

  // 提交公司注册：当前仅将状态更新为 READY_FOR_FILING（待人工/后续自动 Filing）
  async submitIncorporation(draftId: string) {
    const id = Number(draftId);
    if (Number.isNaN(id)) {
      throw new Error('Invalid draftId');
    }

    // 获取当前申请信息
    const currentFiling = await this.prisma.chFiling.findUnique({ where: { id } });
    if (!currentFiling) {
      throw new Error('Filing not found');
    }

    const filing = await this.prisma.chFiling.update({
      where: { id },
      data: {
        status: 'READY_FOR_FILING',
      },
    });

    // 解析申请信息以获取公司名称
    const payload = JSON.parse(filing.payloadJson);
    const companyName = payload.companyName || 'Unknown Company';

    // 获取用户信息以获取电子邮件
    const user = await this.prisma.user.findUnique({ where: { id: filing.userId } });
    if (user && user.email) {
      // 发送申请提交通知
      await this.emailService.sendFilingSubmittedNotification(user.email, filing.id, companyName);
    }

    return {
      draftId: filing.id,
      status: filing.status,
      env: filing.env,
      note:
        'Draft locked and marked as READY_FOR_FILING. No real Companies House filing has been made yet. Use admin/manual process to complete filing and backfill company_number.',
    };
  }

  // Admin / 运营：人工回填 company_number（完成 WebFiling 后在后台调用）
  async backfillCompanyNumber(idParam: string, companyNumber: string) {
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      throw new Error('Invalid filing id');
    }
    if (!companyNumber) {
      throw new Error('companyNumber is required');
    }

    // 获取当前申请信息
    const currentFiling = await this.prisma.chFiling.findUnique({ where: { id } });
    if (!currentFiling) {
      throw new Error('Filing not found');
    }

    const filing = await this.prisma.chFiling.update({
      where: { id },
      data: {
        companyNumber,
        status: 'FILED_MANUALLY',
      },
    });

    // 解析申请信息以获取公司名称
    const payload = JSON.parse(filing.payloadJson);
    const companyName = payload.companyName || 'Unknown Company';

    // 获取用户信息以获取电子邮件
    const user = await this.prisma.user.findUnique({ where: { id: filing.userId } });
    if (user && user.email) {
      // 发送公司注册成功通知
      await this.emailService.sendCompanyRegisteredNotification(
        user.email,
        filing.id,
        companyName,
        companyNumber,
      );
    }

    return filing;
  }

  // 查询提交状态：
  // - 若已有 companyNumber，则调用 CH Public API 获取真实公司档案
  // - 若无 companyNumber，则仅返回内部状态
  async getSubmissionStatus(txId: string) {
    const id = Number(txId);
    if (Number.isNaN(id)) {
      throw new Error('Invalid transaction id');
    }

    const filing = await this.prisma.chFiling.findUnique({ where: { id } });
    if (!filing) {
      throw new Error('Filing not found');
    }

    let officialProfile: any = null;
    if (filing.companyNumber) {
      try {
        officialProfile = await this.chPublicService.getCompanyProfile(
          filing.companyNumber,
        );
      } catch (e) {
        // 官方接口失败时，不阻断内部状态返回，只是不提供 officialProfile
      }
    }

    return {
      transactionId: filing.id,
      status: filing.status,
      companyNumber: filing.companyNumber,
      message:
        'This status reflects your internal filing record. When company_number is present, officialProfile comes from Companies House public API.',
      officialProfile,
    };
  }

  // 自动提交公司注册：使用 Software Filing API
  async autoSubmitIncorporation(draftId: string, accessToken: string) {
    const id = Number(draftId);
    if (Number.isNaN(id)) {
      throw new Error('Invalid draftId');
    }

    // 获取草稿信息
    const filing = await this.prisma.chFiling.findUnique({ where: { id } });
    if (!filing) {
      throw new Error('Filing not found');
    }

    if (filing.status !== 'READY_FOR_FILING') {
      throw new Error('Filing must be in READY_FOR_FILING status to submit');
    }

    try {
      // 解析 payload
      const payload = JSON.parse(filing.payloadJson);
      const companyName = payload.companyName || 'Unknown Company';

      // 构建 XML
      const xml = this.chFilingSoftwareService.buildIncorporationXml(payload);

      // 提交到 Companies House
      const submissionResult = await this.chFilingSoftwareService.submitIncorporation(xml, accessToken);

      // 更新状态
      const updatedFiling = await this.prisma.chFiling.update({
        where: { id },
        data: {
          status: 'FILED_WITH_CH',
          transactionId: submissionResult.transactionId,
        },
      });

      // 获取用户信息以获取电子邮件
      const user = await this.prisma.user.findUnique({ where: { id: filing.userId } });
      if (user && user.email) {
        // 发送状态更新通知
        await this.emailService.sendFilingStatusUpdateNotification(
          user.email,
          filing.id,
          companyName,
          'READY_FOR_FILING',
          'FILED_WITH_CH',
        );
      }

      return {
        draftId: updatedFiling.id,
        status: updatedFiling.status,
        env: updatedFiling.env,
        transactionId: updatedFiling.transactionId,
        note: 'Filing has been submitted to Companies House via Software Filing API.',
      };
    } catch (error) {
      throw new HttpException(
        'Failed to submit incorporation: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 更新提交状态（用于自动轮询）
  async updateSubmissionStatus(idParam: string, status: string, companyNumber?: string) {
    const id = Number(idParam);
    if (Number.isNaN(id)) {
      throw new Error('Invalid filing id');
    }

    // 获取当前申请信息
    const currentFiling = await this.prisma.chFiling.findUnique({ where: { id } });
    if (!currentFiling) {
      throw new Error('Filing not found');
    }

    const updateData: any = {
      status,
    };

    if (companyNumber) {
      updateData.companyNumber = companyNumber;
    }

    const filing = await this.prisma.chFiling.update({
      where: { id },
      data: updateData,
    });

    // 解析申请信息以获取公司名称
    const payload = JSON.parse(filing.payloadJson);
    const companyName = payload.companyName || 'Unknown Company';

    // 获取用户信息以获取电子邮件
    const user = await this.prisma.user.findUnique({ where: { id: filing.userId } });
    if (user && user.email && currentFiling.status !== status) {
      // 发送状态更新通知
      await this.emailService.sendFilingStatusUpdateNotification(
        user.email,
        filing.id,
        companyName,
        currentFiling.status,
        status,
      );

      // 如果状态为CH_ACCEPTED且有公司编号，发送注册成功通知
      if (status === 'CH_ACCEPTED' && companyNumber) {
        await this.emailService.sendCompanyRegisteredNotification(
          user.email,
          filing.id,
          companyName,
          companyNumber,
        );
      }
    }

    return filing;
  }

  // 获取 OAuth 授权 URL
  getAuthorizationUrl(state: string): string {
    return this.chFilingSoftwareService.getAuthorizationUrl(state);
  }

  // 兑换授权码为访问令牌
  async exchangeCodeForToken(code: string) {
    return this.chFilingSoftwareService.getAccessToken(code);
  }

  // 执行KYC/AML检查
  async performKycAmlCheck(filingId: string) {
    const id = Number(filingId);
    if (Number.isNaN(id)) {
      throw new Error('Invalid filing id');
    }

    const filing = await this.prisma.chFiling.findUnique({ where: { id } });
    if (!filing) {
      throw new Error('Filing not found');
    }

    const result = await this.kycAmlService.performKycAmlForFiling(id);

    // 解析申请信息以获取公司名称
    const payload = JSON.parse(filing.payloadJson);
    const companyName = payload.companyName || 'Unknown Company';

    // 获取用户信息以获取电子邮件
    const user = await this.prisma.user.findUnique({ where: { id: filing.userId } });
    if (user && user.email) {
      // 发送KYC/AML检查完成通知
      await this.emailService.sendKycAmlCompletedNotification(
        user.email,
        filing.id,
        companyName,
        result.passed,
      );
    }

    return {
      filingId: id,
      kycAmlPassed: result.passed,
      details: result.details,
      status: result.passed ? 'KYC_PASSED' : 'KYC_PENDING',
    };
  }

  // 更新KYC状态
  async updateKycStatus(filingId: string, status: string) {
    const id = Number(filingId);
    if (Number.isNaN(id)) {
      throw new Error('Invalid filing id');
    }

    const filing = await this.prisma.chFiling.update({
      where: { id },
      data: { status },
    });

    return filing;
  }
}

