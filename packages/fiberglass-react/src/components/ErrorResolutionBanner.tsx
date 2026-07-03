/**
 * components/ErrorResolutionBanner.tsx
 *
 * Renders a FiberError with:
 *  - A colour-coded banner matching the error code severity
 *  - A human-readable hint from errorMap.ts
 *  - An expandable "Raw error" disclosure for the verbatim FNN message
 *  - An optional "Retry" button
 *
 * Renders nothing when `error` is null.
 */

import React, { useState } from 'react';
import type { FiberError, FiberErrorCode } from '../lib/rpcClient';
import { getErrorHint } from '../lib/errorMap';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ErrorResolutionBannerProps {
  error: FiberError | null;
  /** Optional callback when user dismisses the banner. */
  onDismiss?: () => void;
  /** Optional callback to trigger a retry. */
  retry?: () => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface CodeStyle {
  icon: string;
  label: string;
  bg: string;
  border: string;
  titleColor: string;
  iconBg: string;
}

function codeStyle(code: FiberErrorCode): CodeStyle {
  switch (code) {
    case 'NO_ROUTE':
      return {
        icon: '🔍',
        label: 'No Route Found',
        bg: '#1e1a2e',
        border: '#7c3aed44',
        titleColor: '#a78bfa',
        iconBg: '#4c1d9520',
      };
    case 'INSUFFICIENT_LIQUIDITY':
      return {
        icon: '💧',
        label: 'Insufficient Liquidity',
        bg: '#1e1a14',
        border: '#d9770644',
        titleColor: '#fb923c',
        iconBg: '#92400e20',
      };
    case 'ASSET_MISMATCH':
      return {
        icon: '⚠️',
        label: 'Asset Mismatch',
        bg: '#1e1a14',
        border: '#ca8a0444',
        titleColor: '#facc15',
        iconBg: '#78350f20',
      };
    case 'INVOICE_EXPIRED':
      return {
        icon: '⏰',
        label: 'Invoice Expired',
        bg: '#1a1e14',
        border: '#4d7c0f44',
        titleColor: '#86efac',
        iconBg: '#14532d20',
      };
    case 'INVOICE_CANCELLED':
      return {
        icon: '🚫',
        label: 'Invoice Cancelled',
        bg: '#1e1414',
        border: '#dc262644',
        titleColor: '#fca5a5',
        iconBg: '#7f1d1d20',
      };
    case 'PAYMENT_ALREADY_EXISTS':
      return {
        icon: '🔁',
        label: 'Payment Already Exists',
        bg: '#141e1e',
        border: '#0891b244',
        titleColor: '#67e8f9',
        iconBg: '#0c4a6e20',
      };
    case 'NODE_UNREACHABLE':
      return {
        icon: '📡',
        label: 'Node Unreachable',
        bg: '#1e1414',
        border: '#dc262644',
        titleColor: '#f87171',
        iconBg: '#7f1d1d20',
      };
    default:
      return {
        icon: '❓',
        label: 'Unexpected Error',
        bg: '#1a1a1e',
        border: '#52525b44',
        titleColor: '#a1a1aa',
        iconBg: '#27272a20',
      };
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ErrorResolutionBanner({
  error,
  onDismiss,
  retry,
}: ErrorResolutionBannerProps) {
  const [rawExpanded, setRawExpanded] = useState(false);

  if (!error) return null;

  const style = codeStyle(error.code);
  const hint = getErrorHint(error.code);

  const containerStyle: React.CSSProperties = {
    background: style.bg,
    border: `1px solid ${style.border}`,
    borderRadius: '10px',
    padding: '14px 16px',
    fontFamily: "'Inter', 'ui-sans-serif', system-ui, sans-serif",
    position: 'relative',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: hint ? '10px' : '0',
  };

  const iconStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: style.iconBg,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    flexShrink: 0,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: style.titleColor,
    flex: 1,
  };

  const codeTagStyle: React.CSSProperties = {
    fontSize: '10px',
    fontFamily: 'monospace',
    color: '#64748b',
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '4px',
    padding: '1px 6px',
    marginLeft: '6px',
    letterSpacing: '0.04em',
  };

  const hintStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: 1.6,
    marginBottom: '10px',
  };

  const footerRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    gap: '10px',
  };

  const rawToggleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '11px',
    color: '#475569',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: 'inherit',
  };

  const retryBtnStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    color: '#e2e8f0',
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.2s',
  };

  const rawBlockStyle: React.CSSProperties = {
    marginTop: '8px',
    padding: '8px 10px',
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'monospace',
    wordBreak: 'break-all',
    lineHeight: 1.5,
  };

  const dismissStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: '#475569',
    cursor: 'pointer',
    fontSize: '14px',
    lineHeight: 1,
    padding: '0 2px',
    fontFamily: 'inherit',
  };

  return (
    <div style={containerStyle} role="alert" aria-live="assertive">
      {onDismiss && (
        <button style={dismissStyle} onClick={onDismiss} aria-label="Dismiss error">
          ✕
        </button>
      )}

      <div style={headerStyle}>
        <div style={iconStyle}>{style.icon}</div>
        <span style={titleStyle}>
          {style.label}
          <span style={codeTagStyle}>{error.code}</span>
        </span>
      </div>

      {hint && <p style={hintStyle}>{hint}</p>}

      <div style={footerRowStyle}>
        <button
          style={rawToggleStyle}
          onClick={() => setRawExpanded((v) => !v)}
          aria-expanded={rawExpanded}
        >
          <span style={{ transform: rawExpanded ? 'rotate(90deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
          {rawExpanded ? 'Hide' : 'Show'} raw error
          <span style={{ fontFamily: 'monospace', color: '#334155', marginLeft: '4px' }}>
            ({error.rpcMethod})
          </span>
        </button>

        {retry && (
          <button style={retryBtnStyle} onClick={retry}>
            ↻ Retry
          </button>
        )}
      </div>

      {rawExpanded && (
        <div style={rawBlockStyle} aria-label="Raw error message">
          {error.rawMessage}
        </div>
      )}
    </div>
  );
}
