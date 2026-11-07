import React, { useState } from 'react';
import { MILESTONES_CONFIG, MilestoneItem } from '../data/mockData';
import { 
  Play, CheckCircle2, Clock, ShieldCheck, AlertCircle, 
  Terminal, FileText, Award, DollarSign, RefreshCw, ChevronRight, Check, Sparkles
} from 'lucide-react';

interface TestResult {
  milestoneId: number;
  status: 'passed' | 'running' | 'idle' | 'failed';
  passedCount: number;
  totalCount: number;
  logs: string[];
  durationMs: number;
}

export const MilestoneRunnerView: React.FC = () => {
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneItem>(MILESTONES_CONFIG[0]);
  const [testResults, setTestResults] = useState<Record<number, TestResult>>({
    1: { 
      milestoneId: 1, 
      status: 'passed', 
      passedCount: 5, 
      totalCount: 5, 
      logs: [
        '[INIT] Initializing Milestone 1 acceptance test harness (ap-southeast-2)...',
        '[PASS 1/5] Health route GET /health returns 200 OK without token; all other routes reject 401',
        '[PASS 2/5] Token fixtures: Valid (200), Expired (401), Tampered (401), Alg "none" (401), Malformed (401), Missing claims (401)',
        '[PASS 3/5] Valid token for unknown or disabled tenant refused with 403 Forbidden',
        '[PASS 4/5] Tenant isolation invariant: client X-Tenant-ID headers ignored; JWT claims strictly isolate data',
        '[PASS 5/5] CORS preflight passes for allowed origin and rejects rogue domain',
        '[SUCCESS] Milestone 1 passed 100% of acceptance checks. Gate cleared for client code review.',
      ], 
      durationMs: 142 
    },
    2: { 
      milestoneId: 2, 
      status: 'passed', 
      passedCount: 6, 
      totalCount: 6, 
      logs: [
        '[INIT] Initializing Milestone 2 acceptance test harness...',
        '[PASS 1/6] Conversations CRUD & SQS polling returns new messages with idempotency key deduplication',
        '[PASS 2/6] Credit reservation limits strictly enforced; duplicate SQS deposit event applies once',
        '[PASS 3/6] Bedrock chat execution completes; repeated SQS message does not invoke model twice',
        '[PASS 4/6] Runaway loop guard aborts after 8 steps / token ceiling exceeded (10,000 tokens / 15s deadline)',
        '[PASS 5/6] 2-Phase safe write plan: direct model writes rejected; plan binds tenant, user, hash',
        '[PASS 6/6] File upload rejects EICAR test virus, enforces 25MB ceiling, and restricts cross-tenant reads',
        '[SUCCESS] Milestone 2 passed 100% of acceptance checks. Gate cleared for client code review.',
      ], 
      durationMs: 290 
    },
    3: {
      milestoneId: 3,
      status: 'passed',
      passedCount: 4,
      totalCount: 4,
      logs: [
        '[INIT] Initializing Milestone 3 declarative agent package validator...',
        '[PASS 1/4] Invalid packages rejected with clear syntax errors (unsafe content, missing previews, unknown fields)',
        '[PASS 2/4] Package-defined write tool enforces identical 2-phase approval flow as coded tools',
        '[PASS 3/4] Canary deployment and zero-downtime rollback executed via CLI without application redeployment',
        '[PASS 4/4] Users never manually choose an agent; primary router routes intelligently to specialist without loops',
        '[SUCCESS] Milestone 3 passed 100% of acceptance checks. Gate cleared for client code review.',
      ],
      durationMs: 165
    },
    4: {
      milestoneId: 4,
      status: 'passed',
      passedCount: 4,
      totalCount: 4,
      logs: [
        '[INIT] Initializing Milestone 4 product agent & ERP connector harness...',
        '[PASS 1/4] ERP connector calls only tenant-configured domain, refuses redirects and unknown paths; rate limits hold',
        '[PASS 2/4] Optimistic concurrency detection stops execution if product was changed by someone else during preview',
        '[PASS 3/4] Category-wide updates (20 products batch) execute within rate limits under a single approved plan',
        '[PASS 4/4] Zero credentials or sensitive ERP payloads logged; prompt injection attacks safely deflected',
        '[SUCCESS] Milestone 4 passed 100% of acceptance checks. Gate cleared for client code review.',
      ],
      durationMs: 310
    },
    5: {
      milestoneId: 5,
      status: 'passed',
      passedCount: 4,
      totalCount: 4,
      logs: [
        '[INIT] Initializing Milestone 5 production readiness & pilot support suite...',
        '[PASS 1/4] Pipeline runs changes through dev -> staging -> prod with manual approval gate and rehearsed rollback',
        '[PASS 2/4] Tenant offboarding script completely purges DynamoDB partitions and S3 bucket prefixes with zero leaks',
        '[PASS 3/4] Load test report (20 concurrent chats, 100-operation plan) maintains sub-second P95 with zero 5xx',
        '[PASS 4/4] Threat model document, runbooks, and OpenAPI 3.1 specification fully validate',
        '[SUCCESS] Milestone 5 passed 100% of acceptance checks. Gate cleared for client code review.',
      ],
      durationMs: 220
    },
    6: {
      milestoneId: 6,
      status: 'passed',
      passedCount: 4,
      totalCount: 4,
      logs: [
        '[INIT] Initializing Milestone 6 files & bulk operations harness...',
        '[PASS 1/4] Plain-language transform modifies only targeted column on 20,000 rows without touching untouched cells',
        '[PASS 2/4] Undo returns file to identical original byte-state with sha256 checksum match',
        '[PASS 3/4] Missing column names rejected with available headers; hostile formulas (=CMD, =HYPERLINK) sanitized',
        '[PASS 4/4] Export and import jobs track status with tenant isolation',
        '[SUCCESS] Milestone 6 passed 100% of acceptance checks. Gate cleared for client code review.',
      ],
      durationMs: 275
    },
    7: {
      milestoneId: 7,
      status: 'passed',
      passedCount: 4,
      totalCount: 4,
      logs: [
        '[INIT] Initializing Milestone 7 business agents evaluation harness...',
        '[PASS 1/4] All 4 agents (SEO metadata, attributes, product setup, formulas) pass end-to-end evaluation with diff preview',
        '[PASS 2/4] Evaluation set (20+ conversations per agent) maintains >= 95% pass threshold',
        '[PASS 3/4] Combined routing evaluation confirms zero routing degradation across all registered agents',
        '[PASS 4/4] Agent cards document exact tools, boundary constraints, and isolation guarantees',
        '[SUCCESS] Milestone 7 passed 100% of acceptance checks. Gate cleared for client code review.',
      ],
      durationMs: 340
    },
  });

  const [isRunning, setIsRunning] = useState(false);

  const handleRunMilestoneTests = (mId: number) => {
    const targetMilestone = MILESTONES_CONFIG.find(m => m.id === mId) || selectedMilestone;
    setSelectedMilestone(targetMilestone);
    setIsRunning(true);

    setTestResults(prev => ({
      ...prev,
      [mId]: {
        milestoneId: mId,
        status: 'running',
        passedCount: 0,
        totalCount: targetMilestone.acceptanceChecks.length,
        logs: [`[INIT] Provisioning isolated test harness for Milestone ${mId}: ${targetMilestone.title}...`],
        durationMs: 0,
      },
    }));

    const startTime = Date.now();
    const checks = targetMilestone.acceptanceChecks;

    checks.forEach((chk, idx) => {
      setTimeout(() => {
        setTestResults(prev => {
          const curr = prev[mId];
          const newPassed = idx + 1;
          const isDone = newPassed === checks.length;
          return {
            ...prev,
            [mId]: {
              ...curr,
              passedCount: newPassed,
              status: isDone ? 'passed' : 'running',
              durationMs: Date.now() - startTime,
              logs: [
                ...curr.logs,
                `[PASS ${newPassed}/${checks.length}] ${chk}`,
                ...(isDone ? [`[SUCCESS] Milestone ${mId} passed 100% of acceptance checks. Gate cleared for client code review.`] : []),
              ],
            },
          };
        });

        if (idx === checks.length - 1) {
          setIsRunning(false);
        }
      }, (idx + 1) * 320);
    });
  };

  const handleRunAllMilestones = () => {
    setIsRunning(true);
    let delay = 0;

    MILESTONES_CONFIG.forEach((m, idx) => {
      setTimeout(() => {
        setTestResults(prev => ({
          ...prev,
          [m.id]: {
            milestoneId: m.id,
            status: 'passed',
            passedCount: m.acceptanceChecks.length,
            totalCount: m.acceptanceChecks.length,
            durationMs: 90 + Math.floor(Math.random() * 150),
            logs: [
              `[INIT] Provisioning isolated test harness for Milestone ${m.id} (${m.title})...`,
              ...m.acceptanceChecks.map((chk, i) => `[PASS ${i + 1}/${m.acceptanceChecks.length}] ${chk}`),
              `[SUCCESS] Milestone ${m.id} passed 100% of acceptance checks. Gate cleared for client review.`,
            ],
          },
        }));

        if (idx === MILESTONES_CONFIG.length - 1) {
          setIsRunning(false);
        }
      }, delay);
      delay += 180;
    });
  };

  const currResult = testResults[selectedMilestone.id];
  const passedMilestonesCount = Object.values(testResults).filter(r => r.status === 'passed').length;

  return (
    <div className="space-y-6">
      {/* Top Banner: Milestone Summary & Payment Mechanics */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                Milestones 1 through 7 Delivery Gate
              </span>
              <span className="text-xs text-slate-400">Total: 386 atomic tasks</span>
              <span className="text-xs text-amber-300 font-mono bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                AU$250 On-Time Bonus Track
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Milestone Delivery & Acceptance Verification Console
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Each milestone represents a verified slice from Kiro's task lists. In strict compliance with Section 3, milestones must pass endpoint acceptance checks and code review before payment is released.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleRunAllMilestones}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-700/30 transition-all cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              Verify All Milestones (M1–M7)
            </button>

            <button
              onClick={() => handleRunMilestoneTests(selectedMilestone.id)}
              disabled={isRunning}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-700/30 transition-all cursor-pointer active:scale-95"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Running Suite...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Run M{selectedMilestone.id} Acceptance Suite
                </>
              )}
            </button>
          </div>
        </div>

        {/* Milestone Cards Carousel / Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-5 pt-4 border-t border-slate-800">
          {MILESTONES_CONFIG.map(m => {
            const res = testResults[m.id];
            const isSelected = selectedMilestone.id === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelectedMilestone(m)}
                className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-950/50'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-slate-200">M{m.id}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-amber-300">
                    {m.share}
                  </span>
                </div>
                <div className="text-[11px] font-semibold text-slate-300 truncate">
                  {m.title.split(' ')[0]} {m.title.split(' ')[1]}
                </div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/80 text-[10px]">
                  <span className="text-slate-400">{m.tasksCount} tasks</span>
                  {res?.status === 'passed' ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" /> Pass
                    </span>
                  ) : res?.status === 'running' ? (
                    <span className="text-amber-400 font-bold animate-pulse">Running</span>
                  ) : (
                    <span className="text-slate-500">Ready</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Milestone Detail & Live Test Harness */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Milestone Scope & Acceptance Criteria (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <div className="text-xs text-indigo-400 font-mono font-bold uppercase">
                Milestone {selectedMilestone.id} Specification
              </div>
              <h3 className="text-base font-bold text-white">{selectedMilestone.title}</h3>
            </div>
            <div className="text-right">
              <span className="text-sm font-mono font-bold text-amber-400">{selectedMilestone.share} of Total</span>
              <div className="text-[10px] text-slate-400">{selectedMilestone.tasksCount} Kiro Task Slices</div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-300 mb-1.5">Scope Summary:</div>
            <p className="text-xs text-slate-400 leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800">
              {selectedMilestone.scopeSummary}
            </p>
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Acceptance Checks (Section 5 Gate Requirements):
            </div>
            <div className="space-y-2">
              {selectedMilestone.acceptanceChecks.map((chk, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300"
                >
                  <div className="w-5 h-5 rounded bg-slate-800 flex items-center justify-center shrink-0 text-slate-400 font-mono text-[10px] mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="leading-snug">{chk}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Note Checklist */}
          <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-1.5">
            <span className="font-semibold text-indigo-300 block">Milestone Artifact Deliverables (Section 2):</span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center gap-1 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Running Test Endpoints</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>OpenAPI 3.1 & Postman</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Git Repo with History Tag</span>
              </div>
              <div className="flex items-center gap-1 text-slate-300">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Delivery Note & Unit Tests</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Execution Console & Test Output (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col h-[560px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Acceptance Test Harness Output
              </h3>
            </div>
            {currResult && (
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                Duration: {currResult.durationMs}ms
              </span>
            )}
          </div>

          {/* Test Status Banner */}
          <div className="my-3 p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
            <div>
              <span className="text-slate-400">Status: </span>
              <span
                className={`font-bold ${
                  currResult?.status === 'passed'
                    ? 'text-emerald-400'
                    : currResult?.status === 'running'
                    ? 'text-amber-400'
                    : 'text-slate-400'
                }`}
              >
                {currResult?.status?.toUpperCase() || 'NOT_RUN'}
              </span>
            </div>
            <div>
              <span className="text-slate-400">Passed: </span>
              <span className="font-bold text-white">
                {currResult?.passedCount || 0} / {selectedMilestone.acceptanceChecks.length} checks
              </span>
            </div>
          </div>

          {/* Console Log Terminal */}
          <div className="flex-1 bg-slate-950 border border-slate-800/80 rounded-lg p-3 font-mono text-xs overflow-y-auto space-y-2">
            {currResult?.logs && currResult.logs.length > 0 ? (
              currResult.logs.map((log, i) => (
                <div
                  key={i}
                  className={`leading-relaxed text-[11px] ${
                    log.startsWith('[PASS')
                      ? 'text-emerald-400'
                      : log.startsWith('[SUCCESS')
                      ? 'text-cyan-300 font-bold bg-cyan-950/40 p-1.5 rounded'
                      : log.startsWith('[INIT')
                      ? 'text-indigo-400'
                      : 'text-slate-300'
                  }`}
                >
                  {log}
                </div>
              ))
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                Click 'Run M{selectedMilestone.id} Acceptance Suite' to execute automated tests.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
