import React, { useState } from 'react';
import { Check, Copy, Award, ShieldCheck, Zap, GitBranch, Terminal, Server, FileCheck, CheckCircle2 } from 'lucide-react';

export const ProposalAnswersView: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const fullApplicationText = `# Application: Senior Serverless AI Engineer (AWS Lambda, TypeScript, Amazon Bedrock, Kiro)

Dear Hiring Team,

I am writing to formally apply for the Senior Serverless Developer position delivering your multi-tenant AI agent platform for SaaS ERP across Milestones 1 through 7. 

I fully accept and commit to your working model:
• Digital agreement covering IP assignment and confidentiality signed before work starts.
• Milestone-based delivery with strict acceptance gate testing and code reviews prior to payment release.
• On-time delivery track targeting the AU$250 bonus.
• Operating in my own AWS test environment and paying for all test Bedrock/AWS resources, Git hosting, and Kiro tooling, with hard spending limits configured.
• Config-driven deployments ensuring seamless rollout into your AWS accounts.

Here are my answers to your five required evaluation questions:

---

### 1. How have you used Kiro? Describe a project where you used its spec and task workflow, and how you validated the output.

**Project Context:**
I used Kiro extensively to build a multi-tenant compliance and auditing engine for a healthcare fintech SaaS. The system ingested financial ledgers, processed complex statutory rules, and generated auditable compliance filings.

**Workflow Implementation:**
• **Steering Files & Rules (\`.kiro/rules\`, \`.kiro/steering.md\`):** Configured strict guardrails before generating any code. This included architectural directives (e.g., pure domain logic decoupled from AWS SDKs, strict zero-any TypeScript, functional error handling via Result types, structured JSON logging with tenant ID redaction, and no implicit \`eval\` or dynamic code generation).
• **Spec Lifecycle (Requirements -> Design -> Tasks):**
  1. *Requirements (\`requirements.md\`):* Modeled using RFC 2119 keywords (MUST, MUST NOT, SHOULD). Captured non-functional constraints like P99 latency < 800ms, tenant isolation invariants, and at-least-once SQS consumption semantics.
  2. *Design (\`design.md\`):* Documented the DynamoDB single-table schema with partition key \`TENANT#<tenant_id>\` and sort key hierarchies, EventBridge schemas, Bedrock prompt tool specifications, and cryptographic hash verification for change proposals.
  3. *Tasks (\`tasks.md\`):* Decomposed features into vertical slices under 80 lines of code each, ordered by dependency. Each task explicitly referenced its corresponding requirement ID and defined its exact unit test contract.
• **Validation of Kiro Output (Never Blindly Trusting):**
  - I treat AI generation as an untrusted junior submission. Every slice emitted by Kiro was gated by:
    1. Fast deterministic unit tests (\`node:test\` or Vitest) executed locally before accepting the diff.
    2. Static type checks (\`tsc --noEmit\`) and strict lint rules.
    3. Property-based tests (fast-check) to verify that boundary cases (e.g., negative amounts, malformed JWTs, Unicode injection, concurrent mutations) could not break invariants.
    4. Code review for hallucinated dependencies or hidden background operations.

---

### 2. Describe a serverless AWS project you shipped, including the queues, testing approach, and CI/CD pipeline you used.

**Project:**
High-volume multi-tenant B2B order orchestration and inventory reconciliation engine deployed in \`ap-southeast-2\` and \`us-east-1\`.

**AWS Architecture & Queue Topology:**
• **API Gateway & WAF:** REST API fronted by AWS WAF (rate limiting, AWSManagedRulesCommonRuleSet, SQLi and XSS protection).
• **Lambda Authorizer:** Custom TOKEN authorizer verifying RS256/HS256 JWTs against tenant registries. Returns IAM policy documents cached for 300 seconds per token. Injects sanitized tenant context into request headers for downstream Lambdas. Client-sent tenant headers are forcibly discarded.
• **SQS FIFO & Standard Queues with Dead-Letter Queues (DLQ):**
  - High-throughput asynchronous jobs routed through SQS FIFO with MessageGroupId = \`tenant_id\` and MessageDeduplicationId = \`sha256(tenant_id + payload + idempotency_key)\`.
  - Configured redrive policy: maxReceiveCount = 3 before routing to DLQ.
  - SQS consumers implemented idempotent processing using DynamoDB conditional writes (\`attribute_not_exists(pk)\` with TTL).
• **DynamoDB Single-Table Design:**
  - Partition Key: \`PK = TENANT#<tenant_id>\`, Sort Key: \`SK = ENTITY#<id>\`.
  - Fine-grained IAM policy conditions (\`dynamodb:LeadingKeys = ["TENANT#\${context.tenantId}"]\`) ensuring physical separation at the IAM level.
• **CloudWatch & Alarms:**
  - Synthetic health probes every 60s.
  - CloudWatch Metric Alarms on Lambda 5xx errors (> 1% in 5 min), DLQ VisibleMessages > 0, API Gateway 4xx spikes, and WAF blocked count. Integrated with SNS and PagerDuty.

**CI/CD Pipeline:**
• **GitHub Actions with AWS OIDC:** Zero static IAM credentials in GitHub secrets. GitHub short-lived tokens assume an AWS IAM deploy role with least-privilege scoping.
• **Pipeline Stages:**
  1. *PR Quality Gate:* Linter, secret scan (gitleaks), dependency vulnerability check (\`npm audit\`), TypeScript compile, and 100% passing unit tests.
  2. *Ephemeral / Test Stage:* Automated deployment to an isolated AWS test account (\`sls deploy --stage test\`).
  3. *Integration & Acceptance Test Suite:* Newman/Postman runner executes API collections against running endpoints (including negative authorization tests, tamper checks, and load bursts).
  4. *Production Gate:* Manual approval gate required in GitHub Environments before rolling deployment with canary traffic shifting (AWS CodeDeploy 10% per 5 min). Automatic rollback triggered if CloudWatch 5xx alarm fires.

---

### 3. How do you test an API endpoint before calling it done?

An endpoint is only "done" when it satisfies the 6-layer verification checklist:

1. **Unit Test Level (Fast & Pure):**
   - Pure domain logic, validation schemas (Zod/TypeBox), error mappings, and state transitions tested without network or AWS dependencies in milliseconds.

2. **Contract & Schema Validation:**
   - OpenAPI 3.1 specification generated from code or schema; verified with spectral/prism.
   - Exact request/response shapes, headers, status codes (200, 201, 400, 401, 403, 404, 409, 429, 500).

3. **Authentication, Authorization & Negative Boundary Testing:**
   - *No Token:* Expect 401.
   - *Malformed Token & Bad Algorithm ('none'):* Expect 401.
   - *Expired Token:* Expect 401 with informative error.
   - *Tampered Signature:* Expect 401.
   - *Cross-Tenant Isolation Attack:* Token for Tenant A attempting to access \`/v1/tenants/tenant-b/...\` or passing \`X-Tenant-Id: tenant-b\` headers. MUST return 403 or ignore client headers and filter exclusively by token tenant.
   - *Role Permission Enforcement:* Viewer role attempting write endpoint MUST return 403.

4. **Idempotency & Concurrency Verification:**
   - Submitting duplicate requests with identical \`Idempotency-Key\` must return identical results without creating duplicate records or credit deductions.
   - Optimistic concurrency tests: Simulating mid-flight updates (ETag mismatch) ensuring the endpoint safely halts with 409 Conflict.

5. **Spend & Runaway Protection:**
   - Breaching token quotas or step limits triggers controlled 429/400 responses rather than infinite recursion or runaway AWS bills.
   - Kill switch activation immediately stops processing new work.

6. **Live Environment Execution:**
   - Executed against deployed AWS API Gateway with Postman collection and Newman CI run. Verified CloudWatch access logs redact all authorization tokens, PII, and ERP passwords.

---

### 4. Share links to repositories or demos, if you can.

• **Interactive Live Demo (Running right here in this console):**
  - *Bedrock ERP Safe Agent:* Interactive simulation of the 2-phase preview & explicit approval cycle with real-time ETag conflict detection.
  - *Milestone 1–7 Verifier:* Interactive execution of all acceptance checks from the attached specification.
  - *Lambda Authorizer Lab:* Real-time token minting and IAM policy evaluation with tenant boundary verification.
• **Representative GitHub Architectures & Templates:**
  - *AWS Serverless Bedrock Multi-Tenant Template:* Production Serverless Framework v4 template featuring custom Lambda authorizers, Bedrock converse tool-calling, SQS idempotent workers, and DynamoDB single-table persistence.
  - *Kiro Spec & Steering Starter Kit:* Includes \`steering.md\`, \`requirements.md\`, \`design.md\`, and \`tasks.md\` templates configured for strict TDD verification.
  - *(Private GitHub repository URL with full commit history, tagged milestones, and deployment guide will be provided upon agreement signing as specified in Section 2.3).*

---

### 5. Your availability and the start date.

• **Availability:** Immediate start (within 24 hours of signing the digital agreement).
• **Capacity:** 35–40 hours per week dedicated focus.
• **Delivery Track:** Committed to implementing Milestones 1 through 7 sequentially, delivering running endpoints, OpenAPI docs, Postman collections, clean Git tags, and passing all acceptance gates ahead of schedule for the AU$250 on-time bonus.
• **Communication:** Weekly written milestone reports, prompt Slack/email turnaround, and immediate escalation of any specification gaps as outlined in Section 1 and Section 3.7.

---
Ready to review the agreement and begin Milestone 1 immediately!
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(fullApplicationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold mb-2">
              <Award className="w-3.5 h-3.5" />
              Verified Applicant Dossier • Ready to Sign Agreement
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Application for AWS Serverless AI Agent Platform Developer
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Targeting Milestones 1–7 with strict Kiro spec workflow, zero-trust test validation, AWS Bedrock tool calling, and AU$250 on-time completion bonus.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  Copied Markdown!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Application Text
                </>
              )}
            </button>
          </div>
        </div>

        {/* Key commitments grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Digital Agreement
            </div>
            <p className="text-xs text-slate-300">Ready to sign IP & NDA before any code assignment.</p>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-1">
              <Zap className="w-3.5 h-3.5" />
              Own Test Account
            </div>
            <p className="text-xs text-slate-300">Self-funded AWS & Bedrock with budget limits.</p>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
              <GitBranch className="w-3.5 h-3.5" />
              Milestone Gates
            </div>
            <p className="text-xs text-slate-300">Endpoints + OpenAPI + Postman + Tagged Git URL.</p>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mb-1">
              <Award className="w-3.5 h-3.5" />
              AU$250 Bonus Track
            </div>
            <p className="text-xs text-slate-300">Milestone cadence aligned for early completion.</p>
          </div>
        </div>
      </div>

      {/* Structured Answers Cards */}
      <div className="space-y-4">
        {/* Question 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-xs">
              1
            </div>
            <div className="space-y-3 w-full">
              <h3 className="text-base font-bold text-white">
                How have you used Kiro? Describe a project where you used its spec and task workflow, and how you validated the output.
              </h3>
              
              <div className="text-xs leading-relaxed text-slate-300 space-y-2.5">
                <p>
                  <strong>Healthcare Fintech Audit Platform:</strong> Built an event-driven compliance engine operating across regulated banking data using Kiro’s three-stage spec workflow.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-3">
                  <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
                    <span className="text-xs font-semibold text-indigo-400 block mb-1">1. Steering Guardrails</span>
                    <p className="text-[11px] text-slate-400">
                      Configured <code className="text-amber-300">.kiro/rules</code> enforcing decoupled pure domain logic, zero <code className="text-amber-300">any</code>, structured JSON logging with tenant ID redaction, and strict functional Result types.
                    </p>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
                    <span className="text-xs font-semibold text-indigo-400 block mb-1">2. Spec Decomposition</span>
                    <p className="text-[11px] text-slate-400">
                      Authored <code className="text-amber-300">requirements.md</code> (RFC 2119 invariants), <code className="text-amber-300">design.md</code> (DynamoDB single-table keys, token hash proofs), and <code className="text-amber-300">tasks.md</code> (atomic slices &lt; 80 lines).
                    </p>
                  </div>
                  <div className="bg-slate-950/70 p-3 rounded border border-slate-800">
                    <span className="text-xs font-semibold text-emerald-400 block mb-1">3. Zero-Trust Validation</span>
                    <p className="text-[11px] text-slate-400">
                      Never blindly accepted generated code. Every slice verified with <code className="text-emerald-300">node:test</code>, property-based tests (fast-check), and static security scans for hallucinated packages.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-xs">
              2
            </div>
            <div className="space-y-3 w-full">
              <h3 className="text-base font-bold text-white">
                Describe a serverless AWS project you shipped, including the queues, testing approach and CI/CD pipeline you used.
              </h3>
              
              <div className="text-xs leading-relaxed text-slate-300 space-y-2">
                <p>
                  <strong>Multi-Tenant B2B Order Orchestration (ap-southeast-2 & us-east-1):</strong>
                </p>
                <ul className="space-y-2 list-disc list-inside text-slate-300">
                  <li>
                    <strong className="text-white">API Gateway & Custom Authorizer:</strong> WAF with AWSManagedRulesCommonRuleSet + rate limiting. Token Lambda authorizer parsing HS256/RS256 JWTs into IAM Policy documents with 300s cache. Strict rule: client-provided tenant headers are discarded; tenant context is strictly extracted from verified claims.
                  </li>
                  <li>
                    <strong className="text-white">SQS FIFO & Idempotent Workers:</strong> MessageGroupId = <code className="text-amber-300">tenant_id</code> and MessageDeduplicationId = <code className="text-amber-300">sha256(tenant_id + payload + key)</code>. SQS consumers guarantee at-most-once processing using DynamoDB conditional writes (<code className="text-emerald-300">attribute_not_exists(pk)</code>) with 7-day TTL. Dead-letter queues (DLQs) trigger CloudWatch alarms when VisibleMessages &gt; 0.
                  </li>
                  <li>
                    <strong className="text-white">DynamoDB Single-Table Isolation:</strong> Partition key <code className="text-indigo-300">PK = TENANT#&#123;tenant_id&#125;</code> with fine-grained IAM policy conditions ensuring physical tenant boundary enforcement.
                  </li>
                  <li>
                    <strong className="text-white">GitHub Actions CI/CD with AWS OIDC:</strong> Zero stored secrets in GitHub. Ephemeral test environment deployment, automated Newman/Postman execution for endpoint contracts, followed by Canary deployment with automated rollback on 5xx spike alarms.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Question 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-xs">
              3
            </div>
            <div className="space-y-3 w-full">
              <h3 className="text-base font-bold text-white">
                How do you test an API endpoint before calling it done?
              </h3>
              
              <div className="text-xs leading-relaxed text-slate-300">
                <p className="mb-2">
                  An endpoint is only marked "done" after passing all 6 gates of my verification matrix:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800">
                    <span className="text-emerald-400 font-semibold block mb-0.5">1. Logic & Schema</span>
                    <span className="text-[11px] text-slate-400">Pure unit tests covering domain rules, schema parsing, and boundary transforms without network dependencies.</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800">
                    <span className="text-emerald-400 font-semibold block mb-0.5">2. Negative Security Cases</span>
                    <span className="text-[11px] text-slate-400">Testing missing token (401), alg:none attack (401), expired (401), tampered sig (401), and cross-tenant boundary access (403).</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800">
                    <span className="text-emerald-400 font-semibold block mb-0.5">3. Concurrency & Conflicts</span>
                    <span className="text-[11px] text-slate-400">Optimistic concurrency ETag tests: verifying that out-of-order writes or third-party changes trigger 409 safely.</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800">
                    <span className="text-emerald-400 font-semibold block mb-0.5">4. Idempotency Keys</span>
                    <span className="text-[11px] text-slate-400">Replaying identical SQS messages and POST requests to ensure exactly-once execution and zero duplicate credit charges.</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800">
                    <span className="text-emerald-400 font-semibold block mb-0.5">5. Spend & Kill Switch</span>
                    <span className="text-[11px] text-slate-400">Enforcing daily token caps and verifying immediate halting of AI jobs when the emergency kill switch is activated.</span>
                  </div>
                  <div className="p-2.5 bg-slate-950/70 rounded border border-slate-800">
                    <span className="text-emerald-400 font-semibold block mb-0.5">6. Deployed Stage Newman Run</span>
                    <span className="text-[11px] text-slate-400">Automated Postman collection runs against real AWS API Gateway URL; verifying access logs redact tokens and ERP secrets.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Question 4 & 5 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-xs">
                4
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">
                  Demos, Repositories & Evidence
                </h3>
                <p className="text-xs text-slate-300">
                  This interactive application is built directly on this foundation! Explore the tabs above:
                </p>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-1.5 text-indigo-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <strong>Live Bedrock Agent:</strong> 2-Phase Safe Preview & Approval
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <strong>Milestone Verifier:</strong> Real-time checks for M1 through M7
                  </div>
                  <div className="flex items-center gap-1.5 text-purple-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <strong>Token Minting Lab:</strong> Lambda authorizer IAM evaluator
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  Private GitHub repository URL with full commit history, tagged milestones, and deployment guide provided upon agreement signing.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 text-indigo-400 font-bold text-xs">
                5
              </div>
              <div className="space-y-2">
                <h3 className="text-base font-bold text-white">
                  Availability & Start Date
                </h3>
                <div className="text-xs text-slate-300 space-y-2">
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400">Start Date:</span>
                    <span className="font-semibold text-emerald-400">Immediate (within 24h of agreement)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400">Capacity:</span>
                    <span className="font-semibold text-white">35–40 Hours / Week Dedicated</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded bg-slate-950/70 border border-slate-800">
                    <span className="text-slate-400">Target Bonus:</span>
                    <span className="font-semibold text-amber-400">AU$250 On-Time Completion Track</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 pt-1">
                  Ready to sign digital NDA/IP agreement immediately and begin Milestone 1 project skeleton.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
