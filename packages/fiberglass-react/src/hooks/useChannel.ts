/**
 * hooks/useChannel.ts
 *
 * Wraps the `list_channels` RPC method.
 * In mock mode returns MOCK_LIST_CHANNELS from mockFixtures.ts.
 * In live mode calls the real node and refreshes on demand.
 */

import { useCallback, useEffect, useState } from 'react';
import { useFiberNode } from './useFiberNode';
import { MOCK_LIST_CHANNELS } from '../lib/mockFixtures';
import { buildFiberError } from '../lib/errorMap';
import type {
  ChannelDetail,
  FiberError,
  UseChannelResult,
} from '../lib/rpcClient';

export interface UseChannelOptions {
  /** If provided, filter to channels with this peer pubkey. */
  peerId?: string;
  /** Auto-refresh interval in ms. 0 = no polling. Default: 0. */
  refreshIntervalMs?: number;
}

export function useChannel(options: UseChannelOptions = {}): UseChannelResult {
  const { peerId, refreshIntervalMs = 0 } = options;
  const { client, mode } = useFiberNode();

  const [channels, setChannels] = useState<ChannelDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<FiberError | null>(null);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'mock') {
        // Simulate a brief async delay to make mock feel realistic
        await delay(120);
        const data = MOCK_LIST_CHANNELS;
        client.logMockCall('list_channels', peerId ? { peer_id: peerId } : {}, data);
        const filtered = peerId
          ? data.channels.filter((ch) => ch.peer_id === peerId)
          : data.channels;
        setChannels(filtered);
      } else {
        const data = await client.listChannels(
          peerId ? { peer_id: peerId as import('../lib/rpcClient').Pubkey } : {},
        );
        setChannels(data.channels);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(buildFiberError(msg, 'list_channels'));
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  }, [client, mode, peerId]);

  // Initial fetch
  useEffect(() => {
    void fetch();
  }, [fetch]);

  // Optional polling
  useEffect(() => {
    if (refreshIntervalMs <= 0) return;
    const id = setInterval(() => void fetch(), refreshIntervalMs);
    return () => clearInterval(id);
  }, [fetch, refreshIntervalMs]);

  return { channels, isLoading, error, refetch: fetch };
}


function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
