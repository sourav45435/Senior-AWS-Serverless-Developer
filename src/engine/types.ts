export interface Tenant {
  id: string;
  name: string;
  status: 'active' | 'disabled' | 'suspended';
  plan: 'starter' | 'growth' | 'enterprise';
  createdAt: string;
  erpBaseUrl: string;
  allowedOrigins: string[];
}

export interface UserToken {
  sub: string;
  email: string;
  tenant_id: string;
  role: 'admin' | 'editor' | 'viewer';
  exp: number; // unix timestamp
  iss: string;
  jti: string;
}

export interface ERPProduct {
  sku: string;
  title: string;
  category: string;
  price: number;
  currency: string;
  stock: number;
  status: 'active' | 'archived' | 'low_stock';
  etag: string;
  updatedAt: string;
}

export interface PlanOperation {
  id: string;
  action: 'UPDATE_PRICE' | 'UPDATE_STOCK' | 'ARCHIVE_PRODUCT' | 'BATCH_UPDATE';
  sku: string;
  field: string;
  oldValue: unknown;
  newValue: unknown;
  expectedEtag: string;
  description: string;
}

export interface ExecutionPlan {
  id: string;
  tenantId: string;
  userId: string;
  agentId: string;
  title: string;
  summary: string;
  operations: PlanOperation[];
  status: 'pending_approval' | 'approved' | 'rejected' | 'executed' | 'failed' | 'expired';
  estimatedTokens: number;
  estimatedCostAud: number;
  createdAt: number; // ms
  expiresAt: number; // ms (typically 5 mins)
  hash: string;
  rejectionReason?: string;
  executedAt?: number;
  executedBy?: string;
}

export interface CreditAccount {
  tenantId: string;
  dailyTokenCap: number;
  tokensUsedToday: number;
  balanceAud: number;
  isKillSwitchActive: boolean;
  reservedCredits: number;
}
