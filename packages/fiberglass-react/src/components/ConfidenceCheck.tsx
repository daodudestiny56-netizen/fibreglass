/**
 * components/ConfidenceCheck.tsx
 *
 * Displays the result of a `send_payment` dry-run (via useConfidence).
 * Shows route confidence status, estimated fee, hop count, and an error
 * if routing failed.
 *
 * Can fetch data internally if `invoiceAddress` is provided,
 * or display pre-fetched confidence details.
 */

import React from 'react';
import type { ConfidenceStatus, AmountString, RouterHop, FiberError } from '../lib/rpcClient';
import { useConfidence } from '../hooks/useConfidence';
import { ErrorResolutionBanner } from './ErrorResolutionBanner';


export interface ConfidenceCheckProps {
  status?: ConfidenceStatus;
  fee?: AmountString | null;
  route?: RouterHop[] | null;
  isLoading?: boolean;
  error?: FiberError | null;

  /** Invoice address to perform internal dry-run routing confidence validation. */
  invoiceAddress?: string | null;
  /** Optional amount override (in shannons). */
  amount?: AmountString;
  /** Optional asset label (for display or future classification). */
  asset?: string;

  /** Optional render-prop escape hatch to custom render status text/elements. */
  renderStatus?: (status: ConfidenceStatus) => React.ReactNode;
  mode?: 'live' | 'mock';
}


function shannonsToCkb(shannons: string): string {
  const val = BigInt(shannons);
  const ckb = Number(val) / 1e8;
  if (ckb < 0.0001) return `${shannons} shannons`;
  return `${ckb.toLocaleString(undefined, { maximumFractionDigits: 6 })} CKB`;
}

interface StatusInfo {
  icon: string;
  label: string;
  color: string;
  bg: string;
  border: string;
}

function statusInfo(status: ConfidenceStatus): StatusInfo {
  switch (status) {
    case 'ready':
      return {
        icon: '✓',
        label: 'Route found — ready to send',
        color: 'var(--signal-active, #4FF0D8)',
        bg: 'var(--signal-dim, #4FF0D822)',
        border: 'var(--glass-edge, #151c2d)',
      };
    case 'loading':
      return {
        icon: '⟳',
        label: 'Checking route…',
        color: 'var(--ink-secondary, #64748b)',
        bg: 'transparent',
        border: 'var(--glass-edge, #151c2d)',
      };
    case 'no_route':
      return {
        icon: '✕',
        label: 'No route available',
        color: 'var(--fail-signal, #f43f5e)',
        bg: 'transparent',
        border: 'var(--glass-edge, #151c2d)',
      };
    case 'insufficient_liquidity':
      return {
        icon: '',
        label: 'Insufficient channel liquidity',
        color: '#fb923c',
        bg: '#1e1204',
        border: '#d9770644',
      };
    case 'asset_mismatch':
      return {
        icon: '',
        label: 'Asset type mismatch',
        color: '#facc15',
        bg: 'transparent',
        border: 'var(--glass-edge, #151c2d)',
      };
    case 'error':
      return {
        icon: '!',
        label: 'Routing check failed',
        color: 'var(--fail-signal, #f43f5e)',
        bg: 'transparent',
        border: 'var(--glass-edge, #151c2d)',
      };
  }
}


export function ConfidenceCheck({
  status: propStatus,
  fee: propFee,
  route: propRoute,
  isLoading: propIsLoading,
  error: propError,

  invoiceAddress,
  amount,
  asset,

  renderStatus,
  mode = 'mock',
}: ConfidenceCheckProps) {
  // Call hook unconditionally to avoid violating rules of hooks
  const internalData = useConfidence({
    invoiceAddress: invoiceAddress ?? null,
    ...(amount !== undefined ? { amount } : {}),
  });

  const isInternal = invoiceAddress !== undefined;
  const status = isInternal ? internalData.status : (propStatus ?? 'loading');
  const fee = isInternal ? internalData.fee : (propFee ?? null);
  const route = isInternal ? internalData.route : (propRoute ?? null);
  const isLoading = isInternal ? internalData.isLoading : (propIsLoading ?? false);
  const error = isInternal ? internalData.error : (propError ?? null);

  const info = statusInfo(status);

  const containerStyle: React.CSSProperties = {
    background: 'var(--glass-surface, #0a0e17)',
    border: '1px solid var(--glass-edge, #151c2d)',
    borderRadius: '2px',
    padding: '16px 20px',
    fontFamily: "'Satoshi', sans-serif",
    color: 'var(--ink-primary, #e2e8f0)',
  };

  const statusBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: info.bg,
    border: `1px solid ${info.border}`,
    borderRadius: '2px',
    marginBottom: '14px',
  };

  const iconStyle: React.CSSProperties = {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: `${info.color}22`,
    border: `1px solid ${info.color}55`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 700,
    color: info.color,
    flexShrink: 0,
    animation: status === 'loading' || isLoading ? 'spin 1s linear infinite' : 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 500,
    color: info.color,
  };

  const statsRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap' as const,
  };

  const statBoxStyle: React.CSSProperties = {
    flex: '1 1 120px',
    background: 'var(--glass-base, #05080f)',
    border: '1px solid var(--glass-edge, #151c2d)',
    borderRadius: '2px',
    padding: '10px 14px',
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    color: 'var(--ink-secondary, #64748b)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    marginBottom: '4px',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--ink-primary, #e2e8f0)',
    fontFamily: "'Space Mono', monospace",
  };

  const modeBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: mode === 'live' ? 'var(--signal-active, #4FF0D8)' : 'var(--ink-secondary, #64748b)',
    background: mode === 'live' ? 'var(--signal-dim, #4FF0D822)' : 'transparent',
    border: `1px solid ${mode === 'live' ? 'var(--signal-active, #4FF0D8)' : 'var(--glass-edge, #151c2d)'}`,
    borderRadius: '2px',
    padding: '1px 5px',
    marginBottom: '10px',
  };

  return (
    <div style={containerStyle}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={modeBadgeStyle}>{mode === 'live' ? '● LIVE' : '− MOCK'}</div>

      <div style={statusBarStyle}>
        <div style={iconStyle}>{info.icon}</div>
        <span style={labelStyle}>
          {renderStatus ? renderStatus(status) : info.label}
        </span>
        {isLoading && (
          <span style={{ fontSize: '11px', color: '#475569', marginLeft: 'auto' }}>
            validating…
          </span>
        )}
      </div>

      {asset && (
        <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>
          Asset: <span style={{ color: '#c7d2fe', fontWeight: 500 }}>{asset}</span>
        </div>
      )}

      {status === 'ready' && (fee !== null || route !== null) && (
        <div style={statsRowStyle}>
          {fee !== null && (
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Estimated Fee</div>
              <div style={statValueStyle}>{shannonsToCkb(fee)}</div>
            </div>
          )}
          {route !== null && (
            <div style={statBoxStyle}>
              <div style={statLabelStyle}>Hops</div>
              <div style={statValueStyle}>{route.length}</div>
            </div>
          )}
        </div>
      )}

      {error && status !== 'ready' && (
        <div style={{ marginTop: '12px' }}>
          <ErrorResolutionBanner error={error} />
        </div>
      )}
    </div>
  );
}
