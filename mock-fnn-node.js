/**
 * mock-fnn-node.js
 *
 * A lightweight local JSON-RPC 2.0 Mock Server that runs on port 8227.
 * It implements all six FNN node RPC methods:
 *   - node_info
 *   - list_channels
 *   - new_invoice
 *   - get_invoice
 *   - send_payment
 *   - get_payment
 *
 * This allows the client application (demo-wallet or new project) to switch to
 * "LIVE" mode locally, testing real RPC client connections and API integration.
 */

const http = require('http');

const PORT = 8227;

// In-memory store for invoices and payments
const invoices = new Map();
const payments = new Map();

// Constants
const NODE_PUBKEY = '0x02eec7245d6b7d2ccb30380bfbe2a3648cd7a942653f5aa340edcea1f283686619';
const PEER_A = '0x0327e9a6e7cf27c31af5a97e32516f9acdb47a7fcbb8fc38ac7d0f1f0893c88e16';
const PEER_B = '0x02f9f400803e683727b14f463836e1e78e1c64417638aa066919291a225f0e8dd8';
const PEER_C = '0x03a94a60c4aef8e62c1bf5c7bff49cb79eb65bef5e7a0a1b6ff5a69e1b4da0f3e';

const CHANNEL_A = '0x4a5e1e4baab89f3a32518a88c31bc87f618f76673e2cc77ab2127b7afdeda33b';
const CHANNEL_B = '0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069';

// Seed initial mock invoice
const initialPaymentHash = '0xa665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
const initialInvoiceAddr = 'fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqqzvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfxzf0lfmscmygq5yuhqd7gq5r4jvq8qqqdvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfx';

invoices.set(initialPaymentHash, {
  invoice_address: initialInvoiceAddr,
  invoice: {
    payment_hash: initialPaymentHash,
    amount: '100000000',
    currency: 'Fibb',
    expiry: Math.floor(Date.now() / 1000) + 3600,
    description: 'Mock invoice — Fiberglass live mode test',
  },
  status: 'Open',
});

// JSON-RPC 2.0 Request Router
function handleRpcRequest(method, params) {
  console.log(`[RPC Method: ${method}]`, JSON.stringify(params));

  switch (method) {
    case 'node_info':
      return {
        node_name: 'fiberglass-live-fnn-node',
        node_id: NODE_PUBKEY,
        version: '0.3.0',
        addresses: ['/ip4/127.0.0.1/tcp/8228'],
        chain_hash: '0x92b197aa1fba0f3633922af3d0f943ef6a7f41b200ce85c3e82e7fc6d193bd5e',
        open_channel_auto_accept_min_ckb_funding_amount: '100000000000',
      };

    case 'list_channels':
      return {
        channels: [
          {
            channel_id: CHANNEL_A,
            peer_id: PEER_A,
            local_balance: '450000000000',
            remote_balance: '150000000000',
            enabled: true,
            state: 'ChannelReady',
          },
          {
            channel_id: CHANNEL_B,
            peer_id: PEER_B,
            local_balance: '80000000000',
            remote_balance: '320000000000',
            enabled: true,
            state: 'ChannelReady',
          },
        ],
      };

    case 'new_invoice': {
      const amount = params.amount;
      const currency = params.currency || 'CKB';
      const description = params.description || params.memo || '';
      const expiry = Math.floor(Date.now() / 1000) + (params.expiry_seconds || 3600);
      const payment_hash = '0x' + require('crypto').randomBytes(32).toString('hex');
      const invoice_address = 'fibb1' + require('crypto').randomBytes(60).toString('hex');

      const invoiceData = {
        invoice_address,
        invoice: {
          payment_hash,
          amount,
          currency,
          expiry,
          description,
        },
        status: 'Open',
      };

      invoices.set(payment_hash, invoiceData);
      return {
        invoice_address,
        invoice: invoiceData.invoice,
      };
    }

    case 'get_invoice': {
      const hash = params.payment_hash;
      const inv = invoices.get(hash);
      if (!inv) {
        throw { code: -32602, message: 'Invoice not found' };
      }
      return inv;
    }

    case 'send_payment': {
      // In FNN, payment can be sent by invoice string or by node details
      const invoiceStr = params.invoice;
      const isDryRun = params.dry_run === true;
      let targetHash = initialPaymentHash;

      // Find matching invoice if any
      if (invoiceStr) {
        for (const [hash, inv] of invoices.entries()) {
          if (inv.invoice_address === invoiceStr) {
            targetHash = hash;
            break;
          }
        }
      }

      if (isDryRun) {
        // Return routing paths
        return {
          payment_hash: targetHash,
          fee: '1200',
          router: [
            {
              channel_outpoint: `${CHANNEL_A}:0`,
              target: PEER_A,
              amount_received: '400',
              incoming_tlc_expiry: '0x10',
            },
            {
              channel_outpoint: `${CHANNEL_B}:0`,
              target: PEER_B,
              amount_received: '400',
              incoming_tlc_expiry: '0x10',
            },
            {
              channel_outpoint: '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef:0',
              target: PEER_C,
              amount_received: '400',
              incoming_tlc_expiry: '0x10',
            },
          ],
        };
      } else {
        // Real payment send — set status to Paid in memory
        const inv = invoices.get(targetHash);
        if (inv) {
          inv.status = 'Paid';
          invoices.set(targetHash, inv);
        }

        const paymentData = {
          payment_hash: targetHash,
          status: 'Success',
          fee: '1200',
          failed_error: null,
          created_at: '0x' + Date.now().toString(16),
          last_updated_at: '0x' + Date.now().toString(16),
          custom_records: null,
        };
        payments.set(targetHash, paymentData);

        return {
          payment_hash: targetHash,
          fee: '1200',
          router: [],
        };
      }
    }

    case 'get_payment': {
      const hash = params.payment_hash;
      const pay = payments.get(hash);
      if (pay) {
        return pay;
      }
      // If we don't have a record of sending it, return success by default for initial seed
      if (hash === initialPaymentHash) {
        return {
          payment_hash: initialPaymentHash,
          status: 'Success',
          fee: '1200',
          failed_error: null,
          created_at: '0x19f55c86409',
          last_updated_at: '0x19f55c86409',
          custom_records: null,
        };
      }
      return {
        payment_hash: hash,
        status: 'Inflight',
        fee: null,
        failed_error: null,
        created_at: '0x' + Date.now().toString(16),
        last_updated_at: '0x' + Date.now().toString(16),
        custom_records: null,
      };
    }

    default:
      throw { code: -32601, message: `Method not found: ${method}` };
  }
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const json = JSON.parse(body);
        const { method, params, id } = json;

        if (!method) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32600, message: 'Invalid Request' }, id }));
          return;
        }

        try {
          const result = handleRpcRequest(method, params || {});
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', result, id }));
        } catch (err) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: err.code || -32603, message: err.message || 'Internal error' },
            id
          }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32700, message: 'Parse error' }, id: null }));
      }
    });
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Mock FNN JSON-RPC Node endpoint. Send POST request.');
  }
});

server.listen(PORT, () => {
  console.log(`[Mock FNN Node] Running on http://127.0.0.1:${PORT}`);
  console.log(`[Mock FNN Node] Ready to process JSON-RPC requests for Fiberglass LIVE mode!`);
});
