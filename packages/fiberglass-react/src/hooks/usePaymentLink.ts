import { useState, useCallback, useContext } from 'react';
import { FiberContext } from '../provider/FiberProvider';
import { encodePaymentLink, decodePaymentLink, PaymentLinkPayload } from '../lib/paymentLink';

export function usePaymentLink(invoice: PaymentLinkPayload | null) {
  const context = useContext(FiberContext);
  const appOrigin = context?.appOrigin ?? (typeof window !== 'undefined' ? window.location.origin : '');
  
  const encoded = invoice ? encodePaymentLink(invoice) : '';
  // Ensure we don't have double slashes if appOrigin has trailing slash
  const baseUrl = appOrigin.endsWith('/') ? appOrigin.slice(0, -1) : appOrigin;
  const url = encoded ? `${baseUrl}/pay/${encoded}` : '';
  
  const [copied, setCopied] = useState(false);
  
  const copy = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          // Fallback if clipboard fails silently
        });
    }
  }, [url]);

  return { url, copy, copied };
}

export function useReadPaymentLink(encoded: string) {
  const payload = decodePaymentLink(encoded);
  
  return {
    payload,
    error: payload ? null : 'This payment link looks broken or incomplete.'
  };
}
