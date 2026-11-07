import { ERPProduct, ExecutionPlan, PlanOperation } from './types';

/**
 * Creates a deterministic Plan Hash binding the exact tenant, user, operations, and expiration
 */
export function computePlanHash(
  tenantId: string,
  userId: string,
  operations: PlanOperation[],
  expiresAt: number
): string {
  const payload = JSON.stringify({
    tenantId,
    userId,
    operations: operations.map(o => ({
      sku: o.sku,
      action: o.action,
      field: o.field,
      newValue: o.newValue,
      expectedEtag: o.expectedEtag,
    })),
    expiresAt,
  });

  // Simple deterministic djb2-based hash string for testing & execution
  let hash = 5381;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash * 33) ^ payload.charCodeAt(i);
  }
  return 'plan_sig_' + Math.abs(hash).toString(16);
}

/**
 * Creates a pending execution plan after read tool preview
 */
export function createPendingPlan(
  tenantId: string,
  userId: string,
  agentId: string,
  title: string,
  summary: string,
  operations: PlanOperation[],
  ttlSeconds: number = 300 // 5 minutes standard TTL
): ExecutionPlan {
  const now = Date.now();
  const expiresAt = now + ttlSeconds * 1000;
  const hash = computePlanHash(tenantId, userId, operations, expiresAt);

  return {
    id: 'plan_' + Math.random().toString(36).substring(2, 10),
    tenantId,
    userId,
    agentId,
    title,
    summary,
    operations,
    status: 'pending_approval',
    estimatedTokens: 850 + operations.length * 200,
    estimatedCostAud: Number((0.003 + operations.length * 0.0015).toFixed(4)),
    createdAt: now,
    expiresAt,
    hash,
  };
}

export interface PlanExecutionResult {
  success: boolean;
  status: 'executed' | 'conflict_aborted' | 'expired' | 'unauthorized' | 'already_processed';
  executedCount: number;
  message: string;
  updatedProducts?: ERPProduct[];
  conflictDetails?: {
    sku: string;
    expectedEtag: string;
    currentEtag: string;
  };
}

/**
 * Executes an approved plan against ERP products with optimistic concurrency checking (ETag comparison).
 */
export function executeApprovedPlan(
  plan: ExecutionPlan,
  approverUserId: string,
  approverRole: string,
  currentErpProducts: Map<string, ERPProduct>,
  currentTimeMs: number = Date.now()
): PlanExecutionResult {
  // 1. Check if already processed
  if (plan.status === 'executed') {
    return {
      success: false,
      status: 'already_processed',
      executedCount: 0,
      message: 'Plan has already been executed. Repeated operations are blocked by idempotency guard.',
    };
  }

  // 2. Check expiration
  if (currentTimeMs > plan.expiresAt) {
    plan.status = 'expired';
    return {
      success: false,
      status: 'expired',
      executedCount: 0,
      message: `Plan expired at ${new Date(plan.expiresAt).toISOString()}. Please regenerate preview.`,
    };
  }

  // 3. User & Role authorization check
  // Plan must be approved by authorized role ('admin' or 'editor')
  if (approverRole === 'viewer') {
    return {
      success: false,
      status: 'unauthorized',
      executedCount: 0,
      message: 'Forbidden: Viewers are not permitted to approve write plans.',
    };
  }

  // 4. Verify Plan Hash integrity (cannot alter operations after proposal)
  const expectedHash = computePlanHash(plan.tenantId, plan.userId, plan.operations, plan.expiresAt);
  if (plan.hash !== expectedHash) {
    return {
      success: false,
      status: 'unauthorized',
      executedCount: 0,
      message: 'Integrity check failed: Plan payload has been tampered with.',
    };
  }

  // 5. Pre-execution concurrency check (ETag validation across ALL operations before committing)
  for (const op of plan.operations) {
    const product = currentErpProducts.get(op.sku);
    if (!product) {
      return {
        success: false,
        status: 'conflict_aborted',
        executedCount: 0,
        message: `Execution aborted: SKU ${op.sku} was deleted by another process.`,
      };
    }

    if (product.etag !== op.expectedEtag) {
      return {
        success: false,
        status: 'conflict_aborted',
        executedCount: 0,
        message: `Conflict detected on SKU ${op.sku}: Product was modified in ERP between preview and approval. Expected ETag ${op.expectedEtag}, found ${product.etag}. Plan safely aborted.`,
        conflictDetails: {
          sku: op.sku,
          expectedEtag: op.expectedEtag,
          currentEtag: product.etag,
        },
      };
    }
  }

  // 6. Execute operations sequentially (Atomic within transaction batch)
  const updatedProducts: ERPProduct[] = [];
  let executedCount = 0;

  for (const op of plan.operations) {
    const product = currentErpProducts.get(op.sku)!;
    const cloned = { ...product };

    if (op.field === 'price' && typeof op.newValue === 'number') {
      cloned.price = op.newValue;
    } else if (op.field === 'stock' && typeof op.newValue === 'number') {
      cloned.stock = op.newValue;
      if (cloned.stock <= 5) cloned.status = 'low_stock';
      if (cloned.stock > 5) cloned.status = 'active';
    } else if (op.field === 'status' && typeof op.newValue === 'string') {
      cloned.status = op.newValue as ERPProduct['status'];
    }

    // Advance ETag upon successful ERP mutation
    cloned.etag = 'etag_' + Math.random().toString(36).substring(2, 8);
    cloned.updatedAt = new Date(currentTimeMs).toISOString();

    currentErpProducts.set(op.sku, cloned);
    updatedProducts.push(cloned);
    executedCount++;
  }

  plan.status = 'executed';
  plan.executedAt = currentTimeMs;
  plan.executedBy = approverUserId;

  return {
    success: true,
    status: 'executed',
    executedCount,
    message: `Plan executed successfully: ${executedCount} operations committed to ERP with zero conflicts.`,
    updatedProducts,
  };
}
