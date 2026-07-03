/**
 * lib/rpcClient.ts
 *
 * Fiber Network Node (FNN) JSON-RPC 2.0 client.
 *
 * Rules enforced here:
 *  - Only the six RPC methods listed in the project brief are implemented.
 *  - No invented endpoints or response shapes.
 *  - Amounts are `string` (representing u128 shannons) — never `number`.
 *  - All 0x-prefixed hex identifiers use the branded `Hash256` / `Pubkey` types.
 *  - Types marked PROVISIONAL will be updated once real captured payloads arrive (Day 1 task).
 */

// ---------------------------------------------------------------------------
// Branded primitive types
// ---------------------------------------------------------------------------

/** 0x-prefixed 32-byte hex string. e.g. "0xabcd…" */
export type Hash256 = string & { readonly __brand: 'Hash256' };

/** 0x-prefixed secp256k1 public key hex string (compressed, 33 bytes → 66 hex chars + "0x"). */
export type Pubkey = string & { readonly __brand: 'Pubkey' };

/**
 * u128 amount encoded as a decimal string, representing the raw on-chain unit
 * (shannons for CKB, or the asset's minimal unit for UDTs).
 * NEVER use JavaScript `number` for amounts — u128 overflows IEEE-754 double.
 */
export type AmountString = string;

// ---------------------------------------------------------------------------
// SDK-level derived types
// ---------------------------------------------------------------------------

export type FiberMode = 'live' | 'mock';

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface FiberContextValue {
  /** Low-level RPC call wrapper — prefer the domain hooks. */
  client: FiberClient;
  /** 'live' if the provider reached a real FNN node, 'mock' otherwise. */
  mode: FiberMode;
  /** Current connection lifecycle state. */
  connectionStatus: ConnectionStatus;
  /** The node_info response from the live node, or null in mock mode. */
  nodeInfo: NodeInfoResponse | null;
}

/**
 * A structured error surfaced by Fiberglass hooks.
 * `rawMessage` is always the verbatim string from FNN — never hidden.
 */
export interface FiberError {
  /** Short machine-readable code inferred from the raw message. */
  code: FiberErrorCode;
  /** The verbatim error string returned by FNN (or a mock equivalent). */
  rawMessage: string;
  /** The RPC method that produced this error. */
  rpcMethod: FnnMethod;
}

/** Inferred error codes — derived from real FNN error strings (see errorMap.ts). */
export type FiberErrorCode =
  | 'INSUFFICIENT_LIQUIDITY'
  | 'NO_ROUTE'
  | 'ASSET_MISMATCH'
  | 'INVOICE_EXPIRED'
  | 'INVOICE_CANCELLED'
  | 'PAYMENT_ALREADY_EXISTS'
  | 'NODE_UNREACHABLE'
  | 'UNKNOWN';

export type InvoiceStatus = 'Open' | 'Cancelled' | 'Expired' | 'Received' | 'Paid';

export type PaymentStatus = 'Created' | 'Inflight' | 'Success' | 'Failed';

export type ConfidenceStatus =
  | 'ready'
  | 'insufficient_liquidity'
  | 'no_route'
  | 'asset_mismatch'
  | 'loading'
  | 'error';

/** Channel lifecycle state as reported by FNN. PROVISIONAL — update from real payload. */
export type ChannelState =
  | 'NegotiatingFunding'
  | 'CollaboratingFundingTx'
  | 'SigningCommitment'
  | 'AwaitingChannelReady'
  | 'ChannelReady'
  | 'ShuttingDown'
  | 'Closed';

// ---------------------------------------------------------------------------
// RPC method name literals
// ---------------------------------------------------------------------------

export type FnnMethod =
  | 'node_info'
  | 'list_channels'
  | 'new_invoice'
  | 'get_invoice'
  | 'send_payment'
  | 'get_payment';

// ---------------------------------------------------------------------------
// RPC request / response shapes (PROVISIONAL — update from real payloads)
// ---------------------------------------------------------------------------

// ---- node_info ------------------------------------------------------------

/** Parameters for `node_info` — takes no arguments. */
export type NodeInfoParams = Record<string, never>;

/**
 * PROVISIONAL: Shape will be refined once real payload is captured.
 * Known fields from FNN documentation:
 *  - node_name, node_id, version, addresses, chain_hash, open_channel_auto_accept_min_ckb_funding_amount
 */
export interface NodeInfoResponse {
  node_name: string;
  node_id: Pubkey;
  /** Semver string, e.g. "0.3.0" */
  version: string;
  /** Multiaddr strings the node listens on */
  addresses: string[];
  /** Hex-encoded chain genesis hash */
  chain_hash: Hash256;
  /** Minimum CKB funding amount for auto-accept channel opens (in shannons) */
  open_channel_auto_accept_min_ckb_funding_amount: AmountString;
  /** [PROVISIONAL] Additional fields from real payload will extend this. */
  [key: string]: unknown;
}

// ---- list_channels --------------------------------------------------------

export interface ListChannelsParams {
  /** If provided, filter to channels with this peer pubkey. */
  peer_id?: Pubkey;
}

/** PROVISIONAL: channel detail shape from `list_channels`. */
export interface ChannelDetail {
  /** Unique channel identifier (funding tx outpoint or similar). */
  channel_id: Hash256;
  /** Counterparty node pubkey. */
  peer_id: Pubkey;
  /** Funding amount held by local node (shannons). */
  local_balance: AmountString;
  /** Funding amount held by remote peer (shannons). */
  remote_balance: AmountString;
  /** Whether the channel can currently route payments. */
  enabled: boolean;
  /** Lifecycle state string from FNN. */
  state: ChannelState;
  /** [PROVISIONAL] Additional fields from real payload will extend this. */
  [key: string]: unknown;
}

export interface ListChannelsResponse {
  channels: ChannelDetail[];
}

// ---- new_invoice ----------------------------------------------------------

export interface NewInvoiceParams {
  /** Amount in shannons (or UDT minimal unit). */
  amount: AmountString;
  /** Asset identifier — "CKB" for native, or UDT type script hash. */
  currency: string;
  /** Optional human-readable description / memo. */
  description?: string;
  /** Expiry in seconds from now. Defaults to FNN node setting if omitted. */
  expiry?: number;
  /** If provided, the invoice will require this specific payment hash. */
  payment_preimage?: Hash256;
}

/**
 * PROVISIONAL: shape will be refined from real `new_invoice` payload.
 * Known: returns an `invoice_address` (BOLT11-style string) and a `CkbInvoice`
 * object that contains `payment_hash`.
 */
export interface NewInvoiceResponse {
  /** Encodedstring suitable for QR display and sharing. */
  invoice_address: string;
  /** The parsed invoice object. PROVISIONAL sub-fields. */
  invoice: CkbInvoice;
}

/** PROVISIONAL: CkbInvoice sub-object from FNN. */
export interface CkbInvoice {
  /** The preimage hash locked by this invoice. */
  payment_hash: Hash256;
  /** Amount encoded in the invoice. */
  amount: AmountString | null;
  /** Currency / asset identifier. */
  currency: string;
  /** Unix timestamp when the invoice expires. */
  expiry: number;
  /** Human-readable memo. */
  description: string | null;
  /** [PROVISIONAL] Additional fields from real payload will extend this. */
  [key: string]: unknown;
}

// ---- get_invoice ----------------------------------------------------------

export interface GetInvoiceParams {
  payment_hash: Hash256;
}

export interface GetInvoiceResponse {
  invoice_address: string;
  invoice: CkbInvoice;
  status: InvoiceStatus;
}

// ---- send_payment (dry_run) -----------------------------------------------

export interface SendPaymentParams {
  /** BOLT11-style invoice string to pay. */
  invoice: string;
  /** When true, validate routing/fees but do not commit a real payment. */
  dry_run: boolean;
  /** Optional amount override (if invoice has no amount). */
  amount?: AmountString;
}

/**
 * PROVISIONAL: send_payment (dry_run) response.
 * On dry_run success we expect routing information.
 * On failure the RPC itself errors with a message string.
 */
export interface SendPaymentResponse {
  payment_hash: Hash256;
  /** Total fee across all hops (shannons). */
  fee: AmountString;
  /** Ordered hop path — same shape as get_payment routers (PROVISIONAL). */
  router: RouterHop[];
  /** [PROVISIONAL] Additional fields from real payload will extend this. */
  [key: string]: unknown;
}

// ---- get_payment ----------------------------------------------------------

export interface GetPaymentParams {
  payment_hash: Hash256;
}

/**
 * One hop in a payment route.
 * PROVISIONAL: real field names will be confirmed from captured payload.
 */
export interface RouterHop {
  /** The forwarding node's pubkey. */
  channel_outpoint: string;
  /** Next-hop channel ID or target node. PROVISIONAL. */
  next_hop: Pubkey | null;
  /** Fee charged by this hop (shannons). PROVISIONAL. */
  fee: AmountString;
  /** [PROVISIONAL] Additional fields from real payload will extend this. */
  [key: string]: unknown;
}

/**
 * PROVISIONAL: get_payment response.
 * Key fields: status, failed_error (free text), routers (real hop path).
 */
export interface GetPaymentResponse {
  payment_hash: Hash256;
  status: PaymentStatus;
  /** Fee paid (shannons). Populated after Success. */
  fee: AmountString | null;
  /** Amount sent (shannons). */
  amount: AmountString;
  /**
   * Free-text error string from FNN — never a fixed enum.
   * Present only when status === 'Failed'.
   * Fiberglass maps this to FiberErrorCode via errorMap.ts.
   */
  failed_error: string | null;
  /**
   * Ordered list of hops actually traversed.
   * This is the raw data that powers PaymentRouteVisualizer.
   */
  routers: RouterHop[];
  /** [PROVISIONAL] Additional fields from real payload will extend this. */
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Hook return types
// ---------------------------------------------------------------------------

export interface UseChannelResult {
  channels: ChannelDetail[];
  isLoading: boolean;
  error: FiberError | null;
  refetch: () => void;
}

export interface UseConfidenceResult {
  status: ConfidenceStatus;
  fee: AmountString | null;
  route: RouterHop[] | null;
  isLoading: boolean;
  error: FiberError | null;
}

export interface UseInvoiceResult {
  invoiceAddress: string | null;
  paymentHash: Hash256 | null;
  invoiceStatus: InvoiceStatus | null;
  expiresAt: Date | null;
  isLoading: boolean;
  error: FiberError | null;
  /** Force an immediate poll for invoice status. */
  pollNow: () => void;
}

export interface UsePaymentResult {
  payment: GetPaymentResponse | null;
  status: PaymentStatus | null;
  isLoading: boolean;
  error: FiberError | null;
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 wire types (internal)
// ---------------------------------------------------------------------------

interface JsonRpcRequest {
  jsonrpc: '2.0';
  method: string;
  params: unknown;
  id: number;
}

interface JsonRpcSuccess<T> {
  jsonrpc: '2.0';
  result: T;
  id: number;
}

interface JsonRpcError {
  jsonrpc: '2.0';
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
  id: number;
}

type JsonRpcResponse<T> = JsonRpcSuccess<T> | JsonRpcError;

function isJsonRpcError<T>(r: JsonRpcResponse<T>): r is JsonRpcError {
  return 'error' in r;
}

// ---------------------------------------------------------------------------
// FiberClient class
// ---------------------------------------------------------------------------

/**
 * Low-level JSON-RPC 2.0 client for Fiber Network Node.
 * Consumers should use the domain hooks (useChannel, useInvoice, etc.) instead
 * of calling this directly — it is exposed on the context for advanced use only.
 */
export class FiberClient {
  private readonly nodeUrl: string;
  private requestId = 0;

  constructor(nodeUrl: string) {
    this.nodeUrl = nodeUrl;
  }

  /**
   * Send a single JSON-RPC 2.0 request to the FNN node.
   * Throws a typed FiberError on network or RPC-level failure.
   */
  async call<TResult>(
    method: FnnMethod,
    params: unknown = {},
  ): Promise<TResult> {
    const id = ++this.requestId;

    const body: JsonRpcRequest = {
      jsonrpc: '2.0',
      method,
      params,
      id,
    };

    let response: Response;
    try {
      response = await fetch(this.nodeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        // Short timeout — if the node isn't there, fail fast so the provider
        // can fall back to mock mode promptly.
        signal: AbortSignal.timeout(5_000),
      });
    } catch (networkErr) {
      throw buildFiberError(
        'NODE_UNREACHABLE',
        `Network error calling ${method}: ${String(networkErr)}`,
        method,
      );
    }

    if (!response.ok) {
      throw buildFiberError(
        'NODE_UNREACHABLE',
        `HTTP ${response.status} from FNN node calling ${method}`,
        method,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw JSON parse
    const json: JsonRpcResponse<TResult> = (await response.json()) as any;

    if (isJsonRpcError(json)) {
      throw buildFiberError(
        'UNKNOWN',
        json.error.message,
        method,
      );
    }

    return json.result;
  }

  // -------------------------------------------------------------------------
  // Typed method wrappers — one per entry in the RPC mapping table.
  // -------------------------------------------------------------------------

  /** Health check — used by FiberProvider to decide live vs mock mode. */
  nodeInfo(): Promise<NodeInfoResponse> {
    return this.call<NodeInfoResponse>('node_info', {});
  }

  /** List channels, optionally filtered by peer pubkey. */
  listChannels(params: ListChannelsParams = {}): Promise<ListChannelsResponse> {
    return this.call<ListChannelsResponse>('list_channels', params);
  }

  /** Create a new invoice. */
  newInvoice(params: NewInvoiceParams): Promise<NewInvoiceResponse> {
    return this.call<NewInvoiceResponse>('new_invoice', params);
  }

  /** Poll invoice status by payment hash. */
  getInvoice(params: GetInvoiceParams): Promise<GetInvoiceResponse> {
    return this.call<GetInvoiceResponse>('get_invoice', params);
  }

  /**
   * Validate a payment path without committing funds.
   * Always called with `dry_run: true` in this SDK.
   */
  sendPaymentDryRun(
    params: Omit<SendPaymentParams, 'dry_run'>,
  ): Promise<SendPaymentResponse> {
    return this.call<SendPaymentResponse>('send_payment', {
      ...params,
      dry_run: true,
    });
  }

  /** Fetch payment status and route data by hash. */
  getPayment(params: GetPaymentParams): Promise<GetPaymentResponse> {
    return this.call<GetPaymentResponse>('get_payment', params);
  }
}

// ---------------------------------------------------------------------------
// Error helper
// ---------------------------------------------------------------------------

function buildFiberError(
  code: FiberError['code'],
  rawMessage: string,
  rpcMethod: FnnMethod,
): FiberError {
  return { code, rawMessage, rpcMethod };
}

// ---------------------------------------------------------------------------
// Default node URL
// ---------------------------------------------------------------------------

/** Default FNN node URL — matches FNN's documented default. */
export const DEFAULT_NODE_URL = 'http://127.0.0.1:8227';
