/**
 * hooks/usePayment.ts
 *
 * Wraps `get_payment` to fetch payment status and route data.
 * Powers PaymentRouteVisualizer — the `routers` field from GetPaymentResponse
 * is the hop-path the visualizer renders.
 *
 * Polls until a terminal status (Success | Failed) is reached.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFiberNode } from './useFiberNode';
import { MOCK_GET_PAYMENT_SUCCESS } from '../lib/mockFixtures';
import { buildFiberError } from '../lib/errorMap';
import type {
  FiberError,
  GetPaymentResponse,
  Hash256,
  PaymentStatus,
  UsePaymentResult,
} from '../lib/rpcClient';

export interface UsePaymentOptions {
  paymentHash: Hash256 | null;
  /** Poll interval in ms. 0 = no polling. Default: 2000. */
  pollIntervalMs?: number;
}

const TERMINAL_STATUSES: PaymentStatus[] = ['Success', 'Failed'];

export function usePayment({
  paymentHash,
  pollIntervalMs = 2_000,
}: UsePaymentOptions): UsePaymentResult {
  const { client, mode } = useFiberNode();

  const [payment, setPayment] = useState<GetPaymentResponse | null>(null);
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FiberError | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRequestIdRef = useRef(0);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const fetchPayment = useCallback(async () => {
    if (!paymentHash) return;

    const requestId = ++lastRequestIdRef.current;
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'mock') {
        await delay(150);
        const data = MOCK_GET_PAYMENT_SUCCESS;
        client.logMockCall('get_payment', { payment_hash: paymentHash }, data);
        if (requestId === lastRequestIdRef.current) {
          setPayment(data);
          setStatus(data.status);
          if (TERMINAL_STATUSES.includes(data.status)) stopPolling();
        }
      } else {
        const data = await client.getPayment({ payment_hash: paymentHash });
        if (requestId === lastRequestIdRef.current) {
          setPayment(data);
          setStatus(data.status);
          if (TERMINAL_STATUSES.includes(data.status)) stopPolling();
        }
      }
    } catch (err) {
      if (requestId === lastRequestIdRef.current) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(buildFiberError(msg, 'get_payment'));
      }
    } finally {
      if (requestId === lastRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [client, mode, paymentHash, stopPolling]);

  // Fetch immediately when paymentHash appears
  useEffect(() => {
    if (!paymentHash) return;
    void fetchPayment();
  }, [paymentHash, fetchPayment]);

  // Polling
  useEffect(() => {
    if (!paymentHash || pollIntervalMs <= 0) return;
    if (status && TERMINAL_STATUSES.includes(status)) return;

    pollRef.current = setInterval(() => void fetchPayment(), pollIntervalMs);
    return stopPolling;
  }, [paymentHash, pollIntervalMs, fetchPayment, status, stopPolling]);

  return {
    payment,
    status,
    isLoading,
    error,
    refetch: fetchPayment,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
