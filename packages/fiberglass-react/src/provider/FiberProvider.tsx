/**
 * provider/FiberProvider.tsx
 *
 * Top-level context provider for Fiberglass.
 *
 * Behaviour:
 *  - Accepts optional `nodeUrl` prop.
 *  - On mount, attempts `node_info` against the URL (or DEFAULT_NODE_URL).
 *  - If `node_info` succeeds → mode = 'live', uses real RPC client.
 *  - If `node_info` fails or `nodeUrl` is absent → mode = 'mock', silent fallback.
 *  - Never throws. Never blocks rendering. Children always mount.
 *
 * The `mode` value is the source of truth for the "Glass" promise:
 * every component that renders data must read `mode` and display a
 * live/mock badge accordingly.
 */

import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  FiberClient,
  DEFAULT_NODE_URL,
  type FiberContextValue,
  type FiberMode,
  type ConnectionStatus,
  type NodeInfoResponse,
  type RpcLog,
} from '../lib/rpcClient';
import { MOCK_NODE_INFO } from '../lib/mockFixtures';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export const FiberContext = createContext<FiberContextValue | null>(null);
FiberContext.displayName = 'FiberContext';

// ---------------------------------------------------------------------------
// Provider props
// ---------------------------------------------------------------------------

export interface FiberProviderProps {
  /**
   * URL of the FNN JSON-RPC endpoint.
   * Defaults to `http://127.0.0.1:8227`.
   * If omitted or unreachable, the SDK silently operates in mock mode.
   */
  nodeUrl?: string;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Provider component
// ---------------------------------------------------------------------------

export function FiberProvider({ nodeUrl, children }: FiberProviderProps) {
  const url = nodeUrl ?? DEFAULT_NODE_URL;
  const clientRef = useRef<FiberClient>(new FiberClient(url));

  const [mode, setMode] = useState<FiberMode>('mock');
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');
  const [nodeInfo, setNodeInfo] = useState<NodeInfoResponse | null>(null);
  const [rpcLogs, setRpcLogs] = useState<RpcLog[]>([]);

  useEffect(() => {
    clientRef.current.onLog = (log) => {
      setRpcLogs((prev) => [log, ...prev].slice(0, 50));
    };
    return () => {
      clientRef.current.onLog = undefined;
    };
  }, []);

  const attemptConnection = useCallback(async () => {
    setConnectionStatus('connecting');

    try {
      const info = await clientRef.current.nodeInfo();
      setNodeInfo(info);
      setMode('live');
      setConnectionStatus('connected');
    } catch {
      // Silent fallback — log to console only in development
      if (import.meta.env.DEV) {
        console.info(
          '[Fiberglass] Could not reach FNN node at %s — operating in mock mode.',
          url,
        );
      }
      // Use the mock node_info so consumers always get a non-null nodeInfo shape
      setNodeInfo(MOCK_NODE_INFO);
      setMode('mock');
      setConnectionStatus('disconnected');
    }
  }, [url]);

  useEffect(() => {
    void attemptConnection();
  }, [attemptConnection]);

  const contextValue: FiberContextValue = {
    client: clientRef.current,
    mode,
    connectionStatus,
    nodeInfo,
    rpcLogs,
  };

  return (
    <FiberContext.Provider value={contextValue}>
      {children}
    </FiberContext.Provider>
  );
}
