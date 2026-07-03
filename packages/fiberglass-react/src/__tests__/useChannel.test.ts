/**
 * __tests__/useChannel.test.ts
 *
 * Tests for the useChannel hook.
 * Uses React Testing Library + Vitest.
 * No network calls — FiberContext is mocked directly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { useChannel } from '../hooks/useChannel';
import { FiberContext } from '../provider/FiberProvider';
import { MOCK_LIST_CHANNELS } from '../lib/mockFixtures';
import type { FiberContextValue } from '../lib/rpcClient';
import { FiberClient } from '../lib/rpcClient';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeWrapper(contextValue: FiberContextValue) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      FiberContext.Provider,
      { value: contextValue },
      children,
    );
  };
}

function makeMockContext(overrides: Partial<FiberContextValue> = {}): FiberContextValue {
  return {
    client: new FiberClient('http://mock-node'),
    mode: 'mock',
    connectionStatus: 'disconnected',
    nodeInfo: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('mock mode', () => {
    it('returns MOCK_LIST_CHANNELS channels after loading', async () => {
      const ctx = makeMockContext({ mode: 'mock' });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(() => useChannel(), { wrapper });

      // Initially loading
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.channels).toHaveLength(MOCK_LIST_CHANNELS.channels.length);
      expect(result.current.error).toBeNull();
    });

    it('filters channels by peerId option', async () => {
      const ctx = makeMockContext({ mode: 'mock' });
      const wrapper = makeWrapper(ctx);
      const targetPeerId = MOCK_LIST_CHANNELS.channels[0]!.peer_id;

      const { result } = renderHook(
        () => useChannel({ peerId: targetPeerId }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.channels).toHaveLength(1);
      expect(result.current.channels[0]?.peer_id).toBe(targetPeerId);
    });

    it('returns empty array for unknown peerId', async () => {
      const ctx = makeMockContext({ mode: 'mock' });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(
        () => useChannel({ peerId: '0xdeadbeef' as import('../lib/rpcClient').Pubkey }),
        { wrapper },
      );

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.channels).toHaveLength(0);
    });
  });

  describe('live mode', () => {
    it('calls client.listChannels and returns channels', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'listChannels').mockResolvedValue(MOCK_LIST_CHANNELS);

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(() => useChannel(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(mockClient.listChannels).toHaveBeenCalledOnce();
      expect(result.current.channels).toHaveLength(MOCK_LIST_CHANNELS.channels.length);
      expect(result.current.error).toBeNull();
    });

    it('sets error state when client throws', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'listChannels').mockRejectedValue(new Error('no route'));

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(() => useChannel(), { wrapper });

      await waitFor(() => expect(result.current.isLoading).toBe(false));

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.rpcMethod).toBe('list_channels');
      expect(result.current.channels).toHaveLength(0);
    });
  });

  describe('refetch', () => {
    it('refetch triggers a second call in live mode', async () => {
      const mockClient = new FiberClient('http://mock-node');
      vi.spyOn(mockClient, 'listChannels').mockResolvedValue(MOCK_LIST_CHANNELS);

      const ctx = makeMockContext({ mode: 'live', client: mockClient });
      const wrapper = makeWrapper(ctx);

      const { result } = renderHook(() => useChannel(), { wrapper });
      await waitFor(() => expect(result.current.isLoading).toBe(false));

      act(() => {
        result.current.refetch();
      });
      await waitFor(() => expect(mockClient.listChannels).toHaveBeenCalledTimes(2));
    });
  });
});
