// 1. 产品视角状态枚举（面向 Founder / Dashboard）
export const COMPANY_STATUS = {
  EMPTY: 'empty',              // 初始空状态
  DRAFT: 'draft',              // 用户已开始填写但未提交
  SUBMITTED: 'submitted',      // 信息已提交，等待处理
  IN_PROGRESS: 'in_progress',  // 正在向 Companies House 递交/等待结果
  COMPLETED: 'completed',      // 公司已正式注册
  ERROR: 'error',              // 流程中出现错误，需要用户操作
} as const;

export type CompanyStatus = typeof COMPANY_STATUS[keyof typeof COMPANY_STATUS];

// 2. 技术/监管视角状态枚举（对照文档中的 INFO_COMPLETED 等）
export const CH_FLOW_STATUS = {
  INFO_COMPLETED: 'INFO_COMPLETED',   // 表单信息已完整
  KYC_PENDING: 'KYC_PENDING',         // 等待 KYC
  KYC_FAILED: 'KYC_FAILED',           // KYC 未通过
  KYC_PASSED: 'KYC_PASSED',           // KYC 通过
  READY_FOR_FILING: 'READY_FOR_FILING', // 准备向 CH 提交报文
  FILED_WITH_CH: 'FILED_WITH_CH',     // 已提交给 Companies House（Software Filing）
  CH_ACCEPTED: 'CH_ACCEPTED',         // CH 已接受
  CH_REJECTED: 'CH_REJECTED',         // CH 拒绝（报文错误/规则不符）
  COMPLETED: 'COMPLETED',             // 整个流程完成
} as const;

export type ChFlowStatus = typeof CH_FLOW_STATUS[keyof typeof CH_FLOW_STATUS];

// 3. 公司数据结构契约（贴近 UK Companies House 法定字段的简化版）
export interface CompanyProfile {
  // 公司层
  companyName: string;                 // Company Name
  country: 'UK' | 'US' | 'SG';         // 本模拟主要关注 UK
  industry: string;                    // 业务描述
  sicCode: string;                     // SIC Code
  registeredOfficeAddress: string;     // Registered Office Address (UK)
  shareCapital: string;                // Share Capital / 股份结构（简化为字符串）

  // 董事 / 股东 / PSC
  directorFullName: string;           // Full Legal Name
  directorDob: string;                // DOB (YYYY-MM-DD)
  directorNationality: string;        // Nationality
  directorResidentialAddress: string; // Residential Address
  directorServiceAddress: string;     // Service Address
  pscOver25: boolean;                 // 是否存在 >25% 控制人（简化为布尔）

  // 服务与时间
  services: string[];                 // 勾选的服务（注册/银行/合规）
  createdAt: string;                  // ISO 8601
  lastUpdated: string;                // ISO 8601
}

// 4. localStorage key 常量
const STATUS_KEY = 'companyStatus';
const PROFILE_KEY = 'companyProfile';
const CH_STATUS_KEY = 'chFlowStatus';

// 5. 辅助函数：状态读写
export const getCompanyStatus = (): CompanyStatus => {
  if (typeof window === 'undefined') return COMPANY_STATUS.EMPTY;
  return (localStorage.getItem(STATUS_KEY) as CompanyStatus) || COMPANY_STATUS.EMPTY;
};

export const setCompanyStatus = (status: CompanyStatus) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STATUS_KEY, status);
  }
};

export const getChFlowStatus = (): ChFlowStatus | null => {
  if (typeof window === 'undefined') return null;
  return (localStorage.getItem(CH_STATUS_KEY) as ChFlowStatus) || null;
};

export const setChFlowStatus = (status: ChFlowStatus) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CH_STATUS_KEY, status);
  }
};

// 6. 公司资料读写
export const getCompanyProfile = (): CompanyProfile | null => {
  if (typeof window === 'undefined') return null;
  const profile = localStorage.getItem(PROFILE_KEY);
  return profile ? (JSON.parse(profile) as CompanyProfile) : null;
};

export const setCompanyProfile = (profile: CompanyProfile) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  }
};
