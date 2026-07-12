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


export type FiberMode = 'live' | 'mock';

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'error';

export interface RpcLog {
  id: number;
  method: FnnMethod;
  params: unknown;
  timestamp: number;
  response?: unknown;
  error?: string;
}

export interface FiberContextValue {
  /** Low-level RPC call wrapper — prefer the domain hooks. */
  client: FiberClient;
  /** 'live' if the provider reached a real FNN node, 'mock' otherwise. */
  mode: FiberMode;
  /** Current connection lifecycle state. */
  connectionStatus: ConnectionStatus;
  /** The node_info response from the live node, or null in mock mode. */
  nodeInfo: NodeInfoResponse | null;
  /** Recent RPC request and response logs. */
  rpcLogs: RpcLog[];
  /** Base URL for payment links, defaults to window.location.origin */
  appOrigin: string;
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

export type FiberErrorCode =
  | 'INSUFFICIENT_LIQUIDITY'
  | 'NO_ROUTE'
  | 'ASSET_MISMATCH'
  | 'INVOICE_EXPIRED'
  | 'INVOICE_CANCELLED'
  | 'PAYMENT_ALREADY_EXISTS'
  | 'NODE_UNREACHABLE'
  | 'INVALID_INVOICE'
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


export type FnnMethod =
  | 'node_info'
  | 'list_channels'
  | 'new_invoice'
  | 'get_invoice'
  | 'send_payment'
  | 'get_payment';


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

export interface RouterHop {
  /** The target node's pubkey. */
  target: Pubkey;
  /** The channel outpoint used for this hop. */
  channel_outpoint: string;
  /** The amount received at this hop (shannons). */
  amount_received: AmountString;
  /** Expiry for the incoming TLC. */
  incoming_tlc_expiry: string;
  [key: string]: unknown;
}

/**
 * Real get_payment response from FNN.
 * Note: FNN's get_payment does NOT return the route hops array.
 */
export interface GetPaymentResponse {
  payment_hash: Hash256;
  status: PaymentStatus;
  /** Fee paid (shannons). Populated after Success. */
  fee: AmountString | null;
  /**
   * Free-text error string from FNN.
   * This comes from the raw FNN RPC on failure (e.g., synchronous routing failure).
   */
  failed_error: string | null;
  created_at: string;
  last_updated_at: string;
  custom_records: unknown | null;
  [key: string]: unknown;
}


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


/**
 * Low-level JSON-RPC 2.0 client for Fiber Network Node.
 * Consumers should use the domain hooks (useChannel, useInvoice, etc.) instead
 * of calling this directly — it is exposed on the context for advanced use only.
 */
export class FiberClient {
  private readonly nodeUrl: string;
  private requestId = 0;
  public onLog?: ((log: RpcLog) => void) | undefined;

  constructor(nodeUrl: string) {
    this.nodeUrl = nodeUrl;
  }

  /** Log a mock call for the developer panel. */
  logMockCall(method: FnnMethod, params: unknown, response?: unknown, error?: string) {
    this.onLog?.({
      id: ++this.requestId,
      method,
      params,
      timestamp: Date.now(),
      ...(response !== undefined ? { response } : {}),
      ...(error !== undefined ? { error } : {}),
    });
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

    const logEntry: RpcLog = {
      id,
      method,
      params,
      timestamp: Date.now(),
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
      logEntry.error = `Network error: ${String(networkErr)}`;
      this.onLog?.(logEntry);
      throw buildFiberError(
        'NODE_UNREACHABLE',
        `Network error calling ${method}: ${String(networkErr)}`,
        method,
      );
    }

    if (!response.ok) {
      logEntry.error = `HTTP ${response.status}`;
      this.onLog?.(logEntry);
      throw buildFiberError(
        'NODE_UNREACHABLE',
        `HTTP ${response.status} from FNN node calling ${method}`,
        method,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- raw JSON parse
    const json: JsonRpcResponse<TResult> = (await response.json()) as any;

    if (isJsonRpcError(json)) {
      logEntry.error = json.error.message;
      this.onLog?.(logEntry);
      throw buildFiberError(
        'UNKNOWN',
        json.error.message,
        method,
      );
    }

    logEntry.response = json.result;
    this.onLog?.(logEntry);
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


function buildFiberError(
  code: FiberError['code'],
  rawMessage: string,
  rpcMethod: FnnMethod,
): FiberError {
  return { code, rawMessage, rpcMethod };
}


/** Default FNN node URL — matches FNN's documented default. */
export const DEFAULT_NODE_URL = 'http://127.0.0.1:8227';
