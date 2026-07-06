/**
 * components/InvoiceSheet.tsx
 *
 * Renders a Fiber invoice for display and sharing.
 *  - Uses `qrcode.react` (QRCodeSVG) to render actual vector QR codes.
 *  - Displays invoice address string (truncated + copy button).
 *  - Status badge (Open / Paid / Expired / Cancelled).
 *  - Expiry countdown.
 *
 * Can fetch data internally if `amount` and `currency` are provided,
 * and calls `onFulfilled` when the status transitions to 'Paid'.
 */

import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { InvoiceStatus, Hash256, FiberError } from '../lib/rpcClient';
import { useInvoice } from '../hooks/useInvoice';
import { usePaymentLink } from '../hooks/usePaymentLink';
import { ErrorResolutionBanner } from './ErrorResolutionBanner';


export interface InvoiceSheetProps {
  invoiceAddress?: string | null;
  paymentHash?: Hash256 | null;
  invoiceStatus?: InvoiceStatus | null;
  expiresAt?: Date | null;
  isLoading?: boolean;
  error?: FiberError | null;

  /** Amount in shannons to fetch invoice internally. */
  amount?: string;
  /** Currency string (e.g. "CKB") to fetch invoice internally. */
  currency?: string;
  /** Optional memo / description. */
  memo?: string;
  /** Expiry time in seconds. */
  expirySeconds?: number;
  /** Callback fired when payment is successful. */
  onFulfilled?: (paymentHash: string) => void;

  /** Called when user taps "Copy invoice". */
  onCopy?: (address: string) => void;
  mode?: 'live' | 'mock';
}


function statusStyle(status: InvoiceStatus | null): { color: string; bg: string; border: string; label: string } {
  switch (status) {
    case 'Open':
      return { color: 'var(--signal-active, #4FF0D8)', bg: 'var(--signal-dim, #4FF0D822)', border: 'var(--glass-edge, #151c2d)', label: 'Open — waiting for payment' };
    case 'Paid':
      return { color: 'var(--signal-active, #4FF0D8)', bg: 'var(--signal-dim, #4FF0D822)', border: 'var(--glass-edge, #151c2d)', label: '✓ Paid' };
    case 'Expired':
      return { color: 'var(--fail-signal, #f43f5e)', bg: 'transparent', border: 'var(--fail-signal, #f43f5e)', label: 'Expired' };
    case 'Cancelled':
      return { color: 'var(--fail-signal, #f43f5e)', bg: 'transparent', border: 'var(--fail-signal, #f43f5e)', label: 'Cancelled' };
    case 'Received':
      return { color: 'var(--ink-primary, #e2e8f0)', bg: 'var(--glass-surface, #0a0e17)', border: 'var(--glass-edge, #151c2d)', label: 'Received' };
    default:
      return { color: 'var(--ink-secondary, #64748b)', bg: 'transparent', border: 'var(--glass-edge, #151c2d)', label: 'Unknown' };
  }
}

function useCountdown(expiresAt: Date | null): string {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!expiresAt) { setRemaining(''); return; }

    function update() {
      const diff = expiresAt!.getTime() - Date.now();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${m}m ${s.toString().padStart(2, '0')}s`);
    }

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return remaining;
}


export function InvoiceSheet({
  invoiceAddress: propInvoiceAddress,
  paymentHash: propPaymentHash,
  invoiceStatus: propInvoiceStatus,
  expiresAt: propExpiresAt,
  isLoading: propIsLoading,
  error: propError,

  amount,
  currency,
  memo,
  expirySeconds,
  onFulfilled,

  onCopy,
  mode = 'mock',
}: InvoiceSheetProps) {
  const isInternal = amount !== undefined && currency !== undefined;

  // Unconditional hook call
  const internalData = useInvoice({
    amount: amount ?? '0',
    currency: currency ?? 'CKB',
    ...(memo !== undefined ? { memo } : {}),
    ...(expirySeconds !== undefined ? { expirySeconds } : {}),
  });

  const invoiceAddress = isInternal ? internalData.invoiceAddress : (propInvoiceAddress ?? null);
  const paymentHash = isInternal ? internalData.paymentHash : (propPaymentHash ?? null);
  const invoiceStatus = isInternal ? (internalData.invoiceStatus ?? null) : (propInvoiceStatus ?? null);
  const expiresAt = isInternal ? internalData.expiresAt : (propExpiresAt ?? null);
  const isLoading = isInternal ? internalData.isLoading : (propIsLoading ?? false);
  const error = isInternal ? internalData.error : (propError ?? null);

  const [copied, setCopied] = useState(false);
  const countdown = useCountdown(expiresAt);
  const st = statusStyle(invoiceStatus);

  const paymentLinkPayload = (invoiceAddress && paymentHash && amount && currency) 
    ? { invoiceAddress, paymentHash, amount, asset: currency, ...(memo !== undefined ? { memo } : {}) } 
    : null;
  const { copy: copyPaymentLink, copied: paymentLinkCopied } = usePaymentLink(paymentLinkPayload);

  // Fire onFulfilled callback on transitions to Paid
  const lastStatusRef = useRef<InvoiceStatus | null>(null);
  useEffect(() => {
    if (invoiceStatus === 'Paid' && lastStatusRef.current !== 'Paid' && onFulfilled && paymentHash) {
      onFulfilled(paymentHash);
    }
    lastStatusRef.current = invoiceStatus;
  }, [invoiceStatus, paymentHash, onFulfilled]);

  const containerStyle: React.CSSProperties = {
    background: 'var(--glass-surface, #0a0e17)',
    border: '1px solid var(--glass-edge, #151c2d)',
    borderRadius: '2px',
    padding: '20px',
    fontFamily: "'Satoshi', sans-serif",
    color: 'var(--ink-primary, #e2e8f0)',
    maxWidth: '400px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--ink-primary, #e2e8f0)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const modeBadge: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: mode === 'live' ? 'var(--signal-active, #4FF0D8)' : 'var(--ink-secondary, #64748b)',
    background: mode === 'live' ? 'var(--signal-dim, #4FF0D822)' : 'transparent',
    border: `1px solid ${mode === 'live' ? 'var(--signal-active, #4FF0D8)' : 'var(--glass-edge, #151c2d)'}`,
    borderRadius: '2px',
    padding: '2px 6px',
  };

  const statusBadge: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 12px',
    borderRadius: '2px',
    fontSize: '12px',
    fontWeight: 600,
    color: st.color,
    background: st.bg,
    border: `1px solid ${st.border}`,
    marginBottom: '14px',
    width: '100%',
    justifyContent: 'center',
  };

  const qrWrap: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
    position: 'relative',
    background: 'var(--glass-base, #05080f)',
    padding: '16px',
    borderRadius: '2px',
    border: '1px solid var(--glass-edge, #151c2d)',
  };

  const paidOverlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--signal-dim, #4FF0D840)',
    borderRadius: '2px',
    fontSize: '32px',
  };

  const invoiceBox: React.CSSProperties = {
    background: 'var(--glass-base, #05080f)',
    border: '1px solid var(--glass-edge, #151c2d)',
    borderRadius: '2px',
    padding: '8px 10px',
    fontSize: '10px',
    fontFamily: "'Space Mono', monospace",
    color: 'var(--ink-secondary, #64748b)',
    wordBreak: 'break-all',
    marginBottom: '10px',
    lineHeight: 1.5,
  };

  const copyBtn: React.CSSProperties = {
    width: '100%',
    padding: '10px',
    background: copied ? 'var(--signal-dim, #4FF0D822)' : 'transparent',
    border: `1px solid ${copied ? 'var(--signal-active, #4FF0D8)' : 'var(--glass-edge, #151c2d)'}`,
    borderRadius: '2px',
    color: copied ? 'var(--signal-active, #4FF0D8)' : 'var(--ink-primary, #e2e8f0)',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: "'Satoshi', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'all 0.2s',
    marginBottom: error ? '12px' : '0',
  };

  const metaRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--ink-secondary, #64748b)',
    fontFamily: "'Space Mono', monospace",
    marginBottom: '12px',
  };

  const handleCopy = async () => {
    if (!invoiceAddress) return;
    try {
      await navigator.clipboard.writeText(invoiceAddress);
    } catch {
      // Fallback
    }
    setCopied(true);
    onCopy?.(invoiceAddress);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading && !invoiceAddress) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ink-secondary, #64748b)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
          <div style={{ fontSize: '13px' }}>Creating invoice…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Receive Payment</span>
        <span style={modeBadge}>{mode === 'live' ? '● LIVE' : '− MOCK'}</span>
      </div>

      <div style={statusBadge}>{st.label}</div>

      {invoiceAddress && (
        <div style={qrWrap}>
          <QRCodeSVG
            value={invoiceAddress}
            size={140}
            bgColor="transparent"
            fgColor="var(--signal-active, #4FF0D8)"
            level="L"
          />
          {invoiceStatus === 'Paid' && (
            <div style={paidOverlay}></div>
          )}
        </div>
      )}

      {invoiceAddress && (
        <div style={invoiceBox} title={invoiceAddress}>
          {invoiceAddress.slice(0, 60)}…
        </div>
      )}

      <div style={metaRow}>
        <span>
          {paymentHash
            ? `Hash: ${paymentHash.slice(0, 12)}…${paymentHash.slice(-6)}`
            : 'No payment hash'}
        </span>
        {expiresAt && invoiceStatus === 'Open' && (
          <span style={{ color: countdown === 'Expired' ? 'var(--fail-signal, #f43f5e)' : 'var(--ink-secondary, #64748b)' }}>
            Expires in {countdown}
          </span>
        )}
      </div>

      {invoiceAddress && invoiceStatus !== 'Paid' && invoiceStatus !== 'Expired' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: error ? '12px' : '0' }}>
          <button style={{ ...copyBtn, marginBottom: 0 }} onClick={() => void handleCopy()}>
            {copied ? '✓ Copied!' : 'Copy Invoice'}
          </button>
          {paymentLinkPayload && (
            <button
              style={{
                ...copyBtn,
                marginBottom: 0,
                background: paymentLinkCopied ? 'var(--signal-dim, #4FF0D822)' : 'transparent',
                border: `1px solid ${paymentLinkCopied ? 'var(--signal-active, #4FF0D8)' : 'var(--glass-edge, #151c2d)'}`,
                color: paymentLinkCopied ? 'var(--signal-active, #4FF0D8)' : 'var(--ink-primary, #e2e8f0)',
              }}
              onClick={copyPaymentLink}
            >
              {paymentLinkCopied ? '✓ Link Copied!' : 'Copy Payment Link'}
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '12px' }}>
          <ErrorResolutionBanner error={error} />
        </div>
      )}
    </div>
  );
}
