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
  it('returns NO_ROUTE for "no path found" [PROVISIONAL]', () => {
    expect(classifyError('Failed to find a route: no path found to destination node')).toBe(
      'NO_ROUTE',
    );
  });

  it('returns NO_ROUTE for "no route" variant [PROVISIONAL]', () => {
    expect(classifyError('no route available')).toBe('NO_ROUTE');
  });

  it('returns INSUFFICIENT_LIQUIDITY for liquidity error [PROVISIONAL]', () => {
    expect(
      classifyError('Failed to send payment: insufficient outbound liquidity on channel 0x123'),
    ).toBe('INSUFFICIENT_LIQUIDITY');
  });

  it('returns ASSET_MISMATCH for currency mismatch [PROVISIONAL]', () => {
    expect(classifyError('asset mismatch: expected CKB got USDT')).toBe('ASSET_MISMATCH');
  });

  it('returns PAYMENT_ALREADY_EXISTS for duplicate payment [PROVISIONAL]', () => {
    expect(classifyError('duplicate payment: payment already exists')).toBe(
      'PAYMENT_ALREADY_EXISTS',
    );
  });

  it('returns INVOICE_EXPIRED for expired invoice [PROVISIONAL]', () => {
    expect(classifyError('invoice expired')).toBe('INVOICE_EXPIRED');
  });

  it('returns INVOICE_CANCELLED for cancelled invoice [PROVISIONAL]', () => {
    expect(classifyError('invoice cancelled by payee')).toBe('INVOICE_CANCELLED');
  });

  it('returns NODE_UNREACHABLE for peer connection failure [PROVISIONAL]', () => {
    expect(classifyError('peer connection failed: unable to reach remote node')).toBe(
      'NODE_UNREACHABLE',
    );
  });

  it('returns UNKNOWN for unrecognised error strings', () => {
    expect(classifyError('something completely unexpected happened')).toBe('UNKNOWN');
  });

  it('is case-insensitive', () => {
    expect(classifyError('NO PATH FOUND')).toBe('NO_ROUTE');
    expect(classifyError('INSUFFICIENT LIQUIDITY')).toBe('INSUFFICIENT_LIQUIDITY');
  });
});

describe('getErrorHint', () => {
  it('returns a non-empty string for known codes', () => {
    const hint = getErrorHint('NO_ROUTE');
    expect(hint).toBeTruthy();
    expect(typeof hint).toBe('string');
  });

  it('returns null for UNKNOWN', () => {
    expect(getErrorHint('UNKNOWN')).toBeNull();
  });
});

describe('buildFiberError', () => {
  it('builds a FiberError with correct shape', () => {
    const err = buildFiberError('no path found', 'send_payment');
    expect(err.code).toBe('NO_ROUTE');
    expect(err.rawMessage).toBe('no path found');
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
