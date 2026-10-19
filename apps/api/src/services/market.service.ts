/**
 * Market quotes — USD/IDR + gold (Antam 1g) + BI Rate + IHSG
 * Cached in-memory to avoid hammering upstream APIs.
 */

type UsdQuote = {
  rate: number;
  updatedAt: string;
  source: string;
};

type GoldQuote = {
  sellPerGram: number;
  buybackPerGram: number;
  label: string;
  updatedAt: string;
  source: string;
};

type BiRateQuote = {
  rate: number;
  percentLabel: string;
  effectiveDate: string;
  updatedAt: string;
  source: string;
};

type IhsgQuote = {
  value: number;
  change: number;
  changePct: number;
  changePctLabel: string;
  updatedAt: string;
  source: string;
};

export type MarketQuotes = {
  usdIdr: UsdQuote;
  gold: GoldQuote;
  biRate: BiRateQuote | null;
  ihsg: IhsgQuote | null;
  fetchedAt: string;
};

type CacheEntry = {
  data: MarketQuotes;
  expiresAt: number;
};

const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const USD_URL = 'https://open.er-api.com/v6/latest/USD';
const GOLD_URL = 'https://logam-mulia-api.iamutaki.workers.dev/api/prices/anekalogam';
const BI_RATE_URL = 'https://bi-rate.vercel.app/api/bi-rate?startPage=1&endPage=1';
const IHSG_URLS = [
  'https://query1.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=1d&range=5d',
  'https://query2.finance.yahoo.com/v8/finance/chart/%5EJKSE?interval=1d&range=5d',
] as const;

/** Yahoo often rejects bare Node fetch (esp. from VPS); send a browser-like UA. */
const YAHOO_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
};

let cache: CacheEntry | null = null;

type GoldRow = {
  material?: string;
  materialType?: string;
  weight?: number;
  sellPrice?: number;
  buybackPrice?: number;
  recordedDate?: string;
  displayName?: string;
};

function pickAntamOneGram(rows: GoldRow[]): GoldRow | null {
  const oneGram = rows.filter(
    (row) =>
      row.material === 'gold' &&
      row.weight === 1 &&
      typeof row.sellPrice === 'number' &&
      typeof row.buybackPrice === 'number'
  );

  if (!oneGram.length) return null;

  const preferred =
    oneGram.find(
      (row) =>
        /antam/i.test(row.materialType || '') &&
        !/100\s*gram/i.test(row.materialType || '')
    ) || oneGram[0];

  return preferred;
}

async function fetchUsdIdr(): Promise<UsdQuote> {
  const response = await fetch(USD_URL);
  if (!response.ok) {
    throw new Error(`USD rate upstream failed (${response.status})`);
  }

  const json = (await response.json()) as {
    result?: string;
    rates?: { IDR?: number };
    time_last_update_utc?: string;
    provider?: string;
  };

  const rate = json.rates?.IDR;
  if (!rate || !Number.isFinite(rate)) {
    throw new Error('USD/IDR rate missing from upstream');
  }

  return {
    rate: Math.round(rate * 100) / 100,
    updatedAt: json.time_last_update_utc || new Date().toISOString(),
    source: 'ExchangeRate-API',
  };
}

async function fetchGold(): Promise<GoldQuote> {
  const response = await fetch(GOLD_URL);
  if (!response.ok) {
    throw new Error(`Gold price upstream failed (${response.status})`);
  }

  const json = (await response.json()) as {
    success?: boolean;
    data?: GoldRow[];
    timestamp?: string;
  };

  if (!json.success || !Array.isArray(json.data)) {
    throw new Error('Gold price payload invalid');
  }

  const row = pickAntamOneGram(json.data);
  if (!row?.sellPrice || !row.buybackPrice) {
    throw new Error('Antam 1g price not found');
  }

  return {
    sellPerGram: row.sellPrice,
    buybackPerGram: row.buybackPrice,
    label: 'Antam 1 gram',
    updatedAt: row.recordedDate || json.timestamp || new Date().toISOString(),
    source: row.displayName || 'Aneka Logam',
  };
}

async function fetchBiRate(): Promise<BiRateQuote> {
  const response = await fetch(BI_RATE_URL);
  if (!response.ok) {
    throw new Error(`BI Rate upstream failed (${response.status})`);
  }

  const json = (await response.json()) as {
    success?: boolean;
    data?: Array<{ tanggal?: string; rate?: string }>;
  };

  const latest = json.success && Array.isArray(json.data) ? json.data[0] : null;
  if (!latest?.rate) {
    throw new Error('BI Rate missing from upstream');
  }

  const percentLabel = String(latest.rate).trim();
  const numeric = Number.parseFloat(percentLabel.replace('%', '').trim());
  if (!Number.isFinite(numeric)) {
    throw new Error('BI Rate value invalid');
  }

  return {
    rate: numeric,
    percentLabel: percentLabel.includes('%') ? percentLabel : `${percentLabel} %`,
    effectiveDate: latest.tanggal || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: 'Bank Indonesia',
  };
}

type YahooChartResult = {
  meta?: {
    regularMarketPrice?: number;
    fulldayPrice?: number;
    chartPreviousClose?: number;
    previousClose?: number;
    regularMarketTime?: number;
    regularMarketChange?: number;
    fulldayChange?: number;
    regularMarketChangePercent?: number;
    fulldayChangePercent?: number;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      close?: Array<number | null>;
    }>;
  };
};

function finiteNumber(...candidates: Array<number | undefined>): number {
  for (const n of candidates) {
    if (typeof n === 'number' && Number.isFinite(n)) return n;
  }
  return NaN;
}

function parseIhsgFromChart(result: YahooChartResult): IhsgQuote {
  const meta = result.meta ?? {};
  const closes = result.indicators?.quote?.[0]?.close ?? [];

  let value = finiteNumber(meta.regularMarketPrice, meta.fulldayPrice);
  let changePct = finiteNumber(meta.regularMarketChangePercent, meta.fulldayChangePercent);
  let change = finiteNumber(meta.regularMarketChange, meta.fulldayChange);

  // Fallback: last two finite daily closes (helps when meta is incomplete)
  if (!Number.isFinite(value) || !Number.isFinite(changePct)) {
    let lastIdx = -1;
    let prevIdx = -1;
    for (let i = 0; i < closes.length; i++) {
      const v = closes[i];
      if (typeof v === 'number' && Number.isFinite(v)) {
        prevIdx = lastIdx;
        lastIdx = i;
      }
    }
    if (lastIdx < 0) {
      throw new Error('IHSG close not found');
    }
    if (!Number.isFinite(value)) value = Number(closes[lastIdx]);
    const prev = prevIdx >= 0 ? Number(closes[prevIdx]) : value;
    if (!Number.isFinite(change)) change = value - prev;
    if (!Number.isFinite(changePct)) {
      changePct = prev !== 0 ? (change / prev) * 100 : 0;
    }
  }

  if (!Number.isFinite(change)) {
    // Prefer % from meta over chartPreviousClose delta (index level can re-base)
    change = 0;
  }

  const changePctLabel = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`;
  const ts = meta.regularMarketTime;
  const updatedAt =
    typeof ts === 'number' ? new Date(ts * 1000).toISOString() : new Date().toISOString();

  return {
    value,
    change,
    changePct,
    changePctLabel,
    updatedAt,
    source: 'Yahoo Finance ^JKSE',
  };
}

async function fetchIhsg(): Promise<IhsgQuote> {
  let lastError: Error | null = null;

  for (const url of IHSG_URLS) {
    try {
      const response = await fetch(url, { headers: YAHOO_HEADERS });
      if (!response.ok) {
        throw new Error(`IHSG upstream failed (${response.status})`);
      }

      const json = (await response.json()) as {
        chart?: { result?: YahooChartResult[] };
      };
      const result = json.chart?.result?.[0];
      if (!result) {
        throw new Error('IHSG payload invalid');
      }
      return parseIhsgFromChart(result);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }

  throw lastError ?? new Error('IHSG upstream failed');
}

export class MarketService {
  async getQuotes(): Promise<MarketQuotes> {
    if (cache && Date.now() < cache.expiresAt) {
      return cache.data;
    }

    const [usdResult, goldResult, biResult, ihsgResult] = await Promise.allSettled([
      fetchUsdIdr(),
      fetchGold(),
      fetchBiRate(),
      fetchIhsg(),
    ]);

    if (usdResult.status !== 'fulfilled' || goldResult.status !== 'fulfilled') {
      const reason =
        usdResult.status === 'rejected'
          ? usdResult.reason
          : goldResult.status === 'rejected'
            ? goldResult.reason
            : new Error('Market quotes failed');
      throw reason instanceof Error ? reason : new Error(String(reason));
    }

    const data: MarketQuotes = {
      usdIdr: usdResult.value,
      gold: goldResult.value,
      biRate: biResult.status === 'fulfilled' ? biResult.value : null,
      ihsg: ihsgResult.status === 'fulfilled' ? ihsgResult.value : null,
      fetchedAt: new Date().toISOString(),
    };

    // Shorter cache when optional quotes fail so IHSG/BI can recover without waiting 30m
    const ttl =
      data.ihsg && data.biRate ? CACHE_TTL_MS : Math.min(CACHE_TTL_MS, 5 * 60 * 1000);
    cache = { data, expiresAt: Date.now() + ttl };
    return data;
  }
}

export const marketService = new MarketService();
