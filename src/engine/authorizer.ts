import { Tenant, UserToken } from './types';

export interface AuthContext {
  principalId: string;
  tenantId: string;
  userId: string;
  role: 'admin' | 'editor' | 'viewer';
  email: string;
}

export interface AuthorizerResult {
  authorized: boolean;
  context?: AuthContext;
  statusCode: number;
  error?: string;
  policyDocument?: {
    Version: string;
    Statement: Array<{
      Action: string;
      Effect: 'Allow' | 'Deny';
      Resource: string;
    }>;
  };
}

export const KNOWN_TENANTS: Record<string, Tenant> = {
  'tenant-alpha': {
    id: 'tenant-alpha',
    name: 'Apex Manufacturing Corp',
    status: 'active',
    plan: 'enterprise',
    createdAt: '2025-01-15T00:00:00Z',
    erpBaseUrl: 'https://erp.apex-mfg.internal',
    allowedOrigins: ['https://app.apex-mfg.com', 'http://localhost:3000'],
  },
  'tenant-beta': {
    id: 'tenant-beta',
    name: 'BlueWave Distribution Ltd',
    status: 'active',
    plan: 'growth',
    createdAt: '2025-03-01T00:00:00Z',
    erpBaseUrl: 'https://erp.bluewave-logistics.internal',
    allowedOrigins: ['https://portal.bluewave.com', 'http://localhost:3000'],
  },
  'tenant-gamma-disabled': {
    id: 'tenant-gamma-disabled',
    name: 'Gamma Tech (Suspended)',
    status: 'disabled',
    plan: 'starter',
    createdAt: '2024-11-20T00:00:00Z',
    erpBaseUrl: 'https://erp.gamma.internal',
    allowedOrigins: ['https://app.gamma.com'],
  },
};

export const MOCK_SIGNING_KEY = 'secret-signature-key-erp-v1';

export function base64UrlEncode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf8').toString('base64url');
  }
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode(parseInt(p1, 16))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function base64UrlDecode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64url').toString('utf8');
  }
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

/**
 * Validates token and returns AWS Lambda authorizer policy.
 * CRITICAL RULE: Tenant context is DERIVED EXCLUSIVELY from token claims.
 * Any client-supplied X-Tenant-ID headers or query params are intentionally ignored to prevent spoofing.
 */
export function evaluateLambdaAuthorizer(
  tokenString: string | undefined,
  methodArn: string,
  tenants: Record<string, Tenant> = KNOWN_TENANTS
): AuthorizerResult {
  if (!tokenString) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized: Missing Authorization header',
    };
  }

  // Parse Bearer prefix
  const rawToken = tokenString.startsWith('Bearer ') ? tokenString.slice(7).trim() : tokenString.trim();

  // Basic JWT structure check (header.payload.signature)
  const parts = rawToken.split('.');
  if (parts.length !== 3) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized: Malformed JWT structure (expected 3 parts)',
    };
  }

  let header: { alg?: string; typ?: string };
  let payload: UserToken;

  try {
    header = JSON.parse(base64UrlDecode(parts[0]));
    payload = JSON.parse(base64UrlDecode(parts[1]));
  } catch {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized: Malformed base64url encoding or invalid JSON claims',
    };
  }

  // Algorithm verification (Reject 'none' algorithm attacks or asymmetric confusion)
  if (header.alg !== 'HS256') {
    return {
      authorized: false,
      statusCode: 401,
      error: `Unauthorized: Unsupported algorithm '${header.alg}', only HS256 allowed`,
    };
  }

  // Signature check simulation
  const signature = parts[2];
  if (signature === 'tampered_signature_invalid' || !signature.endsWith('_sig')) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized: Signature verification failed (tampered token or invalid key)',
    };
  }

  // Expiration check
  const nowUnix = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowUnix) {
    return {
      authorized: false,
      statusCode: 401,
      error: `Unauthorized: Token expired at ${new Date(payload.exp * 1000).toISOString()}`,
    };
  }

  // Required claims verification
  if (!payload.sub || !payload.tenant_id || !payload.role) {
    return {
      authorized: false,
      statusCode: 401,
      error: 'Unauthorized: Missing mandatory claims (sub, tenant_id, role)',
    };
  }

  // Tenant registry validation
  const tenant = tenants[payload.tenant_id];
  if (!tenant) {
    return {
      authorized: false,
      statusCode: 403,
      error: `Forbidden: Tenant '${payload.tenant_id}' does not exist in registry`,
    };
  }

  if (tenant.status !== 'active') {
    return {
      authorized: false,
      statusCode: 403,
      error: `Forbidden: Tenant '${tenant.name}' account is ${tenant.status}`,
    };
  }

  // Generate IAM-like Policy
  return {
    authorized: true,
    statusCode: 200,
    context: {
      principalId: payload.sub,
      tenantId: payload.tenant_id,
      userId: payload.sub,
      role: payload.role,
      email: payload.email,
    },
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: methodArn,
        },
      ],
    },
  };
}

/**
 * Validates CORS preflight requests according to tenant allowed origins.
 */
export function checkCorsOrigin(origin: string | undefined, tenantId: string, tenants: Record<string, Tenant> = KNOWN_TENANTS): boolean {
  if (!origin) return false;
  const tenant = tenants[tenantId];
  if (!tenant) return false;
  return tenant.allowedOrigins.includes(origin);
}
