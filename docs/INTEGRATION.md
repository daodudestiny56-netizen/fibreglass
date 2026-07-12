# Integration Guide

> Get Fiberglass running in under 10 lines of code.

## Prerequisites

- Node.js 18+
- React 18+
- Tailwind CSS configured in your project (for component styling)
- Optional: a running Fiber Network Node (FNN) — the SDK defaults to mock mode without one

## Step 1 — Install

From npm registry:
```bash
npm install fiberglass-react
```

Or for offline/local testing during development or hackathons:
```bash
npm install /path/to/fiberglass-react-0.1.0.tgz
```

## Step 2 — Wrap your app with `FiberProvider` and import styles

```tsx
// App.tsx
import { FiberProvider } from 'fiberglass-react';
// Import the compiled SDK styling (required for components to render correctly)
import 'fiberglass-react/styles.css';

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

If `VITE_FIBER_NODE_URL` is set and reachable, the app goes live. If not, it falls back to mock mode. No code change is needed.

## Deployment Guidelines

### 1. Hosting on Platforms (Vercel, Netlify, Cloudflare Pages)
When deploying your React app or the demo wallet application:
1. Ensure your bundler environment variable matches the config (e.g., prefix with `VITE_` for Vite projects, `NEXT_PUBLIC_` for Next.js, or `REACT_APP_` for CRA).
2. Configure `VITE_FIBER_NODE_URL` in the hosting provider's dashboard under **Environment Variables**.

### 2. Node Connection & CORS
Since the frontend client makes direct JSON-RPC calls to the FNN node via `fetch`:
*   **CORS Configuration**: Your FNN node must be configured to allow incoming cross-origin requests from your deployed app's domain (or set to accept `*` for public development nodes).
*   **HTTPS Requirement**: Deployed apps served over HTTPS cannot make direct connection requests to HTTP endpoints due to mixed content restrictions. For production deployments, wrap your FNN node API behind a reverse proxy (e.g., Nginx, Caddy) configured with SSL/TLS.

## Full API Reference

See [API.md](./API.md) for all props and hook return types.

