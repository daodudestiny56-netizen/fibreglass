# Fiberglass

> **The Developer Experience Layer for Fiber Network**

[![npm](https://img.shields.io/npm/v/fiberglass-react)](https://www.npmjs.com/package/fiberglass-react)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Demo](https://img.shields.io/badge/Demo-live-brightgreen)](https://fibreglass-demo-wallet.vercel.app)

---

## What is this?

**Fiberglass** lets you add Fiber Network payment features to your React app with just a few lines of code. No need to learn the raw network protocol — just install, import, and render.

```tsx
import { FiberProvider, InvoiceSheet } from 'fiberglass-react';
import 'fiberglass-react/styles.css';

function App() {
  return (
    <FiberProvider>
      <InvoiceSheet amount="100000000" currency="CKB" />
    </FiberProvider>
  );
}
```

That's it — you get a working payment invoice with QR code, countdown timer, and status tracking.

---

## 🔗 Live Demo

See it in action: **[fibreglass-demo-wallet.vercel.app](https://fibreglass-demo-wallet.vercel.app)**

---

## What is Fiber Network?

**Fiber Network (FNN)** is a payment-channel network built on the CKB blockchain. Think of it like the Lightning Network, but for CKB.

- It lets you send and receive payments almost instantly
- It uses **payment channels** — private, fast connections between wallets
- Under the hood, it speaks **JSON-RPC** (a developer protocol)

**Fiberglass wraps all of that complexity** so you don't have to deal with raw RPC calls. You just use React components and hooks.

---

## What does Fiberglass give you?

### 🧩 Ready-to-use Components (just drop them in)

| Component | What it does |
|-----------|-------------|
| `<InvoiceSheet>` | Shows a QR code, invoice address, countdown timer, and tracks when payment is received |
| `<ChannelLifecycleCard>` | Displays a payment channel's balance, status, and peer info |
| `<ConfidenceCheck>` | Checks if a payment can be sent before you actually send it |
| `<ErrorResolutionBanner>` | Turns confusing error codes into human-readable messages with fix suggestions |
| `<PaymentRouteVisualizer>` | Animated diagram showing how your payment hops through the network |
| `<PaymentLinkReceiver>` | Reads a shareable payment link and displays the payment details |

### 🪝 Hooks (for building custom UI)

| Hook | What it does |
|------|-------------|
| `useFiberNode()` | Tells you if you're connected to a real node or using mock data |
| `useChannel()` | Gets the list of payment channels and their balances |
| `useConfidence()` | Checks if a payment route exists before sending money |
| `useInvoice()` | Creates an invoice and polls until it's paid |
| `usePayment()` | Sends a payment and tracks its status in real-time |
| `usePaymentLink()` | Generates a shareable payment URL |
| `useReadPaymentLink()` | Decodes a payment URL back into usable data |

### 🔌 Provider (required wrapper)

| Provider | What it does |
|----------|-------------|
| `<FiberProvider>` | Wraps your app. Connects to a Fiber node (or runs in mock mode if none is available) |

---

## The "Glass" Promise

Every component always shows whether it's using **real data** or **simulated data**:

- 🟢 **LIVE** badge = connected to a real Fiber Network node, showing real data
- 🟠 **MOCK** badge = no node connected, showing realistic simulated data

This is never hidden. You always know what you're looking at.

---

## 🚀 Getting Started (Step by Step)

### What you need first

Before you start, make sure you have:

1. **Node.js** version 18 or higher — [download here](https://nodejs.org/)
2. **A code editor** — [VS Code](https://code.visualstudio.com/) is recommended
3. **A terminal** — Command Prompt, PowerShell (Windows), or Terminal (Mac/Linux)

> 💡 **Don't know if Node.js is installed?** Open your terminal and type:
> ```bash
> node -v
> ```
> If you see a version number like `v18.17.0` or higher, you're good. If not, install it from the link above.

---

### Step 1 — Create a new React project

Open your terminal and run these commands one at a time:

```bash
# This creates a new React project with TypeScript
npx create-vite@latest my-fiber-app --template react-ts

# Move into the new project folder
cd my-fiber-app

# Install the base dependencies
npm install
```

After this, you'll have a folder called `my-fiber-app` with a basic React app inside.

---

### Step 2 — Install Fiberglass

Still in your terminal (inside the `my-fiber-app` folder), run:

```bash
npm install fiberglass-react
```

This downloads the Fiberglass SDK from npm and adds it to your project.

---

### Step 3 — Use Fiberglass in your app

Open the file `src/App.tsx` in your code editor. Delete everything in it and paste this:

```tsx
// 1. Import the components you want to use
import { FiberProvider, InvoiceSheet } from 'fiberglass-react';

// 2. Import the styles (required — without this, components look broken)
import 'fiberglass-react/styles.css';

// 3. Build your app
function App() {
  return (
    // FiberProvider must wrap everything that uses Fiberglass
    <FiberProvider>
      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '2rem' }}>
        <h1>💰 My Payment App</h1>
        <p>This invoice was created with Fiberglass!</p>

        {/* This component handles everything: QR code, countdown, status */}
        <InvoiceSheet
          amount="100000000"
          currency="CKB"
          memo="Coffee payment"
          onFulfilled={(hash) => alert('Payment received! Hash: ' + hash)}
        />
      </div>
    </FiberProvider>
  );
}

export default App;
```

**What this code does:**
1. **Line 2** — Imports `FiberProvider` (the wrapper) and `InvoiceSheet` (the invoice component)
2. **Line 5** — Imports the CSS styles that make components look correct
3. **Line 11** — `<FiberProvider>` wraps your app and handles the connection
4. **Line 17–22** — `<InvoiceSheet>` creates a payment invoice with QR code automatically

---

### Step 4 — Run your app

In your terminal, run:

```bash
npm run dev
```

You'll see something like:

```
  VITE v6.x.x  ready in 500 ms

  ➜  Local:   http://localhost:5173/
```

**Open that URL in your browser.** You should see your invoice with a QR code!

> Since you haven't connected a real Fiber node, it'll run in **mock mode** (showing simulated data with an orange MOCK badge). This is totally normal — it means the SDK is working.

---

### Step 5 — Connect to a real node (optional)

When you're ready to use real data, just pass your Fiber node's URL:

```tsx
<FiberProvider nodeUrl="http://127.0.0.1:8227">
  {/* your components */}
</FiberProvider>
```

Or set it in a `.env` file in your project root:

```bash
VITE_FIBER_NODE_URL=http://your-node-address:8227
```

The app will automatically switch from MOCK to LIVE mode.

---

## 📦 How Imports Work

Everything comes from one place: `'fiberglass-react'`

```tsx
// ✅ Correct — all imports come from the package root
import { FiberProvider, InvoiceSheet, useChannel } from 'fiberglass-react';

// ❌ Wrong — these paths don't exist
import { useChannel } from 'fiberglass-react/hooks/useChannel';
```

Here's the complete list of everything you can import:

```tsx
// The wrapper (required)
import { FiberProvider } from 'fiberglass-react';

// Hooks (use these to build custom UI)
import {
  useFiberNode,        // Check connection status and mode
  useChannel,          // Get channel list and balances
  useConfidence,       // Check if a payment can go through
  useInvoice,          // Create invoices and track payment
  usePayment,          // Send payments and track status
  usePaymentLink,      // Create shareable payment URLs
  useReadPaymentLink,  // Decode payment URLs
} from 'fiberglass-react';

// Components (drop-in UI — just render them)
import {
  InvoiceSheet,            // QR code + invoice + countdown
  ChannelLifecycleCard,    // Channel status card
  ConfidenceCheck,         // Payment route checker
  ErrorResolutionBanner,   // Friendly error messages
  PaymentRouteVisualizer,  // Animated route diagram
  PaymentLinkReceiver,     // Payment link display
} from 'fiberglass-react';

// Styles (required for components to look right)
import 'fiberglass-react/styles.css';
```

---

## 📖 Documentation

| Document | What's inside |
|----------|--------------|
| [Integration Guide](./docs/INTEGRATION.md) | Detailed setup, deployment, and configuration |
| [API Reference](./docs/API.md) | Every component prop and hook option explained |
| [Testing Guide](./TESTING.md) | How to test your app with Fiberglass |
| [Roadmap](./ROADMAP.md) | What's built and what's planned next |

---

## 🏗️ How It Works (Architecture)

Here's how the pieces fit together:

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
├─────────────────────────────────────────────────────────┤
│   fiberglass-react (this package)                        │
│                                                          │
│   FiberProvider ──► Connects to node or uses mock data   │
│        │                                                 │
│        ├── Hooks ──► useChannel, useInvoice, etc.        │
│        │             (logic layer — returns data)         │
│        │                                                 │
│        └── Components ──► InvoiceSheet, etc.             │
│                           (UI layer — renders visuals)    │
│                                                          │
├─────────────────────────────────────────────────────────┤
│   Fiber Network Node (FNN) — JSON-RPC 2.0                │
│   http://127.0.0.1:8227 (default)                        │
└─────────────────────────────────────────────────────────┘
```

**In simple terms:**
1. `FiberProvider` tries to connect to a Fiber node
2. If it connects → everything shows **real data** (LIVE mode)
3. If it can't connect → everything shows **simulated data** (MOCK mode)
4. Your components and hooks work the same either way

---

## 🏆 Hackathon Context

Built for the **"Gone in 60ms" Fiber Network Infrastructure Hackathon**, submitting under **Wallet and Payment UX Infrastructure**.

## 📄 License

MIT — see [LICENSE](./LICENSE).
