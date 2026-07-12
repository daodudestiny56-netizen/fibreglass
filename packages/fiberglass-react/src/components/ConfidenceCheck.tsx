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
        label: 'Path Found — Ready to Send',
        color: 'var(--ink)',
        bg: 'var(--success)',
        border: 'var(--ink)',
      };
    case 'loading':
      return {
        icon: '⟳',
        label: 'Checking the Path…',
        color: 'var(--ink)',
        bg: 'var(--accent-primary)',
        border: 'var(--ink)',
      };
    case 'no_route':
      return {
        icon: '✕',
        label: 'No Way to Reach This Recipient Right Now',
        color: 'var(--ink)',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
      };
    case 'insufficient_liquidity':
      return {
        icon: '✕',
        label: 'Not Enough Funds in the Path',
        color: 'var(--ink)',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
      };
    case 'asset_mismatch':
      return {
        icon: '✕',
        label: 'Wrong Type of Money for This Payment',
        color: 'var(--ink)',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
      };
    case 'error':
      return {
        icon: '!',
        label: 'Check Failed',
        color: 'var(--ink)',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
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
    background: '#FFFFFF',
    border: '3px solid var(--ink)',
    boxShadow: '6px 6px 0px var(--ink)',
    padding: '16px 20px',
    fontFamily: "'Inter', sans-serif",
    color: 'var(--ink)',
  };

  const statusBarStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 14px',
    background: info.bg,
    border: '3px solid var(--ink)',
    marginBottom: '14px',
    boxShadow: '2px 2px 0px var(--ink)',
  };

  const iconStyle: React.CSSProperties = {
    width: '28px',
    height: '28px',
    background: '#FFFFFF',
    border: '2px solid var(--ink)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 700,
    color: info.color,
    fontFamily: "'Space Grotesk', sans-serif",
    flexShrink: 0,
    animation: status === 'loading' || isLoading ? 'spin 1s linear infinite' : 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 700,
    color: info.color,
    fontFamily: "'Space Grotesk', sans-serif",
  };

  const statsRowStyle: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap' as const,
  };

  const statBoxStyle: React.CSSProperties = {
    flex: '1 1 120px',
    background: '#FFFFFF',
    border: '3px solid var(--ink)',
    padding: '10px 14px',
    boxShadow: 'inset 4px 4px 0px rgba(17,17,17,0.1)'
  };

  const statLabelStyle: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--ink)',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
    marginBottom: '4px',
  };

  const statValueStyle: React.CSSProperties = {
    fontSize: '15px',
    fontWeight: 700,
    color: 'var(--ink)',
    fontFamily: "'Space Mono', monospace",
  };

  const modeBadgeStyle: React.CSSProperties = {
    display: 'inline-block',
    fontSize: '10px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: 'var(--ink)',
    background: mode === 'live' ? 'var(--accent-primary)' : 'var(--mock-tag)',
    border: '3px solid var(--ink)',
    padding: '4px 8px',
    boxShadow: '2px 2px 0px var(--ink)',
    marginBottom: '14px',
  };

  return (
    <div style={containerStyle} className="!p-4 sm:!p-5">
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <div style={modeBadgeStyle} title={mode === 'live' ? 'Live = connected to a real Fiber node right now.' : 'Mock = practice data, not a real payment'}>
        {mode === 'live' ? 'LIVE' : 'MOCK'}
      </div>

      <div style={statusBarStyle}>
        <div style={iconStyle}>{info.icon}</div>
        <span style={labelStyle}>
          {renderStatus ? renderStatus(status) : info.label}
        </span>
        {isLoading && (
          <span style={{ fontSize: '11px', color: 'var(--ink)', marginLeft: 'auto', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, textTransform: 'uppercase' }}>
            Checking…
          </span>
        )}
      </div>

      {asset && (
        <div style={{ fontSize: '12px', color: 'var(--ink)', marginBottom: '12px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
          Asset: <span style={{ color: 'var(--ink)', fontFamily: "'Space Mono', monospace" }}>{asset}</span>
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
              <div style={{ fontSize: '10px', marginTop: '4px', opacity: 0.8 }}>Each hop is a stop in the path.</div>
            </div>
          )}
        </div>
      )}

      {error && status !== 'ready' && (
        <div style={{ marginTop: '16px' }}>
          <ErrorResolutionBanner error={error} />
        </div>
      )}
    </div>
  );
}
