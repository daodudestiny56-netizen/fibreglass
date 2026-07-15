# Integration Guide

Welcome! This guide will walk you through integrating **Fiberglass** into your React application step-by-step. 

Whether you are building a hackathon project or a production-ready wallet interface, this document will help you get up and running.

> 🔗 **Live Demo Wallet:** You can view a fully configured example of this integration live at [fibreglass-demo-wallet.vercel.app](https://fibreglass-demo-wallet.vercel.app).

---

## 📋 Prerequisites

Before we start, make sure you have:

*   **Node.js 18+** installed on your system.
*   **React 18+** project already set up (Vite, Next.js, Create React App, etc.).
*   **Tailwind CSS** installed and configured in your project. Fiberglass components use Tailwind utility classes for their styling and layouts.
*   *Optional:* A running **Fiber Network Node (FNN)**. If you don't have one, don't worry! Fiberglass will automatically run in **Mock Mode** with realistic simulated data.

---

## 🛠️ Step-by-Step Integration

### Step 1: Install the Package

Open your terminal in your project's root folder and run:

```bash
npm install fiberglass-react
```

---

### Step 2: Wrap Your App with `FiberProvider` and Import Styles

To use Fiberglass hooks and components, your application must be wrapped in `FiberProvider`. This manages the network connection state and handles the fallback to Mock Mode.

Open your main application file (usually `App.tsx` or `main.tsx`) and add the provider and styles:

```tsx
// App.tsx
import React from 'react';
import { FiberProvider } from 'fiberglass-react';

// IMPORTANT: You must import the CSS file so the components render correctly!
import 'fiberglass-react/styles.css';

import { Dashboard } from './Dashboard';

export default function App() {
  return (
    // By default, it connects to a local node at http://127.0.0.1:8227.
    // If that node isn't running, it will automatically switch to mock mode.
    <FiberProvider nodeUrl="http://127.0.0.1:8227">
      <Dashboard />
    </FiberProvider>
  );
}
```

#### How the Provider Works under the hood:
1. It tries to ping the `nodeUrl` to get node information.
2. If it succeeds, it sets the status to **LIVE** (uses real blockchain payment paths).
3. If it fails (or if you don't supply a URL), it sets the status to **MOCK** (uses mock data).
4. **It never throws errors or crashes your app** if the node is offline.

---

### Step 3: Add a UI Component

Now you can drop a pre-built payment component anywhere in your app. Let's add an `<InvoiceSheet>` which generates a QR code payment request.

```tsx
// ReceivePage.tsx
import React from 'react';
import { InvoiceSheet } from 'fiberglass-react';

export function ReceivePage() {
  return (
    <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h2>Receive CKB</h2>
      
      <InvoiceSheet
        amount="100000000"   // 1 CKB in Shannons (1 CKB = 100,000,000 Shannons)
        currency="CKB"
        memo="Payment for Coffee"
        onFulfilled={(hash) => {
          console.log('Payment Successful! Transaction Hash:', hash);
          alert('Thank you for your payment!');
        }}
      />
    </div>
  );
}
```

> 💡 **What is a Shannon?**
> A Shannon is the smallest unit of CKB (like a Satoshi is to Bitcoin, or a Cent is to a Dollar). `1 CKB = 100,000,000 shannons`. When specifying the `amount` prop, always use the amount in Shannons as a string to avoid rounding errors.

---

## 🌐 Deploying to Production

When you are ready to launch your application to the public (using platforms like Vercel, Netlify, or Cloudflare Pages), keep these important configuration details in mind:

### 1. Environment Variables
Instead of hardcoding your Node URL, configure it dynamically using environment variables. 

*   Create a `.env` file in the root of your project:
    ```bash
    VITE_FIBER_NODE_URL=https://your-fnn-node.example.com:8227
    ```
*   Update your `App.tsx` to read the environment variable:
    ```tsx
    const nodeUrl = import.meta.env.VITE_FIBER_NODE_URL;

    <FiberProvider nodeUrl={nodeUrl}>
      <YourApp />
    </FiberProvider>
    ```

### 2. CORS (Cross-Origin Resource Sharing)
Since the browser makes network requests directly from the frontend to your Fiber node:
*   Your Fiber node must be configured to allow requests from your deployment domain.
*   Ensure that the CORS settings on your Fiber node are configured to allow your website's origin.

### 3. HTTPS Security Requirement
*   If your website is served over **HTTPS** (which Vercel and Netlify do by default), your Fiber node URL **must also use HTTPS**.
*   Browsers block requests from an HTTPS website to an HTTP node (this is called a "Mixed Content" security violation).
*   *Tip:* Set up a secure reverse proxy (like Nginx, Caddy, or Cloudflare) in front of your node to enable HTTPS.

---

## 📚 Next Steps

*   To see a full list of all available props, hooks, and types, read the [API Reference](./API.md).
*   To learn how to verify your installation, view the [Testing Guide](../TESTING.md).
