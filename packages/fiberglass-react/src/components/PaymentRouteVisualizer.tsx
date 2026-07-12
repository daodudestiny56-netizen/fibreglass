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
  bg,
  visible,
  isSource,
  isDest,
}: {
  label: string;
  sublabel?: string;
  bg: string;
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
      gap: '8px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.9)',
      transition: 'opacity 0.2s ease-out, transform 0.2s ease-out',
      flexShrink: 0,
    }}>
      <div style={{
        width: special ? '56px' : '48px',
        height: special ? '56px' : '48px',
        borderRadius: '0',
        background: bg,
        border: '3px solid var(--ink)',
        boxShadow: visible ? '4px 4px 0px var(--ink)' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: special ? '18px' : '14px',
        fontFamily: "'Space Grotesk', sans-serif",
        fontWeight: 700,
        color: 'var(--ink)',
      }}>
        {isSource ? 'YOU' : isDest ? 'DEST' : 'HOP'}
      </div>
      <div style={{
        textAlign: 'center',
        maxWidth: '80px',
      }}>
        <div style={{ fontSize: '11px', color: 'var(--ink)', fontFamily: "'Space Mono', monospace", lineHeight: 1.2, fontWeight: 700 }}>
          {label}
        </div>
        {sublabel && (
          <div style={{ fontSize: '10px', color: 'var(--ink)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}

function EdgeArrow({
  fee,
  bg,
  visible,
  animating,
  delay,
}: {
  fee?: string;
  bg: string;
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
      minWidth: '60px',
      opacity: visible ? 1 : 0,
      transition: `opacity 0.1s ease-out ${delay}ms`,
      position: 'relative',
    }}>
      <div style={{
        height: '4px',
        width: '100%',
        background: bg,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '0',
        borderTop: '2px solid var(--ink)',
        borderBottom: '2px solid var(--ink)',
      }}>
        {animating && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: '-30%',
            width: '30%',
            height: '100%',
            background: 'var(--ink)',
            animation: `pulse-edge 1.2s ease-in-out ${delay}ms infinite`,
          }} />
        )}
      </div>
      <div style={{
        position: 'absolute',
        right: 0,
        width: 0,
        height: 0,
        borderTop: '8px solid transparent',
        borderBottom: '8px solid transparent',
        borderLeft: `10px solid var(--ink)`,
      }} />
      {fee !== undefined && (
        <div style={{
          position: 'absolute',
          top: '-24px',
          fontSize: '10px',
          color: 'var(--ink)',
          background: '#FFFFFF',
          padding: '2px 6px',
          borderRadius: '0',
          border: '2px solid var(--ink)',
          whiteSpace: 'nowrap',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          boxShadow: '2px 2px 0px var(--ink)',
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

  // FNN get_payment does not return routers.
  // We rely entirely on propHops, which would typically be fetched
  // during the routing phase (send_payment dry_run) rather than get_payment.
  const hops = propHops ?? [];
  const paymentStatus = isInternal ? internalData.status : propPaymentStatus;
  const totalFee = isInternal ? internalData.payment?.fee : propTotalFee;

  // We can calculate the total amount sent if it's available, otherwise fallback.
  // We need to pass down the "previous hop's amount received" to calculate fee.
  // However, without the initial sending amount exactly, we can't calculate fee for hop 0 reliably unless we know `totalSentAmount`.
  // Wait, fee for hop i is `amount_received[i-1] - amount_received[i]`.
  // If `i == 0`, fee is `totalSentAmount - amount_received[0]`.
  // Since we might not have `totalSentAmount`, we can compute it if `totalFee` and `amount_received[last]` are known, or we just omit fee for the first hop if we don't have it.
  
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
    background: '#FFFFFF',
    border: '3px solid var(--ink)',
    borderRadius: '0',
    padding: '20px',
    fontFamily: "'Inter', sans-serif",
    color: 'var(--ink)',
    overflow: 'auto',
    boxShadow: '6px 6px 0px var(--ink)',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--ink)',
    fontFamily: "'Space Grotesk', sans-serif",
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  };

  const routeRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '0',
    minWidth: 'max-content',
    padding: '16px 0 24px 0',
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

  const statsRow: React.CSSProperties = {
    display: 'flex',
    gap: '24px',
    marginTop: '16px',
    borderTop: '3px solid var(--ink)',
    paddingTop: '16px',
    flexWrap: 'wrap' as const,
  };

  const statItem: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  };

  const statLabel: React.CSSProperties = {
    fontSize: '12px',
    color: 'var(--ink)',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  };

  const statValue: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: 'var(--ink)',
    fontFamily: "'Space Mono', monospace",
  };

  if (hops.length === 0) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--ink)', fontSize: '15px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}></div>
          No path data yet.
        </div>
      </div>
    );
  }

  // Calculate total sent amount to derive the fee for the first hop
  let totalSentBigInt = 0n;
  if (hops.length > 0) {
    const finalAmount = BigInt(hops[hops.length - 1]!.amount_received);
    const totalFeeBigInt = totalFee ? BigInt(totalFee) : 0n;
    totalSentBigInt = finalAmount + totalFeeBigInt;
  }

  // Visual status indicators
  const isFailed = paymentStatus === 'Failed';
  const isSuccess = paymentStatus === 'Success';
  const isInflight = paymentStatus === 'Inflight';

  // Base colors
  const activeNodeColor = isSuccess ? 'var(--success)' : isFailed ? 'var(--accent-secondary)' : isInflight ? 'var(--accent-primary)' : '#FFFFFF';
  const activeEdgeColor = isSuccess ? 'var(--success)' : isInflight ? 'var(--accent-primary)' : '#FFFFFF';

  // Failed node/edge colors
  const failColor = 'var(--accent-secondary)';

  // The final destination is the target of the LAST hop in the route
  const destId = hops.length > 0 ? hops[hops.length - 1]!.target : 'Destination';

  const replayBtnStyle: React.CSSProperties = {
    background: '#FFFFFF',
    border: '3px solid var(--ink)',
    borderRadius: '0',
    color: 'var(--ink)',
    padding: '4px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    fontWeight: 700,
    boxShadow: '2px 2px 0px var(--ink)',
    transition: 'all 0.1s ease-out',
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

      <div style={headerStyle} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0">
        <span style={titleStyle}>Payment Path</span>
        <div className="flex flex-wrap gap-2 sm:gap-3 items-center">
          <button
            style={replayBtnStyle}
            className="min-h-[44px]"
            onClick={(e) => {
              handleReplay();
              const el = e.currentTarget;
              el.style.transform = 'translate(2px, 2px)';
              el.style.boxShadow = 'none';
              setTimeout(() => {
                el.style.transform = '';
                el.style.boxShadow = '2px 2px 0px var(--ink)';
              }, 100);
            }}
          >
            Replay
          </button>
          {paymentStatus && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: "'Space Grotesk', sans-serif",
              color: 'var(--ink)',
              background: isSuccess ? 'var(--success)' : isFailed ? 'var(--accent-secondary)' : 'var(--accent-primary)',
              border: '3px solid var(--ink)',
              borderRadius: '0',
              padding: '4px 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              boxShadow: '2px 2px 0px var(--ink)',
            }}>
              {isSuccess ? '✓' : isFailed ? '✕' : '⟳'}
              {' '}{paymentStatus}
            </span>
          )}
          <span style={modeBadge} title={mode === 'live' ? 'Live = connected to a real Fiber node right now.' : 'Mock = practice data, not a real payment'}>{mode === 'live' ? 'LIVE' : 'MOCK'}</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <div style={routeRowStyle}>
          {/* Source node */}
          <NodeBubble
            label="You"
            sublabel="Source"
            bg={activeNodeColor}
            visible={visibleCount >= 1}
            isSource
          />

          {/* Each hop (representing an intermediary or the final step) */}
          {hops.map((hop, idx) => {
            const isLastHop = idx === hops.length - 1;
            const edgeColor = isFailed && isLastHop ? failColor : activeEdgeColor;
            const nodeColor = isFailed && isLastHop ? failColor : activeNodeColor;

            let hopFeeBigInt = 0n;
            if (idx === 0) {
              hopFeeBigInt = totalSentBigInt - BigInt((hop?.amount_received || '0'));
            } else {
              hopFeeBigInt = BigInt((hops[idx - 1]?.amount_received || '0')) - BigInt((hop?.amount_received || '0'));
            }
            const feeString = hopFeeBigInt > 0n ? `0x${hopFeeBigInt.toString(16)}` : undefined;

            return (
              <React.Fragment key={idx}>
                <EdgeArrow
                  {...(feeString ? { fee: feeString } : {})}
                  bg={edgeColor}
                  visible={visibleCount >= idx + 2}
                  animating={isAnimating || isInflight}
                  delay={idx * 200}
                />
                {!isLastHop && (
                  <NodeBubble
                    label={shortKey(hop.target, 4)}
                    sublabel={`Hop ${idx + 1}`}
                    bg={nodeColor}
                    visible={visibleCount >= idx + 2}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Destination */}
          <NodeBubble
            label={typeof destId === 'string' ? shortKey(destId, 4) : '?'}
            sublabel="Destination"
            bg={isFailed ? failColor : activeNodeColor}
            visible={visibleCount >= hops.length + 1}
            isDest
          />
        </div>
      </div>
      {hops.length > 1 && (
        <div className="sm:hidden" style={{
          fontSize: '10px',
          color: 'var(--ink)',
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.05em',
          textAlign: 'center',
          marginTop: '-16px',
          marginBottom: '8px',
          opacity: 0.7,
        }}>
          Swipe to see the full route →
        </div>
      )}

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
            <span style={{ ...statValue, color: 'var(--success)', fontFamily: "'Space Grotesk', sans-serif" }}>✓ Delivered</span>
          </div>
        )}
        {isFailed && (
          <div style={statItem}>
            <span style={statLabel}>Status</span>
            <span style={{ ...statValue, color: 'var(--accent-secondary)', fontFamily: "'Space Grotesk', sans-serif" }}>✕ Failed here</span>
          </div>
        )}
      </div>
    </div>
  );
}
