/**
 * lib/mockFixtures.ts
 *
 * Realistic fake responses for all six FNN RPC methods.
 * Used when FiberProvider cannot reach a real node (mock mode).
 *
 * IMPORTANT: These are *plausible* shapes based on the FNN documentation
 * and project brief. Every value here MUST be replaced or validated against
 * real captured payloads (Day 1 task). Any field prefixed [PROVISIONAL]
 * in rpcClient.ts may have a different name or type in reality.
 *
 * The multi-hop `routers` array below is the primary driver for
 * PaymentRouteVisualizer in mock mode — it deliberately includes 3 hops
 * to exercise the full visualizer layout.
 */

import type {
  NodeInfoResponse,
  ListChannelsResponse,
  NewInvoiceResponse,
  GetInvoiceResponse,
  SendPaymentResponse,
  GetPaymentResponse,
  Hash256,
  Pubkey,
} from './rpcClient';


const h = (s: string): Hash256 => s as Hash256;
const p = (s: string): Pubkey => s as Pubkey;


const MOCK_NODE_PUBKEY = p(
  '0x02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619',
);

const MOCK_PEER_A = p(
  '0x0327e9a6e7cf27c31af5a97e32516f9acdb47a7fcbb8fc38ac7d0f1f0893c88e16',
);
const MOCK_PEER_B = p(
  '0x02f9f400803e683727b14f463836e1e78e1c64417638aa066919291a225f0e8dd8',
);
const MOCK_PEER_C = p(
  '0x03a94a60c4aef8e62c1bf5c7bff49cb79eb65bef5e7a0a1b6ff5a69e1b4da0f3e',
);

const MOCK_CHANNEL_A = h(
  '0x4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b',
);
const MOCK_CHANNEL_B = h(
  '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
);

const MOCK_PAYMENT_HASH = h(
  '0xa665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3',
);

const MOCK_INVOICE_ADDRESS =
  'fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqq' +
  'zvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfxzf0lfmscmygq5yu' +
  'hqd7gq5r4jvq8qqqdvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfx';


export const MOCK_NODE_INFO: NodeInfoResponse = {
  node_name: 'fiberglass-mock-node',
  node_id: MOCK_NODE_PUBKEY,
  version: '0.3.0',
  addresses: ['/ip4/127.0.0.1/tcp/8228'],
  chain_hash: h(
    '0x92b197aa1fba0f3633922af3d0f943ef6a7f41b200ce85c3e82e7fc6d193bd5e',
  ),
  open_channel_auto_accept_min_ckb_funding_amount: '100000000000',
};


export const MOCK_LIST_CHANNELS: ListChannelsResponse = {
  channels: [
    {
      channel_id: MOCK_CHANNEL_A,
      peer_id: MOCK_PEER_A,
      local_balance: '450000000000', // 4 500 CKB (in shannons: 1 CKB = 10^8 shannons)
      remote_balance: '150000000000', // 1 500 CKB
      enabled: true,
      state: 'ChannelReady',
    },
    {
      channel_id: MOCK_CHANNEL_B,
      peer_id: MOCK_PEER_B,
      local_balance: '80000000000', //  800 CKB
      remote_balance: '320000000000', // 3 200 CKB
      enabled: true,
      state: 'ChannelReady',
    },
    {
      channel_id: h(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      ),
      peer_id: MOCK_PEER_C,
      local_balance: '0',
      remote_balance: '0',
      enabled: false,
      state: 'ShuttingDown',
    },
  ],
};


const MOCK_EXPIRY_SECONDS = 3600;
const MOCK_CREATED_AT = Math.floor(Date.now() / 1000);

export const MOCK_NEW_INVOICE: NewInvoiceResponse = {
  invoice_address: MOCK_INVOICE_ADDRESS,
  invoice: {
    payment_hash: MOCK_PAYMENT_HASH,
    amount: '100000000', // 1 CKB
    currency: 'Fibb', // PROVISIONAL — real currency string from FNN
    expiry: MOCK_CREATED_AT + MOCK_EXPIRY_SECONDS,
    description: 'Mock invoice — Fiberglass demo',
  },
};


export const MOCK_GET_INVOICE_OPEN: GetInvoiceResponse = {
  invoice_address: MOCK_INVOICE_ADDRESS,
  invoice: MOCK_NEW_INVOICE.invoice,
  status: 'Open',
};

export const MOCK_GET_INVOICE_PAID: GetInvoiceResponse = {
  ...MOCK_GET_INVOICE_OPEN,
  status: 'Paid',
};

// ---------------------------------------------------------------------------
// 5. send_payment (dry_run) — success path
//
//    Three hops: node → peer_a → peer_b → peer_c (destination)
//    PROVISIONAL: real field names for RouterHop will come from real payload.
// ---------------------------------------------------------------------------

export const MOCK_SEND_PAYMENT_DRY_RUN: SendPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  fee: '1200', // 12 shannons total fee across the route
  router: [
    {
      channel_outpoint: `${MOCK_CHANNEL_A}:0`,
      target: MOCK_PEER_A,
      amount_received: '400',
      incoming_tlc_expiry: '0x10',
    },
    {
      channel_outpoint: `${MOCK_CHANNEL_B}:0`,
      target: MOCK_PEER_B,
      amount_received: '400',
      incoming_tlc_expiry: '0x10',
    },
    {
      channel_outpoint:
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef:0',
      target: MOCK_PEER_C,
      amount_received: '400',
      incoming_tlc_expiry: '0x10',
    },
  ],
};


export const MOCK_GET_PAYMENT_SUCCESS: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Success',
  fee: '1200',
  failed_error: null,
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
};

// ---------------------------------------------------------------------------
// 6b. get_payment — failure paths
//
//    The `failed_error` strings below are PROVISIONAL placeholders.
//    They will be replaced with real FNN error strings on Day 1 once
//    the user captures deliberate failure scenarios from a testnet node.
//
//    Three distinct failure scenarios to cover errorMap.ts cases:
// ---------------------------------------------------------------------------

/** Failure: no viable route found. PROVISIONAL error string. */
export const MOCK_GET_PAYMENT_NO_ROUTE: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Failed',
  fee: null,
  failed_error: 'Send payment error: Failed to build route, no path found',
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
};

/** Failure: channel has insufficient liquidity. PROVISIONAL error string. */
export const MOCK_GET_PAYMENT_INSUFFICIENT: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Failed',
  fee: null,
  failed_error:
    'Send payment error: Failed to build route, Insufficient balance: max outbound liquidity 30100000000 is insufficient, required amount: 1000000000000',
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
};

/** Failure: remote node not reachable / peer offline. PROVISIONAL error string. */
export const MOCK_GET_PAYMENT_NODE_UNREACHABLE: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Failed',
  fee: null,
  failed_error: 'Peer connection failed: unable to reach remote node ' + MOCK_PEER_C,
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
};


export const mockFixtures = {
  nodeInfo: MOCK_NODE_INFO,
  listChannels: MOCK_LIST_CHANNELS,
  newInvoice: MOCK_NEW_INVOICE,
  getInvoiceOpen: MOCK_GET_INVOICE_OPEN,
  getInvoicePaid: MOCK_GET_INVOICE_PAID,
  sendPaymentDryRun: MOCK_SEND_PAYMENT_DRY_RUN,
  getPaymentSuccess: MOCK_GET_PAYMENT_SUCCESS,
  getPaymentNoRoute: MOCK_GET_PAYMENT_NO_ROUTE,
  getPaymentInsufficient: MOCK_GET_PAYMENT_INSUFFICIENT,
  getPaymentNodeUnreachable: MOCK_GET_PAYMENT_NODE_UNREACHABLE,
} as const;
