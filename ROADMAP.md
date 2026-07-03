# Roadmap

> Everything listed here is **explicitly deferred** — it's not in the hackathon build, but represents the full vision for Fiberglass as a real ecosystem library.

## What's Built (Days 1–7)

- SDK core: FiberProvider, 4 hooks, 5 components
- Dual live/mock mode with always-visible mode badge
- PaymentRouteVisualizer (hero feature)
- Demo wallet app (Send + Receive + Channel overview)
- Full documentation set
- Vitest test suite

## Phase 2 — Developer Tooling (Days 8–14 stretch, time-permitting)

- **Minimal RPC Log Viewer** — internal panel showing recent request/response pairs
- **Storybook** — interactive stories for the 5 existing components
- **Route Replay** — animated replay of a completed payment's route
- **Developer Playground** — internal page with toggleable component props

## Phase 3 — Ecosystem Maturity (Post-Hackathon)

These are future work, not planned for the hackathon under any circumstances:

- **Real npm publish** — `npm publish` for the `fiberglass-react` package
- **Theme Engine** — CSS custom property system, light mode, custom color schemes
- **Plugin System** — extensibility hooks for custom renderers and data sources
- **Documentation Website** — dedicated docs site (Docusaurus or similar)
- **DevTools Browser Extension** — Chrome/Firefox extension for FNN channel inspection
- **Multi-Framework Support** — Vue, Svelte, and vanilla JS adapters
- **RPC Inspector** — full request/response log viewer with filtering and replay
- **Payment / Failure Simulator** — configurable failure injection for development
- **Route Replay (full)** — step-by-step animated replay with timing data
- **Channel Management UI** — open/close/rebalance channel flows (currently out of scope by design)
- **Key Management / Signing** — out of scope; Fiberglass is a UI layer, not a wallet
