/**
 * hooks/useFiberNode.ts
 *
 * Returns the FiberContext value — the only way components/hooks
 * should access the client, mode, and connection status.
 * Throws if used outside FiberProvider.
 */

import { useContext } from 'react';
import { FiberContext } from '../provider/FiberProvider';
import type { FiberContextValue } from '../lib/rpcClient';

export function useFiberNode(): FiberContextValue {
  const ctx = useContext(FiberContext);
  if (ctx === null) {
    throw new Error(
      '[Fiberglass] useFiberNode must be used inside <FiberProvider>. ' +
        'Wrap your app (or the component tree that uses Fiberglass) with <FiberProvider>.',
    );
  }
  return ctx;
}
