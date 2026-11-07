import React, { useState } from 'react';
import { Layers, FileCode, GitCommit, CheckSquare, Terminal, Shield, BookOpen } from 'lucide-react';

export const KiroWorkflowView: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<'steering' | 'requirements' | 'design' | 'tasks'>('steering');

  const steeringContent = `---
# Kiro Steering Directives: .kiro/rules & .kiro/steering.md
project: serverless-erp-ai-platform
architecture: aws-serverless-bedrock
language: typescript-strict
testing: test-driven-zero-trust
---

### 1. Architecture & Security Invariants
- ZERO direct database write tools exposed to Bedrock models. All state changes MUST be proposed via 2-phase Execution Plans with diff previews and explicit human cryptographic approval.
- Pure domain logic MUST be completely decoupled from AWS SDKs (DynamoDB, SQS, Bedrock) to enable deterministic unit testing under 500ms.
- Tenant context is DERIVED EXCLUSIVELY from verified JWT claims. Never trust or parse X-Tenant-ID headers.
- Multi-tenant DynamoDB schema uses Partition Key PK = TENANT#<tenant_id>. Fine-grained IAM conditions MUST enforce dynamodb:LeadingKeys.

### 2. Implementation Rules for Kiro Slices
- Keep modules clean and small (< 120 lines per file).
- No implicit 'any' types. Use strict Zod / TypeBox schemas at API Gateway boundaries.
- Error handling: Use functional Result<T, E> types. Avoid unhandled promise rejections.
- Sensitive data: Access logs MUST redact authorization tokens, PII, and ERP connection secrets.

### 3. Verification Directives
- Every generated task slice MUST be preceded or accompanied by a passing node:test file.
- Gated pipeline: Lint -> Typecheck (tsc --noEmit) -> Unit Tests -> Secret Scan (gitleaks) -> Tagged Commit.
`;

  const requirementsContent = `# Requirements Specification (requirements.md)
# Format: RFC 2119 Invariants

## REQ-01: Tenant Authentication & Isolation
- REQ-01.1: The system MUST reject any request lacking a valid JWT with HTTP 401 Unauthorized, except for the GET /health probe.
- REQ-01.2: The system MUST evaluate tenant status upon every request and MUST reject disabled or suspended tenants with HTTP 403 Forbidden.
- REQ-01.3: The system MUST NOT permit one tenant to read or mutate another tenant's records, even when identifiers are explicitly provided in request bodies or query parameters.

## REQ-02: Safe Bedrock AI Execution
- REQ-02.1: The AI agent MUST possess only read-only query tools when interacting with ERP data.
- REQ-02.2: Proposed database changes MUST be compiled into an Execution Plan containing before/after diffs, an expiration timestamp, and a SHA-256 cryptographic digest.
- REQ-02.3: An Execution Plan MUST NOT execute without explicit approval by an authenticated user holding the 'admin' or 'editor' role.
- REQ-02.4: The execution engine MUST verify optimistic concurrency ETags before committing changes. If the target product was modified during preview, the plan MUST safely abort with HTTP 409 Conflict.

## REQ-03: Spend Controls & Runaway Protection
- REQ-03.1: The system MUST enforce a daily token ceiling per tenant.
- REQ-03.2: An emergency kill switch MUST immediately halt all ongoing and new AI invocations.
- REQ-03.3: Runaway agent loops MUST be halted after 8 steps or 15 seconds.
`;

  const designContent = `# Architecture & Design Specification (design.md)

## 1. DynamoDB Single-Table Schema
- Table Name: \`erp-platform-\${stage}\`
- Partition Key (PK): String (\`TENANT#<tenant_id>\`)
- Sort Key (SK): String (\`METADATA\` | \`CONV#<id>\` | \`MSG#<id>\` | \`PLAN#<id>\` | \`AUDIT#<id>\`)
- Global Secondary Indexes:
  - GSI1: PK = \`USER#<user_id>\`, SK = \`CREATED_AT#<timestamp>\` (User conversation history)
  - GSI2: PK = \`STATUS#<status>\`, SK = \`EXPIRES_AT#<timestamp>\` (Pending plan TTL reaper)

## 2. Bedrock Converse Tool Protocol
- Models: \`anthropic.claude-3-5-sonnet-20241022-v2:0\` (strictly allow-listed in ap-southeast-2 and us-east-1).
- Outbound Tool Defs:
  - \`erp_read_products(category?, sku?, search?)\` -> returns ReadProductDto[]
  - \`erp_calculate_pricing_diff(sku, newPrice, currency)\` -> returns PriceDiffDto
  - \`erp_propose_execution_plan(operations[])\` -> returns ExecutionPlanDto (Status: PENDING_APPROVAL)

## 3. Cryptographic Plan Binding
- Digest Formula: \`SHA256(tenant_id + user_id + JSON(operations) + expires_at + salt)\`
- Approver Signature: Checked against KMS / HMAC signing secret.
`;

  const tasksContent = `# Task Lists (tasks.md) - Milestone 1 & 2 Breakdown

## Phase 1: Authentication & Tenant Foundation (72 Tasks)
- [x] Task 1.1: Initialize Serverless Framework v4 project skeleton & tsconfig.json.
- [x] Task 1.2: Implement evaluateLambdaAuthorizer pure logic in src/engine/authorizer.ts.
- [x] Task 1.3: Add unit tests for 6 token failure modes in src/engine/engine.test.ts.
- [x] Task 1.4: Configure API Gateway REST API with AWS WAF Regional WebACL.
- [x] Task 1.5: Implement tenant provisioning script with DynamoDB seed fixtures.
- [x] Task 1.6: Setup token-minting CLI utility and OpenAPI 3.1 specification.
- [x] Task 1.7: Milestone 1 Acceptance verification gate.

## Phase 2: AI Core & Safe Execution Engine (115 Tasks)
- [x] Task 2.1: Bedrock client integration with Claude 3.5 Sonnet allow-list.
- [x] Task 2.2: Implement CreditManager with daily token cap and emergency kill switch.
- [x] Task 2.3: Implement SQS FIFO queue with idempotent consumer deduping.
- [x] Task 2.4: Implement 2-phase Execution Plan generator and cryptographic hashing.
- [x] Task 2.5: Implement optimistic concurrency ETag conflict checker.
- [x] Task 2.6: Malware scanning integration for CSV/XLSX file uploads (EICAR check).
- [x] Task 2.7: Milestone 2 Acceptance verification gate.
`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold">
            Kiro Spec Lifecycle
          </span>
          <span className="text-xs text-slate-400">Steering • Requirements • Design • Tasks</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Kiro Specification & Steering Files Inspector
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          Demonstrating true mastery of Kiro: You do not design from scratch or trust AI output blindly. You establish strict steering guardrails, decompose requirements into atomic tasks, and enforce test-driven validation on every slice.
        </p>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-4 pt-3 border-t border-slate-800">
          <button
            onClick={() => setSelectedDoc('steering')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              selectedDoc === 'steering'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            .kiro/steering.md
          </button>
          <button
            onClick={() => setSelectedDoc('requirements')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              selectedDoc === 'requirements'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            requirements.md
          </button>
          <button
            onClick={() => setSelectedDoc('design')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              selectedDoc === 'design'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            design.md
          </button>
          <button
            onClick={() => setSelectedDoc('tasks')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
              selectedDoc === 'tasks'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            tasks.md
          </button>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 font-mono text-xs text-cyan-400">
            <FileCode className="w-4 h-4" />
            <span>spec-pack/{selectedDoc === 'steering' ? '.kiro/steering.md' : `${selectedDoc}.md`}</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Markdown Spec Document
          </span>
        </div>

        <div className="mt-3 p-4 bg-slate-950 rounded-lg border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[550px] overflow-y-auto">
          <pre className="whitespace-pre-wrap">
            {selectedDoc === 'steering' && steeringContent}
            {selectedDoc === 'requirements' && requirementsContent}
            {selectedDoc === 'design' && designContent}
            {selectedDoc === 'tasks' && tasksContent}
          </pre>
        </div>
      </div>
    </div>
  );
};
