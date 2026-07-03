/**
 * App.tsx — Demo Wallet
 *
 * Tactical, developer-focused, high-impact aesthetic.
 * Strictly adheres to these custom typography mappings:
 *  - Headers & Hero Sections: Monument Extended / Syne (`font-monument`) - heavy, wide, commanding.
 *  - Main UI & Balances: Satoshi / Plus Jakarta Sans (`font-sans`) - spacious, clean geometric.
 *  - Public Keys & Hashes & Logs: Space Mono (`font-mono`) - retro-futuristic engineered vibe.
 *  - Ticking numbers and numeric values: `tabular-nums` - prevents jittering and layout shifting.
 *
 * Colors: Slate-Platinum background (`#E5E5EC`) with deep matte Charcoal/Obsidian cards (`#121214`).
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
// Constants & Configurations
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
    <div className="flex flex-col gap-4 font-sans text-xs">
      <div className="flex justify-between items-center mb-1">
        <span className="font-monument text-[10px] tracking-widest text-[#52525B]">Lightning Channels</span>
        <button
          className="bg-[#121214] border border-[#2D2D33] hover:bg-[#1C1C20] text-[9px] font-monument tracking-widest px-4 py-2 rounded text-white transition-all duration-200 active:scale-[0.98] shadow-sm"
          onClick={refetch}
        >
          ↻ Refresh
        </button>
      </div>

      {error && <ErrorResolutionBanner error={error} />}
      
      {channels.length === 0 && !error && (
        <div className="text-center py-12 text-xs text-[#A1A1AA] bg-[#121214] border border-[#222226] rounded-lg shadow-md font-semibold">
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
    <div className="flex flex-col gap-4 items-center font-sans">
      <div className="w-full max-w-[420px] flex flex-col gap-3">
        <span className="font-monument text-[10px] tracking-widest text-[#52525B] mb-1">Receive Funds</span>
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
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-2">
        <span className="font-monument text-[10px] tracking-widest text-[#52525B]">Send Payment</span>
      </div>

      <div className="bg-[#121214] border border-[#222226] rounded-lg p-6 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.25)] flex flex-col gap-4 text-[#F4F4F7]">
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-monument tracking-widest text-[#A1A1AA]">Invoice Address</label>
          <div className="flex gap-2">
            <input
              id="send-invoice-input"
              className="flex-1 bg-[#1A1A1E] border border-[#2D2D33] focus:border-[#2E5BFF] focus:ring-1 focus:ring-[#2E5BFF]/30 rounded-md py-2.5 px-3.5 text-xs text-white font-mono outline-none transition-all duration-200"
              value={invoiceInput}
              onChange={(e) => setInvoiceInput(e.target.value)}
              placeholder="fibb1q…"
              spellCheck={false}
            />
            <button
              className="bg-[#2E5BFF] hover:bg-[#1E4BEF] text-white text-[9px] font-monument tracking-widest px-4 py-2.5 rounded shadow-sm transition-all duration-200 active:scale-[0.98]"
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
          className="w-full py-3.5 bg-[#2E5BFF] hover:bg-[#1E4BEF] text-white text-[10px] font-monument tracking-widest rounded shadow-[0_4px_12px_rgba(46,91,255,0.2)] transition-all duration-200 ease-out active:scale-[0.99] uppercase"
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
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col gap-1.5">
        <span className="font-monument text-[10px] tracking-widest text-[#52525B]">SDK Component Playground</span>
        <span className="text-[11px] text-[#52525B] font-medium">Dynamically adjust parameters to inspect SDK component layouts.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: ChannelLifecycleCard */}
        <div className="bg-[#121214] border border-[#222226] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.25)] flex flex-col gap-3.5 text-[#F4F4F7]">
          <div className="text-[10px] font-monument font-bold text-[#2E5BFF] pb-2 border-b border-[#222226] tracking-wider">&lt;ChannelLifecycleCard&gt;</div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-[#A1A1AA] font-semibold">State:</span>
            <select
              className="bg-[#1A1A1E] border border-[#2D2D33] text-white rounded py-1 px-2 text-xs outline-none"
              value={chState}
              onChange={(e) => setChState(e.target.value as ChannelState)}
            >
              <option value="ChannelReady" className="text-black font-sans">ChannelReady</option>
              <option value="NegotiatingFunding" className="text-black font-sans">NegotiatingFunding</option>
              <option value="AwaitingChannelReady" className="text-black font-sans">AwaitingChannelReady</option>
              <option value="Closed" className="text-black font-sans">Closed</option>
            </select>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#A1A1AA] font-semibold">Local (CKB):</span>
            <input
              className="w-24 bg-[#1A1A1E] border border-[#2D2D33] rounded py-1 px-2 text-xs outline-none text-right text-white font-mono tabular-nums"
              type="number"
              value={Number(chLocal) / 1e8}
              onChange={(e) => setChLocal(String(Number(e.target.value) * 1e8))}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#A1A1AA] font-semibold">Remote (CKB):</span>
            <input
              className="w-24 bg-[#1A1A1E] border border-[#2D2D33] rounded py-1 px-2 text-xs outline-none text-right text-white font-mono tabular-nums"
              type="number"
              value={Number(chRemote) / 1e8}
              onChange={(e) => setChRemote(String(Number(e.target.value) * 1e8))}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#A1A1AA] font-semibold">Enabled:</span>
            <input
              type="checkbox"
              className="accent-[#2E5BFF] h-4 w-4"
              checked={chEnabled}
              onChange={(e) => setChEnabled(e.target.checked)}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-[#222226]">
            <ChannelLifecycleCard channel={simulatedChannel} mode={mode} showModeBadge />
          </div>
        </div>

        {/* Card 2: ConfidenceCheck */}
        <div className="bg-[#121214] border border-[#222226] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.25)] flex flex-col gap-3.5 text-[#F4F4F7]">
          <div className="text-[10px] font-monument font-bold text-[#2E5BFF] pb-2 border-b border-[#222226] tracking-wider">&lt;ConfidenceCheck&gt;</div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#A1A1AA] font-semibold">Route Confidence:</span>
            <select
              className="bg-[#1A1A1E] border border-[#2D2D33] text-white rounded py-1 px-2 text-xs outline-none"
              value={confStatus}
              onChange={(e) => setConfStatus(e.target.value as ConfidenceStatus)}
            >
              <option value="ready" className="text-black font-sans">ready</option>
              <option value="insufficient_liquidity" className="text-black font-sans">insufficient_liquidity</option>
              <option value="no_route" className="text-black font-sans">no_route</option>
              <option value="asset_mismatch" className="text-black font-sans">asset_mismatch</option>
              <option value="loading" className="text-black font-sans">loading</option>
            </select>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#A1A1AA] font-semibold">Fee (shannons):</span>
            <input
              className="w-24 bg-[#1A1A1E] border border-[#2D2D33] rounded py-1 px-2 text-xs outline-none text-right text-white font-mono tabular-nums"
              value={confFee}
              onChange={(e) => setConfFee(e.target.value)}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-[#222226]">
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
        <div className="bg-[#121214] border border-[#222226] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.25)] flex flex-col gap-3.5 text-[#F4F4F7]">
          <div className="text-[10px] font-monument font-bold text-[#2E5BFF] pb-2 border-b border-[#222226] tracking-wider">&lt;InvoiceSheet&gt;</div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#A1A1AA] font-semibold">Invoice Status:</span>
            <select
              className="bg-[#1A1A1E] border border-[#2D2D33] text-white rounded py-1 px-2 text-xs outline-none"
              value={invStatus}
              onChange={(e) => setInvStatus(e.target.value as InvoiceStatus)}
            >
              <option value="Open" className="text-black font-sans">Open</option>
              <option value="Paid" className="text-black font-sans">Paid</option>
              <option value="Expired" className="text-black font-sans">Expired</option>
            </select>
          </div>

          <div className="mt-3 pt-3 border-t border-[#222226] flex justify-center">
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
        <div className="bg-[#121214] border border-[#222226] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.25)] flex flex-col gap-3.5 text-[#F4F4F7]">
          <div className="text-[10px] font-monument font-bold text-[#2E5BFF] pb-2 border-b border-[#222226] tracking-wider">&lt;ErrorResolutionBanner&gt;</div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-[#A1A1AA] font-semibold">FNN Error Code:</span>
            <select
              className="bg-[#1A1A1E] border border-[#2D2D33] text-white rounded py-1 px-2 text-xs outline-none"
              value={errCode}
              onChange={(e) => setErrCode(e.target.value as import('fiberglass-react').FiberErrorCode)}
            >
              <option value="INSUFFICIENT_LIQUIDITY" className="text-black font-sans">INSUFFICIENT_LIQUIDITY</option>
              <option value="NO_ROUTE" className="text-black font-sans">NO_ROUTE</option>
              <option value="ASSET_MISMATCH" className="text-black font-sans">ASSET_MISMATCH</option>
              <option value="NODE_UNREACHABLE" className="text-black font-sans">NODE_UNREACHABLE</option>
            </select>
          </div>

          <div className="mt-3 pt-3 border-t border-[#222226]">
            <ErrorResolutionBanner error={simulatedError} retry={() => alert('Callback re-triggered!')} />
          </div>
        </div>

        {/* Card 5: PaymentRouteVisualizer (Full Span) */}
        <div className="bg-[#121214] border border-[#222226] rounded-lg p-5 shadow-[0_1px_3px_rgba(0,0,0,0.1),0_12px_32px_rgba(0,0,0,0.25)] flex flex-col gap-3.5 text-[#F4F4F7] md:col-span-2">
          <div className="text-[10px] font-monument font-bold text-[#2E5BFF] pb-2 border-b border-[#222226] tracking-wider">&lt;PaymentRouteVisualizer&gt;</div>

          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-[#A1A1AA] font-semibold">Payment Status:</span>
            <select
              className="bg-[#1A1A1E] border border-[#2D2D33] text-white rounded py-1 px-2 text-xs outline-none"
              value={visStatus}
              onChange={(e) => setVisStatus(e.target.value as PaymentStatus)}
            >
              <option value="Success" className="text-black font-sans">Success</option>
              <option value="Failed" className="text-black font-sans">Failed</option>
              <option value="Inflight" className="text-black font-sans">Inflight</option>
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
    <div className="text-center py-16 text-[#52525B]">
      <div className="text-3xl animate-spin inline-block text-[#2E5BFF]">⟳</div>
      <div className="mt-3 text-[9px] font-monument tracking-widest uppercase">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wallet Container Component
// ---------------------------------------------------------------------------

function WalletShell() {
  const { mode, connectionStatus, nodeInfo } = useFiberNode();
  const [activeTab, setActiveTab] = useState<Tab>('channels');

  const modeColor = mode === 'live' ? '#10B981' : '#F59E0B';
  const modeBg = mode === 'live' ? 'bg-[#ECFDF5]/10' : 'bg-[#FFFBEB]/10';
  const modeBorder = mode === 'live' ? 'border-[#10B981]/30' : 'border-[#F59E0B]/30';

  return (
    <div className="min-h-screen bg-[#E5E5EC] flex flex-col text-[#121214] font-sans selection:bg-[#2E5BFF]/10">
      
      {/* Header */}
      <header className="flex justify-between items-center py-5 px-6 border-b border-[#1E1E22] bg-[#121214] text-white shadow-sm">
        <div>
          <div className="text-xs font-monument tracking-widest text-white flex items-center gap-2">
            💎 fiberglass <span className="text-[9px] bg-[#2E5BFF]/20 text-[#2E5BFF] border border-[#2E5BFF]/30 px-1.5 py-0.5 rounded tracking-normal font-mono font-bold lowercase">SDK</span>
          </div>
          <div className="text-[9px] text-[#71717A] tracking-widest uppercase mt-1 font-monument">FNN Client Interface</div>
        </div>

        <div className="flex items-center gap-3">
          <div className={`text-[9px] font-monument tracking-widest px-3.5 py-1.5 border rounded ${modeBg} ${modeBorder} text-white`} style={{ color: modeColor }}>
            {mode === 'live' ? '● LIVE' : '◌ MOCK'} · {connectionStatus.toUpperCase()}
          </div>
          {nodeInfo && (
            <div className="text-[10px] font-mono text-[#A1A1AA] bg-[#1A1A1E] border border-[#2D2D33] px-2.5 py-1 rounded">
              {nodeInfo.node_name} v{nodeInfo.version}
            </div>
          )}
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="flex gap-1 border-b border-[#1E1E22] bg-[#121214] px-6">
        {(['channels', 'receive', 'send', 'playground'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              id={`tab-${tab}`}
              className={`border-b-2 py-4 px-4 text-[9px] font-monument tracking-widest transition-all duration-200 ease-out outline-none ${
                isActive
                  ? 'border-[#2E5BFF] text-white font-bold'
                  : 'border-transparent text-[#71717A] hover:text-[#F4F4F7]'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
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
