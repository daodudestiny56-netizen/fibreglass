/**
 * App.tsx — Demo Wallet
 *
 * Premium editorial-grade UI redesign with tactical developer-focused aesthetic:
 *  - Font: Monument Extended / Syne (`font-sans font-bold uppercase tracking-wider`) for commanding headers.
 *  - Font: Satoshi / Plus Jakarta Sans (`font-sans`) for geometric UI.
 *  - Font: Space Mono (`font-mono`) for keys, hashes, and inspector.
 *  - Tabular Numbers (`tabular-nums`) on all numeric balance readouts.
 *  - Background: Radial-masked grid pattern on industrial platinum (`#E5E5EC`).
 *  - Elevates: Dark Obsidian cards (`surface`) with pure-white text and Electric Cobalt accents (`signal`).
 *
 * New Sleek Dashboard Additions:
 *  - Network Metrics & Liquidity Stats Grid.
 *  - Fast-Track Preset select boxes on Send & Playground tabs.
 *  - Filterable RPC Log Inspector.
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
  PaymentLinkReceiver,
} from 'fiberglass-react';
import { RpcLogViewer } from './components/RpcLogViewer';
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
// Constants & Presets
// ---------------------------------------------------------------------------

type Tab = 'channels' | 'receive' | 'send' | 'playground';

const PRESET_INVOICES = {
  standard: 'fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqqzvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfxzf0lfmscmygq5yu',
  expired: 'fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqqzvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfxzf0lfmscmygq5yu_expired',
  no_route: 'fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqqzvq79pq6xm8gqs3y6e28ekqkq9wj4lxx8t4fdjjvs8vfxzf0lfmscmygq5no_route',
};

const MOCK_HOPS: RouterHop[] = [
  { channel_outpoint: '0x0001', target: '0x0002' as import('fiberglass-react').Pubkey, amount_received: '5000', incoming_tlc_expiry: '0x10' },
  { channel_outpoint: '0x0002', target: '0x0003' as import('fiberglass-react').Pubkey, amount_received: '4000', incoming_tlc_expiry: '0x10' },
];

// ---------------------------------------------------------------------------
// Component: Dashboard Stats Grid
// ---------------------------------------------------------------------------

function DashboardStats({ channelsCount }: { channelsCount: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Metric 1 */}
      <div className="brutalist-container p-4 flex flex-col gap-1 text-ink">
        <span className="font-['Space_Grotesk'] font-bold uppercase tracking-wider text-[11px] text-ink">Total Node Funds</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-mono font-bold tracking-tight tabular-nums text-ink">10.00000000</span>
          <span className="text-[10px] font-mono font-bold text-ink">CKB</span>
        </div>
      </div>
      {/* Metric 2 */}
      <div className="brutalist-container p-4 flex flex-col gap-1 text-ink">
        <span className="font-['Space_Grotesk'] font-bold uppercase tracking-wider text-[11px] text-ink">Total Connections</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-mono font-bold tracking-tight tabular-nums text-ink">{channelsCount}</span>
          <span className="text-[10px] font-mono font-bold text-ink">Active</span>
        </div>
      </div>
      {/* Metric 3 */}
      <div className="brutalist-container p-4 flex flex-col gap-1 text-ink">
        <span className="font-['Space_Grotesk'] font-bold uppercase tracking-wider text-[11px] text-ink">Network Fee</span>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-xl font-mono font-bold tracking-tight tabular-nums text-ink">4,200</span>
          <span className="text-[10px] font-mono font-bold text-ink">shannons</span>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Channels Tab
// ---------------------------------------------------------------------------

function ChannelsTab() {
  const { mode } = useFiberNode();
  const { channels, isLoading, error, refetch } = useChannel({ refreshIntervalMs: 0 });

  if (isLoading) return <LoadingSpinner label="Fetching Connections" />;

  return (
    <div className="flex flex-col gap-4 font-sans text-xs">
      <DashboardStats channelsCount={channels.length} />

      <div className="flex justify-between items-center mb-1">
        <span className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-[12px] text-ink">Connection Overview</span>
        <button
          className="brutalist-button px-4 py-2 text-[11px]"
          onClick={refetch}
        >
          ↻ Refresh
        </button>
      </div>

      {error && <ErrorResolutionBanner error={error} />}
      
      {channels.length === 0 && !error && (
        <div className="text-center py-12 text-sm text-ink brutalist-container font-semibold">
          No connections configured on this node.
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
  const [invoiceAmount, setInvoiceAmount] = useState('100000000'); // 1 CKB default
  const [invoiceMemo, setInvoiceMemo] = useState('Fiberglass SDK Dev Demo');

  // Trigger invoice creation
  const invoice = useInvoice({
    amount: invoiceAmount,
    currency: 'CKB',
    memo: invoiceMemo,
  });

  return (
    <div className="flex flex-col gap-4 items-center font-sans">
      <div className="w-full max-w-[420px] flex flex-col gap-4">
        <span className="font-sans font-bold uppercase tracking-wider text-[10px] tracking-widest text-ink mb-1">Receive Funds</span>
        
        {/* Dynamic Controls */}
        <div className="brutalist-container p-5  flex flex-col gap-4 text-ink">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-sans font-bold uppercase tracking-wider tracking-wider text-ink">Amount (shannons)</label>
            <input
              type="text"
              className="bg-[#FFFFFF] border-[3px] border-ink focus:bg-[var(--accent-primary)] focus:shadow-[4px_4px_0px_var(--ink)] py-2 px-3 text-xs text-ink font-mono outline-none transition-all duration-200"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-sans font-bold uppercase tracking-wider tracking-wider text-ink">Description / Memo</label>
            <input
              type="text"
              className="bg-[#FFFFFF] border-[3px] border-ink focus:bg-[var(--accent-primary)] focus:shadow-[4px_4px_0px_var(--ink)] py-2 px-3 text-xs text-ink outline-none transition-all duration-200"
              value={invoiceMemo}
              onChange={(e) => setInvoiceMemo(e.target.value)}
            />
          </div>
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
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component: Send Tab
// ---------------------------------------------------------------------------

function SendTab() {
  const { mode } = useFiberNode();
  const [invoiceInput, setInvoiceInput] = useState(PRESET_INVOICES.standard);
  const [activeInvoice, setActiveInvoice] = useState<string | null>(PRESET_INVOICES.standard);

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
        <span className="font-sans font-bold uppercase tracking-wider text-[10px] tracking-widest text-ink">Send Payment</span>
      </div>

      <div className="brutalist-container p-6  flex flex-col gap-4 text-[ink]">
        {/* Preset Selectors */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-sans font-bold uppercase tracking-wider tracking-wider text-ink">Preset Mock Scenarios</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                setInvoiceInput(PRESET_INVOICES.standard);
                setActiveInvoice(PRESET_INVOICES.standard);
              }}
              className={`py-2.5 px-3 text-[10px] border-[3px] border-ink font-sans font-bold uppercase tracking-wider tracking-wider transition-all min-h-[44px] ${
                invoiceInput === PRESET_INVOICES.standard
                  ? 'bg-[var(--accent-primary)] text-ink shadow-[2px_2px_0px_var(--ink)] translate-x-[2px] translate-y-[2px]'
                  : 'bg-[#FFFFFF] border-ink text-ink hover:text-ink'
              }`}
            >
              Standard
            </button>
            <button
              onClick={() => {
                setInvoiceInput(PRESET_INVOICES.no_route);
                setActiveInvoice(PRESET_INVOICES.no_route);
              }}
              className={`py-2.5 px-3 text-[10px] border-[3px] border-ink font-sans font-bold uppercase tracking-wider tracking-wider transition-all min-h-[44px] ${
                invoiceInput === PRESET_INVOICES.no_route
                  ? 'bg-[var(--accent-primary)] text-ink shadow-[2px_2px_0px_var(--ink)] translate-x-[2px] translate-y-[2px]'
                  : 'bg-[#FFFFFF] border-ink text-ink hover:text-ink'
              }`}
            >
              No Route
            </button>
            <button
              onClick={() => {
                setInvoiceInput(PRESET_INVOICES.expired);
                setActiveInvoice(PRESET_INVOICES.expired);
              }}
              className={`py-2.5 px-3 text-[10px] border-[3px] border-ink font-sans font-bold uppercase tracking-wider tracking-wider transition-all min-h-[44px] ${
                invoiceInput === PRESET_INVOICES.expired
                  ? 'bg-[var(--accent-primary)] text-ink shadow-[2px_2px_0px_var(--ink)] translate-x-[2px] translate-y-[2px]'
                  : 'bg-[#FFFFFF] border-ink text-ink hover:text-ink'
              }`}
            >
              Expired
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <label className="text-[10px] font-sans font-bold uppercase tracking-wider tracking-widest text-ink">Invoice Address</label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              id="send-invoice-input"
              className="flex-1 bg-[#FFFFFF] border-[3px] border-ink focus:bg-[var(--accent-primary)] focus:shadow-[4px_4px_0px_var(--ink)] py-2.5 px-3.5 text-xs text-ink font-mono outline-none transition-all duration-200 min-h-[44px] break-all"
              value={invoiceInput}
              onChange={(e) => setInvoiceInput(e.target.value)}
              placeholder="fibb1q…"
              spellCheck={false}
            />
            <button
              className="brutalist-button px-4 py-2.5 text-[9px] min-h-[44px] w-full sm:w-auto"
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
          className="w-full py-3.5 brutalist-button text-[10px] uppercase"
          onClick={handleSend}
        >
          Confirm & Send Payment
        </button>
      )}

      {paymentResult.payment && confidence.route && (
        <PaymentRouteVisualizer
          hops={confidence.route}
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

function CodeSnippet({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-5 brutalist-container p-4 text-[11px] font-mono text-ink overflow-x-auto relative group whitespace-pre-wrap break-all leading-relaxed">
      {code}
      <button 
        onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-[#FFFFFF] border-[3px] border-ink px-2.5 py-1 text-[9px]  font-sans font-bold uppercase tracking-wider text-ink hover:bg-[var(--accent-primary)] hover:shadow-[4px_4px_0px_var(--ink)] transition-all cursor-pointer"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

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
        <span className="font-sans font-bold uppercase tracking-wider text-[10px] tracking-widest text-ink">SDK Component Playground</span>
        <span className="text-[11px] text-ink font-medium">Dynamically adjust parameters to inspect SDK component layouts.</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: ChannelLifecycleCard */}
        <div className="brutalist-container p-5  flex flex-col gap-3.5 text-[ink]">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider font-bold text-[signal] pb-2 border-b border-ink tracking-wider">&lt;ChannelLifecycleCard&gt;</div>
          
          <div className="flex justify-between items-center text-xs">
            <span className="text-ink font-semibold">State:</span>
            <select
              className="bg-[#FFFFFF] border-[3px] border-ink text-ink font-bold py-1 px-2 text-xs outline-none"
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
            <span className="text-ink font-semibold">Local (CKB):</span>
            <input
              className="w-24 bg-[#FFFFFF] border-[3px] border-ink py-1 px-2 text-xs outline-none text-right text-ink font-mono tabular-nums"
              type="number"
              value={Number(chLocal) / 1e8}
              onChange={(e) => setChLocal(String(Number(e.target.value) * 1e8))}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-ink font-semibold">Remote (CKB):</span>
            <input
              className="w-24 bg-[#FFFFFF] border-[3px] border-ink py-1 px-2 text-xs outline-none text-right text-ink font-mono tabular-nums"
              type="number"
              value={Number(chRemote) / 1e8}
              onChange={(e) => setChRemote(String(Number(e.target.value) * 1e8))}
            />
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-ink font-semibold">Enabled:</span>
            <input
              type="checkbox"
              className="accent-[signal] h-4 w-4"
              checked={chEnabled}
              onChange={(e) => setChEnabled(e.target.checked)}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-ink">
            <ChannelLifecycleCard channel={simulatedChannel} mode={mode} showModeBadge />
            <CodeSnippet code={`<ChannelLifecycleCard
  channel={{
    channel_id: "0x888...",
    peer_id: "0x028...",
    local_balance: "${chLocal}",
    remote_balance: "${chRemote}",
    enabled: ${chEnabled},
    state: "${chState}"
  }}
  mode="${mode}"
  showModeBadge
/>`} />
          </div>
        </div>

        {/* Card 2: ConfidenceCheck */}
        <div className="brutalist-container p-5  flex flex-col gap-3.5 text-[ink]">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider font-bold text-[signal] pb-2 border-b border-ink tracking-wider">&lt;ConfidenceCheck&gt;</div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-ink font-semibold">Route Confidence:</span>
            <select
              className="bg-[#FFFFFF] border-[3px] border-ink text-ink font-bold py-1 px-2 text-xs outline-none"
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
            <span className="text-ink font-semibold">Fee (shannons):</span>
            <input
              className="w-24 bg-[#FFFFFF] border-[3px] border-ink py-1 px-2 text-xs outline-none text-right text-ink font-mono tabular-nums"
              value={confFee}
              onChange={(e) => setConfFee(e.target.value)}
            />
          </div>

          <div className="mt-3 pt-3 border-t border-ink">
            <ConfidenceCheck
              status={confStatus}
              fee={confFee}
              route={MOCK_HOPS}
              isLoading={confStatus === 'loading'}
              error={null}
              mode={mode}
            />
            <CodeSnippet code={`<ConfidenceCheck
  status="${confStatus}"
  fee="${confFee}"
  route={MOCK_HOPS}
  isLoading={${confStatus === 'loading'}}
  error={null}
  mode="${mode}"
/>`} />
          </div>
        </div>

        {/* Card 3: InvoiceSheet */}
        <div className="brutalist-container p-5  flex flex-col gap-3.5 text-[ink]">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider font-bold text-[signal] pb-2 border-b border-ink tracking-wider">&lt;InvoiceSheet&gt;</div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-ink font-semibold">Invoice Status:</span>
            <select
              className="bg-[#FFFFFF] border-[3px] border-ink text-ink font-bold py-1 px-2 text-xs outline-none"
              value={invStatus}
              onChange={(e) => setInvStatus(e.target.value as InvoiceStatus)}
            >
              <option value="Open" className="text-black font-sans">Open</option>
              <option value="Paid" className="text-black font-sans">Paid</option>
              <option value="Expired" className="text-black font-sans">Expired</option>
            </select>
          </div>

          <div className="mt-3 pt-3 border-t border-ink flex flex-col items-center w-full">
            <InvoiceSheet
              invoiceAddress="fibb1qpp5kh8d0kfwna2t7afjhqjyrq8fq4dg37x4k0hz4w5s9yq9jyeysqqzvq79pq6xm8gqs3y"
              paymentHash={'0x123' as Hash256}
              invoiceStatus={invStatus}
              expiresAt={new Date(Date.now() + 600000)}
              isLoading={false}
              error={null}
              mode={mode}
            />
            <div className="w-full text-left">
              <CodeSnippet code={`<InvoiceSheet
  invoiceAddress="fibb1q..."
  paymentHash="0x123..."
  invoiceStatus="${invStatus}"
  expiresAt={new Date(...)}
  isLoading={false}
  error={null}
  mode="${mode}"
/>`} />
            </div>
          </div>
        </div>

        {/* Card 4: ErrorResolutionBanner */}
        <div className="brutalist-container p-5  flex flex-col gap-3.5 text-[ink]">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider font-bold text-[signal] pb-2 border-b border-ink tracking-wider">&lt;ErrorResolutionBanner&gt;</div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-ink font-semibold">FNN Error Code:</span>
            <select
              className="bg-[#FFFFFF] border-[3px] border-ink text-ink font-bold py-1 px-2 text-xs outline-none"
              value={errCode}
              onChange={(e) => setErrCode(e.target.value as import('fiberglass-react').FiberErrorCode)}
            >
              <option value="INSUFFICIENT_LIQUIDITY" className="text-black font-sans">INSUFFICIENT_LIQUIDITY</option>
              <option value="NO_ROUTE" className="text-black font-sans">NO_ROUTE</option>
              <option value="ASSET_MISMATCH" className="text-black font-sans">ASSET_MISMATCH</option>
              <option value="NODE_UNREACHABLE" className="text-black font-sans">NODE_UNREACHABLE</option>
            </select>
          </div>

          <div className="mt-3 pt-3 border-t border-ink">
            <ErrorResolutionBanner error={simulatedError} retry={() => alert('Callback re-triggered!')} />
            <CodeSnippet code={`<ErrorResolutionBanner 
  error={{
    code: "${errCode}",
    rawMessage: "FNN FAILED: ${errCode}...",
    rpcMethod: "send_payment"
  }} 
  retry={() => alert('...')}
/>`} />
          </div>
        </div>

        {/* Card 5: PaymentRouteVisualizer (Full Span) */}
        <div className="brutalist-container p-5  flex flex-col gap-3.5 text-[ink] md:col-span-2">
          <div className="text-[10px] font-sans font-bold uppercase tracking-wider font-bold text-[signal] pb-2 border-b border-ink tracking-wider">&lt;PaymentRouteVisualizer&gt;</div>

          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-ink font-semibold">Payment Status:</span>
            <select
              className="bg-[#FFFFFF] border-[3px] border-ink text-ink font-bold py-1 px-2 text-xs outline-none"
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
            <CodeSnippet code={`<PaymentRouteVisualizer
  hops={MOCK_HOPS}
  paymentStatus="${visStatus}"
  totalFee="2500"
  mode="${mode}"
  isAnimating={${visStatus === 'Inflight'}}
/>`} />
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
    <div className="text-center py-16 text-ink">
      <div className="text-3xl animate-spin inline-block text-[signal]">⟳</div>
      <div className="mt-3 text-[9px] font-sans font-bold uppercase tracking-wider tracking-widest uppercase">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wallet Container Component
// ---------------------------------------------------------------------------

function WalletShell() {
  const { mode, connectionStatus, nodeInfo, setMode } = useFiberNode();
  const [activeTab, setActiveTab] = useState<Tab>('channels');
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(false);

  // Lightweight routing for payment links
  const [paymentLinkPayload] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/pay/')) {
        return path.slice(5);
      }
    }
    return null;
  });

  if (paymentLinkPayload) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 text-ink font-sans relative overflow-x-hidden">
        <div className="relative z-10 w-full max-w-[400px]">
          <PaymentLinkReceiver encodedPayload={paymentLinkPayload} />
          <div className="mt-8 text-center">
            <a href="/" className="text-[12px] text-ink font-['Space_Grotesk'] font-bold uppercase hover:underline">← Back to Wallet</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col text-ink font-sans relative overflow-x-hidden">
      
      {/* Header */}
      <header 
        className="relative z-10 border-b-[3px] border-ink bg-[#FFFFFF] text-ink sm:cursor-auto"
      >
        {/* Mobile Compact View */}
        <div 
          className="sm:hidden flex justify-between items-center py-3 px-4 cursor-pointer"
          onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
        >
          <div className="text-[12px] font-['Space_Grotesk'] font-bold uppercase tracking-wider flex items-center gap-2">
            fiberglass <span className="text-[9px] bg-[var(--accent-primary)] text-ink border-[2px] border-ink px-1 py-0.5 font-mono font-bold shadow-[1px_1px_0px_var(--ink)]">SDK</span>
          </div>
          <div className="relative flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <div className={`w-2 h-2 rounded-full border-[1.5px] border-ink ${mode === 'live' ? 'bg-[#00FF00]' : 'bg-[var(--mock-tag)]'}`} />
            <select
              value={mode}
              onChange={(e) => {
                if (setMode) setMode(e.target.value as any);
              }}
              className="text-[10px] font-['Space_Grotesk'] font-bold uppercase bg-transparent border-none outline-none cursor-pointer appearance-none pr-4"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right center',
                backgroundSize: '8px'
              }}
            >
              <option value="live">LIVE</option>
              <option value="mock">MOCK</option>
            </select>
          </div>
        </div>

        {/* Expanded View (Always visible on sm) */}
        <div className={`${isHeaderExpanded ? 'flex' : 'hidden'} sm:flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-5 px-4 sm:px-6 gap-4 sm:gap-0 border-t-[3px] sm:border-t-0 border-ink`}>
          <div>
            <div className="hidden sm:flex text-[14px] font-['Space_Grotesk'] font-bold uppercase tracking-wider text-ink items-center gap-2">
              fiberglass <span className="text-[11px] bg-[var(--accent-primary)] text-ink border-[2px] border-ink px-1.5 py-0.5 tracking-normal font-mono font-bold lowercase shadow-[2px_2px_0px_var(--ink)]">SDK</span>
            </div>
            <div className="text-[10px] text-ink font-['Space_Grotesk'] font-bold uppercase sm:mt-1">Node Client Interface</div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative inline-block">
              <select
                value={mode}
                onChange={(e) => {
                  if (setMode) setMode(e.target.value as any);
                }}
                className="text-[11px] font-['Space_Grotesk'] font-bold uppercase tracking-wider pl-3.5 pr-8 py-1.5 border-[3px] border-ink bg-white text-ink shadow-[2px_2px_0px_var(--ink)] outline-none cursor-pointer appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 10px center',
                  backgroundSize: '10px'
                }}
              >
                <option value="live">LIVE · {connectionStatus.toUpperCase()}</option>
                <option value="mock">MOCK · DISCONNECTED</option>
              </select>
            </div>
            {nodeInfo && (
              <div className="text-[12px] font-mono text-ink border-[3px] border-ink bg-white px-2.5 py-1 font-bold shadow-[2px_2px_0px_var(--ink)]">
                {nodeInfo.node_name} v{nodeInfo.version}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="fixed bottom-0 left-0 w-full z-50 sm:relative sm:z-10 flex sm:gap-1 justify-around sm:justify-start border-t-[3px] sm:border-t-0 sm:border-b-[3px] border-ink bg-[#FFFFFF] px-0 sm:px-6 pt-0 sm:pt-2 pb-4 sm:pb-0">
        {(['channels', 'receive', 'send', 'playground'] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          
          let icon = '';
          let shortLabel = '';
          let desktopLabel = '';
          
          switch(tab) {
            case 'channels': icon = '⧉'; shortLabel = 'Connect'; desktopLabel = 'Connections'; break;
            case 'receive': icon = '↓'; shortLabel = 'Receive'; desktopLabel = 'Get Paid'; break;
            case 'send': icon = '↑'; shortLabel = 'Send'; desktopLabel = 'Send Funds'; break;
            case 'playground': icon = '⚙'; shortLabel = 'Dev'; desktopLabel = 'Playground'; break;
          }

          return (
            <button
              key={tab}
              id={`tab-${tab}`}
              className={`flex-1 sm:flex-none flex flex-col sm:block items-center justify-center py-3 sm:py-4 px-2 sm:px-6 text-[10px] sm:text-[12px] font-['Space_Grotesk'] font-bold uppercase tracking-wider outline-none sm:border-[3px] sm:border-ink sm:border-b-0 sm:translate-y-[3px] min-h-[44px] min-w-[44px] ${
                isActive
                  ? 'bg-[var(--accent-primary)] sm:bg-white text-ink z-10 border-t-[3px] sm:border-t-[3px] border-ink sm:border-t-ink'
                  : 'bg-white sm:bg-[var(--bg)] text-ink sm:opacity-60 hover:opacity-100 z-0 border-t-[3px] border-transparent sm:border-t-transparent sm:border-ink'
              }`}
              onClick={() => setActiveTab(tab)}
            >
              <span className="sm:hidden text-lg leading-none mb-1">{icon}</span>
              <span className="sm:hidden">{shortLabel}</span>
              <span className="hidden sm:inline">{desktopLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-[850px] w-full mx-auto p-4 sm:p-6 md:py-8 flex flex-col gap-6 mb-24 sm:mb-0">
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
