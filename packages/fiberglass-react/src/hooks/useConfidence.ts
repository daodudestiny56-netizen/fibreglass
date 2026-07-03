/**
 * hooks/useConfidence.ts
 *
 * Wraps `send_payment` with `dry_run: true` to validate routing/fees
 * without committing a real payment.
 *
 * Returns a `ConfidenceStatus` plus fee/route info on success.
 * The hook re-runs whenever `invoiceAddress` or `amount` changes.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useFiberNode } from './useFiberNode';
import { MOCK_SEND_PAYMENT_DRY_RUN } from '../lib/mockFixtures';
import { buildFiberError, classifyError } from '../lib/errorMap';
import type {
  AmountString,
  ConfidenceStatus,
  FiberError,
  RouterHop,
  UseConfidenceResult,
} from '../lib/rpcClient';

export interface UseConfidenceOptions {
  /** BOLT11-style invoice address to validate. */
  invoiceAddress: string | null;
  /** Optional amount override (for invoices with no embedded amount). */
  amount?: AmountString;
}

export function useConfidence({
  invoiceAddress,
  amount,
}: UseConfidenceOptions): UseConfidenceResult {
  const { client, mode } = useFiberNode();

  const [status, setStatus] = useState<ConfidenceStatus>('loading');
  const [fee, setFee] = useState<AmountString | null>(null);
  const [route, setRoute] = useState<RouterHop[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FiberError | null>(null);

  // Track the last invoice address we ran a dry-run for to avoid duplicate calls
  const lastInvoice = useRef<string | null>(null);

  const run = useCallback(async () => {
    if (!invoiceAddress) {
      setStatus('loading');
      return;
    }
    if (lastInvoice.current === invoiceAddress + (amount ?? '')) return;
    lastInvoice.current = invoiceAddress + (amount ?? '');

    setIsLoading(true);
    setError(null);
    setStatus('loading');

    try {
      if (mode === 'mock') {
        await delay(180);
        const data = MOCK_SEND_PAYMENT_DRY_RUN;
        setFee(data.fee);
        setRoute(data.router);
        setStatus('ready');
      } else {
        const params = { invoice: invoiceAddress, ...(amount ? { amount } : {}) };
        const data = await client.sendPaymentDryRun(params);
        setFee(data.fee);
        setRoute(data.router);
        setStatus('ready');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      const code = classifyError(msg);
      const fiberErr = buildFiberError(msg, 'send_payment');
      setError(fiberErr);
      setFee(null);
      setRoute(null);

      // Map error code to ConfidenceStatus
      if (code === 'NO_ROUTE') setStatus('no_route');
      else if (code === 'INSUFFICIENT_LIQUIDITY') setStatus('insufficient_liquidity');
      else if (code === 'ASSET_MISMATCH') setStatus('asset_mismatch');
      else setStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [client, mode, invoiceAddress, amount]);

  useEffect(() => {
    void run();
  }, [run]);

  return { status, fee, route, isLoading, error };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
