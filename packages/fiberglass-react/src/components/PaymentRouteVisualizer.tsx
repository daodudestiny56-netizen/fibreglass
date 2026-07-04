/**
 * components/PaymentRouteVisualizer.tsx
 *
 * Hero feature — renders the hop path of a payment route as an
 * animated node-and-edge diagram.
 *
 * Layout: horizontal pipeline
 *   [Source] ──(fee)──[Hop 1] ──(fee)──[Hop 2] ──[Destination]
 *
 * Can fetch data internally if `paymentHash` is provided,
 * or render pre-loaded hops.
 *
 * Highlights the failed node/edge in red if status is Failed.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { RouterHop, PaymentStatus, Hash256 } from '../lib/rpcClient';
import { usePayment } from '../hooks/usePayment';


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


function shortKey(key: string, chars = 4): string {
  if (key.length <= chars * 2 + 2) return key;
  return `${key.slice(0, chars + 2)}…${key.slice(-chars)}`;
}

function shannonsToCkb(shannons: string): string {
  const val = Number(BigInt(shannons));
  if (val < 1000) return `${val} sh`;
  return `${(val / 1e8).toFixed(4)} CKB`;
}


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
        {isSource ? '' : isDest ? '' : '⬡'}
      </div>
      <div style={{
        textAlign: 'center',
        maxWidth: '72px',
      }}>
        <div style={{ fontSize: '10px', color: 'var(--ink-secondary, #64748b)', fontFamily: "'Space Mono', monospace", lineHeight: 1.2 }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: '9px', color: 'var(--ink-secondary, #64748b)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
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
          color: 'var(--ink-secondary, #64748b)',
          background: 'var(--glass-surface, #0a0e17)',
          padding: '1px 4px',
          borderRadius: '2px',
          border: '1px solid var(--glass-edge, #151c2d)',
          whiteSpace: 'nowrap',
          fontFamily: "'Satoshi', sans-serif",
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          {shannonsToCkb(fee)} fee
        </div>
      )}
    </div>
  );
}


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
    background: 'var(--glass-surface, #0a0e17)',
    border: '1px solid var(--glass-edge, #151c2d)',
    borderRadius: '2px',
    padding: '20px',
    fontFamily: "'Satoshi', sans-serif",
    color: 'var(--ink-primary, #e2e8f0)',
    overflow: 'auto',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: 'var(--ink-primary, #e2e8f0)',
    letterSpacing: '0.05em',
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
    color: mode === 'live' ? 'var(--signal-active, #4FF0D8)' : 'var(--ink-secondary, #64748b)',
    background: mode === 'live' ? 'var(--signal-dim, #4FF0D822)' : 'transparent',
    border: `1px solid ${mode === 'live' ? 'var(--signal-active, #4FF0D8)' : 'var(--glass-edge, #151c2d)'}`,
    borderRadius: '2px',
    padding: '2px 6px',
  };

  const statsRow: React.CSSProperties = {
    display: 'flex',
    gap: '16px',
    marginTop: '16px',
    borderTop: '1px solid var(--glass-edge, #151c2d)',
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
    color: 'var(--ink-secondary, #64748b)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  };

  const statValue: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 700,
    color: 'var(--ink-primary, #e2e8f0)',
    fontFamily: "'Space Mono', monospace",
  };

  if (hops.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ink-secondary, #64748b)', fontSize: '13px' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}></div>
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
  const activeNodeColor = isSuccess ? 'var(--signal-active, #4FF0D8)' : isFailed ? 'var(--fail-signal, #f43f5e)' : isInflight ? 'var(--signal-active, #4FF0D8)' : 'var(--ink-secondary, #64748b)';
  const activeEdgeColor = isSuccess ? 'var(--signal-active, #4FF0D8)' : isInflight ? 'var(--signal-active, #4FF0D8)' : 'var(--ink-secondary, #64748b)';
  const activeGlow = isSuccess ? 'var(--signal-dim, rgba(79, 240, 216, 0.25))' : isInflight ? 'var(--signal-dim, rgba(79, 240, 216, 0.4))' : 'var(--glass-edge, rgba(21, 28, 45, 0.4))';

  // Failed node/edge colors
  const failColor = 'var(--fail-signal, #f43f5e)';
  const failGlow = 'rgba(244, 63, 94, 0.4)';

  const destId = hops[hops.length - 1]?.next_hop ?? 'Destination';

  const replayBtnStyle: React.CSSProperties = {
    background: 'var(--signal-dim, rgba(79, 240, 216, 0.1))',
    border: '1px solid var(--signal-active, #4FF0D8)',
    borderRadius: '2px',
    color: 'var(--signal-active, #4FF0D8)',
    padding: '3px 8px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: "'Satoshi', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
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
        <span style={titleStyle}>Payment Route</span>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button style={replayBtnStyle} onClick={handleReplay}>
            Replay
          </button>
          {paymentStatus && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 600,
              color: isSuccess ? 'var(--signal-active, #4FF0D8)' : isFailed ? 'var(--fail-signal, #f43f5e)' : 'var(--signal-active, #4FF0D8)',
              background: isSuccess ? 'var(--signal-dim, #4FF0D822)' : isFailed ? 'transparent' : 'var(--signal-dim, #4FF0D822)',
              border: `1px solid ${isSuccess ? 'var(--signal-active, #4FF0D8)' : isFailed ? 'var(--fail-signal, #f43f5e)' : 'var(--signal-active, #4FF0D8)'}`,
              borderRadius: '2px',
              padding: '3px 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              {isSuccess ? '●' : isFailed ? '✕' : '⟳'}
              {' '}{paymentStatus}
            </span>
          )}
          <span style={modeBadge}>{mode === 'live' ? '● LIVE' : '− MOCK'}</span>
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
            <span style={{ ...statValue, color: 'var(--signal-active, #4FF0D8)' }}>✓ Delivered</span>
          </div>
        )}
        {isFailed && (
          <div style={statItem}>
            <span style={statLabel}>Status</span>
            <span style={{ ...statValue, color: 'var(--fail-signal, #f43f5e)' }}>✕ Failed at link</span>
          </div>
        )}
      </div>
    </div>
  );
}
