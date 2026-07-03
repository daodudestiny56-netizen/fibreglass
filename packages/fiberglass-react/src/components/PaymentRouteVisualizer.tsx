/**
 * components/PaymentRouteVisualizer.tsx
 *
 * Hero feature — renders the hop path of a payment route as an
 * animated node-and-edge diagram.
 *
 * Layout: horizontal pipeline
 *   [Source] ──(fee)──▶ [Hop 1] ──(fee)──▶ [Hop 2] ──▶ [Destination]
 *
 * Can fetch data internally if `paymentHash` is provided,
 * or render pre-loaded hops.
 *
 * Highlights the failed node/edge in red if status is Failed.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { RouterHop, PaymentStatus, Hash256 } from '../lib/rpcClient';
import { usePayment } from '../hooks/usePayment';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaymentRouteVisualizerProps {
  /** Hop array representing route path. */
  hops?: RouterHop[];
  /** If provided, colours the route according to final payment status. */
  paymentStatus?: PaymentStatus | null;
  /** Total fee across all hops (shannons string). */
  totalFee?: string | null;
  /** If provided, loads payment details and route internally. */
  paymentHash?: string | null;
  mode?: 'live' | 'mock';
  /** If true, plays the animated "sending" effect. */
  isAnimating?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function shortKey(key: string, chars = 4): string {
  if (key.length <= chars * 2 + 2) return key;
  return `${key.slice(0, chars + 2)}…${key.slice(-chars)}`;
}

function shannonsToCkb(shannons: string): string {
  const val = Number(BigInt(shannons));
  if (val < 1000) return `${val} sh`;
  return `${(val / 1e8).toFixed(4)} CKB`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NodeBubble({
  label,
  sublabel,
  color,
  glow,
  visible,
  isSource,
  isDest,
}: {
  label: string;
  sublabel?: string;
  color: string;
  glow: string;
  visible: boolean;
  isSource?: boolean;
  isDest?: boolean;
}) {
  const special = isSource || isDest;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '6px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.9)',
      transition: 'opacity 0.35s ease, transform 0.35s ease',
      flexShrink: 0,
    }}>
      <div style={{
        width: special ? '52px' : '44px',
        height: special ? '52px' : '44px',
        borderRadius: '50%',
        background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color}66)`,
        border: `2px solid ${color}`,
        boxShadow: visible ? `0 0 16px ${glow}, 0 0 4px ${color}40` : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: special ? '18px' : '14px',
        transition: 'box-shadow 0.5s ease',
      }}>
        {isSource ? '🔷' : isDest ? '🎯' : '⬡'}
      </div>
      <div style={{
        textAlign: 'center',
        maxWidth: '72px',
      }}>
        <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', lineHeight: 1.2 }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: '9px', color: '#475569', marginTop: '2px' }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

function EdgeArrow({
  fee,
  color,
  visible,
  animating,
  delay,
}: {
  fee?: string;
  color: string;
  visible: boolean;
  animating: boolean;
  delay: number;
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1,
      minWidth: '48px',
      opacity: visible ? 1 : 0,
      transition: `opacity 0.3s ease ${delay}ms`,
      position: 'relative',
    }}>
      <div style={{
        height: '2px',
        width: '100%',
        background: `linear-gradient(90deg, ${color}44, ${color}, ${color}44)`,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '1px',
      }}>
        {animating && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-30%',
            width: '30%',
            height: '100%',
            background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
            animation: `pulse-edge 1.2s ease-in-out ${delay}ms infinite`,
          }} />
        )}
      </div>
      <div style={{
        position: 'absolute',
        right: 0,
        width: 0,
        height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: `8px solid ${color}`,
      }} />
      {fee !== undefined && (
        <div style={{
          position: 'absolute',
          top: '-18px',
          fontSize: '9px',
          color: '#475569',
          background: '#0f172a',
          padding: '1px 4px',
          borderRadius: '3px',
          border: '1px solid #1e293b',
          whiteSpace: 'nowrap',
        }}>
          {shannonsToCkb(fee)} fee
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function PaymentRouteVisualizer({
  hops: propHops,
  paymentStatus: propPaymentStatus,
  totalFee: propTotalFee,
  paymentHash,
  mode = 'mock',
  isAnimating = false,
}: PaymentRouteVisualizerProps) {
  const isInternal = paymentHash !== undefined;

  // Unconditional hook call
  const internalData = usePayment({
    paymentHash: paymentHash as Hash256 | null,
  });

  const hops = isInternal ? (internalData.payment?.routers ?? []) : (propHops ?? []);
  const paymentStatus = isInternal ? internalData.status : propPaymentStatus;
  const totalFee = isInternal ? internalData.payment?.fee : propTotalFee;

  const [visibleCount, setVisibleCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stagger-reveal nodes on mount
  useEffect(() => {
    setVisibleCount(0);
    const total = hops.length + 2; // source + hops + dest
    let i = 0;

    function reveal() {
      i++;
      setVisibleCount(i);
      if (i < total) {
        timerRef.current = setTimeout(reveal, 180);
      }
    }

    timerRef.current = setTimeout(reveal, 100);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [hops]);

  const containerStyle: React.CSSProperties = {
    background: 'linear-gradient(160deg, #0f0f1e 0%, #161628 50%, #0c1a2e 100%)',
    border: '1px solid #1e2040',
    borderRadius: '14px',
    padding: '20px',
    fontFamily: "'Inter', 'ui-sans-serif', system-ui, sans-serif",
    color: '#e2e8f0',
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
    letterSpacing: '0.06em',
    textTransform: 'uppercase' as const,
  };

  const routeRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    minWidth: 'max-content',
    padding: '10px 0',
  };

  const modeBadge: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    color: mode === 'live' ? '#34d399' : '#fbbf24',
    background: mode === 'live' ? '#06402720' : '#78350f20',
    border: `1px solid ${mode === 'live' ? '#34d39940' : '#fbbf2440'}`,
    borderRadius: '4px',
    padding: '2px 6px',
  };

  const statsRow: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    marginTop: '16px',
    borderTop: '1px solid #1e2040',
    paddingTop: '14px',
    flexWrap: 'wrap' as const,
  };

  const statItem: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const statLabel: React.CSSProperties = {
    fontSize: '10px',
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  };

  const statValue: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#c7d2fe',
  };

  if (hops.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '30px 0', color: '#334155', fontSize: '13px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔍</div>
          No route data available.
        </div>
      </div>
    );
  }

  // Visual status indicators
  const isFailed = paymentStatus === 'Failed';
  const isSuccess = paymentStatus === 'Success';
  const isInflight = paymentStatus === 'Inflight';

  // Base colors
  const activeNodeColor = isSuccess ? '#4ade80' : isFailed ? '#818cf8' : isInflight ? '#60a5fa' : '#818cf8';
  const activeEdgeColor = isSuccess ? '#22c55e' : isInflight ? '#3b82f6' : '#6366f1';
  const activeGlow = isSuccess ? '#22c55e40' : isInflight ? '#3b82f640' : '#6366f140';

  // Failed node/edge colors
  const failColor = '#f87171';
  const failGlow = '#ef444440';

  const destId = hops[hops.length - 1]?.next_hop ?? 'Destination';

  const replayBtnStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: '6px',
    color: '#94a3b8',
    padding: '3px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontWeight: 600,
    transition: 'background-color 0.15s',
  };

  const handleReplay = () => {
    setVisibleCount(0);
    setTimeout(() => {
      let i = 0;
      const total = hops.length + 2;
      function reveal() {
        i++;
        setVisibleCount(i);
        if (i < total) {
          timerRef.current = setTimeout(reveal, 180);
        }
      }
      reveal();
    }, 50);
  };

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes pulse-edge {
          0% { left: -30%; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 110%; opacity: 0; }
        }
      `}</style>

      <div style={headerStyle}>
        <span style={titleStyle}>⚡ Payment Route</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button style={replayBtnStyle} onClick={handleReplay}>
            🔄 Replay
          </button>
          {paymentStatus && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: isSuccess ? '#4ade80' : isFailed ? '#f87171' : '#60a5fa',
              background: isSuccess ? '#052e16' : isFailed ? '#1e0a0a' : '#0c1a2e',
              border: `1px solid ${isSuccess ? '#16a34a44' : isFailed ? '#dc262644' : '#1d4ed844'}`,
              borderRadius: '20px',
              padding: '3px 10px',
            }}>
              {isSuccess ? '●' : isFailed ? '✕' : '⟳'}
              {' '}{paymentStatus}
            </span>
          )}
          <span style={modeBadge}>{mode === 'live' ? '● LIVE' : '◌ MOCK'}</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={routeRowStyle}>
          {/* Source node */}
          <NodeBubble
            label="You"
            sublabel="Source"
            color={activeNodeColor}
            glow={activeGlow}
            visible={visibleCount >= 1}
            isSource
          />

          {/* Each hop */}
          {hops.map((hop, idx) => {
            const isLastHop = idx === hops.length - 1;
            // If the whole route fails, the failure occurs at the link after the last successfully traversed hop
            const edgeColor = isFailed && isLastHop ? failColor : activeEdgeColor;
            const nodeColor = isFailed && isLastHop ? failColor : activeNodeColor;
            const nodeGlow = isFailed && isLastHop ? failGlow : activeGlow;

            return (
              <React.Fragment key={idx}>
                <EdgeArrow
                  fee={hop.fee}
                  color={edgeColor}
                  visible={visibleCount >= idx + 2}
                  animating={isAnimating || isInflight}
                  delay={idx * 200}
                />
                <NodeBubble
                  label={shortKey(hop.channel_outpoint, 4)}
                  sublabel={`Hop ${idx + 1}`}
                  color={nodeColor}
                  glow={nodeGlow}
                  visible={visibleCount >= idx + 2}
                />
              </React.Fragment>
            );
          })}

          {/* Final edge to destination */}
          <EdgeArrow
            color={isFailed ? failColor : activeEdgeColor}
            visible={visibleCount >= hops.length + 2}
            animating={isAnimating || isInflight}
            delay={hops.length * 200}
          />

          {/* Destination */}
          <NodeBubble
            label={typeof destId === 'string' ? shortKey(destId, 4) : '?'}
            sublabel="Destination"
            color={isFailed ? failColor : activeNodeColor}
            glow={isFailed ? failGlow : activeGlow}
            visible={visibleCount >= hops.length + 2}
            isDest
          />
        </div>
      </div>

      <div style={statsRow}>
        <div style={statItem}>
          <span style={statLabel}>Hops</span>
          <span style={statValue}>{hops.length}</span>
        </div>
        {totalFee !== null && totalFee !== undefined && (
          <div style={statItem}>
            <span style={statLabel}>Total Fee</span>
            <span style={statValue}>{shannonsToCkb(totalFee)}</span>
          </div>
        )}
        {isSuccess && (
          <div style={statItem}>
            <span style={statLabel}>Status</span>
            <span style={{ ...statValue, color: '#4ade80' }}>✓ Delivered</span>
          </div>
        )}
        {isFailed && (
          <div style={statItem}>
            <span style={statLabel}>Status</span>
            <span style={{ ...statValue, color: '#f87171' }}>✕ Failed at link</span>
          </div>
        )}
      </div>
    </div>
  );
}
