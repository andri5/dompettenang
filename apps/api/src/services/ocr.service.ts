/**
 * Dompet Tenang - Receipt OCR (local Tesseract.js)
 * Parses Indonesian-style receipts for amount, date, and merchant hint.
 */

import { createWorker, type Worker } from 'tesseract.js';

export interface ReceiptOcrResult {
  amount: number | null;
  date: string | null;
  description: string | null;
  rawText: string;
  confidence: number | null;
  supported: boolean;
  message?: string;
}

const IMAGE_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/pjpeg',
]);

let workerPromise: Promise<Worker> | null = null;

async function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = (async () => {
      // Writable cache — Docker image runs as non-root `app` (cannot write to /app).
      const cachePath = process.env.TESS_CACHE_DIR || '/tmp/tesseract-cache';
      const worker = await createWorker('eng', 1, { cachePath });
      return worker;
    })().catch((err) => {
      workerPromise = null;
      throw err;
    });
  }
  return workerPromise;
}

/** Parse Rupiah-like numbers: 12.500 / 12,500 / 12500 / Rp12500 */
export function parseIndonesianAmount(raw: string): number | null {
  const cleaned = raw
    .replace(/rp\.?/gi, '')
    .replace(/\s/g, '')
    .replace(/[^\d.,]/g, '');

  if (!cleaned) return null;

  // 12.500.000 or 12,500,000 → thousands separators
  if (/^\d{1,3}([.,]\d{3})+$/.test(cleaned)) {
    const digits = cleaned.replace(/[.,]/g, '');
    const n = Number(digits);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  // 12.50 or 12,50 → decimal
  if (/^\d+[.,]\d{1,2}$/.test(cleaned)) {
    const n = Number(cleaned.replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }

  // plain digits
  if (/^\d+$/.test(cleaned)) {
    const n = Number(cleaned);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  return null;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (year < 1990 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const d = new Date(Date.UTC(year, month - 1, day));
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== month - 1 ||
    d.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}-${day
    .toString()
    .padStart(2, '0')}`;
}

export function parseReceiptDate(text: string): string | null {
  const patterns: Array<{ re: RegExp; map: (m: RegExpMatchArray) => string | null }> = [
    {
      re: /\b(\d{4})[./-](\d{1,2})[./-](\d{1,2})\b/,
      map: (m) => toIsoDate(Number(m[1]), Number(m[2]), Number(m[3])),
    },
    {
      re: /\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/,
      map: (m) => toIsoDate(Number(m[3]), Number(m[2]), Number(m[1])),
    },
    {
      re: /\b(\d{1,2})[./-](\d{1,2})[./-](\d{2})\b/,
      map: (m) => {
        const yy = Number(m[3]);
        const year = yy >= 70 ? 1900 + yy : 2000 + yy;
        return toIsoDate(year, Number(m[2]), Number(m[1]));
      },
    },
  ];

  for (const { re, map } of patterns) {
    const m = text.match(re);
    if (m) {
      const iso = map(m);
      if (iso) return iso;
    }
  }
  return null;
}

function extractCandidateAmounts(text: string): number[] {
  const amounts: number[] = [];
  const amountToken =
    /(?:rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+[.,]\d{1,2}|\d{3,})/gi;
  let m: RegExpExecArray | null;
  while ((m = amountToken.exec(text)) !== null) {
    const n = parseIndonesianAmount(m[0]);
    if (n !== null && n >= 100 && n <= 100_000_000) {
      amounts.push(n);
    }
  }
  return amounts;
}

function pickTotalAmount(text: string): number | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const totalHints =
    /(grand\s*total|total\s*bayar|total\s*harga|jumlah\s*bayar|total\s*tagihan|\btotal\b|amount\s*due|pay\s*amount)/i;

  for (const line of lines) {
    if (!totalHints.test(line)) continue;
    const onLine = extractCandidateAmounts(line);
    if (onLine.length) return Math.max(...onLine);
  }

  // Fallback: largest plausible amount on the receipt
  const all = extractCandidateAmounts(text);
  if (!all.length) return null;
  return Math.max(...all);
}

function pickMerchant(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 3);

  const skip =
    /^(tel|telp|phone|npwp|alamat|address|jl\.|jalan|kasir|struk|receipt|invoice|nota|no\.|tanggal|date|total|subtotal|rp\.?)/i;

  for (const line of lines.slice(0, 8)) {
    if (skip.test(line)) continue;
    if (/^\d+([.,]\d+)*$/.test(line)) continue;
    if (line.length > 60) continue;
    // Prefer lines with letters
    if (!/[a-zA-Z]/.test(line)) continue;
    return line.slice(0, 80);
  }
  return null;
}

/**
 * Pure parser — unit-testable without Tesseract.
 */
export function parseReceiptText(text: string): Omit<ReceiptOcrResult, 'supported' | 'message'> {
  const normalized = text.replace(/\u00a0/g, ' ').trim();
  return {
    amount: pickTotalAmount(normalized),
    date: parseReceiptDate(normalized),
    description: pickMerchant(normalized),
    rawText: normalized,
    confidence: null,
  };
}

export function isOcrImageMime(mimeType: string): boolean {
  return IMAGE_MIME.has(mimeType.toLowerCase());
}

const OCR_TIMEOUT_MS = 45_000;

function emptyOcr(
  supported: boolean,
  message: string
): ReceiptOcrResult {
  return {
    amount: null,
    date: null,
    description: null,
    rawText: '',
    confidence: null,
    supported,
    message,
  };
}

/**
 * Run OCR on a local image file path.
 * Never throws — upload callers can always return the stored file URL.
 */
export async function recognizeReceiptImage(
  filePath: string,
  mimeType: string
): Promise<ReceiptOcrResult> {
  const mime = (mimeType || '').toLowerCase();
  if (!isOcrImageMime(mime) && mime !== 'image/jpg') {
    return emptyOcr(
      false,
      'OCR saat ini mendukung gambar (JPG/PNG/WEBP/GIF). PDF belum dibaca otomatis.'
    );
  }

  try {
    const worker = await getWorker();
    const recognized = await Promise.race([
      worker.recognize(filePath),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('OCR timeout')), OCR_TIMEOUT_MS);
      }),
    ]);

    const text = recognized.data?.text || '';
    const confidence = recognized.data?.confidence;
    const parsed = parseReceiptText(text);
    return {
      ...parsed,
      confidence: typeof confidence === 'number' ? Math.round(confidence) : null,
      supported: true,
      message:
        parsed.amount || parsed.date || parsed.description
          ? 'Hasil scan siap diisi ke form (bisa Anda ubah).'
          : 'Teks terbaca, tapi nominal/tanggal belum terdeteksi. Isi manual saja.',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'OCR gagal';
    return emptyOcr(
      true,
      message === 'OCR timeout'
        ? 'Scan terlalu lama. Struk tetap tersimpan — isi form manual.'
        : `Gagal membaca struk: ${message}`
    );
  }
}
