import React from 'react';
import { Server, Database, Shield, Zap, Lock, Cloud, Terminal, CheckCircle2, ArrowRight } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            AWS Serverless Architecture
          </span>
          <span className="text-xs text-slate-400">Serverless Framework v4 • Amazon Bedrock</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          End-to-End AWS Serverless & Multi-Tenant Blueprint
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          High-performance, least-privilege architecture engineered for zero cross-tenant data leakage, resilient event-driven background processing with SQS FIFO, and strict Bedrock spending safeguards.
        </p>
      </div>

      {/* Interactive Topology Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <Cloud className="w-4 h-4 text-indigo-400" />
          Request Lifecycle & Security Boundary Flow
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs font-mono">
          {/* Step 1: Client & WAF */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-indigo-400 font-bold mb-1">1. INGRESS</div>
              <div className="font-bold text-white mb-2">API Gateway + WAF</div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                AWS WAF CommonRuleSet, rate limiting, and CORS origin check per tenant configuration.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
              ap-southeast-2 (Sydney)
            </div>
          </div>

          {/* Step 2: Custom Authorizer */}
          <div className="p-4 bg-slate-950 rounded-xl border border-indigo-500/40 flex flex-col justify-between shadow-indigo-950/40 shadow-lg">
            <div>
              <div className="text-[10px] text-amber-400 font-bold mb-1">2. AUTHENTICATION</div>
              <div className="font-bold text-white mb-2">Lambda Authorizer</div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Verifies JWT signature, tenant active status, and injects verified tenant context. Header spoofing blocked.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400">
              300s IAM Policy Cache
            </div>
          </div>

          {/* Step 3: Bedrock & Credits */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-cyan-400 font-bold mb-1">3. AI REASONING</div>
              <div className="font-bold text-white mb-2">Amazon Bedrock</div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Claude 3.5 Sonnet. Read-only tool framework. Daily token cap and kill-switch reservation guards.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
              Zero Direct Writes
            </div>
          </div>

          {/* Step 4: SQS & Safe Write Plan */}
          <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/40 flex flex-col justify-between shadow-emerald-950/40 shadow-lg">
            <div>
              <div className="text-[10px] text-emerald-400 font-bold mb-1">4. SAFE 2-PHASE WRITE</div>
              <div className="font-bold text-white mb-2">Plan Execution Gate</div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Cryptographic approval digest verified. Optimistic concurrency ETag check prevents mid-flight race conditions.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400">
              Human-In-The-Loop
            </div>
          </div>

          {/* Step 5: DynamoDB & EventBridge */}
          <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-[10px] text-rose-400 font-bold mb-1">5. PERSISTENCE & AUDIT</div>
              <div className="font-bold text-white mb-2">DynamoDB & S3</div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Single-table design with PK = TENANT#id. S3 bucket with ClamAV scan. EventBridge audit bus.
              </p>
            </div>
            <div className="mt-4 pt-2 border-t border-slate-800/80 text-[10px] text-slate-500">
              Audit Immutability
            </div>
          </div>
        </div>
      </div>

      {/* Deep Dive Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase font-mono">
            <Lock className="w-4 h-4" />
            Least-Privilege IAM & Isolation
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every Lambda execution role is scoped to the exact actions required. For DynamoDB, IAM policy condition keys restrict reads and writes via:
          </p>
          <pre className="p-2.5 bg-slate-950 rounded border border-slate-800 text-[11px] font-mono text-amber-300">
{`"Condition": {
  "ForAllValues:StringEquals": {
    "dynamodb:LeadingKeys": [
      "TENANT#\${context.tenantId}"
    ]
  }
}`}
          </pre>
          <p className="text-[11px] text-slate-400">
            This provides defense-in-depth: even if an application bug omitted a tenant filter, the AWS IAM layer forcibly denies cross-tenant queries.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase font-mono">
            <Zap className="w-4 h-4" />
            SQS FIFO Idempotency
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Asynchronous agent jobs and credit events are ingested through SQS FIFO queues configured with:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong className="text-slate-200">MessageGroupId:</strong> Set to <code className="text-amber-300">tenant_id</code> to guarantee strictly ordered per-tenant processing.</li>
            <li><strong className="text-slate-200">Deduplication:</strong> SHA-256 hash of <code className="text-amber-300">tenant + payload + idempotency_key</code>.</li>
            <li><strong className="text-slate-200">Dead-Letter Queue:</strong> Redrive policy with maxReceiveCount = 3 before routing to DLQ with CloudWatch alarms.</li>
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase font-mono">
            <Shield className="w-4 h-4" />
            CI/CD Pipeline with AWS OIDC
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            GitHub Actions workflows utilize short-lived OpenID Connect (OIDC) federated tokens to assume deployment roles in AWS:
          </p>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong className="text-slate-200">Zero Long-Lived Secrets:</strong> No AWS access keys stored in GitHub repository settings.</li>
            <li><strong className="text-slate-200">Gated Promotion:</strong> Dev -&gt; Ephemeral Test -&gt; Staging -&gt; Manual Approval Gate -&gt; Production Canary.</li>
            <li><strong className="text-slate-200">Automated Rollback:</strong> Triggered on CloudWatch 5xx alarm or synthetic health failure.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
