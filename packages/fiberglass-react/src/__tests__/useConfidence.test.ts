/**
 * __tests__/useConfidence.test.ts
 *
 * Tests for the useConfidence hook (dry-run routing validation).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useConfidence } from '../hooks/useConfidence';
import { FiberContext } from '../provider/FiberProvider';
import { MOCK_SEND_PAYMENT_DRY_RUN } from '../lib/mockFixtures';
import type { FiberContextValue } from '../lib/rpcClient';
import { FiberClient } from '../lib/rpcClient';


function makeWrapper(contextValue: FiberContextValue) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      FiberContext.Provider,
      { value: contextValue },
      children,
    );
  };
}

function makeMockContext(overrides: Partial<FiberContextValue> = {}): FiberContextValue {
  return {
    client: new FiberClient('http://mock-node'),
    mode: 'mock',
    connectionStatus: 'disconnected',
    nodeInfo: null,
    rpcLogs: [],
    appOrigin: 'http://localhost',
    ...overrides,
  } as FiberContextValue;
}


describe('useConfidence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('with null invoice', () => {
    it('stays in loading state without running a dry-run', async () => {
      const ctx = makeMockContext({ mode: 'mock' });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => useConfidence({ invoiceAddress: null }),
        { wrapper },
      );

      // Remains loading — never fires the RPC
      expect(result.current.status).toBe('loading');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('mock mode — success', () => {
    it('returns ready status with fee and route after dry-run', async () => {
      const ctx = makeMockContext({ mode: 'mock' });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => useConfidence({ invoiceAddress: 'fibb1qtest...' }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toBe('ready'), { timeout: 1000 });

      expect(result.current.fee).toBe(MOCK_SEND_PAYMENT_DRY_RUN.fee);
      expect(result.current.route).toHaveLength(MOCK_SEND_PAYMENT_DRY_RUN.router.length);
      expect(result.current.error).toBeNull();
    });
  });

  describe('live mode — success', () => {
    it('calls sendPaymentDryRun and returns ready status', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'sendPaymentDryRun').mockResolvedValue(MOCK_SEND_PAYMENT_DRY_RUN);

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => useConfidence({ invoiceAddress: 'fibb1qtest...' }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.status).toBe('ready'));

      expect(mockClient.sendPaymentDryRun).toHaveBeenCalledOnce();
      expect(result.current.fee).toBe(MOCK_SEND_PAYMENT_DRY_RUN.fee);
    });
  });

  describe('live mode — routing failures', () => {
    it('maps "allow_self_payment is not enabled" error to no_route status', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'sendPaymentDryRun').mockRejectedValue(
        new Error('allow_self_payment is not enabled'),
      );

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => useConfidence({ invoiceAddress: 'fibb1qtest...' }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.status).toBe('no_route');
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.code).toBe('NO_ROUTE');
    });

    it('maps "Insufficient balance: max outbound liquidity" to insufficient_liquidity status', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'sendPaymentDryRun').mockRejectedValue(
        new Error('Insufficient balance: max outbound liquidity 30100000000 is insufficient'),
      );

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => useConfidence({ invoiceAddress: 'fibb1qtest...' }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.status).toBe('insufficient_liquidity');
    });

    it('maps unknown error to error status', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'sendPaymentDryRun').mockRejectedValue(
        new Error('something completely unexpected'),
      );

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => useConfidence({ invoiceAddress: 'fibb1qtest...' }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.status).toBe('error');
      expect(result.current.error?.code).toBe('UNKNOWN');
    });
  });

  describe('deduplication', () => {
    it('does not re-run dry-run when invoiceAddress does not change', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'sendPaymentDryRun').mockResolvedValue(MOCK_SEND_PAYMENT_DRY_RUN);

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { rerender } = renderHook(
        () => useConfidence({ invoiceAddress: 'fibb1qtest...' }),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockClient.sendPaymentDryRun).toHaveBeenCalledOnce();
      });

      // Re-render with the same invoice — should NOT trigger another call
      rerender();
      expect(mockClient.sendPaymentDryRun).toHaveBeenCalledOnce();
    });
  });
});
