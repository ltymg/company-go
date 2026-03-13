import { CH_FLOW_STATUS, COMPANY_STATUS, ChFlowStatus, CompanyStatus } from './state';

export type WorkflowEvent = {
  at: string; // ISO
  chFlowStatus: ChFlowStatus;
  companyStatus: CompanyStatus;
  label: string;
};

export type WorkflowStep = {
  atMs: number;
  chFlowStatus: ChFlowStatus;
  companyStatus: CompanyStatus;
  label: string;
  notification?: { type: 'FILING_SUBMITTED' | 'CH_ACCEPTED' | 'ACTION_REQUIRED'; subject: string };
};

export const WORKFLOW_HISTORY_KEY = 'workflowHistory';
export const NOTIFICATIONS_KEY = 'notifications';

export type NotificationItem = {
  id: string;
  type: 'FILING_SUBMITTED' | 'CH_ACCEPTED' | 'ACTION_REQUIRED';
  subject: string;
  createdAt: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

export function appendWorkflowEvent(e: WorkflowEvent) {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(WORKFLOW_HISTORY_KEY);
  const arr: WorkflowEvent[] = raw ? JSON.parse(raw) : [];
  arr.push(e);
  localStorage.setItem(WORKFLOW_HISTORY_KEY, JSON.stringify(arr));
}

export function getWorkflowHistory(): WorkflowEvent[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(WORKFLOW_HISTORY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function clearWorkflowHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(WORKFLOW_HISTORY_KEY);
}

export function appendNotification(n: Omit<NotificationItem, 'id'>) {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(NOTIFICATIONS_KEY);
  const arr: NotificationItem[] = raw ? JSON.parse(raw) : [];
  arr.unshift({ id: uid(), ...n });
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(arr));
}

export function getNotifications(): NotificationItem[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(NOTIFICATIONS_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function clearNotifications() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(NOTIFICATIONS_KEY);
}

export function buildUkWorkflow(params: { compliancePassed: boolean }): WorkflowStep[] {
  if (!params.compliancePassed) {
    return [
      {
        atMs: 0,
        chFlowStatus: CH_FLOW_STATUS.KYC_PENDING,
        companyStatus: COMPANY_STATUS.IN_PROGRESS,
        label: 'KYC check started…',
      },
      {
        atMs: 1400,
        chFlowStatus: CH_FLOW_STATUS.KYC_FAILED,
        companyStatus: COMPANY_STATUS.ERROR,
        label: 'Action required: KYC failed. Please correct information and resubmit.',
        notification: {
          type: 'ACTION_REQUIRED',
          subject: 'Action required: KYC failed',
        },
      },
    ];
  }

  return [
    {
      atMs: 0,
      chFlowStatus: CH_FLOW_STATUS.INFO_COMPLETED,
      companyStatus: COMPANY_STATUS.SUBMITTED,
      label: 'Information completed. Starting checks…',
    },
    {
      atMs: 900,
      chFlowStatus: CH_FLOW_STATUS.KYC_PENDING,
      companyStatus: COMPANY_STATUS.IN_PROGRESS,
      label: 'Compliance checks (KYC/AML/Sanctions/PEP) started…',
    },
    {
      atMs: 2000,
      chFlowStatus: CH_FLOW_STATUS.KYC_PASSED,
      companyStatus: COMPANY_STATUS.IN_PROGRESS,
      label: 'KYC passed. Preparing Companies House filing payload…',
    },
    {
      atMs: 3200,
      chFlowStatus: CH_FLOW_STATUS.READY_FOR_FILING,
      companyStatus: COMPANY_STATUS.IN_PROGRESS,
      label: 'Ready for Companies House software filing (XML over HTTPS)…',
    },
    {
      atMs: 4400,
      chFlowStatus: CH_FLOW_STATUS.FILED_WITH_CH,
      companyStatus: COMPANY_STATUS.IN_PROGRESS,
      label: 'Filed with Companies House. Waiting for review…',
      notification: {
        type: 'FILING_SUBMITTED',
        subject: 'Filing submitted to Companies House',
      },
    },
    {
      atMs: 6200,
      chFlowStatus: CH_FLOW_STATUS.CH_ACCEPTED,
      companyStatus: COMPANY_STATUS.IN_PROGRESS,
      label: 'Companies House accepted. Government review in progress (usually 24–48h)…',
      notification: {
        type: 'CH_ACCEPTED',
        subject: 'Companies House accepted your filing',
      },
    },
    {
      atMs: 8200,
      chFlowStatus: CH_FLOW_STATUS.COMPLETED,
      companyStatus: COMPANY_STATUS.COMPLETED,
      label: 'Completed. Your UK company is officially incorporated.',
    },
  ];
}
