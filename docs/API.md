# API Reference

This document provides a complete reference for all Hooks, Contexts, Components, and Types exported by `fiberglass-react`.

---

## Provider & Context

### `<FiberProvider>`

Provides low-level JSON-RPC connection state to all child hooks and components. If no `nodeUrl` is provided, or the node at `nodeUrl` is unreachable, it silently operates in **Mock Mode** using the stable mock data fixtures.

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `nodeUrl` | `string` | `'http://127.0.0.1:8227'` | The FNN JSON-RPC HTTP endpoint URL. |
| `children` | `React.ReactNode` | *(Required)* | Child components. |

---

## Hooks

### `useFiberNode()`

Returns the current Fiber connection context values.

#### Return Value

```typescript
interface FiberContextValue {
  client: FiberClient;
  mode: 'live' | 'mock';
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  nodeInfo: NodeInfoResponse | null;
}
```

---

### `useChannel(options?)`

Queries the active channel list from the Fiber node.

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `peerId` | `string` | `undefined` | Filter the channel list to a single counterparty peer pubkey. |
| `refreshIntervalMs` | `number` | `0` | Auto-polling interval in milliseconds. `0` disables polling. |

#### Return Value

```typescript
interface UseChannelResult {
  channels: ChannelDetail[];
  isLoading: boolean;
  error: FiberError | null;
  refetch: () => void;
}
```

---

### `useConfidence(options)`

Performs a dry-run validation of a payment path without committing funds.

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `invoiceAddress` | `string \| null` | *(Required)* | The invoice string to check routing paths for. |
| `amount` | `AmountString` | `undefined` | Optional amount override. |

#### Return Value

```typescript
interface UseConfidenceResult {
  status: ConfidenceStatus; // 'ready' | 'insufficient_liquidity' | 'no_route' | 'asset_mismatch' | 'loading' | 'error'
  fee: AmountString | null;
  route: RouterHop[] | null;
  isLoading: boolean;
  error: FiberError | null;
}
```

---

### `useInvoice(options)`

Generates a new invoice and automatically polls `get_invoice` until a terminal state is reached.

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `amount` | `AmountString` | *(Required)* | Invoice amount in shannons or UDT units. |
| `currency` | `string` | *(Required)* | Currency identifier (e.g. `'CKB'`). |
| `memo` | `string` | `undefined` | Optional memo description. |
| `expirySeconds` | `number` | `undefined` | Invoice expiry duration. |
| `pollIntervalMs` | `number` | `3000` | Polling interval for invoice status. |

#### Return Value

```typescript
interface UseInvoiceResult {
  invoiceAddress: string | null;
  paymentHash: Hash256 | null;
  invoiceStatus: InvoiceStatus | null; // 'Open' | 'Cancelled' | 'Expired' | 'Received' | 'Paid'
  expiresAt: Date | null;
  isLoading: boolean;
  error: FiberError | null;
  pollNow: () => void;
}
```

---

### `usePayment(options)`

Fetches status details and hop-path data for a payment hash, polling until completed.

#### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `paymentHash` | `Hash256 \| null` | *(Required)* | The payment hash to query. Polling begins when non-null. |
| `pollIntervalMs` | `number` | `2000` | Polling interval. |

#### Return Value

```typescript
interface UsePaymentResult {
  payment: GetPaymentResponse | null;
  status: PaymentStatus | null; // 'Created' | 'Inflight' | 'Success' | 'Failed'
  isLoading: boolean;
  error: FiberError | null;
  refetch: () => void;
}
```

---

## Components

### `<ChannelLifecycleCard>`

Renders channel capacity and local/remote balances.

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `channel` | `ChannelDetail` | `undefined` | A pre-loaded channel detail object. |
| `channelId` | `string` | `undefined` | Specific channel ID to query internally. |
| `showModeBadge` | `boolean` | `false` | Shows whether mock or live data is currently viewed. |
| `mode` | `'live' \| 'mock'` | `'mock'` | Renders visual mode label. |

---

### `<ConfidenceCheck>`

Validates invoice payment paths.

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `status` | `ConfidenceStatus` | `undefined` | Prefetched status code. |
| `fee` | `AmountString \| null` | `undefined` | Prefetched routing fee. |
| `route` | `RouterHop[] \| null` | `undefined` | Prefetched hop arrays. |
| `isLoading` | `boolean` | `undefined` | Prefetched loading status. |
| `error` | `FiberError \| null` | `undefined` | Prefetched routing error. |
| `invoiceAddress`| `string \| null` | `undefined` | If provided, queries route confidence internally. |
| `amount` | `AmountString` | `undefined` | Optional amount override. |
| `asset` | `string` | `undefined` | Display label of the asset. |
| `renderStatus` | `(status: ConfidenceStatus) => React.ReactNode` | `undefined` | Render-prop escape hatch to custom render status labels. |
| `mode` | `'live' \| 'mock'` | `'mock'` | Mode display styling. |

---

### `<InvoiceSheet>`

Displays invoices with copy functions and interactive countdowns.

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `invoiceAddress`| `string \| null` | `undefined` | Encoded invoice string. |
| `paymentHash` | `Hash256 \| null` | `undefined` | Invoice payment hash. |
| `invoiceStatus` | `InvoiceStatus \| null` | `undefined` | Current invoice status. |
| `expiresAt` | `Date \| null` | `undefined` | Expiry timestamp. |
| `isLoading` | `boolean` | `undefined` | Loading status. |
| `error` | `FiberError \| null` | `undefined` | Invoiced error. |
| `amount` | `string` | `undefined` | If provided alongside currency, generates invoice internally. |
| `currency` | `string` | `undefined` | Currency label. |
| `memo` | `string` | `undefined` | Invoice memo. |
| `expirySeconds` | `number` | `undefined` | Expiry timeout override. |
| `onFulfilled` | `(paymentHash: string) => void` | `undefined` | Callback fired when the payment is completed. |
| `onCopy` | `(address: string) => void` | `undefined` | Copy button callback. |
| `mode` | `'live' \| 'mock'` | `'mock'` | Mode display badge. |

---

### `<PaymentRouteVisualizer>`

Animates hop paths, displaying fees per hop and highlighting failed nodes.

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `hops` | `RouterHop[]` | `[]` | Parsed hop list. |
| `paymentStatus` | `PaymentStatus \| null`| `undefined` | Final payment status. |
| `totalFee` | `string \| null` | `undefined` | Total route fees. |
| `paymentHash` | `string \| null` | `undefined` | If provided, fetches route detail internally. |
| `mode` | `'live' \| 'mock'` | `'mock'` | Mode label. |
| `isAnimating` | `boolean` | `false` | Toggles sending pulse animations. |

---

### `<ErrorResolutionBanner>`

Displays user-friendly error banners and retry actions.

#### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `error` | `FiberError \| null` | *(Required)* | Fiber error details. |
| `onDismiss` | `() => void` | `undefined` | Close banner callback. |
| `retry` | `() => void` | `undefined` | Shows a retry action button if provided. |
