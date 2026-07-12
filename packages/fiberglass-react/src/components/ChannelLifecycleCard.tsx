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


export interface ChannelLifecycleCardProps {
  channel?: ChannelDetail;
  /** If provided and channel is not passed, fetches channel details internally. */
  channelId?: string;
  /** Show the SDK mode badge ("MOCK" / "LIVE"). Default: false. */
  showModeBadge?: boolean;
  mode?: 'live' | 'mock';
}


function stateStyle(state: ChannelState): { label: string; color: string; dot: string; bg: string } {
  switch (state) {
    case 'ChannelReady':
      return { label: 'Ready', color: 'var(--ink)', dot: 'var(--success)', bg: 'var(--success)' };
    case 'NegotiatingFunding':
      return { label: 'Setting Up', color: 'var(--ink)', dot: 'var(--ink)', bg: 'var(--accent-primary)' };
    case 'CollaboratingFundingTx':
      return { label: 'Setting Up', color: 'var(--ink)', dot: 'var(--ink)', bg: 'var(--accent-primary)' };
    case 'SigningCommitment':
      return { label: 'Finalizing', color: 'var(--ink)', dot: 'var(--ink)', bg: 'var(--accent-primary)' };
    case 'AwaitingChannelReady':
      return { label: 'Waiting to Open', color: 'var(--ink)', dot: 'var(--ink)', bg: 'var(--accent-primary)' };
    case 'ShuttingDown':
      return { label: 'Shutting Down', color: 'var(--ink)', dot: 'var(--ink)', bg: 'var(--accent-secondary)' };
    case 'Closed':
      return { label: 'Closed', color: '#FFFFFF', dot: '#FFFFFF', bg: 'var(--ink)' };
    default:
      return { label: String(state), color: '#FFFFFF', dot: '#FFFFFF', bg: 'var(--ink)' };
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
      background: '#FFFFFF',
      border: '3px solid var(--ink)',
      boxShadow: '6px 6px 0px var(--ink)',
      padding: '16px 20px',
      fontFamily: "'Inter', sans-serif",
      color: 'var(--ink)',
      position: 'relative',
    },
    header: {
      marginBottom: '12px',
    },
    stateBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      border: '3px solid var(--ink)',
      padding: '4px 10px',
      fontSize: '12px',
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
    },
    dot: {
      width: '8px',
      height: '8px',
      border: '2px solid var(--ink)',
      flexShrink: 0,
    },
    channelId: {
      fontSize: '14px',
      color: 'var(--ink)',
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      marginBottom: '4px',
    },
    peerId: {
      fontSize: '12px',
      color: 'var(--ink)',
      fontFamily: "'Space Mono', monospace",
      wordBreak: 'break-all' as const,
    },
    channelCaption: {
      fontSize: '11px',
      color: 'var(--ink)',
      opacity: 0.8,
      marginTop: '4px',
      maxWidth: '250px',
    },
    balanceRow: {
      marginTop: '16px',
    },
    balanceLabels: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '6px',
      fontSize: '12px',
      color: 'var(--ink)',
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    balanceCaption: {
      fontSize: '10px',
      color: 'var(--ink)',
      opacity: 0.8,
      fontFamily: "'Inter', sans-serif",
      textTransform: 'none',
      letterSpacing: 'normal',
      marginTop: '4px',
      marginBottom: '8px',
      display: 'block'
    },
    balanceBar: {
      height: '12px',
      border: '2px solid var(--ink)',
      background: '#FFFFFF',
      overflow: 'hidden',
    },
    balanceAmounts: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '6px',
      fontSize: '14px',
      fontFamily: "'Space Mono', monospace",
      fontVariantNumeric: 'tabular-nums',
      fontWeight: 700,
    },
    localAmount: { color: 'var(--ink)' },
    remoteAmount: { color: 'var(--ink)' },
    modeBadge: {
      position: 'absolute',
      top: '-3px',
      right: '-3px',
      fontSize: '10px',
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: 'var(--ink)',
      background: mode === 'live' ? 'var(--accent-primary)' : 'var(--mock-tag)',
      border: '3px solid var(--ink)',
      padding: '4px 8px',
      boxShadow: '4px 4px 0px var(--ink)',
    },
    disabledTag: {
      fontSize: '11px',
      color: 'var(--ink)',
      fontFamily: "'Space Grotesk', sans-serif",
      fontWeight: 700,
      textTransform: 'uppercase',
      background: 'var(--accent-secondary)',
      border: '3px solid var(--ink)',
      padding: '2px 6px',
      marginLeft: '8px',
    },
    disclosureBtn: {
      marginTop: '16px',
      background: '#FFFFFF',
      border: '3px solid var(--ink)',
      color: 'var(--ink)',
      fontSize: '11px',
      fontWeight: 700,
      cursor: 'pointer',
      padding: '6px 12px',
      fontFamily: "'Space Grotesk', sans-serif",
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      boxShadow: '2px 2px 0px var(--ink)',
      transition: 'all 0.1s ease-out'
    },
    jsonBlock: {
      marginTop: '8px',
      padding: '12px',
      background: '#FFFFFF',
      border: '3px solid var(--ink)',
      fontSize: '11px',
      fontFamily: "'Space Mono', monospace",
      color: 'var(--ink)',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-all',
      boxShadow: 'inset 4px 4px 0px rgba(17,17,17,0.1)'
    },
  };

  if (!channel) {
    return (
      <div style={styles.card}>
        <div style={{ color: 'var(--ink)', fontSize: '14px', textAlign: 'center', padding: '10px 0', fontWeight: 'bold' }}>
          {channelId ? `Connection ${shortId(channelId)} not found` : 'No connection details provided'}
        </div>
      </div>
    );
  }

  const { label, color, dot, bg } = stateStyle(channel.state);

  const local = BigInt(channel.local_balance);
  const remote = BigInt(channel.remote_balance);
  const total = local + remote;
  const localPct = total === 0n ? 50 : Number((local * 100n) / total);

  return (
    <div style={styles.card}>
      {showModeBadge && (
        <span style={styles.modeBadge} title={mode === 'live' ? 'Live = connected to a real Fiber node right now.' : 'Mock = practice data, not a real payment'}>
          {mode === 'live' ? 'LIVE' : 'MOCK'}
        </span>
      )}

      <div style={styles.header} className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div style={{ minWidth: 0 }}>
          <div style={styles.channelId}>
            Channel {shortId(channel.channel_id)}
          </div>
          <div style={styles.peerId}>
            Peer: {shortId(channel.peer_id)}
          </div>
          <div style={styles.channelCaption}>
            A channel is a private, fast connection between two Fiber wallets.
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <span style={{ ...styles.stateBadge, color, background: bg }}>
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
          <div className="flex flex-col sm:flex-row sm:justify-between mb-3 sm:mb-0">
            <div className="flex justify-between items-end sm:block mb-2 sm:mb-0">
              <div style={{ ...styles.balanceLabels, marginBottom: '2px' }}>You Can Send</div>
              <div style={{ ...styles.balanceAmounts, marginTop: '0' }} className="sm:mt-1">{shannonsToCkb(channel.local_balance)} CKB</div>
            </div>
            <div className="flex justify-between items-end sm:flex-col sm:items-end">
              <div style={{ ...styles.balanceLabels, marginBottom: '2px' }}>You Can Receive</div>
              <div style={{ ...styles.balanceAmounts, marginTop: '0' }} className="sm:mt-1">{shannonsToCkb(channel.remote_balance)} CKB</div>
            </div>
          </div>
          
          <span style={styles.balanceCaption}>Local = what you can send. Remote = what the other side can send you.</span>
          <div style={styles.balanceBar}>
            <div style={{
              height: '100%',
              width: `${localPct}%`,
              background: channel.enabled
                ? 'var(--success)'
                : 'var(--ink)',
              borderRight: '2px solid var(--ink)',
              transition: 'width 0.5s ease-out',
            }} />
          </div>
        </div>
      )}

      {total === 0n && (
        <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--ink)', fontWeight: 600 }}>
          No funds left — this connection is closing or closed.
        </div>
      )}

      <button
        style={styles.disclosureBtn}
        className="w-full sm:w-auto min-h-[44px]"
        onClick={(e) => {
          setRawExpanded((v) => !v);
          const el = e.currentTarget;
          el.style.transform = 'translate(2px, 2px)';
          el.style.boxShadow = '2px 2px 0px var(--ink)';
          setTimeout(() => {
            el.style.transform = '';
            el.style.boxShadow = '';
          }, 100);
        }}
      >
        <span>{rawExpanded ? '▲' : '▼'}</span> See Node Connection Data
      </button>

      {rawExpanded && (
        <pre style={styles.jsonBlock}>
          {JSON.stringify(channel, null, 2)}
        </pre>
      )}
    </div>
  );
}
