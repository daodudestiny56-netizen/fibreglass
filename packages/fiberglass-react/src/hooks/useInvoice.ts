/**
 * hooks/useInvoice.ts
 *
 * Wraps `new_invoice` (create) and `get_invoice` (poll).
 *
 * - Creates an invoice on first call / when params change.
 * - Polls `get_invoice` every `pollIntervalMs` (default 3 000 ms) until
 *   the status reaches a terminal state (Paid | Cancelled | Expired).
 * - In mock mode, uses MOCK_NEW_INVOICE and simulates a transition to
 *   Paid after ~6 s to allow visual testing of the fulfillment flow.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFiberNode } from './useFiberNode';
import { MOCK_NEW_INVOICE, MOCK_GET_INVOICE_OPEN, MOCK_GET_INVOICE_PAID } from '../lib/mockFixtures';
import { buildFiberError } from '../lib/errorMap';
import type {
  AmountString,
  FiberError,
  Hash256,
  InvoiceStatus,
  UseInvoiceResult,
} from '../lib/rpcClient';

export interface UseInvoiceOptions {
  /** Amount in shannons or asset minimal unit. */
  amount: AmountString;
  /** Currency string — "CKB" for native, or UDT type hash. */
  currency: string;
  /** Human-readable memo / description for the invoice. */
  memo?: string;
  /** Expiry in seconds. Defaults to the node's configured default. */
  expirySeconds?: number;
  /** Polling interval for `get_invoice`. 0 = no polling. Default: 3000. */
  pollIntervalMs?: number;
}

const TERMINAL_STATUSES: InvoiceStatus[] = ['Paid', 'Cancelled', 'Expired'];

export function useInvoice(options: UseInvoiceOptions): UseInvoiceResult {
  const {
    amount,
    currency,
    memo,
    expirySeconds,
    pollIntervalMs = 3_000,
  } = options;

  const { client, mode } = useFiberNode();

  const [invoiceAddress, setInvoiceAddress] = useState<string | null>(null);
  const [paymentHash, setPaymentHash] = useState<Hash256 | null>(null);
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FiberError | null>(null);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Track whether we've created the invoice already for this set of params
  const createdRef = useRef(false);
  // Mock auto-pay timeout
  const mockPayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async (hash: Hash256) => {
    try {
      if (mode === 'mock') {
        // Status is managed by the mock auto-pay timeout; nothing to do here
        return;
      }
      const data = await client.getInvoice({ payment_hash: hash });
      setInvoiceStatus(data.status);
      if (TERMINAL_STATUSES.includes(data.status)) {
        stopPolling();
      }
    } catch (err) {
      // Non-fatal polling error — log and continue
      if (import.meta.env.DEV) {
        console.warn('[Fiberglass] get_invoice poll error:', err);
      }
    }
  }, [client, mode, stopPolling]);

  const pollNow = useCallback(() => {
    if (paymentHash) void pollStatus(paymentHash);
  }, [paymentHash, pollStatus]);

  const createInvoice = useCallback(async () => {
    if (createdRef.current) return;
    createdRef.current = true;

    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'mock') {
        await delay(200);
        const data = MOCK_NEW_INVOICE;
        client.logMockCall('new_invoice', { amount, currency, description: memo, ...(expirySeconds ? { expiry: expirySeconds } : {}) }, data);
        setInvoiceAddress(data.invoice_address);
        setPaymentHash(data.invoice.payment_hash);
        setInvoiceStatus(MOCK_GET_INVOICE_OPEN.status);
        setExpiresAt(new Date(data.invoice.expiry * 1000));

        // Simulate payment arriving after ~6 s in mock mode
        mockPayRef.current = setTimeout(() => {
          client.logMockCall('get_invoice', { payment_hash: data.invoice.payment_hash }, { invoice_address: data.invoice_address, invoice: data.invoice, status: 'Paid' });
          setInvoiceStatus(MOCK_GET_INVOICE_PAID.status);
          stopPolling();
        }, 6_000);
      } else {
        const data = await client.newInvoice({
          amount,
          currency,
          ...(memo !== undefined ? { description: memo } : {}),
          ...(expirySeconds !== undefined ? { expiry: expirySeconds } : {}),
        });
        setInvoiceAddress(data.invoice_address);
        setPaymentHash(data.invoice.payment_hash);
        setInvoiceStatus('Open');
        setExpiresAt(new Date(data.invoice.expiry * 1000));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(buildFiberError(msg, 'new_invoice'));
      createdRef.current = false; // Allow retry
    } finally {
      setIsLoading(false);
    }
  }, [amount, currency, memo, expirySeconds, mode, client, stopPolling]);

  // Create invoice on mount / when key params change
  useEffect(() => {
    createdRef.current = false;
    void createInvoice();

    return () => {
      stopPolling();
      if (mockPayRef.current !== null) clearTimeout(mockPayRef.current);
    };
  }, [amount, currency, memo, expirySeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Start polling once we have a payment hash and a poll interval
  useEffect(() => {
    if (!paymentHash || pollIntervalMs <= 0) return;
    if (invoiceStatus && TERMINAL_STATUSES.includes(invoiceStatus)) return;

    pollIntervalRef.current = setInterval(
      () => void pollStatus(paymentHash),
      pollIntervalMs,
    );

    return stopPolling;
  }, [paymentHash, pollIntervalMs, pollStatus, invoiceStatus, stopPolling]);

  return {
    invoiceAddress,
    paymentHash,
    invoiceStatus,
    expiresAt,
    isLoading,
    error,
    pollNow,
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
