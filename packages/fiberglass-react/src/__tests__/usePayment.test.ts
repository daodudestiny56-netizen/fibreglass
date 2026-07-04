/**
 * __tests__/usePayment.test.ts
 *
 * Tests for the usePayment hook (payment status polling).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { usePayment } from '../hooks/usePayment';
import { FiberContext } from '../provider/FiberProvider';
import {
  MOCK_GET_PAYMENT_SUCCESS,
  MOCK_GET_PAYMENT_NO_ROUTE,
} from '../lib/mockFixtures';
import type { FiberContextValue, Hash256 } from '../lib/rpcClient';
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
    ...overrides,
  };
}

const MOCK_HASH = '0xa665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3' as Hash256;


describe('usePayment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with null paymentHash', () => {
    it('returns null payment and does not load', () => {
      const ctx = makeMockContext({ mode: 'mock' });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => usePayment({ paymentHash: null }),
        { wrapper },
      );

      expect(result.current.payment).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.status).toBeNull();
    });
  });

  describe('mock mode', () => {
    it('returns MOCK_GET_PAYMENT_SUCCESS after providing a hash', async () => {
      const ctx = makeMockContext({ mode: 'mock' });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => usePayment({ paymentHash: MOCK_HASH, pollIntervalMs: 0 }),
        { wrapper },
      );

      // Advance past delay(150)
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.payment).not.toBeNull();
      expect(result.current.status).toBe('Success');
      expect(result.current.payment?.routers).toHaveLength(MOCK_GET_PAYMENT_SUCCESS.routers.length);
      expect(result.current.error).toBeNull();
    });
  });

  describe('live mode', () => {
    it('calls client.getPayment and returns payment data', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'getPayment').mockResolvedValue(MOCK_GET_PAYMENT_SUCCESS);

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => usePayment({ paymentHash: MOCK_HASH, pollIntervalMs: 0 }),
        { wrapper },
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockClient.getPayment).toHaveBeenCalledOnce();
      expect(mockClient.getPayment).toHaveBeenCalledWith({ payment_hash: MOCK_HASH });
      expect(result.current.status).toBe('Success');
      expect(result.current.isLoading).toBe(false);
    });

    it('stops polling after a terminal status is reached', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'getPayment').mockResolvedValue(MOCK_GET_PAYMENT_SUCCESS);

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => usePayment({ paymentHash: MOCK_HASH, pollIntervalMs: 200 }),
        { wrapper },
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.status).toBe('Success');

      const callsAfterSuccess = vi.mocked(mockClient.getPayment).mock.calls.length;

      // Advance more timers — no additional calls should happen (terminal status stops polling)
      await act(async () => {
        vi.advanceTimersByTime(1000);
      });

      expect(mockClient.getPayment).toHaveBeenCalledTimes(callsAfterSuccess);
    });

    it('surfaces error from client.getPayment', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'getPayment').mockRejectedValue(
        new Error('insufficient outbound liquidity on channel'),
      );

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => usePayment({ paymentHash: MOCK_HASH, pollIntervalMs: 0 }),
        { wrapper },
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.rpcMethod).toBe('get_payment');
    });

    it('returns Failed status with failed_error data', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'getPayment').mockResolvedValue(MOCK_GET_PAYMENT_NO_ROUTE);

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => usePayment({ paymentHash: MOCK_HASH, pollIntervalMs: 0 }),
        { wrapper },
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.status).toBe('Failed');
      expect(result.current.payment?.failed_error).toContain('no path found');
    });
  });

  describe('refetch', () => {
    it('refetch triggers an additional getPayment call', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'getPayment').mockResolvedValue(MOCK_GET_PAYMENT_SUCCESS);

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => usePayment({ paymentHash: MOCK_HASH, pollIntervalMs: 0 }),
        { wrapper },
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.refetch();
      });
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockClient.getPayment).toHaveBeenCalledTimes(2);
    });
  });
});
