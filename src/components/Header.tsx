import React from 'react';
import { Shield, Cpu, Key, CheckCircle2, FileText, Layers, AlertOctagon, Terminal } from 'lucide-react';

export type ActiveTab = 'proposal' | 'bedrock_agent' | 'acceptance_matrix' | 'token_authorizer' | 'kiro_workflow' | 'architecture';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedTenantId: string;
  setSelectedTenantId: (id: string) => void;
  selectedRole: 'admin' | 'editor' | 'viewer';
  setSelectedRole: (role: 'admin' | 'editor' | 'viewer') => void;
  creditBalance: number;
  tokensUsed: number;
  dailyCap: number;
  isKillSwitch: boolean;
  onToggleKillSwitch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedTenantId,
  setSelectedTenantId,
  selectedRole,
  setSelectedRole,
  creditBalance,
  tokensUsed,
  dailyCap,
  isKillSwitch,
  onToggleKillSwitch,
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg">
      {/* Top Banner: Status & Context */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            AWS ap-southeast-2 (Sydney)
          </div>
          <div className="hidden sm:flex items-center gap-1 text-slate-400">
            <span>Runtime:</span>
            <span className="text-slate-200 font-mono">Node.js 20 • TypeScript • Bedrock Claude 3.5 Sonnet</span>
          </div>
        </div>

        {/* Multi-tenant Context Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Active Tenant:</span>
            <select
              aria-label="Active Tenant"
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              className="bg-transparent text-indigo-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="tenant-alpha" className="bg-slate-800 text-slate-100">Apex Manufacturing (Enterprise)</option>
              <option value="tenant-beta" className="bg-slate-800 text-slate-100">BlueWave Logistics (Growth)</option>
              <option value="tenant-gamma-disabled" className="bg-slate-800 text-slate-100">Gamma Tech (Suspended)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded border border-slate-700">
            <span className="text-slate-400">Role:</span>
            <select
              aria-label="User Role"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'editor' | 'viewer')}
              className="bg-transparent text-amber-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="admin" className="bg-slate-800 text-slate-100">Admin (Full Write/Approve)</option>
              <option value="editor" className="bg-slate-800 text-slate-100">Editor (Approve Plan)</option>
              <option value="viewer" className="bg-slate-800 text-slate-100">Viewer (Read-Only)</option>
            </select>
          </div>

          {/* Kill Switch Toggle */}
          <button
            type="button"
            onClick={onToggleKillSwitch}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
              isKillSwitch
                ? 'bg-rose-600 text-white shadow-rose-900/50 shadow-md ring-1 ring-rose-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title="Emergency spend kill switch for current tenant"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            {isKillSwitch ? 'KILL SWITCH ACTIVE' : 'Kill Switch: Normal'}
          </button>
        </div>
      </div>

      {/* Main Header & Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-amber-500 via-orange-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Serverless ERP AI Agent Platform
                <span className="text-[11px] font-normal uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                  Bedrock & Kiro
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Safe 2-Phase Preview & Approval • Strict Tenant Isolation • Milestones 1–7 Delivery
              </p>
            </div>
          </div>
        </div>

        {/* Spend & Token Guard Gauge */}
        <div className="flex items-center gap-4 bg-slate-950/70 px-3.5 py-2 rounded-lg border border-slate-800 text-xs">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Credit Balance</div>
            <div className="font-mono font-semibold text-emerald-400 text-sm">
              AU${creditBalance.toFixed(2)}
            </div>
          </div>
          <div className="w-px h-6 bg-slate-800" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Daily Token Cap</div>
            <div className="font-mono text-slate-300">
              <span className="text-amber-400 font-semibold">{tokensUsed.toLocaleString()}</span> / {dailyCap.toLocaleString()}
            </div>
          </div>
          <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                tokensUsed / dailyCap > 0.8 ? 'bg-rose-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${Math.min(100, (tokensUsed / dailyCap) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex overflow-x-auto gap-1 border-t border-slate-800/80 scrollbar-thin">
        <button
          onClick={() => setActiveTab('proposal')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'proposal'
              ? 'border-amber-400 text-amber-300 bg-amber-400/10 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Application & Dossier
        </button>

        <button
          onClick={() => setActiveTab('bedrock_agent')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'bedrock_agent'
              ? 'border-indigo-400 text-indigo-300 bg-indigo-400/10 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Live Bedrock Agent
        </button>

        <button
          onClick={() => setActiveTab('acceptance_matrix')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'acceptance_matrix'
              ? 'border-emerald-400 text-emerald-300 bg-emerald-400/10 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Milestones 1–7 Verifier
        </button>

        <button
          onClick={() => setActiveTab('token_authorizer')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'token_authorizer'
              ? 'border-purple-400 text-purple-300 bg-purple-400/10 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          Token Authorizer Lab
        </button>

        <button
          onClick={() => setActiveTab('kiro_workflow')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'kiro_workflow'
              ? 'border-cyan-400 text-cyan-300 bg-cyan-400/10 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          Kiro Spec Framework
        </button>

        <button
          onClick={() => setActiveTab('architecture')}
          className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'architecture'
              ? 'border-rose-400 text-rose-300 bg-rose-400/10 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Architecture Blueprint
        </button>
      </div>
    </header>
  );
};
