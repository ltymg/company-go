import { Controller, Get, Post, Delete, Param, Query, UseGuards, UseInterceptors, UploadedFile, Res, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';
import { DocumentService } from './document.service';
import { Response } from 'express';
import * as fs from 'fs';

// 定义文件类型接口
interface File {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Controller('documents')
export class DocumentController {
  constructor(private readonly documentService: DocumentService) {}

  // 上传文档
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          cb(null, `${randomName}-${file.originalname}`);
        },
      }),
    }),
  )
  async uploadDocument(
    @UploadedFile() file: File,
    @Query('category') category: string,
    @Res() res: Response,
    @Query('companyId') companyId?: string,
  ) {
    try {
      const userId = res.locals.user.id;
      const result = await this.documentService.uploadDocument(
        file,
        userId,
        category,
        companyId ? parseInt(companyId, 10) : undefined,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 为公司注册申请上传文档
  @UseGuards(AuthGuard('jwt'))
  @Post('upload/filing/:filingId')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
          cb(null, `${randomName}-${file.originalname}`);
        },
      }),
    }),
  )
  async uploadFilingDocument(
    @UploadedFile() file: File,
    @Param('filingId') filingId: string,
    @Query('category') category: string,
    @Res() res: Response,
  ) {
    try {
      const userId = res.locals.user.id;
      const result = await this.documentService.uploadFilingDocument(
        file,
        userId,
        parseInt(filingId, 10),
        category,
      );
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 下载文档
  @UseGuards(AuthGuard('jwt'))
  @Get('download/:id')
  async downloadDocument(@Param('id') id: string, @Res() res: Response) {
    try {
      const document = await this.documentService.getDocument(parseInt(id, 10));
      
      // 检查文件是否存在
      if (!fs.existsSync(document.path)) {
        return res.status(HttpStatus.NOT_FOUND).json({ message: 'Document not found' });
      }

      // 设置响应头
      res.setHeader('Content-Type', document.mimetype);
      res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(document.filename)}`);

      // 发送文件
      const fileStream = fs.createReadStream(document.path);
      fileStream.pipe(res);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 获取用户的文档列表
  @UseGuards(AuthGuard('jwt'))
  @Get('user')
  async getUserDocuments(@Res() res: Response) {
    try {
      const userId = res.locals.user.id;
      const documents = await this.documentService.getUserDocuments(userId);
      return res.status(HttpStatus.OK).json(documents);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 获取公司的文档列表
  @UseGuards(AuthGuard('jwt'))
  @Get('company/:companyId')
  async getCompanyDocuments(@Param('companyId') companyId: string, @Res() res: Response) {
    try {
      const documents = await this.documentService.getCompanyDocuments(parseInt(companyId, 10));
      return res.status(HttpStatus.OK).json(documents);
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 删除文档
  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async deleteDocument(@Param('id') id: string, @Res() res: Response) {
    try {
      const userId = res.locals.user.id;
      const result = await this.documentService.deleteDocument(parseInt(id, 10), userId);
      return res.status(HttpStatus.OK).json({ success: result });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }
}
