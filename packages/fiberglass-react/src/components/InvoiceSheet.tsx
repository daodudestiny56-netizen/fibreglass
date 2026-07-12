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
      return { color: 'var(--ink)', bg: 'var(--accent-primary)', border: 'var(--ink)', label: 'Waiting for Payment' };
    case 'Paid':
      return { color: 'var(--ink)', bg: 'var(--success)', border: 'var(--ink)', label: '✓ Paid' };
    case 'Expired':
      return { color: 'var(--ink)', bg: 'var(--accent-secondary)', border: 'var(--ink)', label: 'Code Expired' };
    case 'Cancelled':
      return { color: 'var(--ink)', bg: 'var(--accent-secondary)', border: 'var(--ink)', label: 'Code Cancelled' };
    case 'Received':
      return { color: 'var(--ink)', bg: 'var(--success)', border: 'var(--ink)', label: 'Funds Received' };
    default:
      return { color: 'var(--ink)', bg: '#FFFFFF', border: 'var(--ink)', label: 'Unknown' };
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
    background: '#FFFFFF',
    border: '3px solid var(--ink)',
    borderRadius: '0',
    padding: '20px',
    fontFamily: "'Inter', sans-serif",
    color: 'var(--ink)',
    maxWidth: '400px',
    width: '100%',
    boxShadow: '6px 6px 0px var(--ink)'
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--ink)',
    fontFamily: "'Space Grotesk', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const modeBadge: React.CSSProperties = {
    fontSize: '10px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--ink)',
    background: mode === 'live' ? 'var(--accent-primary)' : 'var(--mock-tag)',
    border: '3px solid var(--ink)',
    borderRadius: '0',
    padding: '4px 8px',
    boxShadow: '2px 2px 0px var(--ink)',
  };

  const statusBadge: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    borderRadius: '0',
    fontSize: '14px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    textTransform: 'uppercase',
    color: st.color,
    background: st.bg,
    border: `3px solid ${st.border}`,
    marginBottom: '16px',
    width: '100%',
    justifyContent: 'center',
    boxShadow: '2px 2px 0px var(--ink)',
  };

  const qrWrap: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
    position: 'relative',
    background: '#FFFFFF',
    padding: '16px',
    borderRadius: '0',
    border: '3px solid var(--ink)',
    boxShadow: 'inset 4px 4px 0px rgba(17,17,17,0.1)',
  };

  const paidOverlay: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 200, 83, 0.4)',
    borderRadius: '0',
    fontSize: '48px',
  };

  const invoiceBox: React.CSSProperties = {
    background: '#FFFFFF',
    border: '3px solid var(--ink)',
    borderRadius: '0',
    padding: '12px 14px',
    fontSize: '11px',
    fontFamily: "'Space Mono', monospace",
    color: 'var(--ink)',
    wordBreak: 'break-all',
    marginBottom: '12px',
    lineHeight: 1.5,
    boxShadow: 'inset 4px 4px 0px rgba(17,17,17,0.1)',
  };

  const copyBtn: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    background: copied ? 'var(--success)' : 'var(--accent-primary)',
    border: '3px solid var(--ink)',
    borderRadius: '0',
    color: 'var(--ink)',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    transition: 'all 0.1s ease-out',
    marginBottom: error ? '12px' : '0',
    boxShadow: '2px 2px 0px var(--ink)',
  };

  const copyBtnLink: React.CSSProperties = {
    ...copyBtn,
    background: paymentLinkCopied ? 'var(--success)' : '#FFFFFF',
  };

  const metaRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: 'var(--ink)',
    fontFamily: "'Space Mono', monospace",
    marginBottom: '16px',
    fontWeight: 700,
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
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--ink)' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px', animation: 'spin 1s linear infinite', display: 'inline-block', fontFamily: "'Space Grotesk', sans-serif" }}>⟳</div>
          <div style={{ fontSize: '13px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>Creating payment code…</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Receive Payment</span>
        <span style={modeBadge} title={mode === 'live' ? 'Live = connected to a real Fiber node right now.' : 'Mock = practice data, not a real payment'}>{mode === 'live' ? 'LIVE' : 'MOCK'}</span>
      </div>

      <div style={statusBadge}>{st.label}</div>

      {invoiceAddress && (
        <div style={qrWrap}>
          <QRCodeSVG
            value={invoiceAddress}
            size={160}
            bgColor="transparent"
            fgColor="var(--ink)"
            level="L"
            className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] min-w-[140px] min-h-[140px]"
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

      <div style={metaRow} className="flex-col gap-2 sm:flex-row sm:gap-0">
        <span style={{ wordBreak: 'break-all' as const }}>
          {paymentHash
            ? `Hash: ${paymentHash.slice(0, 12)}…${paymentHash.slice(-6)}`
            : 'No payment hash'}
        </span>
        {expiresAt && invoiceStatus === 'Open' && (
          <span style={{ color: countdown === 'Expired' ? 'var(--accent-secondary)' : 'var(--ink)', flexShrink: 0 }}>
            Expires in {countdown}
          </span>
        )}
      </div>

      {invoiceAddress && invoiceStatus !== 'Paid' && invoiceStatus !== 'Expired' && (
        <div className="flex flex-col sm:flex-row gap-3" style={{ marginBottom: error ? '12px' : '0' }}>
          <button
            style={{ ...copyBtn, marginBottom: 0, minHeight: '44px' }}
            onClick={(e) => {
              void handleCopy();
              const el = e.currentTarget;
              el.style.transform = 'translate(2px, 2px)';
              el.style.boxShadow = '2px 2px 0px var(--ink)';
              setTimeout(() => {
                el.style.transform = '';
                el.style.boxShadow = '2px 2px 0px var(--ink)';
              }, 100);
            }}
          >
            {copied ? '✓ Copied!' : 'Copy Payment Code'}
          </button>
          {paymentLinkPayload && (
            <button
              style={{
                ...copyBtnLink,
                marginBottom: 0,
                minHeight: '44px',
              }}
              onClick={(e) => {
                copyPaymentLink();
                const el = e.currentTarget;
                el.style.transform = 'translate(2px, 2px)';
                el.style.boxShadow = '2px 2px 0px var(--ink)';
                setTimeout(() => {
                  el.style.transform = '';
                  el.style.boxShadow = '2px 2px 0px var(--ink)';
                }, 100);
              }}
            >
              {paymentLinkCopied ? '✓ Copied!' : 'Copy Link'}
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
