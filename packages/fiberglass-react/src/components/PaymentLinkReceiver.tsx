import React, { useEffect, useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReadPaymentLink } from '../hooks/usePaymentLink';
import { useFiberNode } from '../hooks/useFiberNode';
import type { InvoiceStatus, Hash256 } from '../lib/rpcClient';

export interface PaymentLinkReceiverProps {
  encodedPayload: string;
  onFulfilled?: (paymentHash: string) => void;
}

const TERMINAL_STATUSES: InvoiceStatus[] = ['Paid', 'Cancelled', 'Expired'];

export function PaymentLinkReceiver({ encodedPayload, onFulfilled }: PaymentLinkReceiverProps) {
  const { payload, error: decodeError } = useReadPaymentLink(encodedPayload);
  const { client, mode } = useFiberNode();
  
  const [invoiceStatus, setInvoiceStatus] = useState<InvoiceStatus>('Open');
  const [copied, setCopied] = useState(false);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current !== null) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(async () => {
    if (!payload?.paymentHash) return;
    try {
      if (mode === 'mock') {
        return;
      }
      const data = await client.getInvoice({ payment_hash: payload.paymentHash as Hash256 });
      setInvoiceStatus(data.status);
      if (TERMINAL_STATUSES.includes(data.status)) {
        stopPolling();
      }
    } catch (err) {
      // Ignore polling errors
    }
  }, [client, mode, payload?.paymentHash, stopPolling]);

  useEffect(() => {
    if (!payload?.paymentHash) return;
    
    if (mode === 'mock') {
      const id = setTimeout(() => {
        setInvoiceStatus('Paid');
      }, 5000);
      return () => clearTimeout(id);
    } else {
      pollIntervalRef.current = setInterval(() => void pollStatus(), 3000);
      return stopPolling;
    }
  }, [payload?.paymentHash, mode, pollStatus, stopPolling]);

  const lastStatusRef = useRef<InvoiceStatus | null>(null);
  useEffect(() => {
    if (invoiceStatus === 'Paid' && lastStatusRef.current !== 'Paid' && onFulfilled && payload?.paymentHash) {
      onFulfilled(payload.paymentHash);
    }
    lastStatusRef.current = invoiceStatus;
  }, [invoiceStatus, onFulfilled, payload?.paymentHash]);

  const handleCopy = async () => {
    if (!payload?.invoiceAddress) return;
    try {
      await navigator.clipboard.writeText(payload.invoiceAddress);
    } catch {
      // Fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const containerStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '3px solid var(--ink)',
    borderRadius: '0',
    padding: '20px',
    fontFamily: "'Inter', sans-serif",
    color: 'var(--ink)',
    maxWidth: '400px',
    width: '100%',
    margin: '0 auto',
    boxShadow: '6px 6px 0px var(--ink)',
  };

  if (decodeError || !payload) {
    return (
      <div style={containerStyle}>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--accent-secondary)', fontWeight: 600 }}>
          {decodeError || 'This payment link looks broken or incomplete.'}
        </div>
      </div>
    );
  }

  const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' };
  const titleStyle: React.CSSProperties = { fontSize: '18px', fontWeight: 700, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Space Grotesk', sans-serif" };
  const modeBadge: React.CSSProperties = { fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink)', background: mode === 'live' ? 'var(--accent-primary)' : 'var(--mock-tag)', border: '3px solid var(--ink)', borderRadius: '0', padding: '4px 8px', fontFamily: "'Space Grotesk', sans-serif", boxShadow: '2px 2px 0px var(--ink)' };
  
  let st = { color: 'var(--ink)', bg: 'var(--accent-primary)', border: 'var(--ink)', label: 'Waiting for Payment' };
  if (invoiceStatus === 'Paid') st = { color: 'var(--ink)', bg: 'var(--success)', border: 'var(--ink)', label: '✓ Paid' };
  if (invoiceStatus === 'Expired') st = { color: 'var(--ink)', bg: 'var(--accent-secondary)', border: 'var(--ink)', label: 'Code Expired' };
  if (invoiceStatus === 'Cancelled') st = { color: 'var(--ink)', bg: 'var(--accent-secondary)', border: 'var(--ink)', label: 'Code Cancelled' };

  const statusBadge: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '6px 12px', borderRadius: '0', fontSize: '14px', fontWeight: 700, color: st.color, background: st.bg, border: `3px solid ${st.border}`, marginBottom: '16px', width: '100%', justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', boxShadow: '2px 2px 0px var(--ink)' };
  const qrWrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', marginBottom: '16px', position: 'relative', background: '#FFFFFF', padding: '16px', borderRadius: '0', border: '3px solid var(--ink)', boxShadow: 'inset 4px 4px 0px rgba(17,17,17,0.1)' };
  const paidOverlay: React.CSSProperties = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 200, 83, 0.4)', borderRadius: '0', fontSize: '48px' };
  const invoiceBox: React.CSSProperties = { background: '#FFFFFF', border: '3px solid var(--ink)', borderRadius: '0', padding: '12px 14px', fontSize: '11px', fontFamily: "'Space Mono', monospace", color: 'var(--ink)', wordBreak: 'break-all', marginBottom: '12px', lineHeight: 1.5, boxShadow: 'inset 4px 4px 0px rgba(17,17,17,0.1)' };
  const copyBtn: React.CSSProperties = { width: '100%', padding: '12px', background: copied ? 'var(--success)' : 'var(--accent-primary)', border: '3px solid var(--ink)', borderRadius: '0', color: 'var(--ink)', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.1s ease-out', marginBottom: '0', boxShadow: '2px 2px 0px var(--ink)' };
  const metaRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--ink)', fontFamily: "'Space Mono', monospace", marginBottom: '16px', fontWeight: 700, flexWrap: 'wrap' as const, gap: '4px' };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Payment Link</span>
        <span style={modeBadge} title={mode === 'live' ? 'Live = connected to a real Fiber node right now.' : 'Mock = practice data, not a real payment'}>{mode === 'live' ? 'LIVE' : 'MOCK'}</span>
      </div>
      <div style={statusBadge}>{st.label}</div>
      <div style={qrWrap}>
        <QRCodeSVG value={payload.invoiceAddress} size={160} bgColor="transparent" fgColor="var(--ink)" level="L" className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] min-w-[140px] min-h-[140px]" />
        {invoiceStatus === 'Paid' && <div style={paidOverlay}></div>}
      </div>
      <div style={invoiceBox} title={payload.invoiceAddress}>{payload.invoiceAddress.slice(0, 60)}…</div>
      <div style={metaRow}>
        <span>Amount: {payload.amount} {payload.asset}</span>
        {payload.memo && <span>{payload.memo}</span>}
      </div>
      {invoiceStatus !== 'Paid' && invoiceStatus !== 'Expired' && (
        <button
          style={{ ...copyBtn, minHeight: '44px' }}
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
      )}
    </div>
  );
}
