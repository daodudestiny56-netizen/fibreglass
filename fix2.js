const fs = require('fs');

const mockPath = 'c:\\Users\\USER\\Desktop\\fiber glass\\packages\\fiberglass-react\\src\\lib\\mockFixtures.ts';

let content = fs.readFileSync(mockPath, 'utf8');

// Replace MOCK_SEND_PAYMENT_DRY_RUN
const regexSendPayment = /export const MOCK_SEND_PAYMENT_DRY_RUN: SendPaymentResponse = \{[\s\S]*?\};\n/g;
content = content.replace(regexSendPayment, `export const MOCK_SEND_PAYMENT_DRY_RUN: SendPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  fee: '1200',
  router: [
    {
      channel_outpoint: \`\${MOCK_CHANNEL_A}:0\`,
      target: MOCK_PEER_A,
      amount_received: '400',
      incoming_tlc_expiry: '0x10'
    },
    {
      channel_outpoint: \`\${MOCK_CHANNEL_B}:0\`,
      target: MOCK_PEER_B,
      amount_received: '400',
      incoming_tlc_expiry: '0x10'
    },
    {
      channel_outpoint:
        '0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef:0',
      target: MOCK_PEER_C,
      amount_received: '400',
      incoming_tlc_expiry: '0x10'
    },
  ],
};
`);

// Replace MOCK_GET_PAYMENT_SUCCESS
const regexGetPaymentSuccess = /export const MOCK_GET_PAYMENT_SUCCESS: GetPaymentResponse = \{[\s\S]*?\};\n/g;
content = content.replace(regexGetPaymentSuccess, `export const MOCK_GET_PAYMENT_SUCCESS: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Success',
  fee: '1200',
  failed_error: null,
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
};
`);

// Replace MOCK_GET_PAYMENT_NO_ROUTE
const regexGetPaymentNoRoute = /export const MOCK_GET_PAYMENT_NO_ROUTE: GetPaymentResponse = \{[\s\S]*?\};\n/g;
content = content.replace(regexGetPaymentNoRoute, `export const MOCK_GET_PAYMENT_NO_ROUTE: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Failed',
  fee: null,
  failed_error: 'Failed to find a route: no path found to destination node',
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
};
`);

// Replace MOCK_GET_PAYMENT_INSUFFICIENT
const regexGetPaymentInsuf = /export const MOCK_GET_PAYMENT_INSUFFICIENT: GetPaymentResponse = \{[\s\S]*?\};\n/g;
content = content.replace(regexGetPaymentInsuf, `export const MOCK_GET_PAYMENT_INSUFFICIENT: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Failed',
  fee: null,
  failed_error: 'Send payment error: Failed to build route, Insufficient balance: max outbound liquidity 30100000000 is insufficient, required amount: 1000000000000',
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
};
`);

// Replace MOCK_GET_PAYMENT_NODE_UNREACHABLE
const regexGetPaymentUnreachable = /export const MOCK_GET_PAYMENT_NODE_UNREACHABLE: GetPaymentResponse = \{[\s\S]*?\};\n/g;
content = content.replace(regexGetPaymentUnreachable, `export const MOCK_GET_PAYMENT_NODE_UNREACHABLE: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Failed',
  fee: null,
  failed_error: 'Peer connection failed: unable to reach remote node ' + MOCK_PEER_C,
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
};
`);

fs.writeFileSync(mockPath, content);
console.log('Done');
