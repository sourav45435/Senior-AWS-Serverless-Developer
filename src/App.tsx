import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { ProposalAnswersView } from './components/ProposalAnswersView';
import { BedrockAgentView } from './components/BedrockAgentView';
import { MilestoneRunnerView } from './components/MilestoneRunnerView';
import { TokenAuthorizerView } from './components/TokenAuthorizerView';
import { KiroWorkflowView } from './components/KiroWorkflowView';
import { ArchitectureView } from './components/ArchitectureView';
import { INITIAL_PRODUCTS, TENANT_PRODUCTS, INITIAL_TENANT_METRICS } from './data/mockData';
import { ERPProduct } from './engine/types';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('proposal');
  const [selectedTenantId, setSelectedTenantId] = useState('tenant-alpha');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  
  // Per-tenant products state ensuring strict boundary isolation
  const [tenantProducts, setTenantProducts] = useState<Record<string, ERPProduct[]>>(TENANT_PRODUCTS);
  
  // Per-tenant credit and spend metrics
  const [tenantMetrics, setTenantMetrics] = useState(INITIAL_TENANT_METRICS);

  const currentMetrics = tenantMetrics[selectedTenantId] || {
    creditBalance: 0,
    tokensUsed: 0,
    dailyCap: 10000,
    isKillSwitch: true,
  };

  const currentProducts = tenantProducts[selectedTenantId] || [];

  const handleToggleKillSwitch = () => {
    setTenantMetrics(prev => ({
      ...prev,
      [selectedTenantId]: {
        ...prev[selectedTenantId],
        isKillSwitch: !prev[selectedTenantId]?.isKillSwitch,
      },
    }));
  };

  const handleDeductCredits = (tokens: number, costAud: number) => {
    const metrics = tenantMetrics[selectedTenantId];
    if (!metrics || metrics.isKillSwitch) return false;
    if (metrics.tokensUsed + tokens > metrics.dailyCap) return false;

    setTenantMetrics(prev => ({
      ...prev,
      [selectedTenantId]: {
        ...metrics,
        tokensUsed: metrics.tokensUsed + tokens,
        creditBalance: Math.max(0, Number((metrics.creditBalance - costAud).toFixed(4))),
      },
    }));
    return true;
  };

  const handleUpdateTenantProducts = (updater: React.SetStateAction<ERPProduct[]>) => {
    setTenantProducts(prev => {
      const currentList = prev[selectedTenantId] || [];
      const updatedList = typeof updater === 'function' ? updater(currentList) : updater;
      return {
        ...prev,
        [selectedTenantId]: updatedList,
      };
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation & Multi-Tenant Context Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedTenantId={selectedTenantId}
        setSelectedTenantId={setSelectedTenantId}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        creditBalance={currentMetrics.creditBalance}
        tokensUsed={currentMetrics.tokensUsed}
        dailyCap={currentMetrics.dailyCap}
        isKillSwitch={currentMetrics.isKillSwitch}
        onToggleKillSwitch={handleToggleKillSwitch}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'proposal' && <ProposalAnswersView />}
        {activeTab === 'bedrock_agent' && (
          <BedrockAgentView
            products={currentProducts}
            setProducts={handleUpdateTenantProducts}
            selectedTenantId={selectedTenantId}
            selectedRole={selectedRole}
            isKillSwitch={currentMetrics.isKillSwitch}
            onDeductCredits={handleDeductCredits}
          />
        )}
        {activeTab === 'acceptance_matrix' && <MilestoneRunnerView />}
        {activeTab === 'token_authorizer' && <TokenAuthorizerView />}
        {activeTab === 'kiro_workflow' && <KiroWorkflowView />}
        {activeTab === 'architecture' && <ArchitectureView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Serverless AI Agent Platform for SaaS ERP • AWS Lambda, TypeScript & Amazon Bedrock</span>
          <span className="font-mono text-[11px] text-slate-400">Milestones 1–7 Delivery Track • Kiro Spec Framework</span>
        </div>
      </footer>
    </div>
  );
}
