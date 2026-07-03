/**
 * Fiberglass React SDK — Public API barrel
 *
 * Every export from the SDK passes through this file.
 * Nothing is re-exported that isn't intentionally public.
 */

// Provider & core hook
export { FiberProvider } from './provider/FiberProvider';
export { useFiberNode } from './hooks/useFiberNode';

// Domain hooks
export { useChannel } from './hooks/useChannel';
export { useConfidence } from './hooks/useConfidence';
export { useInvoice } from './hooks/useInvoice';
export { usePayment } from './hooks/usePayment';

// Components
export { ChannelLifecycleCard } from './components/ChannelLifecycleCard';
export { ConfidenceCheck } from './components/ConfidenceCheck';
export { InvoiceSheet } from './components/InvoiceSheet';
export { ErrorResolutionBanner } from './components/ErrorResolutionBanner';
export { PaymentRouteVisualizer } from './components/PaymentRouteVisualizer';
export { RpcLogViewer } from './components/RpcLogViewer';

// Types
export type {
  // Primitives
  Hash256,
  Pubkey,
  AmountString,

  // RPC method parameter/response shapes
  NodeInfoResponse,
  ListChannelsParams,
  ListChannelsResponse,
  ChannelDetail,
  NewInvoiceParams,
  NewInvoiceResponse,
  GetInvoiceParams,
  GetInvoiceResponse,
  SendPaymentParams,
  SendPaymentResponse,
  GetPaymentParams,
  GetPaymentResponse,
  RouterHop,

  // SDK-level types
  FiberMode,
  ConnectionStatus,
  FiberContextValue,
  FiberError,
  FiberErrorCode,
  InvoiceStatus,
  PaymentStatus,
  ConfidenceStatus,
  ChannelState,

  // Hook return types
  UseChannelResult,
  UseConfidenceResult,
  UseInvoiceResult,
  UsePaymentResult,
} from './lib/rpcClient';
