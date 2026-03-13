import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class AiService {
  private readonly apiKey: string;
  private readonly apiUrl: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('AI_API_KEY') || '';
    this.apiUrl = this.config.get<string>('AI_API_URL') || 'https://api.openai.com/v1/chat/completions';
  }

  // 生成公司名称建议
  async generateCompanyNameSuggestions(
    industry: string,
    keywords: string[],
    style: string = 'professional',
    count: number = 5,
  ): Promise<string[]> {
    try {
      // 模拟AI响应（实际项目中应调用真实的AI API）
      const suggestions = [
        `Innovative ${industry} Solutions Ltd`,
        `${industry} Excellence Group`,
        `${industry} Pro Services Limited`,
        `${industry} Digital Ventures`,
        `Elite ${industry} Partners Ltd`,
      ];

      return suggestions.slice(0, count);
    } catch (error) {
      throw new HttpException(
        'Failed to generate company name suggestions: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 分析文档内容
  async analyzeDocument(content: string, category: string): Promise<any> {
    try {
      // 模拟AI响应（实际项目中应调用真实的AI API）
      const analysis = {
        extractedInfo: {
          name: 'John Doe',
          dateOfBirth: '1990-01-01',
          address: '123 Main Street, London',
          documentType: category,
        },
        confidence: 0.95,
        recommendations: ['Document appears to be valid', 'All required fields are present'],
      };

      return analysis;

      // 真实API调用示例
      /*
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a document analysis expert. Extract key information from documents and provide insights.',
            },
            {
              role: 'user',
              content: `Analyze the following ${category} document content and extract key information: ${content}. Provide structured extraction and any recommendations.`,
            },
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content;
      */
    } catch (error) {
      throw new HttpException(
        'Failed to analyze document: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 自动填充表单数据
  async autoFillForm(userInput: any, formType: string): Promise<any> {
    try {
      // 模拟AI响应（实际项目中应调用真实的AI API）
      const autoFilled = {
        ...userInput,
        // 添加自动填充的字段
        companyName: userInput.companyName || 'Sample Company Ltd',
        registeredOffice: userInput.registeredOffice || '123 Business Park, London',
        sicCode: userInput.sicCode || '62020', // 计算机编程活动
        shareCapital: userInput.shareCapital || '100',
        shareCurrency: userInput.shareCurrency || 'GBP',
      };

      return autoFilled;

      // 真实API调用示例
      /*
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a form auto-fill expert. Complete form fields based on partial user input.',
            },
            {
              role: 'user',
              content: `Auto-fill the following ${formType} form based on user input: ${JSON.stringify(userInput)}. Provide complete and accurate values for all required fields.`,
            },
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return JSON.parse(response.data.choices[0].message.content);
      */
    } catch (error) {
      throw new HttpException(
        'Failed to auto-fill form: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 合规检查和建议
  async complianceCheck(data: any, industry: string): Promise<any> {
    try {
      // 模拟AI响应（实际项目中应调用真实的AI API）
      const compliance = {
        passed: true,
        issues: [],
        recommendations: [
          'Ensure all directors have valid ID documents',
          'Verify registered office address is valid',
          'Check that company name is not already registered',
        ],
        confidence: 0.9,
      };

      return compliance;

      // 真实API调用示例
      /*
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a UK company compliance expert. Identify compliance issues and provide recommendations.',
            },
            {
              role: 'user',
              content: `Check compliance for a UK company in the ${industry} industry with the following data: ${JSON.stringify(data)}. Identify any issues and provide recommendations.`,
            },
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return JSON.parse(response.data.choices[0].message.content);
      */
    } catch (error) {
      throw new HttpException(
        'Failed to perform compliance check: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 注册流程指导
  async registrationGuidance(step: number, userData: any): Promise<string> {
    try {
      // 模拟AI响应（实际项目中应调用真实的AI API）
      const guidanceMap: Record<string, string> = {
        '1': 'Step 1: Choose a company name. Make sure it is unique and complies with Companies House rules.',
        '2': 'Step 2: Prepare director and shareholder information. You will need their full names, dates of birth, and addresses.',
        '3': 'Step 3: Determine your registered office address. This must be a physical address in the UK.',
        '4': 'Step 4: Select your SIC code. This identifies the nature of your business activities.',
        '5': 'Step 5: Prepare your memorandum and articles of association.',
        '6': 'Step 6: Submit your application to Companies House.',
        '7': 'Step 7: Wait for approval and receive your certificate of incorporation.',
      };

      return guidanceMap[step.toString()] || 'Please complete the previous steps first.';

      /* 真实API调用示例
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a UK company registration expert. Provide clear guidance for each step of the process.',
            },
            {
              role: 'user',
              content: `Provide detailed guidance for step ${step} of the UK company registration process. User data: ${JSON.stringify(userData)}.`,
            },
          ],
          max_tokens: 500,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content;
      */
    } catch (error) {
      throw new HttpException(
        'Failed to get registration guidance: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // 文档分类
  async classifyDocument(content: string): Promise<string> {
    try {
      // 模拟AI响应（实际项目中应调用真实的AI API）
      if (content.includes('passport') || content.includes('ID card')) {
        return 'IDENTIFICATION';
      } else if (content.includes('bank statement') || content.includes('utility bill')) {
        return 'ADDRESS_PROOF';
      } else if (content.includes('company') || content.includes('incorporation')) {
        return 'COMPANY_DOCUMENT';
      } else {
        return 'OTHER';
      }

      // 真实API调用示例
      /*
      const response = await axios.post(
        this.apiUrl,
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a document classification expert. Classify documents into categories like IDENTIFICATION, ADDRESS_PROOF, COMPANY_DOCUMENT, or OTHER.',
            },
            {
              role: 'user',
              content: `Classify the following document content: ${content}. Return only the category name.`,
            },
          ],
          max_tokens: 50,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      return response.data.choices[0].message.content.trim();
      */
    } catch (error) {
      throw new HttpException(
        'Failed to classify document: ' + (error as any).message,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
