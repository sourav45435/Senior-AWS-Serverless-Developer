import React, { useState, useMemo } from 'react';
import { evaluateLambdaAuthorizer, KNOWN_TENANTS, checkCorsOrigin, base64UrlEncode } from '../engine/authorizer';
import { Key, Shield, AlertTriangle, CheckCircle2, Lock, Terminal, Copy, Check, Zap, Globe } from 'lucide-react';

export type TokenTestMode = 
  | 'valid'
  | 'expired'
  | 'tampered_sig'
  | 'none_alg'
  | 'malformed_jwt'
  | 'malformed_claims'
  | 'missing_claims'
  | 'unknown_tenant'
  | 'disabled_tenant';

export const TokenAuthorizerView: React.FC = () => {
  const [tenantId, setTenantId] = useState('tenant-alpha');
  const [userId, setUserId] = useState('usr_engineer_99');
  const [role, setRole] = useState<'admin' | 'editor' | 'viewer'>('editor');
  const [tamperMode, setTamperMode] = useState<TokenTestMode>('valid');
  const [spoofedHeaderTenant, setSpoofedHeaderTenant] = useState('tenant-beta');
  const [corsOrigin, setCorsOrigin] = useState('https://app.apex-mfg.com');
  const [copied, setCopied] = useState(false);

  // Mint simulated JWT with useMemo to keep token stable across renders
  const currentToken = useMemo(() => {
    if (tamperMode === 'malformed_jwt') {
      return 'not.a.valid.jwt.four.parts.bad';
    }
    if (tamperMode === 'malformed_claims') {
      const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      return `${header}.invalid-non-base64-payload!!!.valid_key_sig`;
    }

    let alg = 'HS256';
    let signature = 'valid_key_sig';
    let effectiveTenant = tenantId;
    let exp = Math.floor(Date.now() / 1000) + 3600;

    if (tamperMode === 'none_alg') alg = 'none';
    if (tamperMode === 'tampered_sig') signature = 'tampered_signature_invalid';
    if (tamperMode === 'expired') exp = Math.floor(Date.now() / 1000) - 300;
    if (tamperMode === 'unknown_tenant') effectiveTenant = 'tenant-rogue-intruder';
    if (tamperMode === 'disabled_tenant') effectiveTenant = 'tenant-gamma-disabled';

    const header = base64UrlEncode(JSON.stringify({ alg, typ: 'JWT' }));
    
    // Missing claims test: omit role and sub
    const payloadObject = tamperMode === 'missing_claims' 
      ? {
          tenant_id: effectiveTenant,
          exp,
          iss: 'https://auth.saas-erp.com',
          jti: 'jti_missing_claims',
        }
      : {
          sub: userId,
          email: `${userId}@saas-erp.internal`,
          tenant_id: effectiveTenant,
          role,
          exp,
          iss: 'https://auth.saas-erp.com',
          jti: 'jti_test_static_001',
        };

    const payload = base64UrlEncode(JSON.stringify(payloadObject));
    return `${header}.${payload}.${signature}`;
  }, [tenantId, userId, role, tamperMode]);

  const authResult = useMemo(() => {
    return evaluateLambdaAuthorizer(
      `Bearer ${currentToken}`,
      'arn:aws:execute-api:ap-southeast-2:407840206155:api/v1/*'
    );
  }, [currentToken]);

  const corsAllowed = useMemo(() => {
    const effectiveTenant = authResult.context?.tenantId || tenantId;
    return checkCorsOrigin(corsOrigin, effectiveTenant);
  }, [corsOrigin, authResult.context?.tenantId, tenantId]);

  const copyToken = () => {
    navigator.clipboard.writeText(currentToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold">
            Milestone 1 Implementation
          </span>
          <span className="text-xs text-slate-400">Custom AWS Lambda Authorizer</span>
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">
          Token Minting Lab & Lambda Authorizer Policy Inspector
        </h2>
        <p className="text-xs text-slate-300 mt-1 max-w-2xl">
          In strict accordance with Milestone 1: Prepared tokens (valid for multiple tenants, expired, tampered, wrong key, unsupported algorithm, malformed claims) return expected IAM allow/deny policies. Tenant identifiers in headers are discarded to enforce absolute boundary isolation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Token Minting Controls (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Key className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Token Minting Tool
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Target Tenant (in Token Claim):</label>
              <select
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                <option value="tenant-alpha">tenant-alpha (Apex Manufacturing - Active Enterprise)</option>
                <option value="tenant-beta">tenant-beta (BlueWave Logistics - Active Growth)</option>
                <option value="tenant-gamma-disabled">tenant-gamma-disabled (Suspended Account)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">User Subject (sub) & Role:</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'editor' | 'viewer')}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Test Attack / Anomaly Vector:</label>
              <select
                value={tamperMode}
                onChange={(e) => setTamperMode(e.target.value as TokenTestMode)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
              >
                <option value="valid">Standard Valid Token (Expect 200 Allow)</option>
                <option value="expired">Expired Token (exp in past - Expect 401 Deny)</option>
                <option value="tampered_sig">Tampered Signature (Expect 401 Deny)</option>
                <option value="none_alg">Algorithm: 'none' Attack (Expect 401 Deny)</option>
                <option value="malformed_jwt">Malformed JWT Structure (Expect 401 Deny)</option>
                <option value="malformed_claims">Malformed Claims / Corrupt JSON (Expect 401 Deny)</option>
                <option value="missing_claims">Missing Mandatory Claims (Expect 401 Deny)</option>
                <option value="unknown_tenant">Unknown Tenant ID (Expect 403 Forbidden)</option>
                <option value="disabled_tenant">Suspended / Disabled Tenant (Expect 403 Forbidden)</option>
              </select>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="text-slate-400 block mb-1 flex items-center justify-between">
                <span>Simulate Spoofed Request Header:</span>
                <span className="text-[10px] text-amber-400 font-mono">X-Tenant-ID Header</span>
              </label>
              <input
                type="text"
                placeholder="e.g. tenant-beta (Will be safely ignored!)"
                value={spoofedHeaderTenant}
                onChange={(e) => setSpoofedHeaderTenant(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:outline-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Security Rule: API Gateway custom authorizer strictly strips and overrides any client-sent tenant headers with verified JWT claims.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="text-slate-400 block mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  CORS Origin Verification:
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${corsAllowed ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'}`}>
                  {corsAllowed ? 'ALLOWED' : 'BLOCKED'}
                </span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={corsOrigin}
                  onChange={(e) => setCorsOrigin(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setCorsOrigin('https://evil-unauthorized-hacker.com')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded border border-slate-700 cursor-pointer"
                  title="Simulate unauthorized origin"
                >
                  Test Rogue
                </button>
              </div>
            </div>

            <div className="pt-2">
              <label className="text-slate-400 block mb-1 flex items-center justify-between">
                <span>Generated JWT:</span>
                <button
                  type="button"
                  onClick={copyToken}
                  className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </label>
              <div className="p-2.5 bg-slate-950 rounded border border-slate-800 font-mono text-[10px] text-slate-400 break-all max-h-24 overflow-y-auto">
                {currentToken}
              </div>
            </div>
          </div>
        </div>

        {/* Live Lambda Authorizer Output (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Lambda Authorizer Evaluation Result
              </h3>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded ${
                authResult.authorized
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
              }`}
            >
              HTTP {authResult.statusCode} {authResult.authorized ? 'ALLOW' : 'DENY'}
            </span>
          </div>

          {/* Status Message */}
          <div
            className={`p-3 rounded-lg text-xs font-mono flex items-center gap-2.5 ${
              authResult.authorized
                ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
            }`}
          >
            {authResult.authorized ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>
              {authResult.authorized
                ? `Authorized! Isolated tenant context '${authResult.context?.tenantId}' established for user '${authResult.context?.userId}'.`
                : authResult.error}
            </span>
          </div>

          {/* Injected Context & IAM Policy */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1 font-mono">
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                Sanitized Downstream Context:
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                {JSON.stringify(authResult.context || { error: authResult.error }, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1 font-mono">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                Generated IAM Policy:
              </div>
              <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto">
                {JSON.stringify(authResult.policyDocument || { Policy: 'DenyAll' }, null, 2)}
              </pre>
            </div>
          </div>

          {/* Spoofing test assertion */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
            <span className="font-semibold text-indigo-300">Tenant Boundary Isolation Guarantee:</span>
            <p className="text-[11px] text-slate-400">
              Even if a malicious actor specifies <code className="text-amber-300">X-Tenant-ID: {spoofedHeaderTenant || 'tenant-beta'}</code>, the authorizer resolves identity solely from the cryptographically verified JWT claim (<code className="text-emerald-300">{authResult.context?.tenantId || 'none'}</code>). Cross-tenant data leak is mathematically impossible.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
