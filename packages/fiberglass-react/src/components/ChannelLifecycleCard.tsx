/**
 * components/ChannelLifecycleCard.tsx
 *
 * Renders a single Fiber channel's lifecycle state, peer ID, and
 * local/remote balance bar.
 *
 * Accepts either:
 *  - a `channel` object directly.
 *  - a `channelId` string (uses useChannel internally to find and load it).
 */

import React, { useState } from 'react';
import type { ChannelDetail, ChannelState } from '../lib/rpcClient';
import { useChannel } from '../hooks/useChannel';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChannelLifecycleCardProps {
  channel?: ChannelDetail;
  /** If provided and channel is not passed, fetches channel details internally. */
  channelId?: string;
  /** Show the SDK mode badge ("MOCK" / "LIVE"). Default: false. */
  showModeBadge?: boolean;
  mode?: 'live' | 'mock';
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function stateStyle(state: ChannelState): { label: string; color: string; dot: string } {
  switch (state) {
    case 'ChannelReady':
      return { label: 'Ready', color: '#22c55e', dot: '#16a34a' };
    case 'NegotiatingFunding':
      return { label: 'Negotiating', color: '#f59e0b', dot: '#d97706' };
    case 'CollaboratingFundingTx':
      return { label: 'Collaborating', color: '#f59e0b', dot: '#d97706' };
    case 'SigningCommitment':
      return { label: 'Signing', color: '#f59e0b', dot: '#d97706' };
    case 'AwaitingChannelReady':
      return { label: 'Awaiting', color: '#3b82f6', dot: '#2563eb' };
    case 'ShuttingDown':
      return { label: 'Shutting Down', color: '#ef4444', dot: '#dc2626' };
    case 'Closed':
      return { label: 'Closed', color: '#6b7280', dot: '#4b5563' };
    default:
      return { label: String(state), color: '#6b7280', dot: '#4b5563' };
  }
}

function shannonsToCkb(shannons: string): string {
  const val = BigInt(shannons);
  const ckb = Number(val) / 1e8;
  return ckb.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function shortId(id: string, chars = 6): string {
  if (id.length <= chars * 2 + 2) return id;
  return `${id.slice(0, chars + 2)}…${id.slice(-chars)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChannelLifecycleCard({
  channel: propChannel,
  channelId,
  showModeBadge = false,
  mode = 'mock',
}: ChannelLifecycleCardProps) {
  const { channels } = useChannel();
  const [rawExpanded, setRawExpanded] = useState(false);

  const channel = propChannel ?? channels.find((ch) => ch.channel_id === channelId);

  const styles: Record<string, React.CSSProperties> = {
    card: {
      background: 'linear-gradient(135deg, #1e1e2e 0%, #16213e 100%)',
      border: '1px solid #2a2a4a',
      borderRadius: '12px',
      padding: '16px 20px',
      fontFamily: "'Inter', 'ui-sans-serif', system-ui, sans-serif",
      color: '#e2e8f0',
      position: 'relative',
      overflow: 'hidden',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '12px',
    },
    stateBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '3px 10px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.04em',
    },
    dot: {
      width: '7px',
      height: '7px',
      borderRadius: '50%',
      flexShrink: 0,
    },
    channelId: {
      fontSize: '11px',
      color: '#64748b',
      fontFamily: 'monospace',
      marginBottom: '4px',
    },
    peerId: {
      fontSize: '12px',
      color: '#94a3b8',
      fontFamily: 'monospace',
    },
    balanceRow: {
      marginTop: '14px',
    },
    balanceLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: '11px',
      color: '#64748b',
    },
    balanceBar: {
      height: '6px',
      borderRadius: '3px',
      background: '#1e293b',
      overflow: 'hidden',
    },
    balanceAmounts: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '6px',
      fontSize: '12px',
    },
    localAmount: { color: '#818cf8', fontWeight: 500 },
    remoteAmount: { color: '#64748b' },
    modeBadge: {
      position: 'absolute',
      top: '10px',
      right: '10px',
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: mode === 'live' ? '#34d399' : '#fbbf24',
      background: mode === 'live' ? '#06402720' : '#78350f20',
      border: `1px solid ${mode === 'live' ? '#34d39940' : '#fbbf2440'}`,
      borderRadius: '4px',
      padding: '1px 5px',
    },
    disabledTag: {
      fontSize: '10px',
      color: '#ef4444',
      background: '#ef444415',
      border: '1px solid #ef444430',
      borderRadius: '4px',
      padding: '1px 6px',
      marginLeft: '6px',
    },
    disclosureBtn: {
      marginTop: '12px',
      background: 'none',
      border: 'none',
      color: '#64748b',
      fontSize: '11px',
      cursor: 'pointer',
      padding: 0,
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    jsonBlock: {
      marginTop: '8px',
      padding: '10px',
      background: '#0f172a',
      border: '1px solid #1e293b',
      borderRadius: '6px',
      fontSize: '10px',
      fontFamily: 'monospace',
      color: '#94a3b8',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
    },
  };

  if (!channel) {
    return (
      <div style={styles.card}>
        <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '10px 0' }}>
          {channelId ? `Channel ${shortId(channelId)} not found` : 'No channel details provided'}
        </div>
      </div>
    );
  }

  const { label, color, dot } = stateStyle(channel.state);

  const local = BigInt(channel.local_balance);
  const remote = BigInt(channel.remote_balance);
  const total = local + remote;
  const localPct = total === 0n ? 50 : Number((local * 100n) / total);

  return (
    <div style={styles.card}>
      {showModeBadge && (
        <span style={styles.modeBadge}>{mode === 'live' ? '● LIVE' : '◌ MOCK'}</span>
      )}

      <div style={styles.header}>
        <div>
          <div style={styles.channelId}>
            Channel {shortId(channel.channel_id)}
          </div>
          <div style={styles.peerId}>
            Peer: {shortId(channel.peer_id)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ ...styles.stateBadge, color, border: `1px solid ${color}55`, background: `${color}22` }}>
            <span style={{ ...styles.dot, background: dot }} />
            <span style={{ marginLeft: '6px' }}>{label}</span>
          </span>
          {!channel.enabled && (
            <span style={styles.disabledTag}>disabled</span>
          )}
        </div>
      </div>

      {total > 0n && (
        <div style={styles.balanceRow}>
          <div style={styles.balanceLabels}>
            <span>Local Balance</span>
            <span>Remote Balance</span>
          </div>
          <div style={styles.balanceBar}>
            <div style={{
              height: '100%',
              width: `${localPct}%`,
              background: channel.enabled
                ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                : 'linear-gradient(90deg, #475569, #64748b)',
              borderRadius: '3px',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={styles.balanceAmounts}>
            <span style={styles.localAmount}>{shannonsToCkb(channel.local_balance)} CKB</span>
            <span style={styles.remoteAmount}>{shannonsToCkb(channel.remote_balance)} CKB</span>
          </div>
        </div>
      )}

      {total === 0n && (
        <div style={{ marginTop: '10px', fontSize: '11px', color: '#475569', fontStyle: 'italic' }}>
          No balance — channel is closing or closed.
        </div>
      )}

      <button
        style={styles.disclosureBtn}
        onClick={() => setRawExpanded((v) => !v)}
      >
        <span>{rawExpanded ? '▼' : '▶'}</span> View Raw RPC
      </button>

      {rawExpanded && (
        <pre style={styles.jsonBlock}>
          {JSON.stringify(channel, null, 2)}
        </pre>
      )}
    </div>
  );
}
