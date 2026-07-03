# Fiberglass

> **The Developer Experience Layer for Fiber Network**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Demo](https://img.shields.io/badge/Demo-live-brightgreen)](https://fiberglass-demo.vercel.app)

Install one package. Get production-quality Fiber payment UI in under 10 lines of code.

```tsx
import { FiberProvider, InvoiceSheet } from 'fiberglass-react';

function App() {
  return (
    <FiberProvider nodeUrl="http://your-fnn-node:8227">
      <InvoiceSheet amount="100000000" currency="CKB" />
    </FiberProvider>
  );
}
```

---

## What is Fiber Network?

Fiber Network (FNN) is a payment-channel network on CKB — think Lightning Network for CKB. FNN exposes a raw JSON-RPC 2.0 interface for wallets and applications to build on top of.

## What is Fiberglass?

Fiberglass is the UX layer between your app and FNN's raw RPC surface. It provides:

- **`FiberProvider`** — connection management, live/mock mode detection, context
- **`useChannel`** — channel state, local/remote balance, enabled status
- **`useConfidence`** — dry-run payment validation before committing funds
- **`useInvoice`** — invoice creation, QR display, expiry countdown, fulfillment polling
- **`usePayment`** — real-time payment status, route data
- **`<ChannelLifecycleCard>`** — visual channel state with balance bars
- **`<ConfidenceCheck>`** — pre-send route validation with clear status states
- **`<InvoiceSheet>`** — QR + copyable invoice, countdown, live fulfillment
- **`<ErrorResolutionBanner>`** — human-readable resolution hints from raw FNN errors
- **`<PaymentRouteVisualizer>`** — animated hop-by-hop route diagram

## The "Glass" Promise

Every component always makes clear whether it's showing **live node data** or **simulated mock data**. A `mode` badge is never optional, never hideable. This isn't just a UX nicety — it's the core promise of the library name.

## Live Demo

🔗 **[fiberglass-demo.vercel.app](https://fiberglass-demo.vercel.app)** *(link updated on Day 5)*

📹 **[Video walkthrough](https://youtu.be/placeholder)** *(link updated on Day 7)*

## Quick Start

See **[docs/INTEGRATION.md](./docs/INTEGRATION.md)** for a full step-by-step guide.

## Documentation

- [Integration guide](./docs/INTEGRATION.md)
- [API reference](./docs/API.md)
- [Testing checklist](./TESTING.md)
- [Roadmap](./ROADMAP.md)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
├─────────────────────────────────────────────────────────┤
│   fiberglass-react (this package)                        │
│   ┌──────────────┐  ┌───────────────────────────────┐  │
│   │  FiberProvider│  │  Hooks (logic layer)           │  │
│   │  ─────────── │  │  useChannel · useConfidence    │  │
│   │  mode: live  │  │  useInvoice · usePayment       │  │
│   │       mock   │  │  useFiberNode                  │  │
│   └──────┬───────┘  └───────────────────────────────┘  │
│          │           ┌───────────────────────────────┐  │
│          │           │  Components (thin renderers)   │  │
│          │           │  ChannelLifecycleCard          │  │
│          │           │  ConfidenceCheck               │  │
│          │           │  InvoiceSheet                  │  │
│          │           │  ErrorResolutionBanner         │  │
│          │           │  PaymentRouteVisualizer        │  │
│          │           └───────────────────────────────┘  │
│          │           ┌───────────────────────────────┐  │
│          └──────────▶│  lib/rpcClient.ts             │  │
│                      │  lib/errorMap.ts              │  │
│                      │  lib/mockFixtures.ts          │  │
│                      └───────────────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│        Fiber Network Node (FNN) — JSON-RPC 2.0          │
│        http://127.0.0.1:8227  (default)                 │
└─────────────────────────────────────────────────────────┘
```

## Hackathon Context

Built for the **"Gone in 60ms" Fiber Network Infrastructure Hackathon**, submitting under **Wallet and Payment UX Infrastructure**.

## License

MIT — see [LICENSE](./LICENSE).
