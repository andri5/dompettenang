import { describe, expect, it } from 'vitest';
import {
  parseIndonesianAmount,
  parseReceiptDate,
  parseReceiptText,
} from '../../services/ocr.service.js';

describe('parseIndonesianAmount', () => {
  it('parses dotted thousands', () => {
    expect(parseIndonesianAmount('Rp 12.500')).toBe(12500);
    expect(parseIndonesianAmount('125.000')).toBe(125000);
  });

  it('parses plain digits', () => {
    expect(parseIndonesianAmount('8500')).toBe(8500);
  });
});

describe('parseReceiptDate', () => {
  it('parses DD/MM/YYYY', () => {
    expect(parseReceiptDate('Tanggal: 03/11/2026')).toBe('2026-11-03');
  });

  it('parses YYYY-MM-DD', () => {
    expect(parseReceiptDate('2026-01-15 Kasir 1')).toBe('2026-01-15');
  });
});

describe('parseReceiptText', () => {
  it('extracts total, date, and merchant from sample receipt', () => {
    const text = `
WARUNG MAKAN SEJAHTERA
Jl. Melati No. 12
Tanggal 03/11/2026
Nasi goreng      18.000
Es teh           5.000
Subtotal        23.000
TOTAL BAYAR     23.000
Terima kasih
`;
    const result = parseReceiptText(text);
    expect(result.amount).toBe(23000);
    expect(result.date).toBe('2026-11-03');
    expect(result.description).toMatch(/WARUNG/i);
  });
});
