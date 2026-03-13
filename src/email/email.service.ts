import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    this.fromEmail = this.config.get<string>('EMAIL_FROM') || 'no-reply@globalcompanyformation.com';

    // 创建邮件传输器
    this.transporter = nodemailer.createTransport({
      service: this.config.get<string>('EMAIL_SERVICE') || 'gmail',
      auth: {
        user: this.config.get<string>('EMAIL_USER'),
        pass: this.config.get<string>('EMAIL_PASS'),
      },
    });
  }

  // 发送电子邮件
  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      this.logger.log(`Email sent to ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending email to ${to}: ${(error as any).message}`);
      return false;
    }
  }

  // 发送公司注册申请提交通知
  async sendFilingSubmittedNotification(to: string, filingId: number, companyName: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Company Registration Submitted</h1>
        <p>Hello,</p>
        <p>Your company registration application for <strong>${companyName}</strong> has been successfully submitted.</p>
        <p><strong>Application ID:</strong> ${filingId}</p>
        <p>Our team will review your application and proceed with the Companies House filing.</p>
        <p>You can track the status of your application in your dashboard.</p>
        <p>Best regards,<br>Global Company Formation Team</p>
      </div>
    `;

    return this.sendEmail(to, 'Company Registration Application Submitted', html);
  }

  // 发送公司注册状态更新通知
  async sendFilingStatusUpdateNotification(
    to: string,
    filingId: number,
    companyName: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<boolean> {
    const statusDescription = this.getStatusDescription(newStatus);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Company Registration Status Updated</h1>
        <p>Hello,</p>
        <p>The status of your company registration application for <strong>${companyName}</strong> has been updated.</p>
        <p><strong>Application ID:</strong> ${filingId}</p>
        <p><strong>Old Status:</strong> ${this.getStatusDescription(oldStatus)}</p>
        <p><strong>New Status:</strong> ${statusDescription}</p>
        <p>${this.getStatusAction(newStatus)}</p>
        <p>You can track the complete status of your application in your dashboard.</p>
        <p>Best regards,<br>Global Company Formation Team</p>
      </div>
    `;

    return this.sendEmail(to, 'Company Registration Status Updated', html);
  }

  // 发送KYC/AML检查完成通知
  async sendKycAmlCompletedNotification(
    to: string,
    filingId: number,
    companyName: string,
    passed: boolean,
  ): Promise<boolean> {
    const subject = passed ? 'KYC/AML Check Completed - Passed' : 'KYC/AML Check Completed - Action Required';
    const statusText = passed ? 'passed' : 'requires additional information';
    const actionText = passed 
      ? 'Your application will now proceed to the next stage.' 
      : 'Please provide the requested information to complete your KYC/AML check.';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">KYC/AML Check Completed</h1>
        <p>Hello,</p>
        <p>We have completed the KYC/AML check for your company registration application for <strong>${companyName}</strong>.</p>
        <p><strong>Application ID:</strong> ${filingId}</p>
        <p><strong>Check Result:</strong> ${statusText}</p>
        <p>${actionText}</p>
        <p>You can view the details in your dashboard.</p>
        <p>Best regards,<br>Global Company Formation Team</p>
      </div>
    `;

    return this.sendEmail(to, subject, html);
  }

  // 发送公司注册成功通知
  async sendCompanyRegisteredNotification(
    to: string,
    filingId: number,
    companyName: string,
    companyNumber: string,
  ): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">🎉 Company Registered Successfully</h1>
        <p>Hello,</p>
        <p>Congratulations! Your company <strong>${companyName}</strong> has been successfully registered with Companies House.</p>
        <p><strong>Application ID:</strong> ${filingId}</p>
        <p><strong>Company Number:</strong> ${companyNumber}</p>
        <p>You can now access all the details and documents for your company in your dashboard.</p>
        <p>Best regards,<br>Global Company Formation Team</p>
      </div>
    `;

    return this.sendEmail(to, 'Company Registered Successfully', html);
  }

  // 获取状态描述
  private getStatusDescription(status: string): string {
    const statusMap: Record<string, string> = {
      'DRAFT': 'Draft',
      'INFO_COMPLETED': 'Information Completed',
      'KYC_PENDING': 'KYC/AML Pending',
      'KYC_PASSED': 'KYC/AML Passed',
      'READY_FOR_FILING': 'Ready for Filing',
      'FILED_MANUALLY': 'Filed Manually',
      'FILED_WITH_CH': 'Filed with Companies House',
      'CH_ACCEPTED': 'Companies House Accepted',
      'CH_REJECTED': 'Companies House Rejected',
    };

    return statusMap[status] || status;
  }

  // 获取状态对应的行动建议
  private getStatusAction(status: string): string {
    const actionMap: Record<string, string> = {
      'KYC_PENDING': 'We are currently processing your KYC/AML check. This may take a few business days.',
      'KYC_PASSED': 'Your KYC/AML check has been completed successfully. Your application will now proceed to filing.',
      'READY_FOR_FILING': 'Your application is now ready for filing with Companies House. Our team will submit it shortly.',
      'FILED_WITH_CH': 'Your application has been submitted to Companies House. We will update you once we receive confirmation.',
      'CH_ACCEPTED': 'Congratulations! Your company has been successfully registered with Companies House.',
      'CH_REJECTED': 'Your application has been rejected by Companies House. Please contact our support team for assistance.',
    };

    return actionMap[status] || 'Your application status has been updated.';
  }
}
