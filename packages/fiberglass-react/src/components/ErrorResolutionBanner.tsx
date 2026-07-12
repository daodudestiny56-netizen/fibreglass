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


export interface ErrorResolutionBannerProps {
  error: FiberError | null;
  /** Optional callback when user dismisses the banner. */
  onDismiss?: () => void;
  /** Optional callback to trigger a retry. */
  retry?: () => void;
  className?: string;
}


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
        icon: '✕',
        label: 'No Way to Reach This Recipient',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
        titleColor: 'var(--ink)',
        iconBg: 'transparent',
      };
    case 'INSUFFICIENT_LIQUIDITY':
      return {
        icon: '✕',
        label: 'Not Enough Funds in the Path',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
        titleColor: 'var(--ink)',
        iconBg: 'transparent',
      };
    case 'ASSET_MISMATCH':
      return {
        icon: '✕',
        label: 'Wrong Type of Money for This Payment',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
        titleColor: 'var(--ink)',
        iconBg: 'transparent',
      };
    case 'INVOICE_EXPIRED':
      return {
        icon: '✕',
        label: 'Payment Code Expired',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
        titleColor: 'var(--ink)',
        iconBg: 'transparent',
      };
    case 'INVOICE_CANCELLED':
      return {
        icon: '✕',
        label: 'Payment Code Cancelled',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
        titleColor: 'var(--ink)',
        iconBg: 'transparent',
      };
    case 'PAYMENT_ALREADY_EXISTS':
      return {
        icon: '✕',
        label: 'Payment Already Sent',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
        titleColor: 'var(--ink)',
        iconBg: 'transparent',
      };
    case 'NODE_UNREACHABLE':
      return {
        icon: '✕',
        label: 'Cannot Connect to Network',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
        titleColor: 'var(--ink)',
        iconBg: 'transparent',
      };
    case 'INVALID_INVOICE':
      return {
        icon: '✕',
        label: 'Invalid Payment Code',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
        titleColor: 'var(--ink)',
        iconBg: 'transparent',
      };
    default:
      return {
        icon: '!',
        label: 'Something Went Wrong',
        bg: 'var(--accent-secondary)',
        border: 'var(--ink)',
        titleColor: 'var(--ink)',
        iconBg: 'transparent',
      };
  }
}


export function ErrorResolutionBanner({
  error,
  onDismiss,
  retry,
}: ErrorResolutionBannerProps) {
  const [rawExpanded, setRawExpanded] = useState(false);

  if (!error) return null;

  const style = codeStyle(error.code);
  const hint = getErrorHint(error.code);

  const bannerStyle: React.CSSProperties = {
    background: style.bg,
    border: '3px solid var(--ink)',
    borderRadius: '0',
    padding: '16px 20px',
    fontFamily: "'Inter', sans-serif",
    color: 'var(--ink)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    boxShadow: '6px 6px 0px var(--ink)',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    flexWrap: 'wrap' as const,
  };

  const iconStyle: React.CSSProperties = {
    fontSize: '18px',
    color: 'var(--ink)',
    fontWeight: 700,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--ink)',
    fontFamily: "'Space Grotesk', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  };

  const codeTagStyle: React.CSSProperties = {
    fontSize: '10px',
    fontFamily: "'Space Mono', monospace",
    color: 'var(--ink)',
    background: '#FFFFFF',
    border: '3px solid var(--ink)',
    borderRadius: '0',
    padding: '2px 6px',
    marginLeft: '10px',
    letterSpacing: '0.04em',
    fontWeight: 700,
    boxShadow: '2px 2px 0px var(--ink)'
  };

  const hintStyle: React.CSSProperties = {
    fontSize: '13px',
    color: 'var(--ink)',
    lineHeight: 1.6,
    marginBottom: '10px',
    fontWeight: 600,
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
    fontSize: '12px',
    color: 'var(--ink)',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    textTransform: 'uppercase',
  };

  const retryBtnStyle: React.CSSProperties = {
    background: 'var(--accent-primary)',
    border: '3px solid var(--ink)',
    color: 'var(--ink)',
    padding: '8px 16px',
    borderRadius: '0',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    boxShadow: '2px 2px 0px var(--ink)',
    transition: 'all 0.1s ease-out'
  };

  const rawBlockStyle: React.CSSProperties = {
    marginTop: '8px',
    background: '#FFFFFF',
    border: '3px solid var(--ink)',
    borderRadius: '0',
    padding: '12px 14px',
    fontFamily: "'Space Mono', monospace",
    fontSize: '11px',
    color: 'var(--ink)',
    wordBreak: 'break-all',
    lineHeight: 1.5,
    boxShadow: 'inset 4px 4px 0px rgba(17,17,17,0.1)'
  };

  const dismissStyle: React.CSSProperties = {
    position: 'absolute',
    top: '10px',
    right: '12px',
    background: 'none',
    border: 'none',
    color: 'var(--ink)',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 700,
    lineHeight: 1,
    padding: '0 2px',
    fontFamily: 'inherit',
  };

  return (
    <div style={bannerStyle} role="alert" aria-live="assertive">
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

      <div style={footerRowStyle} className="flex-col sm:flex-row">
        <button
          style={rawToggleStyle}
          className="min-h-[44px]"
          onClick={() => setRawExpanded((v) => !v)}
          aria-expanded={rawExpanded}
        >
          <span style={{ transform: rawExpanded ? 'rotate(90deg)' : 'rotate(0)', display: 'inline-block', transition: 'transform 0.15s' }}>▶</span>
          {rawExpanded ? 'Hide' : 'Show'} Developer Data
        </button>

        {retry && (
          <button
            style={retryBtnStyle}
            className="w-full sm:w-auto min-h-[44px]"
            onClick={(e) => {
              retry();
              const el = e.currentTarget;
              el.style.transform = 'translate(2px, 2px)';
              el.style.boxShadow = 'none';
              setTimeout(() => {
                el.style.transform = '';
                el.style.boxShadow = '2px 2px 0px var(--ink)';
              }, 100);
            }}
          >
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
