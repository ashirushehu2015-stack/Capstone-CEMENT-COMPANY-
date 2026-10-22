import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  ShieldCheck,
  Clock,
  Check,
  AlertTriangle,
  Info,
  Loader2,
  ExternalLink
} from 'lucide-react';
import type { AcceptanceTestResult } from '../types/index.ts';
import { apiInventory } from '../services/api.ts';

interface AcceptanceTestsTabProps {
  onNotification: (type: 'success' | 'error', text: string) => void;
  onRefreshParent: () => void;
}

export const AcceptanceTestsTab: React.FC<AcceptanceTestsTabProps> = ({
  onNotification,
  onRefreshParent,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<AcceptanceTestResult[]>([]);
  const [summaryText, setSummaryText] = useState<string>('');
  const [lastExecutedAt, setLastExecutedAt] = useState<string | null>(null);

  const handleRunTests = async () => {
    setIsRunning(true);
    try {
      const res = await apiInventory.runAcceptanceTests();
      setTestResults(res.results);
      setSummaryText(res.summary);
      setLastExecutedAt(new Date().toISOString());
      if (res.allPassed) {
        onNotification('success', `All 16 Acceptance Tests passed successfully!`);
      } else {
        onNotification('error', `Some acceptance tests failed. Check diagnostic log.`);
      }
      onRefreshParent();
    } catch (err: any) {
      onNotification('error', err.message || 'Failed to execute test suite.');
    } finally {
      setIsRunning(false);
    }
  };

  const passedCount = testResults.filter((r) => r.passed).length;
  const failedCount = testResults.filter((r) => !r.passed).length;

  return (
    <div className="space-y-6">
      {/* Test Runner Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-4 h-4" /> Section 8 — Automated Acceptance Tests Suite
          </div>
          <h2 className="text-xl font-black text-white mt-1">16 Authoritative Business Rules Verification</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Executes programmatic tests validating full truck orders (600 bags), stock reservation concurrency, separation of duties,
            Manager-only approval, Agent-only issuance, 100% full payment, opening stock baseline, and ledger balance reconciliation.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-xs flex items-center gap-2.5 shadow-xl transition-all shrink-0 disabled:opacity-50"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Running 16 Automated Tests...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" /> Run All 16 Acceptance Tests
            </>
          )}
        </button>
      </div>

      {/* Test Execution Summary Cards */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-mono text-xs">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Total Tests</span>
            <span className="text-2xl font-black text-white">{testResults.length}</span>
          </div>
          <div className="bg-slate-900 border border-emerald-900/60 p-4 rounded-xl">
            <span className="text-emerald-400 block text-[11px]">Passed</span>
            <span className="text-2xl font-black text-emerald-400">{passedCount}</span>
          </div>
          <div className="bg-slate-900 border border-rose-900/60 p-4 rounded-xl">
            <span className="text-rose-400 block text-[11px]">Failed</span>
            <span className="text-2xl font-black text-rose-400">{failedCount}</span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
            <span className="text-slate-400 block text-[11px]">Last Executed</span>
            <span className="text-sm font-bold text-slate-200 block truncate">
              {lastExecutedAt ? new Date(lastExecutedAt).toLocaleTimeString() : 'N/A'}
            </span>
          </div>
        </div>
      )}

      {/* Test Results Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-white text-sm">Automated Test Specifications & Results</h3>
            {summaryText && (
              <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-mono">
                {summaryText}
              </span>
            )}
          </div>
        </div>

        {testResults.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Play className="w-10 h-10 text-amber-500/50 mx-auto" />
            <h4 className="text-sm font-bold text-white">Acceptance Tests Ready to Run</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click the green button above to execute the 16 tests asserting each operational invariant defined in Section 8.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {testResults.map((t) => (
              <div key={t.testId} className="p-4 hover:bg-slate-800/30 transition-colors flex items-start gap-4">
                <div className="pt-0.5">
                  {t.passed ? (
                    <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-rose-950 border border-rose-700/60 flex items-center justify-center text-rose-400">
                      <XCircle className="w-4 h-4" />
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">Test {t.testId}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider font-mono ${
                        t.passed
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {t.passed ? 'PASSED' : 'FAILED'}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white">{t.name}</h4>
                  <p className="text-xs text-slate-400">{t.description}</p>

                  <div className="mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-[11px] text-slate-300">
                    <span className="text-slate-500 mr-2">Diagnostics:</span>
                    {t.details}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
