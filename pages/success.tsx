import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/layout/Layout';
import Card from '../components/ui/Card';
import { motion } from 'framer-motion';
import {
  COMPANY_STATUS,
  getCompanyStatus,
  setCompanyStatus,
  setChFlowStatus,
} from '../lib/state';
import {
  appendNotification,
  appendWorkflowEvent,
  buildUkWorkflow,
  clearNotifications,
  clearWorkflowHistory,
  getWorkflowHistory,
} from '../lib/workflow';

type ComplianceResult = {
  status: 'pending' | 'passed' | 'failed';
  issues: string[];
  needsEdd: boolean;
  createdAt: string;
};

function getCompliance(): ComplianceResult | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('complianceResult');
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function Success() {
  const router = useRouter();
  const [currentLabel, setCurrentLabel] = useState('Preparing your submission…');
  const [activeIndex, setActiveIndex] = useState(0);

  // 根据合规结果构建 UK Companies House 工作流
  const steps = useMemo(() => {
    const compliance = getCompliance();
    const passed = compliance?.status === 'passed';
    return buildUkWorkflow({ compliancePassed: passed });
  }, []);

  useEffect(() => {
    const status = getCompanyStatus();
    if (status === COMPANY_STATUS.EMPTY) {
      router.replace('/dashboard');
      return;
    }

    // 新一轮模拟前清空历史与通知
    clearWorkflowHistory();
    clearNotifications();

    const timers: Array<ReturnType<typeof setTimeout>> = [];

    steps.forEach((s, idx) => {
      timers.push(
        setTimeout(() => {
          setChFlowStatus(s.chFlowStatus);
          setCompanyStatus(s.companyStatus);
          setCurrentLabel(s.label);
          setActiveIndex(idx);

          appendWorkflowEvent({
            at: new Date().toISOString(),
            chFlowStatus: s.chFlowStatus,
            companyStatus: s.companyStatus,
            label: s.label,
          });

          if (s.notification) {
            appendNotification({
              type: s.notification.type,
              subject: s.notification.subject,
              createdAt: new Date().toISOString(),
            });
          }
        }, s.atMs),
      );
    });

    const lastMs = steps[steps.length - 1]?.atMs ?? 0;
    timers.push(
      setTimeout(() => {
        router.push('/dashboard');
      }, lastMs + 1200),
    );

    return () => timers.forEach(clearTimeout);
  }, [router, steps]);

  const history = useMemo(() => getWorkflowHistory(), [activeIndex]);

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-indigo-900 to-black">
        <Card className="w-full max-w-2xl">
          {/* 顶部进度与当前状态 */}
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-indigo-500/20 flex items-center justify-center mb-6">
                <div className="w-8 h-8 border-2 border-indigo-300 border-t-transparent rounded-full animate-spin" />
              </div>
              <h1 className="text-3xl font-bold text-white">Your setup is being processed.</h1>
              <p className="text-gray-400 mt-3">
                Simulation of the Companies House workflow (software filing + async status).
              </p>
              <p className="text-gray-200 mt-4">{currentLabel}</p>
              <div className="mt-6 w-full bg-gray-700/50 rounded-full h-1.5">
                <motion.div
                  className="bg-indigo-500 h-1.5 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 9, ease: 'linear' }}
                />
              </div>
            </motion.div>
          </div>

          {/* Timeline 列表（对应文档中的 INFO_COMPLETED → … → COMPLETED） */}
          <div className="mt-10 border-t border-gray-700/50 pt-6">
            <h2 className="text-lg font-semibold text-white">Timeline</h2>
            <p className="text-sm text-gray-500 mt-1">
              This is what the dashboard tracks: Filed / In review / Completed and intermediate states.
            </p>

            <div className="mt-4 space-y-3">
              {steps.map((s, idx) => {
                const done = idx < activeIndex;
                const active = idx === activeIndex;
                return (
                  <div
                    key={`${s.chFlowStatus}-${idx}`}
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      active
                        ? 'border-indigo-500/40 bg-indigo-500/10'
                        : done
                        ? 'border-green-500/30 bg-green-500/5'
                        : 'border-gray-700/50 bg-gray-900/30'
                    }`}
                  >
                    <div
                      className={`mt-1 w-3 h-3 rounded-full ${
                        done ? 'bg-green-400' : active ? 'bg-indigo-400' : 'bg-gray-600'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-white">{s.chFlowStatus}</p>
                        <p className="text-xs text-gray-500">{s.companyStatus}</p>
                      </div>
                      <p className="text-sm text-gray-300 mt-1">{s.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {history.length > 0 && (
              <p className="text-xs text-gray-500 mt-4">Events recorded: {history.length}</p>
            )}
          </div>
        </Card>
      </div>
    </Layout>
  );
}
