import { Controller, Get, Post, Body, Query, UseGuards, Res, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { Response } from 'express';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // 生成公司名称建议
  @UseGuards(AuthGuard('jwt'))
  @Post('company-names')
  async generateCompanyNames(
    @Body('industry') industry: string,
    @Body('keywords') keywords: string[],
    @Body('style') style: string = 'professional',
    @Body('count') count: number = 5,
    @Res() res: Response,
  ) {
    try {
      const suggestions = await this.aiService.generateCompanyNameSuggestions(
        industry,
        keywords,
        style,
        count,
      );
      return res.status(HttpStatus.OK).json({ suggestions });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 分析文档内容
  @UseGuards(AuthGuard('jwt'))
  @Post('analyze-document')
  async analyzeDocument(
    @Body('content') content: string,
    @Body('category') category: string,
    @Res() res: Response,
  ) {
    try {
      const analysis = await this.aiService.analyzeDocument(content, category);
      return res.status(HttpStatus.OK).json({ analysis });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 自动填充表单数据
  @UseGuards(AuthGuard('jwt'))
  @Post('auto-fill')
  async autoFillForm(
    @Body('userInput') userInput: any,
    @Body('formType') formType: string,
    @Res() res: Response,
  ) {
    try {
      const autoFilled = await this.aiService.autoFillForm(userInput, formType);
      return res.status(HttpStatus.OK).json({ autoFilled });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 合规检查和建议
  @UseGuards(AuthGuard('jwt'))
  @Post('compliance-check')
  async complianceCheck(
    @Body('data') data: any,
    @Body('industry') industry: string,
    @Res() res: Response,
  ) {
    try {
      const compliance = await this.aiService.complianceCheck(data, industry);
      return res.status(HttpStatus.OK).json({ compliance });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 注册流程指导
  @UseGuards(AuthGuard('jwt'))
  @Get('registration-guidance')
  async registrationGuidance(
    @Query('step') step: number,
    @Body('userData') userData: any,
    @Res() res: Response,
  ) {
    try {
      const guidance = await this.aiService.registrationGuidance(step, userData);
      return res.status(HttpStatus.OK).json({ guidance });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }

  // 文档分类
  @UseGuards(AuthGuard('jwt'))
  @Post('classify-document')
  async classifyDocument(
    @Body('content') content: string,
    @Res() res: Response,
  ) {
    try {
      const category = await this.aiService.classifyDocument(content);
      return res.status(HttpStatus.OK).json({ category });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({ message: (error as any).message });
    }
  }
}
