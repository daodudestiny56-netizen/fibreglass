/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/components/ChannelLifecycleCard.tsx',
    './src/components/ConfidenceCheck.tsx',
    './src/components/InvoiceSheet.tsx',
    './src/components/ErrorResolutionBanner.tsx',
    './src/components/PaymentRouteVisualizer.tsx',
    './src/components/PaymentLinkReceiver.tsx'
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      }
    }
  },
  plugins: [],
};
