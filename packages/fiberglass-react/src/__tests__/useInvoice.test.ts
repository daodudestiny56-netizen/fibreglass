/**
 * __tests__/useInvoice.test.ts
 *
 * Tests for the useInvoice hook (invoice creation + status polling).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useInvoice } from '../hooks/useInvoice';
import { FiberContext } from '../provider/FiberProvider';
import {
  MOCK_NEW_INVOICE,
  MOCK_GET_INVOICE_OPEN,
  MOCK_GET_INVOICE_PAID,
} from '../lib/mockFixtures';
import type { FiberContextValue } from '../lib/rpcClient';
import { FiberClient } from '../lib/rpcClient';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

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

const INVOICE_OPTIONS = {
  amount: '100000000',
  currency: 'Fibb',
  memo: 'test invoice',
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('mock mode', () => {
    it('creates invoice and returns invoiceAddress + paymentHash', async () => {
      const ctx = makeMockContext({ mode: 'mock' });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(() => useInvoice(INVOICE_OPTIONS), { wrapper });

      expect(result.current.isLoading).toBe(true);

      // Advance past the mock delay (200ms)
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.invoiceAddress).toBe(MOCK_NEW_INVOICE.invoice_address);
      expect(result.current.paymentHash).toBe(MOCK_NEW_INVOICE.invoice.payment_hash);
      expect(result.current.invoiceStatus).toBe('Open');
      expect(result.current.error).toBeNull();
    });

    it('transitions to Paid status after the mock auto-pay delay', async () => {
      const ctx = makeMockContext({ mode: 'mock' });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(() => useInvoice(INVOICE_OPTIONS), { wrapper });

      // Create invoice
      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.invoiceStatus).toBe('Open');

      // Advance past the mock auto-pay timer (6000ms)
      await act(async () => {
        vi.advanceTimersByTime(6500);
      });

      expect(result.current.invoiceStatus).toBe('Paid');
    });

    it('sets expiresAt as a Date', async () => {
      const ctx = makeMockContext({ mode: 'mock' });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(() => useInvoice(INVOICE_OPTIONS), { wrapper });

      await act(async () => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current.expiresAt).toBeInstanceOf(Date);
    });
  });

  describe('live mode', () => {
    it('calls client.newInvoice and returns invoice data', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'newInvoice').mockResolvedValue(MOCK_NEW_INVOICE);
      vi.spyOn(mockClient, 'getInvoice').mockResolvedValue(MOCK_GET_INVOICE_OPEN);

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => useInvoice({ ...INVOICE_OPTIONS, pollIntervalMs: 0 }),
        { wrapper },
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockClient.newInvoice).toHaveBeenCalledOnce();
      expect(result.current.invoiceAddress).toBe(MOCK_NEW_INVOICE.invoice_address);
      expect(result.current.invoiceStatus).toBe('Open');
    });

    it('polls get_invoice until Paid status', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'newInvoice').mockResolvedValue(MOCK_NEW_INVOICE);
      vi.spyOn(mockClient, 'getInvoice')
        .mockResolvedValueOnce(MOCK_GET_INVOICE_OPEN)
        .mockResolvedValueOnce(MOCK_GET_INVOICE_PAID);

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => useInvoice({ ...INVOICE_OPTIONS, pollIntervalMs: 500 }),
        { wrapper },
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      expect(result.current.invoiceStatus).toBe('Open');

      // Advance past the first poll
      await act(async () => {
        vi.advanceTimersByTime(600);
      });

      // pollNow to force the second poll
      act(() => {
        result.current.pollNow();
      });
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.invoiceStatus).toBe('Paid');
    });

    it('sets error when newInvoice fails', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'newInvoice').mockRejectedValue(new Error('node_info failed'));

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => useInvoice({ ...INVOICE_OPTIONS, pollIntervalMs: 0 }),
        { wrapper },
      );

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.rpcMethod).toBe('new_invoice');
      expect(result.current.invoiceAddress).toBeNull();
    });
  });
});
