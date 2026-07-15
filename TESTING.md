# Testing Checklist & Verification Guide

This guide explains how to test and verify that your application has integrated Fiberglass successfully. 

We break down the testing process into easy-to-follow steps for both **Mock Mode** (no node required) and **Live Mode** (connected to a real Fiber node).

---

## 🛠️ Phase 1: Testing in Mock Mode (Offline)

Mock Mode runs automatically if you don't connect a Fiber node. This is the best way to design your UI and test your app logic quickly.

### 1. Verification Setup
*   Run your project locally (`npm run dev`).
*   Open the browser console (`F12` -> Console tab) to monitor events.

### 2. Checklist Scenarios

- [ ] **Visual Check: Mode Badge**
  *   *Expected:* Every Fiberglass component shows a clear, orange `MOCK` badge. 

- [ ] **Creating an Invoice**
  *   *Action:* Load the page containing `<InvoiceSheet>`.
  *   *Expected:* The component displays a simulated QR code, shows an address starting with `fibb1q...`, and the countdown timer begins ticking down from 3600 seconds.

- [ ] **Fulfill Payment Simulation**
  *   *Action:* In mock mode, the component will automatically simulate a payment completion after a few seconds.
  *   *Expected:* The `<InvoiceSheet>` transitions to a green `✔ PAID` checkmark state. If you defined an `onFulfilled` callback, verify that the success message triggers (e.g. your `console.log` or `alert` fires).

- [ ] **Channel Lifecycle Cards**
  *   *Expected:* The `<ChannelLifecycleCard>` loads three mock channels automatically, showing their local and remote balance ratios.

- [ ] **Route Pathing Confidence**
  *   *Action:* Enter one of the preset invoice addresses inside the `<ConfidenceCheck>` or `<PaymentRouteVisualizer>` input field:
    *   *Standard path:* `fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqqzvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfxzf0lfmscmygq5yu`
    *   *Broken path:* `fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqqzvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfxzf0lfmscmygq5no_route`
  *   *Expected (Standard):* Shows "Path Found — Ready to Send" with animated green hops.
  *   *Expected (Broken):* Shows a "No Route Found" error banner.

---

## ⚡ Phase 2: Testing in Live Mode (Real Node)

Once your UI works perfectly offline, you can connect it to a real running **Fiber Network Node (FNN)**.

### 1. Connection Checklist
- [ ] **Live Badge Verification**
  *   *Action:* Launch your FNN node, configure the connection URL in `FiberProvider`, and reload the browser page.
  *   *Expected:* The badges on your components change to a green `LIVE` state.
- [ ] **Offline Handling**
  *   *Action:* Turn off your FNN node.
  *   *Expected:* The app automatically switches to `MOCK` mode without throwing console errors or crashing the web page.

### 2. Live Feature Tests
- [ ] **Create Real Invoice**
  *   *Expected:* Your node successfully returns a new CKB payment invoice address.
- [ ] **Receive Payment**
  *   *Action:* Scan the invoice QR code using a compatible Fiber-enabled wallet (e.g., the [Demo Wallet App](https://fibreglass-demo-wallet.vercel.app)) and send the payment.
  *   *Expected:* The UI instantly updates to the completed green state when the node receives the funds.
- [ ] **Connection Overview**
  *   *Expected:* The connection card displays your actual open node channels with correct live balances.

---

## 🧪 Phase 3: Automated Unit Tests

If you are modifying the SDK source code, you can run the built-in automated test suite to ensure nothing is broken.

1. Open your terminal in the `packages/fiberglass-react/` directory.
2. Run the tests:
   ```bash
   npm run test
   ```
3. *Expected:* All 57 tests pass successfully.
