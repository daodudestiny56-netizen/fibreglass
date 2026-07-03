# Integration Guide

> Get Fiberglass running in under 10 lines of code.

## Prerequisites

- Node.js 18+
- React 18+
- Tailwind CSS configured in your project (for component styling)
- Optional: a running Fiber Network Node (FNN) — the SDK defaults to mock mode without one

## Step 1 — Install

```bash
npm install fiberglass-react
```

## Step 2 — Wrap your app with `FiberProvider`

```tsx
// App.tsx
import { FiberProvider } from 'fiberglass-react';

export default function App() {
  return (
    // nodeUrl is optional — omit for mock mode, provide for live data
    <FiberProvider nodeUrl="http://127.0.0.1:8227">
      <YourApp />
    </FiberProvider>
  );
}
```

`FiberProvider` will:
1. Attempt `node_info` against the `nodeUrl`.
2. If it succeeds → `mode = 'live'` (all components show real data).
3. If it fails or `nodeUrl` is omitted → `mode = 'mock'` (all components show clearly-labelled simulated data).
4. It never throws. It never blocks rendering.

## Step 3 — Use a component

```tsx
// ReceivePage.tsx
import { InvoiceSheet } from 'fiberglass-react';

export function ReceivePage() {
  return (
    <InvoiceSheet
      amount="100000000"   // 1 CKB in shannons
      currency="CKB"
      memo="Payment for order #1234"
      onFulfilled={(hash) => console.log('Paid!', hash)}
    />
  );
}
```

That's it. The component handles invoice creation, QR display, expiry countdown, and fulfillment polling automatically.

## Environment variable (for deployed apps)

```bash
# .env.production
VITE_FIBER_NODE_URL=http://your-fnn-node.example.com:8227
```

If `VITE_FIBER_NODE_URL` is set and reachable, the app goes live. If not, it stays in mock mode. No code change needed.

## Full API

See [API.md](./API.md) for all props and hook return types.
