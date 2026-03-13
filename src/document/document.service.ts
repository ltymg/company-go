import { Injectable, HttpException, HttpStatus, UploadedFile } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 定义文件类型接口
interface File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Injectable()
export class DocumentService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;

  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {
    this.uploadDir = this.config.get<string>('UPLOAD_DIR') || './uploads';
    this.maxFileSize = this.config.get<number>('MAX_FILE_SIZE') || 10 * 1024 * 1024; // 10MB

    // 确保上传目录存在
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  // 上传文档
  async uploadDocument(
    file: File,
    userId: number,
    category: string,
    companyId?: number,
  ): Promise<{ id: number; path: string; category: string }> {
    try {
      // 验证文件大小
      if (file.size > this.maxFileSize) {
        throw new HttpException('File size exceeds limit', HttpStatus.BAD_REQUEST);
      }

      // 验证文件类型
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new HttpException('File type not allowed', HttpStatus.BAD_REQUEST);
      }

      // 生成唯一文件名
      const fileName = `${uuidv4()}-${file.originalname}`;
      const filePath = path.join(this.uploadDir, fileName);

      // 保存文件
      fs.writeFileSync(filePath, file.buffer);

      // 构建创建数据
      const createData: any = {
        path: fileName,
        category,
        uploadedById: userId,
      };

      // 只有当companyId存在时才添加到创建数据中
      if (companyId) {
        createData.companyId = companyId;
      }

      // 保存文档记录到数据库
      const document = await this.prisma.document.create({
        data: createData,
      });

      return {
        id: document.id,
        path: document.path,
        category: document.category,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to upload document: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 获取文档
  async getDocument(documentId: number): Promise<{ path: string; filename: string; mimetype: string }> {
    try {
      const document = await this.prisma.document.findUnique({ where: { id: documentId } });
      if (!document) {
        throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
      }

      const filePath = path.join(this.uploadDir, document.path);
      if (!fs.existsSync(filePath)) {
        throw new HttpException('Document file not found', HttpStatus.NOT_FOUND);
      }

      // 确定文件的MIME类型
      const mimetype = this.getMimeType(document.path);

      return {
        path: filePath,
        filename: document.path,
        mimetype,
      };
    } catch (error) {
      throw new HttpException(
        'Failed to get document: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 获取公司的所有文档
  async getCompanyDocuments(companyId: number): Promise<any[]> {
    try {
      return this.prisma.document.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new HttpException(
        'Failed to get company documents: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 获取用户上传的所有文档
  async getUserDocuments(userId: number): Promise<any[]> {
    try {
      return this.prisma.document.findMany({
        where: { uploadedById: userId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      throw new HttpException(
        'Failed to get user documents: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 删除文档
  async deleteDocument(documentId: number, userId: number): Promise<boolean> {
    try {
      const document = await this.prisma.document.findUnique({ where: { id: documentId } });
      if (!document) {
        throw new HttpException('Document not found', HttpStatus.NOT_FOUND);
      }

      // 验证用户权限
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (!user || (document.uploadedById !== userId && !user.isSuperAdmin)) {
        throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
      }

      // 删除文件
      const filePath = path.join(this.uploadDir, document.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // 删除数据库记录
      await this.prisma.document.delete({ where: { id: documentId } });

      return true;
    } catch (error) {
      throw new HttpException(
        'Failed to delete document: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 为公司注册申请上传文档
  async uploadFilingDocument(
    file: File,
    userId: number,
    filingId: number,
    category: string,
  ): Promise<{ id: number; path: string; category: string }> {
    try {
      // 验证申请存在
      const filing = await this.prisma.chFiling.findUnique({ where: { id: filingId } });
      if (!filing) {
        throw new HttpException('Filing not found', HttpStatus.NOT_FOUND);
      }

      // 验证用户权限
      if (filing.userId !== userId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user || !user.isSuperAdmin) {
          throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
        }
      }

      // 上传文档
      const uploadedDoc = await this.uploadDocument(file, userId, category);

      // 如果申请已关联公司，将文档关联到公司
      if (filing.companyId) {
        await this.prisma.document.update({
          where: { id: uploadedDoc.id },
          data: { companyId: filing.companyId },
        });
      }

      return uploadedDoc;
    } catch (error) {
      throw new HttpException(
        'Failed to upload filing document: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 获取文件的MIME类型
  private getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }
}
