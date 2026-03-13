import { Test, TestingModule } from '@nestjs/testing';
import { DocumentService } from '../src/document/document.service';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

// Mock Prisma Service
const mockPrismaService = {
  document: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  },
  chFiling: {
    findUnique: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
};

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key) => {
    switch (key) {
      case 'UPLOAD_DIR':
        return './test-uploads';
      case 'MAX_FILE_SIZE':
        return 10 * 1024 * 1024; // 10MB
      default:
        return null;
    }
  }),
};

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

// Mock path
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  extname: jest.fn((filename) => {
    const parts = filename.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }),
}));

describe('DocumentService', () => {
  let service: DocumentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<DocumentService>(DocumentService);
    jest.clearAllMocks();

    // Mock fs.existsSync to return false initially
    (fs.existsSync as jest.Mock).mockReturnValue(false);
  });

  describe('uploadDocument', () => {
    it('should upload document successfully', async () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;

      const userId = 1;
      const category = 'IDENTIFICATION';
      const companyId = 2;

      const document = {
        id: 1,
        path: 'test-path.pdf',
        category,
        companyId,
        uploadedById: userId,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      mockPrismaService.document.create.mockResolvedValue(document);

      const result = await service.uploadDocument(file, userId, category, companyId);

      expect(mockPrismaService.document.create).toHaveBeenCalledWith({
        data: {
          path: expect.any(String),
          category,
          companyId,
          uploadedById: userId,
        },
      });

      expect(result).toEqual({
        id: document.id,
        path: document.path,
        category: document.category,
      });
    });

    it('should throw error if file size exceeds limit', async () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 20 * 1024 * 1024, // 20MB
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;

      const userId = 1;
      const category = 'IDENTIFICATION';

      await expect(service.uploadDocument(file, userId, category)).rejects.toThrow(HttpException);
    });

    it('should throw error if file type is not allowed', async () => {
      const file = {
        originalname: 'test.txt',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;

      const userId = 1;
      const category = 'IDENTIFICATION';

      await expect(service.uploadDocument(file, userId, category)).rejects.toThrow(HttpException);
    });
  });

  describe('getDocument', () => {
    it('should get document successfully', async () => {
      const documentId = 1;

      const document = {
        id: documentId,
        path: 'test-path.pdf',
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      mockPrismaService.document.findUnique.mockResolvedValue(document);

      const result = await service.getDocument(documentId);

      expect(result).toEqual({
        path: expect.any(String),
        filename: document.path,
        mimetype: 'application/pdf',
      });
    });

    it('should throw error if document not found', async () => {
      const documentId = 1;

      mockPrismaService.document.findUnique.mockResolvedValue(null);

      await expect(service.getDocument(documentId)).rejects.toThrow(HttpException);
    });

    it('should throw error if document file not found', async () => {
      const documentId = 1;

      const document = {
        id: documentId,
        path: 'test-path.pdf',
      };

      (fs.existsSync as jest.Mock).mockReturnValue(false);
      mockPrismaService.document.findUnique.mockResolvedValue(document);

      await expect(service.getDocument(documentId)).rejects.toThrow(HttpException);
    });
  });

  describe('getCompanyDocuments', () => {
    it('should get company documents successfully', async () => {
      const companyId = 1;
      const documents = [
        { id: 1, path: 'doc1.pdf', category: 'IDENTIFICATION', companyId },
        { id: 2, path: 'doc2.pdf', category: 'ADDRESS_PROOF', companyId },
      ];

      mockPrismaService.document.findMany.mockResolvedValue(documents);

      const result = await service.getCompanyDocuments(companyId);

      expect(mockPrismaService.document.findMany).toHaveBeenCalledWith({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(documents);
    });
  });

  describe('getUserDocuments', () => {
    it('should get user documents successfully', async () => {
      const userId = 1;
      const documents = [
        { id: 1, path: 'doc1.pdf', category: 'IDENTIFICATION', uploadedById: userId },
        { id: 2, path: 'doc2.pdf', category: 'ADDRESS_PROOF', uploadedById: userId },
      ];

      mockPrismaService.document.findMany.mockResolvedValue(documents);

      const result = await service.getUserDocuments(userId);

      expect(mockPrismaService.document.findMany).toHaveBeenCalledWith({
        where: { uploadedById: userId },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toEqual(documents);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document successfully', async () => {
      const documentId = 1;
      const userId = 1;

      const document = {
        id: documentId,
        path: 'test-path.pdf',
        uploadedById: userId,
      };

      const user = {
        id: userId,
        isSuperAdmin: false,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.unlinkSync as jest.Mock).mockImplementation(() => {});
      mockPrismaService.document.findUnique.mockResolvedValue(document);
      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.document.delete.mockResolvedValue(document);

      const result = await service.deleteDocument(documentId, userId);

      expect(result).toBe(true);
    });

    it('should throw error if document not found', async () => {
      const documentId = 1;
      const userId = 1;

      mockPrismaService.document.findUnique.mockResolvedValue(null);

      await expect(service.deleteDocument(documentId, userId)).rejects.toThrow(HttpException);
    });

    it('should throw error if user is not authorized', async () => {
      const documentId = 1;
      const userId = 1;

      const document = {
        id: documentId,
        path: 'test-path.pdf',
        uploadedById: 2, // Different user
      };

      const user = {
        id: userId,
        isSuperAdmin: false,
      };

      mockPrismaService.document.findUnique.mockResolvedValue(document);
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.deleteDocument(documentId, userId)).rejects.toThrow(HttpException);
    });
  });

  describe('uploadFilingDocument', () => {
    it('should upload filing document successfully', async () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;

      const userId = 1;
      const filingId = 2;
      const category = 'IDENTIFICATION';

      const filing = {
        id: filingId,
        userId,
        companyId: 3,
      };

      const document = {
        id: 1,
        path: 'test-path.pdf',
        category,
        uploadedById: userId,
      };

      const updatedDocument = {
        ...document,
        companyId: filing.companyId,
      };

      (fs.existsSync as jest.Mock).mockReturnValue(true);
      (fs.writeFileSync as jest.Mock).mockImplementation(() => {});
      mockPrismaService.chFiling.findUnique.mockResolvedValue(filing);
      mockPrismaService.document.create.mockResolvedValue(document);
      mockPrismaService.document.update.mockResolvedValue(updatedDocument);

      const result = await service.uploadFilingDocument(file, userId, filingId, category);

      expect(result).toEqual({
        id: document.id,
        path: document.path,
        category: document.category,
      });
    });

    it('should throw error if filing not found', async () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;

      const userId = 1;
      const filingId = 2;
      const category = 'IDENTIFICATION';

      mockPrismaService.chFiling.findUnique.mockResolvedValue(null);

      await expect(service.uploadFilingDocument(file, userId, filingId, category)).rejects.toThrow(HttpException);
    });

    it('should throw error if user is not authorized', async () => {
      const file = {
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        buffer: Buffer.from('test content'),
      } as Express.Multer.File;

      const userId = 1;
      const filingId = 2;
      const category = 'IDENTIFICATION';

      const filing = {
        id: filingId,
        userId: 2, // Different user
      };

      const user = {
        id: userId,
        isSuperAdmin: false,
      };

      mockPrismaService.chFiling.findUnique.mockResolvedValue(filing);
      mockPrismaService.user.findUnique.mockResolvedValue(user);

      await expect(service.uploadFilingDocument(file, userId, filingId, category)).rejects.toThrow(HttpException);
    });
  });
});
