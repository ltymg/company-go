import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from '../src/email/email.service';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key) => {
    switch (key) {
      case 'EMAIL_HOST':
        return 'smtp.example.com';
      case 'EMAIL_PORT':
        return 587;
      case 'EMAIL_USER':
        return 'test@example.com';
      case 'EMAIL_PASS':
        return 'password';
      case 'EMAIL_FROM':
        return 'no-reply@example.com';
      default:
        return null;
    }
  }),
};

// Mock nodemailer
const mockTransporter = {
  sendMail: jest.fn(),
  verify: jest.fn(),
};

jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn(() => mockTransporter),
  };
});

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    jest.clearAllMocks();
  });

  describe('sendFilingSubmittedNotification', () => {
    it('should send filing submitted notification email', async () => {
      const email = 'user@example.com';
      const filingId = 1;
      const companyName = 'Test Company Ltd';

      const expectedMailOptions = {
        from: 'no-reply@example.com',
        to: email,
        subject: 'Company Registration Application Submitted',
        html: expect.stringContaining('Your company registration application for <strong>Test Company Ltd</strong> has been successfully submitted'),
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendFilingSubmittedNotification(email, filingId, companyName);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expectedMailOptions);
    });

    it('should handle sendMail errors gracefully', async () => {
      const email = 'user@example.com';
      const filingId = 1;
      const companyName = 'Test Company Ltd';

      mockTransporter.sendMail.mockRejectedValue(new Error('Email send failed'));

      // Should not throw an error
      await expect(service.sendFilingSubmittedNotification(email, filingId, companyName)).resolves.not.toThrow();
    });
  });

  describe('sendFilingStatusUpdateNotification', () => {
    it('should send filing status update notification email', async () => {
      const email = 'user@example.com';
      const filingId = 1;
      const companyName = 'Test Company Ltd';
      const oldStatus = 'READY_FOR_FILING';
      const newStatus = 'FILED_WITH_CH';

      const expectedMailOptions = {
        from: 'no-reply@example.com',
        to: email,
        subject: 'Company Registration Status Updated',
        html: expect.stringContaining('The status of your company registration application for <strong>Test Company Ltd</strong> has been updated'),
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendFilingStatusUpdateNotification(email, filingId, companyName, oldStatus, newStatus);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expectedMailOptions);
    });
  });

  describe('sendKycAmlCompletedNotification', () => {
    it('should send KYC/AML completed notification email for passed check', async () => {
      const email = 'user@example.com';
      const filingId = 1;
      const companyName = 'Test Company Ltd';
      const passed = true;

      const expectedMailOptions = {
        from: 'no-reply@example.com',
        to: email,
        subject: 'KYC/AML Check Completed - Passed',
        html: expect.stringContaining('We have completed the KYC/AML check for your company registration application for <strong>Test Company Ltd</strong>'),
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendKycAmlCompletedNotification(email, filingId, companyName, passed);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expectedMailOptions);
    });

    it('should send KYC/AML completed notification email for failed check', async () => {
      const email = 'user@example.com';
      const filingId = 1;
      const companyName = 'Test Company Ltd';
      const passed = false;

      const expectedMailOptions = {
        from: 'no-reply@example.com',
        to: email,
        subject: 'KYC/AML Check Completed - Action Required',
        html: expect.stringContaining('Please provide the requested information to complete your KYC/AML check'),
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendKycAmlCompletedNotification(email, filingId, companyName, passed);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expectedMailOptions);
    });
  });

  describe('sendCompanyRegisteredNotification', () => {
    it('should send company registered notification email', async () => {
      const email = 'user@example.com';
      const filingId = 1;
      const companyName = 'Test Company Ltd';
      const companyNumber = '12345678';

      const expectedMailOptions = {
      to: email,
      from: 'no-reply@example.com',
      subject: 'Company Registered Successfully',
      html: expect.stringContaining(
        'Your company <strong>Test Company Ltd</strong> has been successfully registered with Companies House',
      ),
    };

      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendCompanyRegisteredNotification(email, filingId, companyName, companyNumber);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expectedMailOptions);
    });
  });

  describe('sendEmail', () => {
    it('should send email with provided options', async () => {
      const to = 'user@example.com';
      const subject = 'Test Email';
      const html = '<p>This is a test email</p>';

      const expectedMailOptions = {
        from: 'no-reply@example.com',
        to,
        subject,
        html,
      };

      mockTransporter.sendMail.mockResolvedValue({ messageId: '123' });

      await service.sendEmail(to, subject, html);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(expectedMailOptions);
    });
  });
});
