/**
 * __tests__/errorMap.test.ts
 *
 * Unit tests for lib/errorMap.ts.
 * These run first because errorMap.ts has no external dependencies.
 *
 * NOTE: Pattern strings are PROVISIONAL. Tests marked [PROVISIONAL] must be
 * updated with real FNN error strings once captured on Day 1.
 */

import { describe, it, expect } from 'vitest';
import { classifyError, getErrorHint, buildFiberError, allErrorCodes } from '../lib/errorMap';

describe('classifyError', () => {
  it('returns NO_ROUTE for "allow_self_payment is not enabled"', () => {
    expect(classifyError('Feature not enabled: allow_self_payment is not enabled, can not pay to self')).toBe(
      'NO_ROUTE',
    );
  });

  it('returns INSUFFICIENT_LIQUIDITY for liquidity error', () => {
    expect(
      classifyError('Failed to build route, Insufficient balance: max outbound liquidity 30100000000 is insufficient'),
    ).toBe('INSUFFICIENT_LIQUIDITY');
  });

  it('returns INVALID_INVOICE with a hint for invalid invoice', () => {
    expect(classifyError('Failed to validate payment request: "invoice is invalid"')).toBe(
      'INVALID_INVOICE'
    );
  });

  it('returns UNKNOWN for completely unrecognised error strings', () => {
    expect(classifyError('something completely unexpected happened')).toBe('UNKNOWN');
  });

  it('is case-insensitive', () => {
    expect(classifyError('ALLOW_SELF_PAYMENT IS NOT ENABLED')).toBe('NO_ROUTE');
    expect(classifyError('INSUFFICIENT BALANCE: MAX OUTBOUND LIQUIDITY')).toBe('INSUFFICIENT_LIQUIDITY');
  });
});

describe('getErrorHint', () => {
  it('returns a non-empty string for known codes', () => {
    const hint = getErrorHint('NO_ROUTE');
    expect(hint).toBeTruthy();
    expect(typeof hint).toBe('string');
  });

  it('returns a specific hint for INVALID_INVOICE if matched', () => {
    // Our invalid invoice matcher returns INVALID_INVOICE but provides a hint
    expect(getErrorHint('INVALID_INVOICE')).toBe(
      'The payment request is invalid. It may be malformed or corrupted.'
    );
  });
});

describe('buildFiberError', () => {
  it('builds a FiberError with correct shape', () => {
    const err = buildFiberError('allow_self_payment is not enabled', 'send_payment');
    expect(err.code).toBe('NO_ROUTE');
    expect(err.rawMessage).toBe('allow_self_payment is not enabled');
    expect(err.rpcMethod).toBe('send_payment');
  });

  it('preserves the raw message exactly', () => {
    const raw = '  Raw error with leading space and CAPS  ';
    const err = buildFiberError(raw, 'get_payment');
    expect(err.rawMessage).toBe(raw);
  });
});

describe('allErrorCodes', () => {
  it('includes UNKNOWN', () => {
    const codes = allErrorCodes().map((e) => e.code);
    expect(codes).toContain('UNKNOWN');
  });

  it('does not return duplicate codes', () => {
    const codes = allErrorCodes().map((e) => e.code);
    const unique = new Set(codes);
    expect(codes.length).toBe(unique.size);
  });
});
