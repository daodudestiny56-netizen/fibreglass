/**
 * lib/errorMap.ts
 *
 * Maps raw FNN error strings to Fiberglass FiberErrorCode values.
 *
 * DESIGN RATIONALE:
 *  - FNN's `failed_error` is a free-text string, not a fixed enum.
 *  - We use an ordered list of substring/regex matchers rather than exact
 *    matching — this is more robust to minor wording changes across FNN versions.
 *  - The raw error string is ALWAYS preserved and surfaced; we never hide it.
 *  - The generic 'UNKNOWN' fallback ensures we never silently swallow an error.
 *
 * TO UPDATE (Day 1):
 *  Replace the PROVISIONAL pattern strings with substrings from the real
 *  `failed_error` values captured from a live FNN testnet node.
 *  Add one entry per distinct real error string observed.
 */

import type { FiberError, FiberErrorCode, FnnMethod } from './rpcClient';


interface ErrorMatcher {
  /**
   * A string or RegExp tested against the raw `failed_error` text.
   * String matching is case-insensitive substring search.
   */
  pattern: string | RegExp;
  code: FiberErrorCode;
  /**
   * A human-readable hint shown alongside the raw error in the UI.
   * Must NOT replace the raw error — supplement only.
   */
  hint: string;
}

// ---------------------------------------------------------------------------
// Ordered matcher list
// Priority: first match wins. Put the most specific patterns first.
//
// PROVISIONAL: Pattern strings will be updated from real FNN error text.
// ---------------------------------------------------------------------------

const MATCHERS: ErrorMatcher[] = [
  // --- Insufficient liquidity ---------------------------------------------
  {
    pattern: /Insufficient balance: max outbound liquidity/i,
    code: 'INSUFFICIENT_LIQUIDITY',
    hint: "A channel on the route doesn't have enough balance to forward this payment. Try a smaller amount or wait for liquidity to rebalance.",
  },

  // --- No route / Self-payment disabled -----------------------------------
  {
    pattern: /allow_self_payment is not enabled/i,
    code: 'NO_ROUTE',
    hint: 'Self-payments are disabled on this node, or no valid route exists.',
  },

  // --- Invalid Invoice ----------------------------------------------------
  {
    pattern: /invoice is invalid/i,
    code: 'INVALID_INVOICE',
    hint: 'The payment request is invalid. It may be malformed or corrupted.',
  },
];


/**
 * Classify a raw FNN error string into a FiberErrorCode.
 * Falls through to 'UNKNOWN' if no pattern matches.
 */
export function classifyError(rawMessage: string): FiberErrorCode {
  const lower = rawMessage.toLowerCase();

  for (const { pattern, code } of MATCHERS) {
    if (typeof pattern === 'string') {
      if (lower.includes(pattern.toLowerCase())) {
        return code;
      }
    } else {
      if (pattern.test(rawMessage)) {
        return code;
      }
    }
  }

  return 'UNKNOWN';
}

/**
 * Return the human-readable hint for a classified error code, if any.
 * Used by ErrorResolutionBanner to supplement the raw error text.
 */
export function getErrorHint(code: FiberErrorCode): string | null {
  const entry = MATCHERS.find((m) => m.code === code);
  return entry?.hint ?? null;
}

/**
 * Build a FiberError from a raw FNN error string.
 * This is the primary entry point for hooks to produce structured errors.
 */
export function buildFiberError(
  rawMessage: string,
  rpcMethod: FnnMethod,
): FiberError {
  const code = classifyError(rawMessage);
  return { code, rawMessage, rpcMethod };
}

/**
 * Return all error codes and their hints for documentation / Storybook use.
 * (Stretch — only used if Storybook is built in Days 8–14.)
 */
export function allErrorCodes(): Array<{ code: FiberErrorCode; hint: string }> {
  const seen = new Set<FiberErrorCode>();
  const results: Array<{ code: FiberErrorCode; hint: string }> = [];

  for (const { code, hint } of MATCHERS) {
    if (!seen.has(code)) {
      seen.add(code);
      results.push({ code, hint });
    }
  }

  // Always include UNKNOWN
  if (!seen.has('UNKNOWN')) {
    results.push({
      code: 'UNKNOWN',
      hint: 'An unexpected error occurred. The raw error text above contains the full detail from the Fiber node.',
    });
  }

  return results;
}
