/**
 * App.tsx — Demo Wallet
 *
 * Premium high-performance Light Mode UI component using React and Tailwind CSS.
 * Follows Principal UI/UX Design constraints:
 *  - Alabaster off-white backdrop (`#F9F9FB`), pure white elevated panels (`#FFFFFF`).
 *  - Deep Charcoal text (`#0F0F11`), secondary Slate text (`#52525B`).
 *  - Minimal, multi-layered ambient occlusion shadows.
 *  - Highly deliberate "Electric Cobalt" accent (`#2E5BFF`).
 *  - Responsive transitions, sleek spacing, and Neo-Grotesque typography.
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
// Constants & Mock Configurations
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

  if (isLoading) return <LoadingSpinner label="Retrieving channel states" />;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-bold tracking-wider text-[#52525B] uppercase">Lightning Channels</span>
        <button
          className="bg-white border border-[#E4E4E7] hover:bg-[#F9F9FB] text-xs font-semibold px-3 py-1.5 rounded-md text-[#52525B] transition-all duration-200 active:scale-[0.98] shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
          onClick={refetch}
        >
          ↻ Refresh
        </button>
      </div>

      {error && <ErrorResolutionBanner error={error} />}
      
      {channels.length === 0 && !error && (
        <div className="text-center py-10 text-xs text-[#71717A] bg-white border border-[#E4E4E7] rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.01)]">
          No channels configured on this node.
        </div>
      )}

      <div className="grid gap-4">
        {channels.map((ch) => (
          <ChannelLifecycleCard
            key={ch.channel_id}
            channel={ch}
            mode={mode}
            showModeBadge
          />
        ))}
      </div>
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
    memo: 'Fiberglass SDK Dev Demo',
  });

  return (
    <div className="flex flex-col gap-4 items-center">
      <div className="w-full max-w-[420px] flex flex-col gap-3">
        <span className="text-xs font-bold tracking-wider text-[#52525B] uppercase mb-1">Receive Funds</span>
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

  const confidence = useConfidence({ invoiceAddress: activeInvoice });

  const [paymentHash, setPaymentHash] = useState<string | null>(null);
  const paymentResult = usePayment({
    paymentHash: paymentHash as Hash256 | null,
  });

  const handleSend = () => {
    setPaymentHash('0xa665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3');
  };

  const canSend = confidence.status === 'ready' && !paymentResult.payment;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold tracking-wider text-[#52525B] uppercase">Send Payment</span>
      </div>

      <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold text-[#52525B] uppercase tracking-wide">Invoice Address</label>
          <div className="flex gap-2">
            <input
              id="send-invoice-input"
              className="flex-1 bg-white border border-[#E4E4E7] focus:border-[#2E5BFF] focus:ring-1 focus:ring-[#2E5BFF]/30 rounded-md py-2 px-3 text-xs text-[#0F0F11] font-mono outline-none transition-all duration-200"
              value={invoiceInput}
              onChange={(e) => setInvoiceInput(e.target.value)}
              placeholder="fibb1q…"
              spellCheck={false}
            />
            <button
              className="bg-[#2E5BFF] hover:bg-[#1E4BEF] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-sm transition-all duration-200 active:scale-[0.98]"
              onClick={() => setActiveInvoice(invoiceInput || null)}
            >
              Verify Route
            </button>
          </div>
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
        <button
          className="w-full py-3 bg-[#2E5BFF] hover:bg-[#1E4BEF] text-white text-xs font-bold rounded-md shadow-[0_4px_12px_rgba(46,91,255,0.15)] transition-all duration-200 ease-out active:scale-[0.99] tracking-wider uppercase"
          onClick={handleSend}
        >
          ⚡ Confirm & Send Payment
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

  // 1. Channel controls
  const [chState, setChState] = useState<ChannelState>('ChannelReady');
  const [chLocal, setChLocal] = useState<string>('7500000000');
  const [chRemote, setChRemote] = useState<string>('2500000000');
  const [chEnabled, setChEnabled] = useState<boolean>(true);

  // 2. Confidence controls
  const [confStatus, setConfStatus] = useState<ConfidenceStatus>('ready');
  const [confFee, setConfFee] = useState<string>('4200');

  // 3. Invoice controls
  const [invStatus, setInvStatus] = useState<InvoiceStatus>('Open');

  // 4. Error controls
  const [errCode, setErrCode] = useState<import('fiberglass-react').FiberErrorCode>('INSUFFICIENT_LIQUIDITY');

  // 5. Visualizer controls
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
    rawMessage: `FNN FAILED: ${errCode}. Transaction aborted at routing engine.`,
    rpcMethod: 'send_payment',
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold tracking-wider text-[#52525B] uppercase">SDK Component Playground</span>
        <span className="text-[11px] text-[#71717A]">Dynamically adjust props to preview rendering configurations.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: ChannelLifecycleCard */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] flex flex-col gap-3">
          <div className="text-[11px] font-mono font-bold text-[#2E5BFF] pb-2 border-b border-[#F0F0F3]">&lt;ChannelLifecycleCard&gt;</div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#52525B] font-medium">State:</span>
            <select
              className="bg-white border border-[#E4E4E7] rounded-md py-1 px-2 text-xs outline-none text-[#0F0F11]"
              value={chState}
              onChange={(e) => setChState(e.target.value as ChannelState)}
            >
              <option value="ChannelReady">ChannelReady</option>
              <option value="NegotiatingFunding">NegotiatingFunding</option>
              <option value="AwaitingChannelReady">AwaitingChannelReady</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#52525B] font-medium">Local Balance (CKB):</span>
            <input
              className="w-24 bg-white border border-[#E4E4E7] rounded-md py-1 px-2 text-xs outline-none text-right text-[#0F0F11]"
              type="number"
              value={Number(chLocal) / 1e8}
              onChange={(e) => setChLocal(String(Number(e.target.value) * 1e8))}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#52525B] font-medium">Remote Balance (CKB):</span>
            <input
              className="w-24 bg-white border border-[#E4E4E7] rounded-md py-1 px-2 text-xs outline-none text-right text-[#0F0F11]"
              type="number"
              value={Number(chRemote) / 1e8}
              onChange={(e) => setChRemote(String(Number(e.target.value) * 1e8))}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#52525B] font-medium">Enabled:</span>
            <input
              type="checkbox"
              className="accent-[#2E5BFF] h-4 w-4"
              checked={chEnabled}
              onChange={(e) => setChEnabled(e.target.checked)}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-[#F0F0F3]">
            <ChannelLifecycleCard channel={simulatedChannel} mode={mode} showModeBadge />
          </div>
        </div>

        {/* Card 2: ConfidenceCheck */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] flex flex-col gap-3">
          <div className="text-[11px] font-mono font-bold text-[#2E5BFF] pb-2 border-b border-[#F0F0F3]">&lt;ConfidenceCheck&gt;</div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#52525B] font-medium">Route Confidence:</span>
            <select
              className="bg-white border border-[#E4E4E7] rounded-md py-1 px-2 text-xs outline-none text-[#0F0F11]"
              value={confStatus}
              onChange={(e) => setConfStatus(e.target.value as ConfidenceStatus)}
            >
              <option value="ready">ready</option>
              <option value="insufficient_liquidity">insufficient_liquidity</option>
              <option value="no_route">no_route</option>
              <option value="asset_mismatch">asset_mismatch</option>
              <option value="loading">loading</option>
            </select>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#52525B] font-medium">Fee (shannons):</span>
            <input
              className="w-24 bg-white border border-[#E4E4E7] rounded-md py-1 px-2 text-xs outline-none text-right text-[#0F0F11]"
              value={confFee}
              onChange={(e) => setConfFee(e.target.value)}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-[#F0F0F3]">
            <ConfidenceCheck
              status={confStatus}
              fee={confFee}
              route={MOCK_HOPS}
              isLoading={confStatus === 'loading'}
              error={null}
              mode={mode}
            />
          </div>
        </div>

        {/* Card 3: InvoiceSheet */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] flex flex-col gap-3">
          <div className="text-[11px] font-mono font-bold text-[#2E5BFF] pb-2 border-b border-[#F0F0F3]">&lt;InvoiceSheet&gt;</div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#52525B] font-medium">Invoice Status:</span>
            <select
              className="bg-white border border-[#E4E4E7] rounded-md py-1 px-2 text-xs outline-none text-[#0F0F11]"
              value={invStatus}
              onChange={(e) => setInvStatus(e.target.value as InvoiceStatus)}
            >
              <option value="Open">Open</option>
              <option value="Paid">Paid</option>
              <option value="Expired">Expired</option>
            </select>
          </div>

          <div className="mt-3 pt-3 border-t border-[#F0F0F3] flex justify-center">
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
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] flex flex-col gap-3">
          <div className="text-[11px] font-mono font-bold text-[#2E5BFF] pb-2 border-b border-[#F0F0F3]">&lt;ErrorResolutionBanner&gt;</div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#52525B] font-medium">FNN Error Code:</span>
            <select
              className="bg-white border border-[#E4E4E7] rounded-md py-1 px-2 text-xs outline-none text-[#0F0F11]"
              value={errCode}
              onChange={(e) => setErrCode(e.target.value as import('fiberglass-react').FiberErrorCode)}
            >
              <option value="INSUFFICIENT_LIQUIDITY">INSUFFICIENT_LIQUIDITY</option>
              <option value="NO_ROUTE">NO_ROUTE</option>
              <option value="ASSET_MISMATCH">ASSET_MISMATCH</option>
              <option value="NODE_UNREACHABLE">NODE_UNREACHABLE</option>
            </select>
          </div>

          <div className="mt-3 pt-3 border-t border-[#F0F0F3]">
            <ErrorResolutionBanner error={simulatedError} retry={() => alert('Callback re-triggered!')} />
          </div>
        </div>

        {/* Card 5: PaymentRouteVisualizer (Full Span) */}
        <div className="bg-white border border-[#E4E4E7] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.04)] flex flex-col gap-3 md:col-span-2">
          <div className="text-[11px] font-mono font-bold text-[#2E5BFF] pb-2 border-b border-[#F0F0F3]">&lt;PaymentRouteVisualizer&gt;</div>

          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-[#52525B] font-medium">Payment Status:</span>
            <select
              className="bg-white border border-[#E4E4E7] rounded-md py-1 px-2 text-xs outline-none text-[#0F0F11]"
              value={visStatus}
              onChange={(e) => setVisStatus(e.target.value as PaymentStatus)}
            >
              <option value="Success">Success</option>
              <option value="Failed">Failed</option>
              <option value="Inflight">Inflight</option>
            </select>
          </div>

          <div className="mt-2">
            <PaymentRouteVisualizer
              hops={MOCK_HOPS}
              paymentStatus={visStatus}
              totalFee="2500"
              mode={mode}
              isAnimating={visStatus === 'Inflight'}
            />
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
    <div className="text-center py-16 text-[#71717A]">
      <div className="text-3xl animate-spin inline-block text-[#2E5BFF]">⟳</div>
      <div className="mt-3 text-xs font-semibold tracking-wide uppercase text-[#52525B]">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wallet Container Component
// ---------------------------------------------------------------------------

function WalletShell() {
  const { mode, connectionStatus, nodeInfo } = useFiberNode();
  const [activeTab, setActiveTab] = useState<Tab>('channels');

  const modeColor = mode === 'live' ? '#059669' : '#D97706';
  const modeBg = mode === 'live' ? '#ECFDF5' : '#FFFBEB';
  const modeBorder = mode === 'live' ? 'border-[#A7F3D0]/40' : 'border-[#FDE68A]/40';

  return (
    <div className="min-h-screen bg-[#F9F9FB] flex flex-col text-[#0F0F11] font-sans antialiased selection:bg-[#2E5BFF]/10">
      
      {/* Header */}
      <header className="flex justify-between items-center py-5 px-6 border-b border-[#F0F0F3] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.01),0_4px_12px_rgba(0,0,0,0.02)]">
        <div>
          <div className="text-lg font-bold tracking-tight text-[#0F0F11] flex items-center gap-1.5">
            💎 fiberglass <span className="text-[10px] bg-[#2E5BFF]/10 text-[#2E5BFF] px-1.5 py-0.5 rounded font-mono">SDK</span>
          </div>
          <div className="text-[10px] text-[#71717A] tracking-wide uppercase mt-0.5 font-semibold">FNN Client Interface</div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`text-[10px] font-bold tracking-wider px-3 py-1 border rounded-full ${modeBg} ${modeBorder} ${modeColor}`}>
            {mode === 'live' ? '● LIVE' : '◌ MOCK'} · {connectionStatus.toUpperCase()}
          </div>
          {nodeInfo && (
            <div className="text-[10px] font-mono text-[#52525B] bg-[#F4F4F5] px-2.5 py-1 rounded">
              {nodeInfo.node_name} v{nodeInfo.version}
            </div>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="flex gap-1 border-b border-[#F0F0F3] bg-white px-6">
        {(['channels', 'receive', 'send', 'playground'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              id={`tab-${tab}`}
              className={`border-b-2 py-4 px-4 text-xs font-semibold transition-all duration-200 ease-out outline-none ${
                isActive
                  ? 'border-[#2E5BFF] text-[#2E5BFF]'
                  : 'border-transparent text-[#71717A] hover:text-[#0F0F11]'
              }`}
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
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[850px] w-full mx-auto p-6 md:py-8 flex flex-col gap-6">
        <div className="flex-1">
          {activeTab === 'channels' && <ChannelsTab />}
          {activeTab === 'receive' && <ReceiveTab />}
          {activeTab === 'send' && <SendTab />}
          {activeTab === 'playground' && <PlaygroundTab />}
        </div>

        {/* Real-time RPC logs inspector panel */}
        <div className="mt-4">
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
