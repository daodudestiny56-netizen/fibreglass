# API Reference

Welcome to the Fiberglass API Reference! This document explains how to use every **Hook**, **Context**, and **Component** provided by `fiberglass-react`.

If you are new to React or payment integrations, don't worry! We include code examples and clear explanations for every part of the SDK.

---

## 🔌 Provider & Context

### `<FiberProvider>`
This is the root provider that connects your application to a Fiber Network Node (FNN). It must wrap any component or hook that uses Fiberglass.

If the node URL is unreachable or omitted, it silently falls back to **Mock Mode** (using simulated local data) so your app never crashes.

#### Props
| Prop | Type | Default | Description |
|---|---|---|---|
| `nodeUrl` | `string` | `'http://127.0.0.1:8227'` | The URL of your running FNN JSON-RPC node. |
| `children` | `React.ReactNode` | *(Required)* | Your application components. |

#### Usage Example:
```tsx
import { FiberProvider } from 'fiberglass-react';

function Root() {
  return (
    <FiberProvider nodeUrl="http://127.0.0.1:8227">
      <App />
    </FiberProvider>
  );
}
```

---

## 🪝 React Hooks (Logic & State)

Hooks allow you to write custom interface logic by pulling data directly from your Fiber node or mock environment.

### `useFiberNode()`
Tells you the status of the connection to the Fiber Node.

#### Return Value
*   `mode`: `'live'` or `'mock'`.
*   `connectionStatus`: `'connecting'`, `'connected'`, `'disconnected'`, or `'error'`.
*   `nodeInfo`: Information about the connected node (version, name, public key), or `null`.

#### Usage Example:
```tsx
import { useFiberNode } from 'fiberglass-react';

function ConnectionStatus() {
  const { mode, connectionStatus, nodeInfo } = useFiberNode();

  return (
    <div>
      <p>Status: {connectionStatus}</p>
      <p>Mode: {mode.toUpperCase()}</p>
      {nodeInfo && <p>Node Name: {nodeInfo.node_name}</p>}
    </div>
  );
}
```

---

### `useChannel(options?)`
Retrieves a list of all active payment channels (connections) on this node.

#### Options
*   `peerId` (optional `string`): Filter channels to only show those with a specific peer.
*   `refreshIntervalMs` (optional `number`): Auto-refresh interval in milliseconds. Set to `0` (default) to disable auto-polling.

#### Return Value
*   `channels`: Array of active channels.
*   `isLoading`: `true` while the request is loading.
*   `error`: Any network or API error returned, or `null`.
*   `refetch`: Function you can trigger manually to reload the channel list (e.g., on a refresh button).

#### Usage Example:
```tsx
import { useChannel } from 'fiberglass-react';

function ChannelsList() {
  const { channels, isLoading, refetch } = useChannel({ refreshIntervalMs: 5000 }); // Auto poll every 5s

  if (isLoading) return <p>Loading channels...</p>;

  return (
    <div>
      <button onClick={refetch}>Refresh Now</button>
      {channels.map(ch => (
        <div key={ch.channel_id}>
          <p>Channel ID: {ch.channel_id}</p>
          <p>My Balance: {ch.local_balance} Shannons</p>
        </div>
      ))}
    </div>
  );
}
```

---

### `useConfidence(options)`
Checks if a payment route exists to a recipient invoice before you commit any funds.

#### Options
*   `invoiceAddress` (required `string | null`): The recipient invoice address.
*   `amount` (optional `string`): Overrides the payment amount.

#### Return Value
*   `status`: Current route confidence (`'ready'`, `'insufficient_liquidity'`, `'no_route'`, `'loading'`, `'error'`).
*   `fee`: Estimated transaction fee in Shannons, or `null`.
*   `route`: The array of network hops the payment will take, or `null`.
*   `isLoading`: `true` during pathfinding check.

#### Usage Example:
```tsx
import { useConfidence } from 'fiberglass-react';

function SendChecker({ invoice }) {
  const { status, fee, isLoading } = useConfidence({ invoiceAddress: invoice });

  if (isLoading) return <p>Checking route...</p>;
  if (status === 'no_route') return <p style={{ color: 'red' }}>Error: No path to receiver found.</p>;

  return <p>Route Ready! Est. Fee: {fee} Shannons</p>;
}
```

---

### `useInvoice(options)`
Creates a new payment invoice request and monitors (polls) it until it is paid.

#### Options
*   `amount` (required `string`): The amount in Shannons.
*   `currency` (required `string`): E.g., `'CKB'`.
*   `memo` (optional `string`): Description visible to the payer.
*   `expirySeconds` (optional `number`): Time until invoice expires.
*   `pollIntervalMs` (optional `number`): Interval to check payment status (defaults to `3000`ms).

#### Return Value
*   `invoiceAddress`: The encoded invoice string (to share with the sender).
*   `paymentHash`: Unique transaction hash identifier.
*   `invoiceStatus`: Current status (`'Open'`, `'Expired'`, `'Paid'`).
*   `expiresAt`: Date object when the invoice expires.
*   `isLoading`: `true` while the invoice is being generated.

#### Usage Example:
```tsx
import { useInvoice } from 'fiberglass-react';

function ReceivePayment() {
  const { invoiceAddress, invoiceStatus } = useInvoice({
    amount: '100000000', // 1 CKB
    currency: 'CKB',
    memo: 'Thank you for coffee'
  });

  return (
    <div>
      <p>Invoice String: {invoiceAddress}</p>
      <p>Status: {invoiceStatus}</p>
      {invoiceStatus === 'Paid' && <p>🎉 Received payment!</p>}
    </div>
  );
}
```

---

### `usePayment(options)`
Tracks a payment that you are sending in real-time.

#### Options
*   `paymentHash` (required `string | null`): The payment hash returned after initiating a send command.
*   `pollIntervalMs` (optional `number`): Defaults to `2000`ms.

#### Return Value
*   `status`: Status of the sent payment (`'Created'`, `'Inflight'`, `'Success'`, `'Failed'`).
*   `error`: Error detail if the status is `'Failed'`.

---

## 🎨 UI Components (Pre-styled Views)

Fiberglass includes built-in, pre-designed components that you can insert directly into your JSX/TSX files.

### `<InvoiceSheet>`
Renders an interactive payment screen displaying a QR code, copyable invoice text, an expiration countdown timer, and a checkmark state once paid.

#### Props
*   `amount` (optional `string`): Creates an invoice automatically if provided.
*   `currency` (optional `string`): E.g., `'CKB'`.
*   `memo` (optional `string`): Invoice description.
*   `onFulfilled` (optional `(hash: string) => void`): Callback run when payment is successful.

#### Usage Example:
```tsx
import { InvoiceSheet } from 'fiberglass-react';

function Checkout() {
  return (
    <InvoiceSheet 
      amount="500000000" // 5 CKB
      currency="CKB"
      memo="Purchase Premium Plan"
      onFulfilled={(hash) => alert('Order Complete!')}
    />
  );
}
```

---

### `<ChannelLifecycleCard>`
Displays a beautiful layout showing a connection's capacity, local (spendable) balance, and remote (receivable) balance with visual progress bars.

#### Props
*   `channelId` (optional `string`): Specific channel to query and display.
*   `showModeBadge` (optional `boolean`): Show the orange/green MOCK/LIVE status indicator.

---

### `<ConfidenceCheck>`
An inline status card designed to be shown before sending a payment. It visually confirms if a payment route exists.

#### Props
*   `invoiceAddress` (required `string | null`): The destination invoice address to test.
*   `amount` (optional `string`): The amount override.

---

### `<PaymentRouteVisualizer>`
An animated hop-by-hop diagram showing how a transaction flows from your node, through intermediate node channels, and finally to the destination wallet.

#### Props
*   `hops` (required `RouterHop[]`): Array of payment steps (usually retrieved from `useConfidence`).
*   `paymentStatus` (optional `string`): Visual states like `'Success'` or `'Failed'`.
*   `isAnimating` (optional `boolean`): Enables live payment pulse animation effects.

---

### `<ErrorResolutionBanner>`
A smart banner that reads raw node codes (e.g. from connection issues, route failures) and displays helpful tips in plain English on how to fix them.

#### Props
*   `error` (required `FiberError | null`): The error object caught from a hook.
*   `retry` (optional `() => void`): Provides a retry button trigger.
