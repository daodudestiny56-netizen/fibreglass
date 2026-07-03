/**
 * App.tsx — Demo Wallet
 *
 * Fully redesigned premium Light Mode Demo Wallet.
 * Showcases:
 *  - ChannelOverview, Send, and Receive flows.
 *  - SDK Playground: Interactive sliders and togglers for all 5 components.
 *  - RPC Log Inspector: Real-time API logging.
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
  RpcLogViewer,
} from 'fiberglass-react';
import type {
  ChannelDetail,
  ChannelState,
  ConfidenceStatus,
  InvoiceStatus,
  PaymentStatus,
  RouterHop,
  FiberError,
  Hash256,
} from 'fiberglass-react';

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

type Tab = 'channels' | 'receive' | 'send' | 'playground';

const DEMO_INVOICE =
  'fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqqzvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfxzf0lfmscmygq5yu';

const MOCK_HOPS: RouterHop[] = [
  { channel_outpoint: '0x0001', next_hop: '0x0002' as import('fiberglass-react').Pubkey, fee: '1000' },
  { channel_outpoint: '0x0002', next_hop: '0x0003' as import('fiberglass-react').Pubkey, fee: '1500' },
];

// ---------------------------------------------------------------------------
// Component: Channels Tab
// ---------------------------------------------------------------------------

function ChannelsTab() {
  const { mode } = useFiberNode();
  const { channels, isLoading, error, refetch } = useChannel({ refreshIntervalMs: 0 });

  if (isLoading) return <LoadingSpinner label="Loading channels…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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
          showModeBadge
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Receive Tab
// ---------------------------------------------------------------------------

function ReceiveTab() {
  const { mode } = useFiberNode();
  const invoice = useInvoice({
    amount: '100000000', // 1 CKB
    currency: 'CKB',
    memo: 'Fiberglass Demo Payment',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', alignItems: 'center' }}>
      <div style={{ ...styles.sectionHeader, width: '100%', maxWidth: '400px' }}>
        <span style={styles.sectionTitle}>Receive Funds</span>
      </div>
      <InvoiceSheet
        invoiceAddress={invoice.invoiceAddress}
        paymentHash={invoice.paymentHash}
        invoiceStatus={invoice.invoiceStatus}
        expiresAt={invoice.expiresAt}
        isLoading={invoice.isLoading}
        error={invoice.error}
        mode={mode}
        onCopy={(addr) => console.log('[demo] Copied address:', addr)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Send Tab
// ---------------------------------------------------------------------------

function SendTab() {
  const { mode } = useFiberNode();
  const [invoiceInput, setInvoiceInput] = useState(DEMO_INVOICE);
  const [activeInvoice, setActiveInvoice] = useState<string | null>(DEMO_INVOICE);

  // Confidence check
  const confidence = useConfidence({ invoiceAddress: activeInvoice });

  // Payment result
  const [paymentHash, setPaymentHash] = useState<string | null>(null);
  const paymentResult = usePayment({
    paymentHash: paymentHash as Hash256 | null,
  });

  const handleSend = () => {
    setPaymentHash('0xa665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3');
  };

  const canSend = confidence.status === 'ready' && !paymentResult.payment;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>Send CKB</span>
      </div>

      <div style={styles.inputGroup}>
        <label style={styles.inputLabel}>Invoice Address</label>
        <div style={{ display: 'flex', gap: '10px' }}>
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
            Verify
          </button>
        </div>
      </div>

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

      {canSend && (
        <button style={styles.sendBtn} onClick={handleSend}>
          ⚡ Send Payment
        </button>
      )}

      {paymentResult.payment && (
        <PaymentRouteVisualizer
          hops={paymentResult.payment.routers}
          paymentStatus={paymentResult.status}
          totalFee={paymentResult.payment.fee}
          mode={mode}
          isAnimating={paymentResult.status === 'Inflight'}
        />
      )}

      {paymentResult.error && (
        <ErrorResolutionBanner error={paymentResult.error} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: SDK Playground
// ---------------------------------------------------------------------------

function PlaygroundTab() {
  const { mode } = useFiberNode();

  // 1. Channel props
  const [chState, setChState] = useState<ChannelState>('ChannelReady');
  const [chLocal, setChLocal] = useState<string>('7500000000');
  const [chRemote, setChRemote] = useState<string>('2500000000');
  const [chEnabled, setChEnabled] = useState<boolean>(true);

  // 2. Confidence props
  const [confStatus, setConfStatus] = useState<ConfidenceStatus>('ready');
  const [confFee, setConfFee] = useState<string>('4200');

  // 3. Invoice props
  const [invStatus, setInvStatus] = useState<InvoiceStatus>('Open');

  // 4. Error props
  const [errCode, setErrCode] = useState<import('fiberglass-react').FiberErrorCode>('INSUFFICIENT_LIQUIDITY');

  // 5. Visualizer props
  const [visStatus, setVisStatus] = useState<PaymentStatus>('Success');

  const simulatedChannel: ChannelDetail = {
    channel_id: '0x8888888888888888888888888888888888888888888888888888888888888888' as Hash256,
    peer_id: '0x028888888888888888888888888888888888888888888888888888888888888888' as import('fiberglass-react').Pubkey,
    local_balance: chLocal,
    remote_balance: chRemote,
    enabled: chEnabled,
    state: chState,
  };

  const simulatedError: FiberError = {
    code: errCode,
    rawMessage: `Simulated FNN error string matching ${errCode}. Node execution halted.`,
    rpcMethod: 'send_payment',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={styles.sectionHeader}>
        <span style={styles.sectionTitle}>🛝 SDK Component Playground</span>
      </div>

      {/* Grid Layout */}
      <div style={styles.playgroundGrid}>
        
        {/* Card 1: ChannelLifecycleCard */}
        <div style={styles.playgroundCard}>
          <div style={styles.cardHeader}>&lt;ChannelLifecycleCard&gt;</div>
          <div style={styles.controlsRow}>
            <label style={styles.controlLabel}>State:</label>
            <select style={styles.select} value={chState} onChange={(e) => setChState(e.target.value as ChannelState)}>
              <option value="ChannelReady">ChannelReady</option>
              <option value="NegotiatingFunding">NegotiatingFunding</option>
              <option value="AwaitingChannelReady">AwaitingChannelReady</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
          <div style={styles.controlsRow}>
            <label style={styles.controlLabel}>Local Balance (CKB):</label>
            <input
              style={styles.controlInput}
              type="number"
              value={Number(chLocal) / 1e8}
              onChange={(e) => setChLocal(String(Number(e.target.value) * 1e8))}
            />
          </div>
          <div style={styles.controlsRow}>
            <label style={styles.controlLabel}>Remote Balance (CKB):</label>
            <input
              style={styles.controlInput}
              type="number"
              value={Number(chRemote) / 1e8}
              onChange={(e) => setChRemote(String(Number(e.target.value) * 1e8))}
            />
          </div>
          <div style={styles.controlsRow}>
            <label style={styles.controlLabel}>Enabled:</label>
            <input type="checkbox" checked={chEnabled} onChange={(e) => setChEnabled(e.target.checked)} />
          </div>
          <div style={styles.previewContainer}>
            <ChannelLifecycleCard channel={simulatedChannel} mode={mode} showModeBadge />
          </div>
        </div>

        {/* Card 2: ConfidenceCheck */}
        <div style={styles.playgroundCard}>
          <div style={styles.cardHeader}>&lt;ConfidenceCheck&gt;</div>
          <div style={styles.controlsRow}>
            <label style={styles.controlLabel}>Status:</label>
            <select style={styles.select} value={confStatus} onChange={(e) => setConfStatus(e.target.value as ConfidenceStatus)}>
              <option value="ready">ready</option>
              <option value="insufficient_liquidity">insufficient_liquidity</option>
              <option value="no_route">no_route</option>
              <option value="asset_mismatch">asset_mismatch</option>
              <option value="loading">loading</option>
            </select>
          </div>
          <div style={styles.controlsRow}>
            <label style={styles.controlLabel}>Est. Fee (shannons):</label>
            <input
              style={styles.controlInput}
              value={confFee}
              onChange={(e) => setConfFee(e.target.value)}
            />
          </div>
          <div style={styles.previewContainer}>
            <ConfidenceCheck status={confStatus} fee={confFee} route={MOCK_HOPS} isLoading={confStatus === 'loading'} error={null} mode={mode} />
          </div>
        </div>

        {/* Card 3: InvoiceSheet */}
        <div style={styles.playgroundCard}>
          <div style={styles.cardHeader}>&lt;InvoiceSheet&gt;</div>
          <div style={styles.controlsRow}>
            <label style={styles.controlLabel}>Status:</label>
            <select style={styles.select} value={invStatus} onChange={(e) => setInvStatus(e.target.value as InvoiceStatus)}>
              <option value="Open">Open</option>
              <option value="Paid">Paid</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
          <div style={styles.previewContainer}>
            <InvoiceSheet
              invoiceAddress="fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqqzvq79pq6xm8gqs3y"
              paymentHash={'0x123' as Hash256}
              invoiceStatus={invStatus}
              expiresAt={new Date(Date.now() + 600000)}
              isLoading={false}
              error={null}
              mode={mode}
            />
          </div>
        </div>

        {/* Card 4: ErrorResolutionBanner */}
        <div style={styles.playgroundCard}>
          <div style={styles.cardHeader}>&lt;ErrorResolutionBanner&gt;</div>
          <div style={styles.controlsRow}>
            <label style={styles.controlLabel}>Error Code:</label>
            <select style={styles.select} value={errCode} onChange={(e) => setErrCode(e.target.value as import('fiberglass-react').FiberErrorCode)}>
              <option value="INSUFFICIENT_LIQUIDITY">INSUFFICIENT_LIQUIDITY</option>
              <option value="NO_ROUTE">NO_ROUTE</option>
              <option value="ASSET_MISMATCH">ASSET_MISMATCH</option>
              <option value="NODE_UNREACHABLE">NODE_UNREACHABLE</option>
            </select>
          </div>
          <div style={styles.previewContainer}>
            <ErrorResolutionBanner error={simulatedError} retry={() => alert('Retry clicked!')} />
          </div>
        </div>

        {/* Card 5: PaymentRouteVisualizer */}
        <div style={{ ...styles.playgroundCard, gridColumn: 'span 2' }}>
          <div style={styles.cardHeader}>&lt;PaymentRouteVisualizer&gt;</div>
          <div style={styles.controlsRow}>
            <label style={styles.controlLabel}>Status:</label>
            <select style={styles.select} value={visStatus} onChange={(e) => setVisStatus(e.target.value as PaymentStatus)}>
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Inflight">Inflight</option>
            </select>
          </div>
          <div style={styles.previewContainer}>
            <PaymentRouteVisualizer hops={MOCK_HOPS} paymentStatus={visStatus} totalFee="2500" mode={mode} isAnimating={visStatus === 'Inflight'} />
          </div>
        </div>

      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function LoadingSpinner({ label }: { label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
      <div style={{ fontSize: '32px', animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>⟳</div>
      <div style={{ marginTop: '12px', fontSize: '14px', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wallet Shell Component
// ---------------------------------------------------------------------------

function WalletShell() {
  const { mode, connectionStatus, nodeInfo } = useFiberNode();
  const [activeTab, setActiveTab] = useState<Tab>('channels');

  const modeColor = mode === 'live' ? '#10b981' : '#f59e0b';
  const modeBg = mode === 'live' ? '#ecfdf5' : '#fffbeb';

  return (
    <div style={styles.root}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f8fafc; color: #1e293b; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.logo}>💎 Fiberglass Wallet</div>
          <div style={styles.logoSub}>Fiber Network Developer Interface</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ ...styles.modeBadge, background: modeBg, borderColor: `${modeColor}30`, color: modeColor }}>
            {mode === 'live' ? '● LIVE' : '◌ MOCK'} · {connectionStatus}
          </div>
          {nodeInfo && (
            <div style={styles.nodeInfo}>
              {nodeInfo.node_name} v{nodeInfo.version}
            </div>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <nav style={styles.tabBar}>
        {(['channels', 'receive', 'send', 'playground'] as Tab[]).map((tab) => (
          <button
            key={tab}
            id={`tab-${tab}`}
            style={{
              ...styles.tab,
              ...(activeTab === tab ? styles.tabActive : {}),
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'channels'
              ? '⛓ Channels'
              : tab === 'receive'
              ? '⬇ Receive'
              : tab === 'send'
              ? '⬆ Send'
              : '🛝 Playground'}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main style={styles.main}>
        {activeTab === 'channels' && <ChannelsTab />}
        {activeTab === 'receive' && <ReceiveTab />}
        {activeTab === 'send' && <SendTab />}
        {activeTab === 'playground' && <PlaygroundTab />}

        {/* Real-time RPC logs inspector panel */}
        <div style={{ marginTop: '30px' }}>
          <RpcLogViewer />
        </div>
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Root Provider wrapper
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
// Styles (Sleek Light Mode Palette)
// ---------------------------------------------------------------------------

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: '#f8fafc',
    color: '#334155',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '18px 24px',
    borderBottom: '1px solid #e2e8f0',
    background: '#ffffff',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  },
  logo: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#4f46e5',
    letterSpacing: '-0.02em',
  },
  logoSub: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
    fontWeight: 500,
  },
  modeBadge: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    border: '1px solid',
    borderRadius: '20px',
    padding: '4px 12px',
  },
  nodeInfo: {
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'monospace',
    background: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '6px',
  },
  tabBar: {
    display: 'flex',
    gap: '4px',
    borderBottom: '1px solid #e2e8f0',
    background: '#ffffff',
    padding: '0 16px',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '3px solid transparent',
    color: '#64748b',
    padding: '14px 18px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  },
  tabActive: {
    color: '#4f46e5',
    borderBottomColor: '#4f46e5',
  },
  main: {
    flex: 1,
    padding: '24px',
    maxWidth: '850px',
    width: '100%',
    margin: '0 auto',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  refreshBtn: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    color: '#475569',
    padding: '5px 12px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background-color 0.15s',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#94a3b8',
    fontSize: '13px',
    border: '2px dashed #cbd5e1',
    borderRadius: '12px',
    background: '#ffffff',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputLabel: {
    fontSize: '11px',
    color: '#64748b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
    fontWeight: 700,
  },
  input: {
    flex: 1,
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    color: '#1e293b',
    padding: '10px 14px',
    fontSize: '12px',
    fontFamily: 'monospace',
    outline: 'none',
    boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.02)',
  },
  checkBtn: {
    background: '#f1f5f9',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    color: '#475569',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap' as const,
    transition: 'background-color 0.15s',
  },
  sendBtn: {
    width: '100%',
    padding: '14px',
    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
    border: 'none',
    borderRadius: '10px',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.02em',
    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.25)',
  },
  // Playground Specific Styles
  playgroundGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
    gap: '20px',
  },
  playgroundCard: {
    background: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  cardHeader: {
    fontSize: '13px',
    fontFamily: 'monospace',
    fontWeight: 700,
    color: '#4f46e5',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '6px',
  },
  controlsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  controlLabel: {
    color: '#64748b',
    fontWeight: 500,
  },
  controlInput: {
    width: '120px',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
  },
  select: {
    width: '140px',
    padding: '4px 6px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
  },
  previewContainer: {
    marginTop: '10px',
    borderTop: '1px dashed #e2e8f0',
    paddingTop: '14px',
  },
};
