const fs = require('fs');

const mockPath = 'c:\\Users\\USER\\Desktop\\fiber glass\\packages\\fiberglass-react\\src\\lib\\mockFixtures.ts';

let content = fs.readFileSync(mockPath, 'utf8');

content = content.replace(
/export const MOCK_GET_PAYMENT_SUCCESS: GetPaymentResponse = \{\s*payment_hash: MOCK_PAYMENT_HASH,\s*status: 'Success',\s*fee: '1200',\s*amount: '100000000',\s*failed_error: null,\s*\};/g,
`export const MOCK_GET_PAYMENT_SUCCESS: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Success',
  fee: '1200',
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
  failed_error: null,
};`
);

content = content.replace(
/export const MOCK_GET_PAYMENT_INSUFFICIENT: GetPaymentResponse = \{\s*payment_hash: MOCK_PAYMENT_HASH,\s*status: 'Failed',\s*fee: null,\s*amount: '100000000',\s*\/\/ PROVISIONAL — replace with real FNN error string\s*failed_error: 'Failed to find a route: no path found to destination node',\s*\};/g,
`export const MOCK_GET_PAYMENT_INSUFFICIENT: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Failed',
  fee: null,
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
  failed_error: 'Send payment error: Failed to build route, Insufficient balance: max outbound liquidity 30100000000 is insufficient, required amount: 1000000000000',
};`
);

content = content.replace(
/export const MOCK_GET_PAYMENT_NO_ROUTE: GetPaymentResponse = \{\s*payment_hash: MOCK_PAYMENT_HASH,\s*status: 'Failed',\s*fee: null,\s*amount: '100000000',\s*failed_error: 'Insufficient liquidity on channel 0x...',\s*\};/g,
`export const MOCK_GET_PAYMENT_NO_ROUTE: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Failed',
  fee: null,
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
  failed_error: 'Send payment error: Failed to build route, no path found',
};`
);

content = content.replace(
/export const MOCK_GET_PAYMENT_UNKNOWN: GetPaymentResponse = \{\s*payment_hash: MOCK_PAYMENT_HASH,\s*status: 'Failed',\s*fee: null,\s*amount: '100000000',\s*failed_error: 'Unknown error occurred',\s*\};/g,
`export const MOCK_GET_PAYMENT_UNKNOWN: GetPaymentResponse = {
  payment_hash: MOCK_PAYMENT_HASH,
  status: 'Failed',
  fee: null,
  created_at: '0x19f55c86409',
  last_updated_at: '0x19f55c86409',
  custom_records: null,
  failed_error: 'Send payment error: Database lock timeout',
};`
);

fs.writeFileSync(mockPath, content);
console.log('Done');
