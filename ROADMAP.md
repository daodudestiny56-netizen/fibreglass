# Fiberglass Project Roadmap

This document outlines the development path for the Fiberglass SDK. It helps developers and users understand what features are fully built and ready to use, versus what is planned for future releases.

---

## 🟢 Phase 1: Hackathon Ready (Fully Built & Available)
These features are completed, tested, and ready for you to use in your applications today:

*   **SDK Core Package (`fiberglass-react`):**
    *   `<FiberProvider>` configuration context wrapper.
    *   Hooks for managing channels, invoicing, path-finding, and sending payments (`useChannel`, `useInvoice`, `useConfidence`, `usePayment`, `usePaymentLink`).
    *   Pre-styled UI components including `<InvoiceSheet>`, `<ChannelLifecycleCard>`, `<ConfidenceCheck>`, `<ErrorResolutionBanner>`, and `<PaymentRouteVisualizer>`.
*   **Dual Mode Detection:**
    *   SDK automatically detects if your local node is running.
    *   Seamlessly runs in **Mock Mode** (using simulated fixtures) or **Live Mode** (connected to real nodes) with a persistent status badge.
*   **Demo Wallet Application:**
    *   A sample application showcasing the components in a Neobrutalist design.
    *   Live demo link: [fibreglass-demo-wallet.vercel.app](https://fibreglass-demo-wallet.vercel.app)
*   **Documentation & Test Suite:**
    *   Complete step-by-step setup guides, testing checklists, and Vitest suite (all 57 unit tests passing).

---

## 🟡 Phase 2: Developer Tooling (Planned Future Releases)
These improvements are focused on making the developer integration experience even better:

*   **Storybook Component Catalog:**
    *   An interactive visual dictionary where developers can preview and play with each UI component under different configurations.
*   **Minimal RPC Log Inspector:**
    *   An optional debug panel inside the UI allowing developers to see raw requests and responses being exchanged with their node.
*   **Failure and Error Simulator:**
    *   A tool allowing developers to simulate node offline conditions, expired invoices, and routing errors to test how their applications behave.

---

## 🔵 Phase 3: Ecosystem Maturity (Post-Hackathon Roadmap)
Long-term development goals for production-grade use:

*   **Custom Theme Engine:**
    *   A simple way to change the design style of components (e.g. from the default Neobrutalist style to Tailwind, modern glassmorphism, or dark modes) using custom CSS variables.
*   **Multi-Framework Adapters:**
    *   Wrappers enabling other popular frontend frameworks (like Vue, Svelte, and Angular) or Vanilla JS/HTML to use Fiberglass.
*   **Chrome/Firefox DevTools Extension:**
    *   A browser extension for developers to inspect, debug, and trace payments directly inside their browser's dev console.
*   **Interactive Payment Replay:**
    *   An advanced route visualization tool showing historical payment animations with exact hop timings and fee breakdowns.
