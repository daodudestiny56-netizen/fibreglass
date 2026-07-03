/**
 * App.tsx — Demo Wallet
 *
 * Full working demo that showcases every Fiberglass SDK component:
 *  - ChannelLifecycleCard  → Channel Overview tab
 *  - InvoiceSheet          → Receive tab
 *  - ConfidenceCheck +
 *    PaymentRouteVisualizer → Send tab
 *  - ErrorResolutionBanner → inline within each flow
 *
 * Operates in mock mode automatically when no FNN node is reachable.
 */

import { useState } from 'react';
import {
  FiberProvider,
  useFiberNode,
  useChannel,
  useInvoice,
  useConfidence,
  usePayment,
  ChannelLifecycleCard,
  InvoiceSheet,
  ConfidenceCheck,
  PaymentRouteVisualizer,
  ErrorResolutionBanner,
} from 'fiberglass-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Tab = 'channels' | 'receive' | 'send';

// ---------------------------------------------------------------------------
// Tab: Channel Overview
// ---------------------------------------------------------------------------

function ChannelsTab() {
  const { mode } = useFiberNode();
  const { channels, isLoading, error, refetch } = useChannel({ refreshIntervalMs: 0 });

  if (isLoading) return <LoadingSpinner label="Loading channels…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Lightning Channels</span>
        <button style={styles.refreshBtn} onClick={refetch}>↻ Refresh</button>
      </div>
      {error && <ErrorResolutionBanner error={error} />}
      {channels.length === 0 && !error && (
        <div style={styles.emptyState}>No channels found.</div>
      )}
      {channels.map((ch) => (
        <ChannelLifecycleCard
          key={ch.channel_id}
          channel={ch}
          mode={mode}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Receive (Invoice)
// ---------------------------------------------------------------------------

function ReceiveTab() {
  const { mode } = useFiberNode();
  const invoice = useInvoice({
    amount: '100000000', // 1 CKB
    currency: 'Fibb',
    memo: 'Fiberglass demo payment',
  });

  return (
    <div>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Receive Payment</span>
      </div>
      <InvoiceSheet
        invoiceAddress={invoice.invoiceAddress}
        paymentHash={invoice.paymentHash}
        invoiceStatus={invoice.invoiceStatus}
        expiresAt={invoice.expiresAt}
        isLoading={invoice.isLoading}
        error={invoice.error}
        mode={mode}
        onCopy={(addr) => console.log('[demo] Copied invoice:', addr.slice(0, 20))}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab: Send (Confidence + Route)
// ---------------------------------------------------------------------------

const DEMO_INVOICE =
  'fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqqzvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfxzf0lfmscmygq5yu';

function SendTab() {
  const { mode } = useFiberNode();
  const [invoiceInput, setInvoiceInput] = useState(DEMO_INVOICE);
  const [activeInvoice, setActiveInvoice] = useState<string | null>(DEMO_INVOICE);

  // Confidence check (dry-run routing)
  const confidence = useConfidence({ invoiceAddress: activeInvoice });

  // Payment result (only shown after "Send")
  const [paymentHash, setPaymentHash] = useState<string | null>(null);
  const paymentResult = usePayment({
    paymentHash: paymentHash as import('fiberglass-react').Hash256 | null,
  });

  const handleSend = () => {
    // In a real app this would call send_payment (non-dry-run).
    // In mock mode we surface the mock payment result instead.
    setPaymentHash('0xa665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3');
  };

  const canSend = confidence.status === 'ready' && !paymentResult.payment;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Send Payment</span>
      </div>

      {/* Invoice input */}
      <div>
        <label style={styles.inputLabel}>Invoice Address</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            id="send-invoice-input"
            style={styles.input}
            value={invoiceInput}
            onChange={(e) => setInvoiceInput(e.target.value)}
            placeholder="fibb1q…"
            spellCheck={false}
          />
          <button
            style={styles.checkBtn}
            onClick={() => setActiveInvoice(invoiceInput || null)}
          >
            Check
          </button>
        </div>
      </div>

      {/* Confidence check */}
      {activeInvoice && (
        <ConfidenceCheck
          status={confidence.status}
          fee={confidence.fee}
          route={confidence.route}
          isLoading={confidence.isLoading}
          error={confidence.error}
          mode={mode}
        />
      )}

      {/* Send button */}
      {canSend && (
        <button style={styles.sendBtn} onClick={handleSend}>
          ⚡ Send Payment
        </button>
      )}

      {/* Route visualizer — shown after "Send" */}
      {paymentResult.payment && (
        <div>
          <div style={{ ...styles.sectionTitle, marginBottom: '10px' }}>Payment Route</div>
          <PaymentRouteVisualizer
            hops={paymentResult.payment.routers}
            paymentStatus={paymentResult.status}
            totalFee={paymentResult.payment.fee}
            mode={mode}
          />
        </div>
      )}

      {/* Payment error */}
      {paymentResult.error && (
        <ErrorResolutionBanner error={paymentResult.error} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared: Loading spinner
// ---------------------------------------------------------------------------

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '40px', color: '#475569' }}>
      <div style={{ fontSize: '28px', animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</div>
      <div style={{ marginTop: '10px', fontSize: '13px' }}>{label}</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shell (must live inside <FiberProvider>)
// ---------------------------------------------------------------------------

function WalletShell() {
  const { mode, connectionStatus, nodeInfo } = useFiberNode();
  const [activeTab, setActiveTab] = useState<Tab>('channels');

  const modeColor = mode === 'live' ? '#34d399' : '#fbbf24';
  const modeBg = mode === 'live' ? '#064027' : '#78350f';

  return (
    <div style={styles.root}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #0b0b18; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* ── Header ── */}
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>💎 Fiberglass</div>
          <div style={styles.logoSub}>Fiber Network Developer SDK</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ ...styles.modeBadge, background: `${modeBg}44`, borderColor: `${modeColor}44`, color: modeColor }}>
            {mode === 'live' ? '● LIVE' : '◌ MOCK'} · {connectionStatus}
          </div>
          {nodeInfo && (
            <div style={styles.nodeInfo}>
              {nodeInfo.node_name} v{nodeInfo.version}
            </div>
          )}
        </div>
      </header>

      {/* ── Tab bar ── */}
      <nav style={styles.tabBar}>
        {(['channels', 'receive', 'send'] as Tab[]).map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'channels' ? '⛓ Channels' : tab === 'receive' ? '⬇ Receive' : '⬆ Send'}
          </button>
        ))}
      </nav>

      {/* ── Content ── */}
      <main style={styles.main}>
        {activeTab === 'channels' && <ChannelsTab />}
        {activeTab === 'receive' && <ReceiveTab />}
        {activeTab === 'send' && <SendTab />}
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root — FiberProvider wraps everything
// ---------------------------------------------------------------------------

export default function App() {
  const nodeUrl = import.meta.env['VITE_FIBER_NODE_URL'] as string | undefined;

  return (
    <FiberProvider {...(nodeUrl !== undefined ? { nodeUrl } : {})}>
      <WalletShell />
    </FiberProvider>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#0b0b18',
    color: '#e2e8f0',
    fontFamily: "'Inter', 'ui-sans-serif', system-ui, sans-serif",
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #1a1a30',
    background: '#0f0f1e',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#c7d2fe',
    letterSpacing: '-0.02em',
  },
  logoSub: {
    fontSize: '11px',
    color: '#475569',
    marginTop: '2px',
  },
  modeBadge: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.06em',
    border: '1px solid',
    borderRadius: '6px',
    padding: '4px 10px',
  },
  nodeInfo: {
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'monospace',
  },
  tabBar: {
    display: 'flex',
    gap: '0',
    borderBottom: '1px solid #1a1a30',
    background: '#0f0f1e',
    padding: '0 16px',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#475569',
    padding: '12px 18px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabActive: {
    color: '#818cf8',
    borderBottomColor: '#818cf8',
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: '600px',
    width: '100%',
    margin: '0 auto',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  refreshBtn: {
    background: 'none',
    border: '1px solid #1e293b',
    borderRadius: '6px',
    color: '#64748b',
    padding: '4px 10px',
    fontSize: '11px',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#334155',
    fontSize: '13px',
    border: '1px dashed #1e293b',
    borderRadius: '10px',
  },
  inputLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#475569',
    marginBottom: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  input: {
    flex: 1,
    background: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    color: '#c7d2fe',
    padding: '9px 12px',
    fontSize: '11px',
    fontFamily: 'monospace',
    outline: 'none',
  },
  checkBtn: {
    background: '#1e1e3e',
    border: '1px solid #3730a3',
    borderRadius: '8px',
    color: '#818cf8',
    padding: '9px 14px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap' as const,
  },
  sendBtn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
    boxShadow: '0 4px 20px #6366f130',
  },
};
