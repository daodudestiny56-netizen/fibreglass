/**
 * components/RpcLogViewer.tsx
 *
 * Developer panel showing recent JSON-RPC 2.0 request/response logs.
 * Supports light mode aesthetics and expanding log entries to view JSON details.
 */

import React, { useState } from 'react';
import { useFiberNode } from '../hooks/useFiberNode';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.toLocaleTimeString()} .${d.getMilliseconds().toString().padStart(3, '0')}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function RpcLogViewer() {
  const { rpcLogs } = useFiberNode();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const styles: Record<string, React.CSSProperties> = {
    container: {
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#334155',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      marginTop: '20px',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '1px solid #f1f5f9',
      paddingBottom: '10px',
      marginBottom: '12px',
    },
    title: {
      fontSize: '13px',
      fontWeight: 700,
      color: '#475569',
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
    },
    badge: {
      fontSize: '11px',
      background: '#f1f5f9',
      color: '#475569',
      padding: '2px 8px',
      borderRadius: '12px',
      fontWeight: 600,
    },
    logList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      maxHeight: '280px',
      overflowY: 'auto',
      paddingRight: '4px',
    },
    logItem: {
      border: '1px solid #f1f5f9',
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'border-color 0.15s',
    },
    logHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 12px',
      cursor: 'pointer',
      background: '#f8fafc',
      userSelect: 'none',
      fontSize: '12px',
    },
    methodName: {
      fontFamily: 'monospace',
      fontWeight: 700,
      color: '#6366f1',
      flex: 1,
    },
    statusText: {
      fontSize: '10px',
      fontWeight: 600,
      padding: '2px 6px',
      borderRadius: '4px',
      marginLeft: '8px',
    },
    timeText: {
      fontSize: '10px',
      color: '#94a3b8',
      fontFamily: 'monospace',
      marginLeft: '8px',
    },
    logContent: {
      padding: '12px',
      background: '#f8fafc',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    },
    jsonBlock: {
      background: '#0f172a',
      color: '#cbd5e1',
      padding: '8px 12px',
      borderRadius: '6px',
      fontSize: '10px',
      fontFamily: 'monospace',
      margin: 0,
      overflow: 'auto',
      maxHeight: '140px',
    },
    subTitle: {
      fontSize: '10px',
      fontWeight: 700,
      textTransform: 'uppercase',
      color: '#64748b',
      letterSpacing: '0.04em',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.title}>
          ⚙️ RPC Log Inspector
          <span style={styles.badge}>{rpcLogs.length} logs</span>
        </div>
      </div>

      {rpcLogs.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '12px' }}>
          No RPC requests recorded yet. Interact with the wallet to generate logs.
        </div>
      ) : (
        <div style={styles.logList}>
          {rpcLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const hasError = !!log.error;

            const statusBg = hasError ? '#fef2f2' : '#f0fdf4';
            const statusColor = hasError ? '#ef4444' : '#22c55e';
            const statusLabel = hasError ? 'ERROR' : 'SUCCESS';

            return (
              <div
                key={log.id}
                style={{
                  ...styles.logItem,
                  borderColor: isExpanded ? '#6366f1' : '#f1f5f9',
                }}
              >
                <div
                  style={styles.logHeader}
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <span style={{ marginRight: '6px', fontSize: '10px', color: '#94a3b8' }}>
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span style={styles.methodName}>
                    {log.method}
                  </span>
                  <span style={{ ...styles.statusText, background: statusBg, color: statusColor }}>
                    {statusLabel}
                  </span>
                  <span style={styles.timeText}>
                    {formatTime(log.timestamp)}
                  </span>
                </div>

                {isExpanded && (
                  <div style={styles.logContent}>
                    <div>
                      <div style={styles.subTitle}>Request Parameters (JSON-RPC ID: {log.id})</div>
                      <pre style={styles.jsonBlock}>
                        {JSON.stringify(log.params, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div style={styles.subTitle}>
                        {hasError ? 'Error Message' : 'Response Result'}
                      </div>
                      <pre style={{
                        ...styles.jsonBlock,
                        background: hasError ? '#450a0a' : '#0f172a',
                        color: hasError ? '#fca5a5' : '#cbd5e1',
                      }}>
                        {JSON.stringify(hasError ? log.error : log.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
