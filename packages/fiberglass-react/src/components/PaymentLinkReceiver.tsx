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
    background: 'var(--glass-surface, #0a0e17)',
    border: '1px solid var(--glass-edge, #151c2d)',
    borderRadius: '2px',
    padding: '20px',
    fontFamily: "'Satoshi', sans-serif",
    color: 'var(--ink-primary, #e2e8f0)',
    maxWidth: '400px',
    margin: '0 auto'
  };

  if (decodeError || !payload) {
    return (
      <div style={containerStyle}>
        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--fail-signal, #f43f5e)' }}>
          {decodeError || 'This payment link looks broken or incomplete.'}
        </div>
      </div>
    );
  }

  const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' };
  const titleStyle: React.CSSProperties = { fontSize: '14px', fontWeight: 600, color: 'var(--ink-primary, #e2e8f0)', textTransform: 'uppercase', letterSpacing: '0.05em' };
  const modeBadge: React.CSSProperties = { fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: mode === 'live' ? 'var(--signal-active, #4FF0D8)' : 'var(--ink-secondary, #64748b)', background: mode === 'live' ? 'var(--signal-dim, #4FF0D822)' : 'transparent', border: `1px solid ${mode === 'live' ? 'var(--signal-active, #4FF0D8)' : 'var(--glass-edge, #151c2d)'}`, borderRadius: '2px', padding: '2px 6px' };
  
  let st = { color: 'var(--signal-active, #4FF0D8)', bg: 'var(--signal-dim, #4FF0D822)', border: 'var(--glass-edge, #151c2d)', label: 'Open — waiting for payment' };
  if (invoiceStatus === 'Paid') st = { color: 'var(--signal-active, #4FF0D8)', bg: 'var(--signal-dim, #4FF0D822)', border: 'var(--glass-edge, #151c2d)', label: '✓ Paid' };
  if (invoiceStatus === 'Expired') st = { color: 'var(--fail-signal, #f43f5e)', bg: 'transparent', border: 'var(--fail-signal, #f43f5e)', label: 'Expired' };
  if (invoiceStatus === 'Cancelled') st = { color: 'var(--fail-signal, #f43f5e)', bg: 'transparent', border: 'var(--fail-signal, #f43f5e)', label: 'Cancelled' };

  const statusBadge: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', padding: '4px 12px', borderRadius: '2px', fontSize: '12px', fontWeight: 600, color: st.color, background: st.bg, border: `1px solid ${st.border}`, marginBottom: '14px', width: '100%', justifyContent: 'center' };
  const qrWrap: React.CSSProperties = { display: 'flex', justifyContent: 'center', marginBottom: '16px', position: 'relative', background: 'var(--glass-base, #05080f)', padding: '16px', borderRadius: '2px', border: '1px solid var(--glass-edge, #151c2d)' };
  const paidOverlay: React.CSSProperties = { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--signal-dim, #4FF0D840)', borderRadius: '2px', fontSize: '32px' };
  const invoiceBox: React.CSSProperties = { background: 'var(--glass-base, #05080f)', border: '1px solid var(--glass-edge, #151c2d)', borderRadius: '2px', padding: '8px 10px', fontSize: '10px', fontFamily: "'Space Mono', monospace", color: 'var(--ink-secondary, #64748b)', wordBreak: 'break-all', marginBottom: '10px', lineHeight: 1.5 };
  const copyBtn: React.CSSProperties = { width: '100%', padding: '10px', background: copied ? 'var(--signal-dim, #4FF0D822)' : 'transparent', border: `1px solid ${copied ? 'var(--signal-active, #4FF0D8)' : 'var(--glass-edge, #151c2d)'}`, borderRadius: '2px', color: copied ? 'var(--signal-active, #4FF0D8)' : 'var(--ink-primary, #e2e8f0)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: "'Satoshi', sans-serif", textTransform: 'uppercase', letterSpacing: '0.05em', transition: 'all 0.2s', marginBottom: '0' };
  const metaRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--ink-secondary, #64748b)', fontFamily: "'Space Mono', monospace", marginBottom: '12px' };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={titleStyle}>Payment Link</span>
        <span style={modeBadge}>{mode === 'live' ? '● LIVE' : '− MOCK'}</span>
      </div>
      <div style={statusBadge}>{st.label}</div>
      <div style={qrWrap}>
        <QRCodeSVG value={payload.invoiceAddress} size={140} bgColor="transparent" fgColor="var(--signal-active, #4FF0D8)" level="L" />
        {invoiceStatus === 'Paid' && <div style={paidOverlay}></div>}
      </div>
      <div style={invoiceBox} title={payload.invoiceAddress}>{payload.invoiceAddress.slice(0, 60)}…</div>
      <div style={metaRow}>
        <span>Amount: {payload.amount} {payload.asset}</span>
        {payload.memo && <span>{payload.memo}</span>}
      </div>
      {invoiceStatus !== 'Paid' && invoiceStatus !== 'Expired' && (
        <button style={copyBtn} onClick={() => void handleCopy()}>
          {copied ? '✓ Copied!' : 'Copy Invoice'}
        </button>
      )}
    </div>
  );
}
