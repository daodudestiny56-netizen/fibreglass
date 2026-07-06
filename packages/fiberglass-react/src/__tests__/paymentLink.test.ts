import { describe, it, expect } from 'vitest';
import { encodePaymentLink, decodePaymentLink, PaymentLinkPayload } from '../lib/paymentLink';

describe('paymentLink utility', () => {
  const validPayload: PaymentLinkPayload = {
    invoiceAddress: 'fibb1qpp5kh8d0k',
    paymentHash: '0x123abc',
    amount: '100000000',
    asset: 'CKB',
    memo: 'optional description'
  };

  it('should encode and decode a valid payload (round-trip)', () => {
    const encoded = encodePaymentLink(validPayload);
    expect(typeof encoded).toBe('string');
    // Ensure it's url-safe (no +, /, or =)
    expect(encoded).not.toMatch(/[+/=]/);
    
    const decoded = decodePaymentLink(encoded);
    expect(decoded).toEqual(validPayload);
  });

  it('should encode and decode correctly without a memo', () => {
    const payloadWithoutMemo: PaymentLinkPayload = {
      invoiceAddress: 'fibb1qpp5kh8d0k',
      paymentHash: '0x123abc',
      amount: '100000000',
      asset: 'CKB'
    };
    
    const encoded = encodePaymentLink(payloadWithoutMemo);
    const decoded = decodePaymentLink(encoded);
    expect(decoded).toEqual(payloadWithoutMemo);
  });

  it('should return null for malformed base64', () => {
    // arbitrary invalid base64 string
    const decoded = decodePaymentLink('not-base64-!@#$');
    expect(decoded).toBeNull();
  });

  it('should return null for non-JSON string', () => {
    const encoded = typeof btoa === 'function' ? btoa('just a regular string') : Buffer.from('just a regular string').toString('base64');
    const decoded = decodePaymentLink(encoded);
    expect(decoded).toBeNull();
  });

  it('should return null if parsed JSON is missing required fields', () => {
    const incompletePayload = {
      invoiceAddress: 'fibb1qpp5kh8d0k',
      amount: '100000000'
      // missing paymentHash and asset
    };
    const encoded = typeof btoa === 'function' ? btoa(JSON.stringify(incompletePayload)) : Buffer.from(JSON.stringify(incompletePayload)).toString('base64');
    const decoded = decodePaymentLink(encoded);
    expect(decoded).toBeNull();
  });

  it('should return null if parsed JSON is not an object', () => {
    const encoded = typeof btoa === 'function' ? btoa(JSON.stringify(['an', 'array'])) : Buffer.from(JSON.stringify(['an', 'array'])).toString('base64');
    const decoded = decodePaymentLink(encoded);
    expect(decoded).toBeNull();
  });
});
