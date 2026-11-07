import { CreditAccount } from './types';

export interface ReservationResult {
  allowed: boolean;
  reservationId?: string;
  error?: string;
}

export class CreditManager {
  private accounts: Map<string, CreditAccount> = new Map();
  private activeReservations: Map<string, { tenantId: string; tokens: number; expiresAt: number }> = new Map();
  private processedCreditEventIds: Set<string> = new Set();

  constructor(initialAccounts?: CreditAccount[]) {
    if (initialAccounts) {
      for (const acc of initialAccounts) {
        this.accounts.set(acc.tenantId, { ...acc });
      }
    }
  }

  getAccount(tenantId: string): CreditAccount | undefined {
    return this.accounts.get(tenantId);
  }

  setAccount(acc: CreditAccount): void {
    this.accounts.set(acc.tenantId, acc);
  }

  toggleKillSwitch(tenantId: string, active: boolean): boolean {
    const acc = this.accounts.get(tenantId);
    if (!acc) return false;
    acc.isKillSwitchActive = active;
    return true;
  }

  /**
   * Reserves tokens before calling Bedrock model
   */
  reserveCredits(tenantId: string, requestedTokens: number, isWriteOp: boolean = false): ReservationResult {
    const acc = this.accounts.get(tenantId);
    if (!acc) {
      return { allowed: false, error: `Account for tenant ${tenantId} not found` };
    }

    if (acc.isKillSwitchActive) {
      return { allowed: false, error: 'Emergency kill switch active. All AI operations are halted for this tenant.' };
    }

    // Check if daily cap breached
    if (acc.tokensUsedToday + acc.reservedCredits + requestedTokens > acc.dailyTokenCap) {
      return {
        allowed: false,
        error: `Daily token cap reached (${acc.tokensUsedToday} / ${acc.dailyTokenCap} tokens). Upgrade plan to increase quota.`,
      };
    }

    // Zero balance check: Zero balance allows read-only chat within daily cap, but blocks write plans
    if (acc.balanceAud <= 0 && isWriteOp) {
      return {
        allowed: false,
        error: 'Zero credit balance: Write plan operations require positive credit balance (AUD).',
      };
    }

    const reservationId = 'res_' + Math.random().toString(36).substring(2, 9);
    acc.reservedCredits += requestedTokens;
    this.activeReservations.set(reservationId, {
      tenantId,
      tokens: requestedTokens,
      expiresAt: Date.now() + 60000, // 60s reservation
    });

    return { allowed: true, reservationId };
  }

  /**
   * Finalizes reservation and commits actual tokens used
   */
  commitReservation(reservationId: string, actualTokensUsed: number, costAud: number): boolean {
    const res = this.activeReservations.get(reservationId);
    if (!res) return false;

    const acc = this.accounts.get(res.tenantId);
    if (!acc) return false;

    // Release reservation
    acc.reservedCredits = Math.max(0, acc.reservedCredits - res.tokens);
    acc.tokensUsedToday += actualTokensUsed;
    acc.balanceAud = Math.max(0, Number((acc.balanceAud - costAud).toFixed(4)));

    this.activeReservations.delete(reservationId);
    return true;
  }

  /**
   * Deduplicates credit events (SQS idempotency guarantee)
   */
  applyCreditDeposit(eventId: string, tenantId: string, amountAud: number): { applied: boolean; reason?: string } {
    if (this.processedCreditEventIds.has(eventId)) {
      return { applied: false, reason: 'Duplicate event ID ignored (idempotent guard)' };
    }

    const acc = this.accounts.get(tenantId);
    if (!acc) return { applied: false, reason: 'Tenant not found' };

    acc.balanceAud += amountAud;
    this.processedCreditEventIds.add(eventId);
    return { applied: true };
  }
}

/**
 * Runaway execution guard: Enforces step, token, and time bounds
 */
export function validateRunawayGuard(
  stepCount: number,
  tokensAccumulated: number,
  elapsedMs: number,
  maxSteps: number = 8,
  maxTokens: number = 10000,
  maxMs: number = 15000
): { ok: boolean; reason?: string } {
  if (stepCount >= maxSteps) {
    return { ok: false, reason: `Runaway loop aborted: Step limit reached (${stepCount}/${maxSteps})` };
  }
  if (tokensAccumulated >= maxTokens) {
    return { ok: false, reason: `Runaway token cost aborted: Token ceiling exceeded (${tokensAccumulated}/${maxTokens})` };
  }
  if (elapsedMs >= maxMs) {
    return { ok: false, reason: `Execution timeout: Operation exceeded ${maxMs / 1000}s deadline` };
  }
  return { ok: true };
}
