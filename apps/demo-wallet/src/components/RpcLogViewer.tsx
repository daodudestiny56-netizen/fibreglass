/**
 * components/RpcLogViewer.tsx
 *
 * Developer panel showing recent JSON-RPC 2.0 request/response logs.
 * Styled with Neo-Brutalism tokens.
 *
 * Stays in apps/demo-wallet as an internal dev-tool.
 */

import { useState } from 'react';
import { useFiberNode } from 'fiberglass-react';

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.toLocaleTimeString()} .${d.getMilliseconds().toString().padStart(3, '0')}`;
}

export function RpcLogViewer() {
  const { rpcLogs } = useFiberNode();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="brutalist-container p-5 mt-6">
      <div className="flex justify-between items-center pb-3 mb-4 border-b-4 border-[var(--ink)]">
        <div className="text-sm font-bold uppercase tracking-widest text-[var(--ink)] flex items-center gap-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Node Connection Data
          <span className="brutalist-badge text-[10px] bg-[var(--accent-primary)] text-[var(--ink)] px-2 py-1 shadow-[2px_2px_0px_var(--ink)]">
            {rpcLogs.length} LOGS
          </span>
        </div>
      </div>

      {rpcLogs.length === 0 ? (
        <div className="text-center text-[var(--ink)] py-8 text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", textTransform: 'uppercase' }}>
          No data recorded yet.
        </div>
      ) : (
        <div className="flex flex-col gap-3 max-h-[320px] overflow-y-auto pr-2">
          {rpcLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const hasError = !!log.error;

            const statusBg = hasError ? 'bg-[var(--accent-secondary)]' : 'bg-[var(--success)]';
            const statusLabel = hasError ? 'ERROR' : 'SUCCESS';

            return (
              <div
                key={log.id}
                className={`border-4 transition-all duration-100 ${
                  isExpanded ? 'border-[var(--ink)] shadow-[4px_4px_0px_var(--ink)]' : 'border-[var(--ink)] shadow-[2px_2px_0px_var(--ink)]'
                }`}
                style={{ backgroundColor: '#FFFFFF' }}
              >
                {/* Header row */}
                <div
                  className="flex items-center p-3 cursor-pointer hover:bg-[var(--accent-primary)] select-none text-xs transition-colors border-b-4 border-transparent hover:border-[var(--ink)]"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  style={{ borderBottomColor: isExpanded ? 'var(--ink)' : 'transparent' }}
                >
                  <span className="mr-3 font-bold text-[14px] text-[var(--ink)]" style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform 0.1s' }}>
                    ▶
                  </span>
                  <span className="font-mono font-bold text-[var(--ink)] flex-1 text-[13px]">
                    {log.method}
                  </span>
                  <span className={`brutalist-badge text-[10px] px-2 py-1 ml-2 ${statusBg} text-[var(--ink)] shadow-[2px_2px_0px_var(--ink)]`}>
                    {statusLabel}
                  </span>
                  <span className="text-[11px] text-[var(--ink)] font-mono ml-3 font-bold">
                    {formatTime(log.timestamp)}
                  </span>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="p-4 flex flex-col gap-4 bg-[#FFFFFF]">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        Data Sent
                      </div>
                      <pre className="bg-[var(--ink)] text-[#FFFFFF] p-3 border-4 border-[var(--ink)] font-mono text-[11px] overflow-auto max-h-[140px] whitespace-pre-wrap break-all shadow-[inset_4px_4px_0px_rgba(0,0,0,0.5)]">
                        {JSON.stringify(log.params, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink)] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {hasError ? 'Error Received' : 'Data Received'}
                      </div>
                      <pre className={`p-3 border-4 border-[var(--ink)] font-mono text-[11px] overflow-auto max-h-[140px] whitespace-pre-wrap break-all ${
                        hasError ? 'bg-[var(--accent-secondary)] text-[var(--ink)] font-bold' : 'bg-[var(--ink)] text-[#FFFFFF] shadow-[inset_4px_4px_0px_rgba(0,0,0,0.5)]'
                      }`}>
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
