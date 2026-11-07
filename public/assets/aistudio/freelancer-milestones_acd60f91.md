# Project milestones, acceptance and payment

Project: serverless AI agent platform on AWS (Lambda, TypeScript, Amazon Bedrock) for a SaaS ERP product.
Purpose of this document: attached to the job listing. It describes the milestones, what is delivered and tested in each, how payment is released, and the on-time bonus. Currency is Australian dollars (AUD). Items in [square brackets] are filled in before the contract is awarded.

The detailed specification pack (requirements, design and task lists written in Kiro's spec format) is shared with the selected developer after the digital agreement is signed. Nothing in this document replaces the agreement.

## 1. How the work is delivered

- The specification is already written. You implement it in order, one slice at a time. You are not asked to design the system from scratch, but you are expected to raise problems you find in the specification.
- You work in your own Git repository and your own AWS test environment. **You pay for your own test environment (AWS and Bedrock usage), your Kiro access and your Git hosting.** Please budget for model usage during testing. The code must include spending limits so tests cannot run away.
- You use Kiro (spec, design and task workflow) to implement the tasks and you validate what it produces by running tests yourself. We expect to see the evidence.
- The code must deploy into a different AWS account by changing configuration only (no hard-coded account ids, regions or secrets) and must include a deployment guide.
- Progress is reported weekly with a short written update: what was completed, what is next, and any blockers.

## 2. What you deliver for each milestone

1. **Running endpoints.** The milestone is deployed in your test environment, and the environment stays available while we review and while any rework is done.
2. **API documentation.** An OpenAPI description (or equivalent) of every endpoint added or changed in the milestone, with example requests and responses, error codes, and a ready-to-run request collection (for example Postman). Include how we obtain valid test tokens and test tenants for your environment (a token-minting tool plus the test secret shared securely, and pre-created test tenants and users).
3. **Code as a Git URL with history.** A private Git repository URL (read access for us) containing the full commit history, not a squashed export, with a tag for the milestone (for example `milestone-1`). It must build and test from a clean clone by following the README.
4. **Delivery note.** Test results, the tag, how to run the unit tests, and anything that differs from the specification.

## 3. How a milestone is accepted

1. **We test the endpoints** with your collection against your environment, including the negative cases (wrong token, wrong tenant, bad input, repeated requests). The milestone's acceptance checks (section 5) must pass.
2. **We review the code** from the repository: automated unit tests present and passing, timeouts and log retention set on every function, least-privilege permissions, no secrets in code or in the Git history (we run a secret scan), dependencies pinned and checked for known vulnerabilities, no hidden background work, clean and small modules, and the commit history intact.
3. **We may also deploy** from the repository into our own AWS account to confirm that it deploys by configuration alone.
4. **Review turnaround:** [5 business days] from a complete delivery. If a check fails we list the failures and you fix them.
5. **Fixing what was not delivered costs the client nothing.** The milestone price covers delivering the original requirements: the specification pack, the milestone's scope and its acceptance checks. If a delivery does not meet them, you fix it at your own cost, and review starts again from the corrected delivery. There is no extra payment for rework and no extra payment for time spent on it, however many rounds it takes. If a milestone has still not passed after [3] rework rounds, the client may end the contract for that milestone, and no payment is due for it.
6. **Changes to the requirements are separate.** A change is something the client asks for that is not in the specification pack, the milestone scope or the acceptance checks. Changes are agreed in writing, with the price and the date effect, before any work on them starts. Only an agreed change alters a milestone's price or date. Work done on a change that was not agreed in writing is not paid for.
7. **Deviations and specification problems.** If you find an error or gap in the specification, raise it promptly in writing. The client decides whether the specification is corrected (no price change if the original intent is unchanged) or treated as a change under item 6. If you choose to deliver something different from the specification without written approval, that does not change the price, and the original requirement still has to be met.

## 4. Payment and bonus

- **One payment release per milestone**, made after acceptance as above (endpoint testing passed, code review passed, repository received). No partial releases.
- Payment is released within [3 business days] of acceptance through the platform's milestone payment.
- **On-time bonus: AU$250**, paid when all milestones in the awarded scope are accepted on or before the agreed completion date [date]. The date, and any extensions caused by the client (for example waiting for access or information we promised) or by an agreed change, are written into the agreement. Time spent fixing work that did not meet the original requirements is not a client delay and does not extend the date.
- All code and documents belong to the client on payment of the milestone. Confidentiality and IP terms are in the agreement.
- Percentages below are shares of the total budget. Milestones 6 and 7 may be awarded later; in that case the percentages are re-based to the awarded milestones.

| # | Milestone | Share of total budget | Target date |
|---|-----------|-----------------------|-------------|
| 1 | Authentication and tenant foundation | 14% | [date] |
| 2 | AI core | 24% | [date] |
| 3 | Agent packages | 12% | [date] |
| 4 | First business agent | 14% | [date] |
| 5 | Production readiness and pilot support | 10% | [date] |
| 6 | Files and bulk | 10% | [date] |
| 7 | Further business agents | 16% | [date] |
| | **Total** | **100%** | |

The shares reflect the relative size of the task lists in each phase (about 72, 115, 43, 46, 49, 37 and 24 detailed steps respectively), adjusted for complexity. Total budget: [AUD amount].

## 5. Milestones and acceptance checks

The milestones follow the seven phases of the specification pack, in order.

### Milestone 1: Authentication and tenant foundation (14%)

Scope: project skeleton and first deployment; verification of the client's existing token format; a tenant registry with a provisioning script; secure per-tenant data access; a custom API authoriser; firewall (WAF) in monitoring mode, browser cross-origin handling, access logging and a small set of alarms; fixture tokens and a token-minting tool for testing.

Acceptance checks:
- The health route responds; every other route rejects an unauthenticated request.
- Prepared tokens (valid for two tenants, expired, tampered, wrong key, unsupported algorithm, malformed claims) each return the expected result.
- A valid token for an unknown, disabled or mismatched tenant is refused.
- One tenant cannot read another tenant's data even by guessing identifiers; one user cannot read another user's data; tenant values in headers, query or body are ignored.
- Browser pre-flight requests succeed for an allowed origin and fail for an unknown one; alarms exist and notify.

### Milestone 2: AI core (24%)

Scope: Amazon Bedrock model verification and a documented model choice; strict model allow-listing by geography; conversation and message APIs; credits, usage and spend controls; background job processing; a command-line chat tool; a tool framework; plans with previews and approvals bound to exactly what was approved, and a plan executor; a demonstration agent; secure file upload with malware scanning, parsing of CSV and XLSX files and read tools; conversation summaries; a time-boxed streaming experiment with a written result; account memory (the client may defer it); full isolation tests; runbook.

Acceptance checks:
- Conversations: create, list, read, delete; polling returns only new messages; repeating a request with the same idempotency key creates one message; no cross-tenant or cross-user access.
- Credits: concurrent reservations never exceed the limit; a repeated credit event applies once; monthly rollover happens once; a zero-balance account is limited to read-only chat within its daily cap; a kill switch stops new work.
- Chat works end to end on a real model; a repeated queue message does not repeat a model call; step, token and time limits stop a runaway job with a clear error.
- Writes happen only through an approved plan: wrong approval details, an expired plan, another user approving or approving twice all fail; the model cannot call a write tool directly; each plan operation runs exactly once; a failing operation stops the plan.
- Files: signed upload, scan, parse and read work; a test virus file, oversized and malformed files are rejected; another user's file is inaccessible; hostile text inside a file triggers no write; a ten-row file drives an approved plan with one operation per row.
- Long conversations are summarised and later turns use the summary; logs contain no message text, file contents, tokens or personal data.

### Milestone 3: Agent packages (12%)

Scope: first a short proof that the planned declarative format can describe the real endpoints (a go or no-go decision point); then the package format and validator, the generic tool engine, the agent registry with versioning, loading and rollback, a command-line tool to validate, evaluate and publish packages, the primary agent that routes users to the right specialist agent, handover safety rules, routing evaluation, and an administrator guide.

Decision point: if the proof shows the format cannot describe the real endpoints, work stops and the client and developer agree a revised plan before continuing. The proof is paid on completion of the milestone either way.

Acceptance checks:
- Invalid packages are rejected with readable errors (unsafe content, missing previews, unknown fields, oversized files).
- A package-defined write tool goes through the same approval flow as a coded one.
- A new agent is added, canary-enabled and rolled back using only files and the command-line tool, with no code change and no application redeployment; a running job keeps its original version after a new one is published.
- Users are never asked to pick an agent; requests reach the right specialist in the routing evaluation set; handovers to unknown, disabled or retired agents are refused; handover loops are stopped; a pending approval still works after a handover; hostile text cannot redirect a conversation to an unrelated agent.

### Milestone 4: First business agent (14%)

Scope: the endpoint inventory with the client's backend team; a secure connector to the ERP's REST API with strict outbound rules, rate limiting and a circuit breaker; a mock connector; delegated credentials with the ERP backend; the product agent (as a package) that finds a product and changes it with before-and-after previews, conflict detection and read-back verification, singly and across a category within one approved plan; evaluation set and hardening.

Acceptance checks:
- The connector calls only the tenant's own address, refuses redirects and unknown paths; rate limits and retry behaviour hold under load.
- The agent reads before it proposes changes and asks when a request is ambiguous; a change made by someone else between preview and approval is detected and stopped; validation, permission, not-found and busy errors produce the specified messages.
- Against the client's two demo tenants: a product change is found, previewed, approved, executed and verified; a category-wide change of at least 20 products completes within the rate limits; one tenant's credential is refused on the other tenant.
- No credentials, response bodies or personal data in logs; hostile text in product data causes no unintended action; the evaluation set meets the agreed pass threshold.

Client provides (dependency): the backend team's cooperation, demo tenants and connector credentials over a secure channel. Delays here extend this milestone's date.

### Milestone 5: Production readiness and pilot support (10%)

Scope: a delivery pipeline (tests on every change, approved promotion between environments, rollback); a threat model document and support for an independent security review and penetration test; firewall tuning evidence process; cost controls and a usage report script; operations runbooks and saved log queries; a tenant offboarding script; integration documentation for the front-end developers; a checklist for deploying to another region; up to [number] hours of support during a small pilot.

The work is delivered as code, scripts and documents, tested in your environment. The client performs production deployment, with your remote guidance as agreed.

Acceptance checks:
- The pipeline runs a change through the environments with manual approvals and a rehearsed rollback.
- The offboarding script is rehearsed on a seeded tenant and leaves nothing behind; the usage report matches seeded usage data.
- A load test report from your environment (for example 20 concurrent chats and one 100-operation plan) with no throttling storms or timeouts.
- Threat model, runbooks and the integration guide are reviewed and accepted; the API description validates.

### Milestone 6: Files and bulk (10%)

Scope: file editing through plain-language requests with a deterministic engine and file versions; downloads of edited files; export of products from the ERP into a file and creation of an ERP bulk import job from a file (these two depend on the client's backend).

Acceptance checks:
- A request such as "add a prefix to every slug" changes every data row of a 20,000-row file and only that column; the original is unchanged; the new version downloads and opens; undo returns to the original.
- A request naming a missing column is rejected with the available headers; pathological patterns are stopped; hostile text in cells triggers no write; another user's file or version is inaccessible; untouched CSV cells round-trip unchanged.
- Against the demo tenant: export a category, edit it, then either download it or create an import job and read the job status.

Client provides (dependency): the backend's import and export contracts and demo tenant access.

### Milestone 7: Further business agents (16%)

Scope: the shared consistency-check capability and evaluation runner, and four agents authored as packages: search-engine metadata, attributes and values, basic product setup, and conditions and formulas. Writes in the conditions and formulas area stay off until the backend offers a way to validate or test them. (The bill of materials agent is not included.)

Acceptance checks, for each agent:
- Its main tasks run end to end on a demo tenant with preview and approval.
- Its evaluation set (at least 20 conversations) meets the agreed pass threshold.
- Its routing examples pass in the combined routing evaluation, and publishing it does not reduce routing for the other agents.
- Isolation, injection and log checks pass; an agent card documents what it can and cannot do.

The client may split this milestone into one payment per agent at award. Client provides (dependency): the backend inventories for each area.

## 6. What we need from applicants

- Verifiable experience using Kiro's spec, design and task workflow to implement and validate code.
- Production AWS Lambda and serverless experience (SQS, DynamoDB, API Gateway, IAM).
- Git and CI/CD experience.
- Ability to sign the agreement digitally before work is assigned.

## 7. Terms fixed in the agreement

Confidentiality and intellectual property assignment; the completion date and the bonus condition; the review period, the rework rule and the change process in section 3; security rules for credentials and for handling the client's demo tenant access; the client's response times for questions and dependencies [2 business days]; and what happens if either side needs to end the contract early.
