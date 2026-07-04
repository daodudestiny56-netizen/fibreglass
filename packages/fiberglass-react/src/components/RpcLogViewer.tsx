/**
 * components/RpcLogViewer.tsx
 *
 * Developer panel showing recent JSON-RPC 2.0 request/response logs.
 * Styled using Tailwind CSS to match the premium minimalist light-mode system.
 */

import { useState } from 'react';
import { useFiberNode } from '../hooks/useFiberNode';

function formatTime(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.toLocaleTimeString()} .${d.getMilliseconds().toString().padStart(3, '0')}`;
}

export function RpcLogViewer() {
  const { rpcLogs } = useFiberNode();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 mt-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)]">
      <div className="flex justify-between items-center pb-2.5 mb-3 border-b border-[#F0F0F3]">
        <div className="text-[10px] font-monument tracking-widest text-[#52525B] flex items-center gap-2">
          ️ RPC Log Inspector
          <span className="text-[10px] bg-[#F4F4F5] text-[#52525B] px-2 py-0.5 rounded font-mono font-bold">
            {rpcLogs.length} logs
          </span>
        </div>
      </div>

      {rpcLogs.length === 0 ? (
        <div className="text-center text-[#71717A] py-8 text-xs font-medium">
          No RPC requests recorded yet. Interact with the wallet to generate logs.
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1">
          {rpcLogs.map((log) => {
            const isExpanded = expandedId === log.id;
            const hasError = !!log.error;

            const statusBg = hasError ? 'bg-[#FEF2F2]' : 'bg-[#ECFDF5]';
            const statusColor = hasError ? 'text-[#EF4444]' : 'text-[#10B981]';
            const statusLabel = hasError ? 'ERROR' : 'SUCCESS';

            return (
              <div
                key={log.id}
                className={`border rounded-md overflow-hidden transition-all duration-150 ${
                  isExpanded ? 'border-[#2E5BFF]' : 'border-[#F0F0F3]'
                }`}
              >
                {/* Header row */}
                <div
                  className="flex items-center p-3 cursor-pointer bg-[#F9F9FB] hover:bg-[#F4F4F5] select-none text-xs transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                >
                  <span className="mr-2 text-[10px] text-[#71717A]">
                    {isExpanded ? '▼' : ''}
                  </span>
                  <span className="font-mono font-bold text-[#2E5BFF] flex-1">
                    {log.method}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ml-2 ${statusBg} ${statusColor}`}>
                    {statusLabel}
                  </span>
                  <span className="text-[10px] text-[#71717A] font-mono ml-2">
                    {formatTime(log.timestamp)}
                  </span>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="p-3 bg-[#F9F9FB] border-t border-[#F0F0F3] flex flex-col gap-3">
                    <div>
                      <div className="text-[9px] font-monument tracking-wider text-[#71717A] mb-1">
                        Request Parameters (JSON-RPC ID: {log.id})
                      </div>
                      <pre className="bg-[#121214] text-[#E4E4E7] p-3 rounded font-mono text-[10px] overflow-auto max-h-[140px] whitespace-pre-wrap break-all">
                        {JSON.stringify(log.params, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="text-[9px] font-monument tracking-wider text-[#71717A] mb-1">
                        {hasError ? 'Error Message' : 'Response Result'}
                      </div>
                      <pre className={`p-3 rounded font-mono text-[10px] overflow-auto max-h-[140px] whitespace-pre-wrap break-all ${
                        hasError ? 'bg-[#450A0A] text-[#FCA5A5]' : 'bg-[#121214] text-[#E4E4E7]'
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
