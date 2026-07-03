# Testing Checklist

> Manual verification scenarios for real-node testing.
> Populated during Day 7 regression pass.

## Real FNN Node Scenarios (Day 7)

- [ ] `FiberProvider` connects to live node → `mode === 'live'`, badge shows green LIVE
- [ ] `FiberProvider` with unreachable URL → `mode === 'mock'`, badge shows amber MOCK, no crash
- [ ] `FiberProvider` with no `nodeUrl` → `mode === 'mock'`
- [ ] `useChannel` returns real channel list from live node
- [ ] `useChannel` returns mock channels in mock mode
- [ ] `useConfidence` dry-run succeeds on a valid invoice
- [ ] `useConfidence` returns `no_route` for an unreachable destination
- [ ] `useConfidence` returns `insufficient_liquidity` for an amount exceeding channel balance
- [ ] `useInvoice` creates a real invoice, QR displays correctly, countdown ticks
- [ ] `useInvoice` transitions to `Paid` status after real payment received
- [ ] `usePayment` returns `Success` status with real `routers` array
- [ ] `usePayment` returns `Failed` status with a real `failed_error` string
- [ ] `PaymentRouteVisualizer` renders real `routers` hops from a successful payment
- [ ] `PaymentRouteVisualizer` flags failed hop in red on a failed payment
- [ ] `ErrorResolutionBanner` shows correct hint for each real `failed_error` string captured
- [ ] All mock-mode components clearly show the MOCK badge
- [ ] No `console.error` in either live or mock mode in production build

## Unit Test Coverage (automated — run `npm test`)

- [ ] `errorMap.test.ts` — all patterns, UNKNOWN fallback
- [ ] `rpcClient.test.ts` — all six methods, dry_run enforcement, error shapes
- [ ] Hook tests (added Day 2) — all four hooks, live and mock paths
- [ ] Component render tests (added Day 3) — each component renders without crash
