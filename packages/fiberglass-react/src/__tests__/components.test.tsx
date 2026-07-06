/**
 * __tests__/components.test.tsx
 *
 * Automated render tests for all five Fiberglass UI components.
 * Ensures they mount and render without throwing exceptions.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { ChannelLifecycleCard } from '../components/ChannelLifecycleCard';
import { ConfidenceCheck } from '../components/ConfidenceCheck';
import { InvoiceSheet } from '../components/InvoiceSheet';
import { ErrorResolutionBanner } from '../components/ErrorResolutionBanner';
import { PaymentRouteVisualizer } from '../components/PaymentRouteVisualizer';
import { MOCK_LIST_CHANNELS, MOCK_SEND_PAYMENT_DRY_RUN } from '../lib/mockFixtures';
import type { FiberError, Hash256 } from '../lib/rpcClient';

import { FiberContext } from '../provider/FiberProvider';
import { FiberClient } from '../lib/rpcClient';

const mockContextValue = {
  client: new FiberClient('http://mock-node'),
  mode: 'mock' as const,
  connectionStatus: 'disconnected' as const,
  nodeInfo: null,
  rpcLogs: [],
  appOrigin: 'http://localhost',
};

function renderWithProvider(ui: React.ReactElement) {
  return render(
    React.createElement(FiberContext.Provider, { value: mockContextValue }, ui)
  );
}


describe('UI Components Render Tests', () => {
  describe('<ChannelLifecycleCard>', () => {
    it('renders channel details correctly', () => {
      const channel = MOCK_LIST_CHANNELS.channels[0]!;
      renderWithProvider(<ChannelLifecycleCard channel={channel} />);
      expect(screen.getByText(/Channel/i)).toBeDefined();
      expect(screen.getByText(/Local Balance/i)).toBeDefined();
    });

    it('renders empty message if channel not found', () => {
      renderWithProvider(<ChannelLifecycleCard channelId="0xnonexistent" />);
      expect(screen.getByText(/not found/i)).toBeDefined();
    });
  });

  describe('<ConfidenceCheck>', () => {
    it('renders confidence status correctly', () => {
      renderWithProvider(
        <ConfidenceCheck
          status="ready"
          fee="1200"
          route={MOCK_SEND_PAYMENT_DRY_RUN.router}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.getByText(/Route found/i)).toBeDefined();
      expect(screen.getByText(/Estimated Fee/i)).toBeDefined();
    });

    it('uses custom renderStatus if provided', () => {
      renderWithProvider(
        <ConfidenceCheck
          status="ready"
          fee="1200"
          route={MOCK_SEND_PAYMENT_DRY_RUN.router}
          isLoading={false}
          error={null}
          renderStatus={(status) => `Custom status: ${status}`}
        />
      );
      expect(screen.getByText(/Custom status: ready/i)).toBeDefined();
    });
  });

  describe('<InvoiceSheet>', () => {
    it('renders open invoice details and copy button', () => {
      renderWithProvider(
        <InvoiceSheet
          invoiceAddress="fibb1qtest"
          paymentHash={'0xabc' as Hash256}
          invoiceStatus="Open"
          expiresAt={new Date(Date.now() + 100000)}
          isLoading={false}
          error={null}
        />
      );
      expect(screen.getByText(/Receive Payment/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Copy Invoice/i })).toBeDefined();
    });
  });

  describe('<ErrorResolutionBanner>', () => {
    it('renders structured error messages and retry button', () => {
      const mockError: FiberError = {
        code: 'INSUFFICIENT_LIQUIDITY',
        rawMessage: 'insufficient outbound liquidity on channel',
        rpcMethod: 'send_payment',
      };
      const handleRetry = () => {};
      render(
        <ErrorResolutionBanner
          error={mockError}
          retry={handleRetry}
        />
      );
      expect(screen.getByText(/Insufficient Liquidity/i)).toBeDefined();
      expect(screen.getByRole('button', { name: /Retry/i })).toBeDefined();
    });
  });

  describe('<PaymentRouteVisualizer>', () => {
    it('renders horizontal hop pipeline correctly', () => {
      renderWithProvider(
        <PaymentRouteVisualizer
          hops={MOCK_SEND_PAYMENT_DRY_RUN.router}
          paymentStatus="Success"
          totalFee="1200"
        />
      );
      expect(screen.getByText(/Payment Route/i)).toBeDefined();
      expect(screen.getByText(/Total Fee/i)).toBeDefined();
    });
  });
});
