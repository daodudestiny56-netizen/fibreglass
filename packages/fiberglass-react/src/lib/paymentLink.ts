export interface PaymentLinkPayload {
  invoiceAddress: string;
  paymentHash: string;
  amount: string;
  asset: string;
  memo?: string;
}

export function encodePaymentLink(invoice: PaymentLinkPayload): string {
  try {
    const jsonStr = JSON.stringify(invoice);
    // Use btoa if available, else Buffer for Node.js environments
    const base64 = typeof btoa === 'function' ? btoa(jsonStr) : Buffer.from(jsonStr).toString('base64');
    
    // Convert to base64url format
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    throw new Error('Failed to encode payment link');
  }
}

export function decodePaymentLink(encoded: string): PaymentLinkPayload | null {
  try {
    // Convert base64url back to standard base64
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const jsonStr = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString();
    const parsed = JSON.parse(jsonStr);

    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof parsed.invoiceAddress === 'string' &&
      typeof parsed.paymentHash === 'string' &&
      typeof parsed.amount === 'string' &&
      typeof parsed.asset === 'string'
    ) {
      return parsed as PaymentLinkPayload;
    }
    return null;
  } catch (e) {
    return null; // Return null instead of throwing on malformed payloads
  }
}
