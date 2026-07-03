/**
 * __tests__/rpcClient.test.ts
 *
 * Unit tests for FiberClient.
 * Uses fetch mocking — no real network calls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FiberClient, DEFAULT_NODE_URL } from '../lib/rpcClient';
import { MOCK_NODE_INFO, MOCK_LIST_CHANNELS } from '../lib/mockFixtures';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchSuccess(result: unknown) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ jsonrpc: '2.0', result, id: 1 }),
  } as Response);
}

function mockFetchRpcError(message: string) {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      jsonrpc: '2.0',
      error: { code: -32603, message },
      id: 1,
    }),
  } as Response);
}

function mockFetchNetworkError() {
  global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FiberClient', () => {
  let client: FiberClient;

  beforeEach(() => {
    client = new FiberClient(DEFAULT_NODE_URL);
  });

  describe('nodeInfo()', () => {
    it('returns the node info on success', async () => {
      mockFetchSuccess(MOCK_NODE_INFO);
      const result = await client.nodeInfo();
      expect(result.node_name).toBe(MOCK_NODE_INFO.node_name);
      expect(result.node_id).toBe(MOCK_NODE_INFO.node_id);
    });

    it('throws a FiberError on RPC error', async () => {
      mockFetchRpcError('Internal server error');
      await expect(client.nodeInfo()).rejects.toMatchObject({
        code: 'UNKNOWN',
        rawMessage: 'Internal server error',
        rpcMethod: 'node_info',
      });
    });

    it('throws a FiberError on network failure', async () => {
      mockFetchNetworkError();
      await expect(client.nodeInfo()).rejects.toMatchObject({
        code: 'NODE_UNREACHABLE',
        rpcMethod: 'node_info',
      });
    });
  });

  describe('listChannels()', () => {
    it('returns channels list on success', async () => {
      mockFetchSuccess(MOCK_LIST_CHANNELS);
      const result = await client.listChannels();
      expect(result.channels).toHaveLength(MOCK_LIST_CHANNELS.channels.length);
    });

    it('sends the correct JSON-RPC method', async () => {
      mockFetchSuccess(MOCK_LIST_CHANNELS);
      await client.listChannels();
      const body = JSON.parse((vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit).body as string);
      expect(body.method).toBe('list_channels');
      expect(body.jsonrpc).toBe('2.0');
    });
  });

  describe('sendPaymentDryRun()', () => {
    it('always sets dry_run: true in the request body', async () => {
      mockFetchSuccess({ payment_hash: '0xabc', fee: '100', router: [] });
      await client.sendPaymentDryRun({ invoice: 'fibb1q...' });
      const body = JSON.parse((vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit).body as string);
      expect(body.params.dry_run).toBe(true);
    });
  });

  describe('request ID increments', () => {
    it('increments the request id on each call', async () => {
      // Set up two independent mock responses
      global.fetch = vi
        .fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jsonrpc: '2.0', result: MOCK_NODE_INFO, id: 1 }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ jsonrpc: '2.0', result: MOCK_NODE_INFO, id: 2 }),
        } as Response);

      await client.nodeInfo();
      await client.nodeInfo();

      const calls = vi.mocked(fetch).mock.calls;
      const id1 = JSON.parse((calls[0]?.[1] as RequestInit).body as string).id as number;
      const id2 = JSON.parse((calls[1]?.[1] as RequestInit).body as string).id as number;
      expect(id2).toBe(id1 + 1);
    });
  });
});
