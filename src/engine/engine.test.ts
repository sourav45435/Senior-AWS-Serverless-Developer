import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLambdaAuthorizer, KNOWN_TENANTS, checkCorsOrigin } from './authorizer';
import { computePlanHash, createPendingPlan, executeApprovedPlan } from './approvalPlan';
import { CreditManager, validateRunawayGuard } from './credits';
import { ERPProduct, UserToken } from './types';

// Helper to create mock test tokens
function createTestToken(payload: Partial<UserToken>, headerAlg = 'HS256', signature = 'valid_key_sig'): string {
  const h = Buffer.from(JSON.stringify({ alg: headerAlg, typ: 'JWT' })).toString('base64url');
  const p = Buffer.from(JSON.stringify({
    sub: 'user_123',
    email: 'developer@example.com',
    tenant_id: 'tenant-alpha',
    role: 'editor',
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'https://auth.saas-erp.com',
    jti: 'jti_abc123',
    ...payload,
  })).toString('base64url');
  return `${h}.${p}.${signature}`;
}

test('Authorizer: Rejects missing authorization header', () => {
  const result = evaluateLambdaAuthorizer(undefined, 'arn:aws:execute-api:us-east-1:12345:api/dev/GET/products');
  assert.equal(result.authorized, false);
  assert.equal(result.statusCode, 401);
});

test('Authorizer: Rejects malformed token without 3 parts', () => {
  const result = evaluateLambdaAuthorizer('Bearer not-a-valid-jwt', 'arn:test');
  assert.equal(result.authorized, false);
  assert.match(result.error || '', /Malformed JWT/);
});

test('Authorizer: Rejects unsupported algorithm like "none"', () => {
  const token = createTestToken({}, 'none');
  const result = evaluateLambdaAuthorizer(`Bearer ${token}`, 'arn:test');
  assert.equal(result.authorized, false);
  assert.match(result.error || '', /Unsupported algorithm 'none'/);
});

test('Authorizer: Rejects tampered signature', () => {
  const token = createTestToken({}, 'HS256', 'tampered_signature_invalid');
  const result = evaluateLambdaAuthorizer(`Bearer ${token}`, 'arn:test');
  assert.equal(result.authorized, false);
  assert.match(result.error || '', /Signature verification failed/);
});

test('Authorizer: Rejects expired token', () => {
  const pastUnix = Math.floor(Date.now() / 1000) - 120;
  const token = createTestToken({ exp: pastUnix });
  const result = evaluateLambdaAuthorizer(`Bearer ${token}`, 'arn:test');
  assert.equal(result.authorized, false);
  assert.match(result.error || '', /Token expired/);
});

test('Authorizer: Rejects unknown tenant ID', () => {
  const token = createTestToken({ tenant_id: 'tenant-unknown-rogue' });
  const result = evaluateLambdaAuthorizer(`Bearer ${token}`, 'arn:test');
  assert.equal(result.authorized, false);
  assert.equal(result.statusCode, 403);
  assert.match(result.error || '', /does not exist in registry/);
});

test('Authorizer: Rejects disabled tenant account', () => {
  const token = createTestToken({ tenant_id: 'tenant-gamma-disabled' });
  const result = evaluateLambdaAuthorizer(`Bearer ${token}`, 'arn:test');
  assert.equal(result.authorized, false);
  assert.equal(result.statusCode, 403);
  assert.match(result.error || '', /account is disabled/);
});

test('Authorizer: Rejects missing mandatory claims in payload', () => {
  const token = createTestToken({ role: undefined });
  const result = evaluateLambdaAuthorizer(`Bearer ${token}`, 'arn:test');
  assert.equal(result.authorized, false);
  assert.equal(result.statusCode, 401);
  assert.match(result.error || '', /Missing mandatory claims/);
});

test('Authorizer: Rejects malformed base64/JSON claims', () => {
  const badToken = 'eyJhbGciOiJIUzI1NiJ9.bm90LWpzb24-c3RyaW5n.valid_key_sig';
  const result = evaluateLambdaAuthorizer(`Bearer ${badToken}`, 'arn:test');
  assert.equal(result.authorized, false);
  assert.equal(result.statusCode, 401);
  assert.match(result.error || '', /Malformed base64url encoding or invalid JSON claims/);
});

test('Authorizer: Accepts valid token and establishes isolated tenant context', () => {
  const token = createTestToken({ tenant_id: 'tenant-alpha', sub: 'usr_jane_doe', role: 'admin' });
  const result = evaluateLambdaAuthorizer(`Bearer ${token}`, 'arn:aws:execute-api:ap-southeast-2:123:api/*');
  assert.equal(result.authorized, true);
  assert.equal(result.statusCode, 200);
  assert.equal(result.context?.tenantId, 'tenant-alpha');
  assert.equal(result.context?.role, 'admin');
  assert.equal(result.context?.userId, 'usr_jane_doe');
});

test('Approval Plan: Detects concurrent ERP modification (ETag conflict) and halts write safely', () => {
  const erpMap = new Map<string, ERPProduct>([
    ['SKU-101', {
      sku: 'SKU-101',
      title: 'Hydraulic Motor 24V',
      category: 'Motors',
      price: 240.0,
      currency: 'AUD',
      stock: 45,
      status: 'active',
      etag: 'etag_original_111',
      updatedAt: '2026-11-06T12:00:00Z',
    }],
  ]);

  // Create plan based on original ETag
  const plan = createPendingPlan('tenant-alpha', 'usr_john', 'product-agent', 'Price adjustment', 'Increase price by 10%', [
    {
      id: 'op_1',
      action: 'UPDATE_PRICE',
      sku: 'SKU-101',
      field: 'price',
      oldValue: 240.0,
      newValue: 264.0,
      expectedEtag: 'etag_original_111',
      description: 'Adjust SKU-101 price to AUD 264.00',
    },
  ]);

  // Simulate third-party modification in ERP before approval occurs
  erpMap.get('SKU-101')!.etag = 'etag_concurrent_mutation_999';

  const executionResult = executeApprovedPlan(plan, 'usr_manager', 'editor', erpMap);
  assert.equal(executionResult.success, false);
  assert.equal(executionResult.status, 'conflict_aborted');
  assert.match(executionResult.message, /Conflict detected/);
  // Ensure product price was NOT modified!
  assert.equal(erpMap.get('SKU-101')?.price, 240.0);
});

test('Approval Plan: Successfully executes when ETags match, updating state and advancing ETag', () => {
  const erpMap = new Map<string, ERPProduct>([
    ['SKU-102', {
      sku: 'SKU-102',
      title: 'Stainless Flange 50mm',
      category: 'Fittings',
      price: 45.0,
      currency: 'AUD',
      stock: 12,
      status: 'active',
      etag: 'etag_v1_aaa',
      updatedAt: '2026-11-06T12:00:00Z',
    }],
  ]);

  const plan = createPendingPlan('tenant-alpha', 'usr_john', 'product-agent', 'Stock depletion', 'Set stock to 2', [
    {
      id: 'op_2',
      action: 'UPDATE_STOCK',
      sku: 'SKU-102',
      field: 'stock',
      oldValue: 12,
      newValue: 2,
      expectedEtag: 'etag_v1_aaa',
      description: 'Update stock to 2',
    },
  ]);

  const executionResult = executeApprovedPlan(plan, 'usr_manager', 'admin', erpMap);
  assert.equal(executionResult.success, true);
  assert.equal(executionResult.status, 'executed');
  assert.equal(executionResult.executedCount, 1);

  const updated = erpMap.get('SKU-102')!;
  assert.equal(updated.stock, 2);
  assert.equal(updated.status, 'low_stock'); // Automatic business rule
  assert.notEqual(updated.etag, 'etag_v1_aaa'); // Advanced
});

test('Approval Plan: Rejects execution if plan is expired', () => {
  const erpMap = new Map<string, ERPProduct>();
  const plan = createPendingPlan('tenant-alpha', 'usr_john', 'product-agent', 'Expired test', 'Test', []);
  plan.expiresAt = Date.now() - 5000; // 5 seconds in the past

  const result = executeApprovedPlan(plan, 'usr_manager', 'admin', erpMap);
  assert.equal(result.success, false);
  assert.equal(result.status, 'expired');
});

test('Approval Plan: Rejects viewer role from approving write operations', () => {
  const erpMap = new Map<string, ERPProduct>();
  const plan = createPendingPlan('tenant-alpha', 'usr_john', 'product-agent', 'Viewer test', 'Test', []);

  const result = executeApprovedPlan(plan, 'usr_viewer', 'viewer', erpMap);
  assert.equal(result.success, false);
  assert.equal(result.status, 'unauthorized');
});

test('Credits & Guard: Enforces daily cap, kill switch, and SQS idempotency', () => {
  const creditMgr = new CreditManager([
    {
      tenantId: 'tenant-alpha',
      dailyTokenCap: 10000,
      tokensUsedToday: 9500,
      balanceAud: 50.0,
      isKillSwitchActive: false,
      reservedCredits: 0,
    },
  ]);

  // Cap test: 9500 + 800 > 10000 cap
  const capCheck = creditMgr.reserveCredits('tenant-alpha', 800);
  assert.equal(capCheck.allowed, false);
  assert.match(capCheck.error || '', /Daily token cap reached/);

  // Kill switch test
  creditMgr.setAccount({
    tenantId: 'tenant-alpha',
    dailyTokenCap: 50000,
    tokensUsedToday: 1000,
    balanceAud: 50.0,
    isKillSwitchActive: true,
    reservedCredits: 0,
  });

  const killCheck = creditMgr.reserveCredits('tenant-alpha', 500);
  assert.equal(killCheck.allowed, false);
  assert.match(killCheck.error || '', /kill switch active/);

  // SQS Idempotent credit deposit test
  creditMgr.toggleKillSwitch('tenant-alpha', false);
  const dep1 = creditMgr.applyCreditDeposit('evt_sqs_invoice_001', 'tenant-alpha', 100.0);
  assert.equal(dep1.applied, true);
  assert.equal(creditMgr.getAccount('tenant-alpha')?.balanceAud, 150.0);

  // Duplicate replay
  const dep2 = creditMgr.applyCreditDeposit('evt_sqs_invoice_001', 'tenant-alpha', 100.0);
  assert.equal(dep2.applied, false);
  assert.equal(creditMgr.getAccount('tenant-alpha')?.balanceAud, 150.0); // Not doubled!
});

test('Runaway Guard: Halts execution exceeding step or token threshold', () => {
  const normal = validateRunawayGuard(3, 1500, 2000);
  assert.equal(normal.ok, true);

  const runawaySteps = validateRunawayGuard(8, 2000, 2000);
  assert.equal(runawaySteps.ok, false);
  assert.match(runawaySteps.reason || '', /Step limit reached/);

  const runawayTokens = validateRunawayGuard(2, 12000, 2000);
  assert.equal(runawayTokens.ok, false);
  assert.match(runawayTokens.reason || '', /Token ceiling exceeded/);

  const runawayTimeout = validateRunawayGuard(2, 1000, 16000);
  assert.equal(runawayTimeout.ok, false);
  assert.match(runawayTimeout.reason || '', /Execution timeout/);
});

test('Approval Plan: Rejects tampered plan hash if operation was modified in transit', () => {
  const erpMap = new Map<string, ERPProduct>([
    ['SKU-105', {
      sku: 'SKU-105',
      title: 'Pressure Relief Valve',
      category: 'Valves',
      price: 100.0,
      currency: 'AUD',
      stock: 10,
      status: 'active',
      etag: 'etag_105',
      updatedAt: '2026-11-06T12:00:00Z',
    }],
  ]);

  const plan = createPendingPlan('tenant-alpha', 'usr_john', 'product-agent', 'Tamper test', 'Test', [
    {
      id: 'op_tamper',
      action: 'UPDATE_PRICE',
      sku: 'SKU-105',
      field: 'price',
      oldValue: 100.0,
      newValue: 110.0,
      expectedEtag: 'etag_105',
      description: 'Legitimate proposed price',
    },
  ]);

  // Malicious in-transit tamper: inject unauthorized price drop to $1.00
  plan.operations[0].newValue = 1.0;

  const result = executeApprovedPlan(plan, 'usr_admin', 'admin', erpMap);
  assert.equal(result.success, false);
  assert.equal(result.status, 'unauthorized');
  assert.match(result.message, /Integrity check failed: Plan payload has been tampered with/);
  // Product price MUST remain original
  assert.equal(erpMap.get('SKU-105')?.price, 100.0);
});

test('Approval Plan: Milestone 4 Batch execution up to 20 products within one plan', () => {
  const erpMap = new Map<string, ERPProduct>();
  const ops = [];

  for (let i = 1; i <= 20; i++) {
    const sku = `SKU-BATCH-${i}`;
    erpMap.set(sku, {
      sku,
      title: `Batch Product ${i}`,
      category: 'BulkCategory',
      price: 50.0,
      currency: 'AUD',
      stock: 100,
      status: 'active',
      etag: `etag_batch_${i}`,
      updatedAt: '2026-11-06T12:00:00Z',
    });

    ops.push({
      id: `op_batch_${i}`,
      action: 'UPDATE_PRICE' as const,
      sku,
      field: 'price',
      oldValue: 50.0,
      newValue: 45.0, // 10% discount
      expectedEtag: `etag_batch_${i}`,
      description: `Discount ${sku}`,
    });
  }

  const plan = createPendingPlan('tenant-alpha', 'usr_batch', 'product-agent', 'Batch 20', 'Bulk update', ops);
  const result = executeApprovedPlan(plan, 'usr_admin', 'admin', erpMap);

  assert.equal(result.success, true);
  assert.equal(result.status, 'executed');
  assert.equal(result.executedCount, 20);
  assert.equal(erpMap.get('SKU-BATCH-1')?.price, 45.0);
  assert.equal(erpMap.get('SKU-BATCH-20')?.price, 45.0);
});

test('Credits: Zero balance permits read-only chat within cap, but rejects write plans', () => {
  const creditMgr = new CreditManager([
    {
      tenantId: 'tenant-alpha',
      dailyTokenCap: 5000,
      tokensUsedToday: 500,
      balanceAud: 0.0, // Zero balance
      isKillSwitchActive: false,
      reservedCredits: 0,
    },
  ]);

  // Read-only chat reservation should succeed
  const readCheck = creditMgr.reserveCredits('tenant-alpha', 300, false);
  assert.equal(readCheck.allowed, true);

  // Write operation reservation should be blocked
  const writeCheck = creditMgr.reserveCredits('tenant-alpha', 300, true);
  assert.equal(writeCheck.allowed, false);
  assert.match(writeCheck.error || '', /Zero credit balance: Write plan operations require positive credit balance/);
});

test('Authorizer & CORS: Allows whitelisted tenant origin and rejects unconfigured origin', () => {
  // Allowed origins for tenant-alpha: 'https://app.apex-mfg.com', 'http://localhost:3000'
  assert.equal(checkCorsOrigin('https://app.apex-mfg.com', 'tenant-alpha'), true);
  assert.equal(checkCorsOrigin('http://localhost:3000', 'tenant-alpha'), true);
  // Malicious / unconfigured origin
  assert.equal(checkCorsOrigin('https://evil-attacker.com', 'tenant-alpha'), false);
  assert.equal(checkCorsOrigin(undefined, 'tenant-alpha'), false);
  assert.equal(checkCorsOrigin('https://app.apex-mfg.com', 'unknown-tenant'), false);
});

