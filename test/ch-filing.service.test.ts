import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { ChFilingService } from '../src/ch-filing/ch-filing.service';
import { ChFilingSoftwareService } from '../src/ch-filing/ch-filing-software.service';
import { ChPublicService } from '../src/ch-public/ch-public.service';
import { KycAmlService } from '../src/kyc-aml/kyc-aml.service';
import { EmailService } from '../src/email/email.service';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';

// Mock Prisma Service
const mockPrismaService = {
  chFiling: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  company: {
    create: jest.fn(),
  },
};

// Mock ChFilingSoftwareService
const mockChFilingSoftwareService = {
  buildIncorporationXml: jest.fn(),
  submitIncorporation: jest.fn(),
  checkSubmissionStatus: jest.fn(),
  getAuthorizationUrl: jest.fn(),
  getAccessToken: jest.fn(),
  refreshAccessToken: jest.fn(),
};

// Mock ChPublicService
const mockChPublicService = {
  getCompanyProfile: jest.fn(),
};

// Mock KycAmlService
const mockKycAmlService = {
  performKycAmlForFiling: jest.fn(),
};

// Mock EmailService
const mockEmailService = {
  sendFilingSubmittedNotification: jest.fn(),
  sendFilingStatusUpdateNotification: jest.fn(),
  sendKycAmlCompletedNotification: jest.fn(),
  sendCompanyRegisteredNotification: jest.fn(),
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn(),
};

describe('ChFilingService', () => {
  let service: ChFilingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChFilingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ChFilingSoftwareService,
          useValue: mockChFilingSoftwareService,
        },
        {
          provide: ChPublicService,
          useValue: mockChPublicService,
        },
        {
          provide: KycAmlService,
          useValue: mockKycAmlService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ChFilingService>(ChFilingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createIncorporationDraft', () => {
    it('should create a new incorporation draft', async () => {
      const userId = 1;
      const payload = {
        userId,
        companyName: 'Test Company Ltd',
        directors: [],
        shareholders: [],
      };

      const expectedResult = {
        id: 1,
        userId,
        status: 'DRAFT',
        payloadJson: JSON.stringify(payload),
        env: 'sandbox',
        createdAt: new Date(),
      };

      mockPrismaService.chFiling.create.mockResolvedValue(expectedResult);

      const result = await service.createIncorporationDraft(payload);

      expect(mockPrismaService.chFiling.create).toHaveBeenCalledWith({
        data: {
          userId,
          payloadJson: JSON.stringify(payload),
          status: 'DRAFT',
          env: 'sandbox',
        },
      });

      expect(result).toEqual(expectedResult);
    });

    it('should handle null payload', async () => {
      const payload = null;

      const expectedResult = {
        id: 1,
        userId: 1,
        status: 'DRAFT',
        payloadJson: JSON.stringify({}),
        env: 'sandbox',
        createdAt: new Date(),
      };

      mockPrismaService.chFiling.create.mockResolvedValue(expectedResult);

      const result = await service.createIncorporationDraft(payload);

      expect(result).toEqual(expectedResult);
    });
  });

  describe('submitIncorporation', () => {
    it('should submit incorporation and send notification', async () => {
      const draftId = '1';
      const userId = 1;
      const companyName = 'Test Company Ltd';

      const filing = {
        id: 1,
        userId,
        status: 'DRAFT',
        payloadJson: JSON.stringify({ companyName }),
        env: 'sandbox',
      };

      const updatedFiling = {
        ...filing,
        status: 'READY_FOR_FILING',
      };

      const user = {
        id: userId,
        email: 'test@example.com',
      };

      mockPrismaService.chFiling.findUnique.mockResolvedValue(filing);
      mockPrismaService.chFiling.update.mockResolvedValue(updatedFiling);
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockEmailService.sendFilingSubmittedNotification.mockResolvedValue(undefined);

      const result = await service.submitIncorporation(draftId);

      expect(mockPrismaService.chFiling.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { status: 'READY_FOR_FILING' },
      });

      expect(mockEmailService.sendFilingSubmittedNotification).toHaveBeenCalledWith(
        user.email,
        filing.id,
        companyName,
      );

      expect(result).toEqual({
        draftId: updatedFiling.id,
        status: updatedFiling.status,
        env: updatedFiling.env,
        note: 'Draft locked and marked as READY_FOR_FILING. No real Companies House filing has been made yet. Use admin/manual process to complete filing and backfill company_number.',
      });
    });

    it('should throw an error if filing not found', async () => {
      const draftId = '1';

      mockPrismaService.chFiling.findUnique.mockResolvedValue(null);

      await expect(service.submitIncorporation(draftId)).rejects.toThrow('Filing not found');
    });
  });

  describe('autoSubmitIncorporation', () => {
    it('should auto submit incorporation and update status', async () => {
      const draftId = '1';
      const accessToken = 'test-token';
      const userId = 1;
      const companyName = 'Test Company Ltd';

      const filing = {
        id: 1,
        userId,
        status: 'READY_FOR_FILING',
        payloadJson: JSON.stringify({ companyName }),
        env: 'sandbox',
      };

      const updatedFiling = {
        ...filing,
        status: 'FILED_WITH_CH',
        transactionId: 'test-transaction-id',
      };

      const user = {
        id: userId,
        email: 'test@example.com',
      };

      const xml = '<xml>test</xml>';
      const submissionResult = {
        transactionId: 'test-transaction-id',
      };

      mockPrismaService.chFiling.findUnique.mockResolvedValue(filing);
      mockChFilingSoftwareService.buildIncorporationXml.mockReturnValue(xml);
      mockChFilingSoftwareService.submitIncorporation.mockResolvedValue(submissionResult);
      mockPrismaService.chFiling.update.mockResolvedValue(updatedFiling);
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockEmailService.sendFilingStatusUpdateNotification.mockResolvedValue(undefined);

      const result = await service.autoSubmitIncorporation(draftId, accessToken);

      expect(mockChFilingSoftwareService.submitIncorporation).toHaveBeenCalledWith(xml, accessToken);
      expect(mockPrismaService.chFiling.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          status: 'FILED_WITH_CH',
          transactionId: submissionResult.transactionId,
        },
      });

      expect(result).toEqual({
        draftId: updatedFiling.id,
        status: updatedFiling.status,
        transactionId: updatedFiling.transactionId,
        env: updatedFiling.env,
      });
    });

    it('should throw an error if filing is not in READY_FOR_FILING status', async () => {
      const draftId = '1';
      const accessToken = 'test-token';

      const filing = {
        id: 1,
        status: 'DRAFT',
      };

      mockPrismaService.chFiling.findUnique.mockResolvedValue(filing);

      await expect(service.autoSubmitIncorporation(draftId, accessToken)).rejects.toThrow(
        'Filing must be in READY_FOR_FILING status to submit',
      );
    });
  });

  describe('performKycAmlCheck', () => {
    it('should perform KYC/AML check and send notification', async () => {
      const filingId = '1';
      const userId = 1;
      const companyName = 'Test Company Ltd';

      const filing = {
        id: 1,
        userId,
        payloadJson: JSON.stringify({ companyName }),
      };

      const kycResult = {
        passed: true,
        details: 'KYC passed',
      };

      const user = {
        id: userId,
        email: 'test@example.com',
      };

      mockPrismaService.chFiling.findUnique.mockResolvedValue(filing);
      mockKycAmlService.performKycAmlForFiling.mockResolvedValue(kycResult);
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockEmailService.sendKycAmlCompletedNotification.mockResolvedValue(undefined);

      const result = await service.performKycAmlCheck(filingId);

      expect(mockKycAmlService.performKycAmlForFiling).toHaveBeenCalledWith(1);
      expect(mockEmailService.sendKycAmlCompletedNotification).toHaveBeenCalledWith(
        user.email,
        filing.id,
        companyName,
        kycResult.passed,
      );

      expect(result).toEqual({
        filingId: 1,
        kycAmlPassed: kycResult.passed,
        details: kycResult.details,
        status: 'KYC_PASSED',
      });
    });
  });
});
