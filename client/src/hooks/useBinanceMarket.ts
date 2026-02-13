/**
 * useBinanceMarket - Frontend WebSocket hook for real-time Binance market data
 *
 * Supports two modes:
 * 1. Backend proxy mode: connects to /ws/market (when backend is available)
 * 2. Direct Binance mode: connects to wss://stream.binance.com (static deployment)
 *
 * Features:
 * - Auto-detect mode: tries backend proxy first, falls back to direct Binance
 * - Auto-reconnect with exponential backoff
 * - Connection status tracking
 * - Merges real-time data into the allCoins mock data structure
 * - Throttled notifications to reduce re-renders
 * - Auto-disconnect when no listeners remain
 */

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Coin } from "@/lib/mockData";
import { allCoins as staticCoins } from "@/lib/mockData";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TickerUpdate {
  symbol: string;
  price: number;
  change24h: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  ts: number;
}

export type WsStatus = "connecting" | "connected" | "disconnected" | "error";

interface WsMessage {
  type: "tickers" | "snapshot";
  data: TickerUpdate[];
  ts: number;
}

/** Binance miniTicker raw message item */
interface BinanceMiniTickerItem {
  s: string;  // symbol
  c: string;  // close price
  o: string;  // open price
  h: string;  // high price
  l: string;  // low price
  v: string;  // base asset volume
  E?: number; // event time
}

// ─── Singleton Connection ────────────────────────────────────────────────────

let globalWs: WebSocket | null = null;
let globalStatus: WsStatus = "disconnected";
let globalTickers = new Map<string, TickerUpdate>();
let listeners = new Set<() => void>();
let reconnectAttempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let notifyThrottleTimer: ReturnType<typeof setTimeout> | null = null;
const MAX_RECONNECT_DELAY = 30_000;
const NOTIFY_THROTTLE_MS = 200; // Throttle notifications to max 5/sec
let useDirectBinance = true; // Force direct Binance connection for static deployment
let pendingNotify = false;

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

/**
 * Throttled notification — batches rapid updates to reduce React re-renders.
 * Status changes are notified immediately; ticker data updates are throttled.
 */
function notifyListenersThrottled() {
  pendingNotify = true;
  if (notifyThrottleTimer) return; // Already scheduled
  notifyThrottleTimer = setTimeout(() => {
    notifyThrottleTimer = null;
    if (pendingNotify) {
      pendingNotify = false;
      notifyListeners();
    }
  }, NOTIFY_THROTTLE_MS);
}

/**
 * Get WebSocket URL - tries backend proxy first, falls back to direct Binance
 */
function getBackendWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws/market`;
}

const BINANCE_DIRECT_URL = "wss://stream.binance.com:9443/ws/!miniTicker@arr";

/**
 * Parse Binance direct miniTicker array message
 */
function parseBinanceMiniTicker(data: BinanceMiniTickerItem[]): TickerUpdate[] {
  const updates: TickerUpdate[] = [];
  for (const item of data) {
    // Only process USDT pairs
    if (!item.s || !item.s.endsWith("USDT")) continue;
    const symbol = item.s.replace("USDT", "");
    const price = parseFloat(item.c);
    const open = parseFloat(item.o);
    const high = parseFloat(item.h);
    const low = parseFloat(item.l);
    const volume = parseFloat(item.v);
    const change24h = open > 0 ? ((price - open) / open) * 100 : 0;

    updates.push({
      symbol,
      price,
      change24h,
      volume,
      high,
      low,
      open,
      ts: item.E || Date.now(),
    });
  }
  return updates;
}

function applyTickerUpdates(updates: TickerUpdate[]) {
  for (const t of updates) {
    globalTickers.set(t.symbol, t);
  }
  // Create new Map reference for React change detection
  globalTickers = new Map(globalTickers);
  notifyListenersThrottled();
}

function connectDirect() {
  if (globalWs?.readyState === WebSocket.OPEN || globalWs?.readyState === WebSocket.CONNECTING) {
    return;
  }

  globalStatus = "connecting";
  notifyListeners(); // Status changes are immediate

  try {
    globalWs = new WebSocket(BINANCE_DIRECT_URL);
  } catch {
    globalStatus = "error";
    notifyListeners();
    scheduleReconnect();
    return;
  }

  globalWs.onopen = () => {
    globalStatus = "connected";
    reconnectAttempts = 0;
    notifyListeners();
  };

  globalWs.onmessage = (event) => {
    try {
      const raw = JSON.parse(event.data);
      if (Array.isArray(raw)) {
        const updates = parseBinanceMiniTicker(raw);
        applyTickerUpdates(updates);
      }
    } catch {
      // Ignore parse errors
    }
  };

  globalWs.onclose = () => {
    globalStatus = "disconnected";
    globalWs = null;
    notifyListeners();
    scheduleReconnect();
  };

  globalWs.onerror = () => {
    globalStatus = "error";
    notifyListeners();
  };
}

function connectBackend() {
  if (globalWs?.readyState === WebSocket.OPEN || globalWs?.readyState === WebSocket.CONNECTING) {
    return;
  }

  globalStatus = "connecting";
  notifyListeners();

  try {
    globalWs = new WebSocket(getBackendWsUrl());
  } catch {
    // Backend proxy not available, switch to direct Binance
    useDirectBinance = true;
    connectDirect();
    return;
  }

  // If backend WS doesn't connect within 3 seconds, fall back to direct
  const fallbackTimer = setTimeout(() => {
    if (globalWs && globalWs.readyState !== WebSocket.OPEN) {
      globalWs.close();
      useDirectBinance = true;
      connectDirect();
    }
  }, 3000);

  globalWs.onopen = () => {
    clearTimeout(fallbackTimer);
    globalStatus = "connected";
    reconnectAttempts = 0;
    notifyListeners();
  };

  globalWs.onmessage = (event) => {
    try {
      const msg: WsMessage = JSON.parse(event.data);
      if (msg.type === "tickers" || msg.type === "snapshot") {
        applyTickerUpdates(msg.data);
      }
    } catch {
      // Ignore parse errors
    }
  };

  globalWs.onclose = () => {
    clearTimeout(fallbackTimer);
    globalStatus = "disconnected";
    globalWs = null;
    notifyListeners();
    // If backend was never successfully connected, switch to direct
    if (reconnectAttempts >= 2) {
      useDirectBinance = true;
    }
    scheduleReconnect();
  };

  globalWs.onerror = () => {
    clearTimeout(fallbackTimer);
    globalStatus = "error";
    notifyListeners();
  };
}

function connect() {
  if (useDirectBinance) {
    connectDirect();
  } else {
    connectBackend();
  }
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (notifyThrottleTimer) {
    clearTimeout(notifyThrottleTimer);
    notifyThrottleTimer = null;
  }
  if (globalWs) {
    globalWs.onclose = null; // Prevent reconnect on intentional close
    globalWs.onerror = null;
    globalWs.close();
    globalWs = null;
  }
  globalStatus = "disconnected";
  reconnectAttempts = 0;
}

function scheduleReconnect() {
  // Don't reconnect if no listeners
  if (listeners.size === 0) {
    disconnect();
    return;
  }
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), MAX_RECONNECT_DELAY);
  reconnectAttempts++;
  reconnectTimer = setTimeout(connect, delay);
}

function ensureConnection() {
  if (!globalWs || globalWs.readyState === WebSocket.CLOSED) {
    connect();
  }
}

// ─── React Hook ──────────────────────────────────────────────────────────────

/**
 * Subscribe to real-time market data.
 * Returns the current tickers map and connection status.
 * Auto-connects on first subscriber, auto-disconnects when last subscriber leaves.
 */
export function useBinanceMarket() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((n) => n + 1);
    listeners.add(listener);
    ensureConnection();

    return () => {
      listeners.delete(listener);
      // Auto-disconnect when no listeners remain
      if (listeners.size === 0) {
        // Delay disconnect slightly to handle rapid mount/unmount (e.g. React StrictMode)
        setTimeout(() => {
          if (listeners.size === 0) {
            disconnect();
          }
        }, 1000);
      }
    };
  }, []);

  return {
    tickers: globalTickers,
    status: globalStatus as WsStatus,
    tickerCount: globalTickers.size,
  };
}

/**
 * Get allCoins merged with real-time prices.
 * Static coin data (category, aiSignal, etc.) is preserved,
 * but price, change24h, and volume are replaced with live data.
 */
export function useLiveCoins(): {
  coins: Coin[];
  status: WsStatus;
  liveCount: number;
} {
  const { tickers, status } = useBinanceMarket();

  const coins = useMemo(() => {
    return staticCoins.map((coin) => {
      const live = tickers.get(coin.symbol);
      if (!live) return coin;

      return {
        ...coin,
        price: live.price,
        change24h: live.change24h,
        volume: live.volume,
      };
    });
  }, [tickers]);

  const liveCount = useMemo(() => {
    let count = 0;
    for (const coin of staticCoins) {
      if (tickers.has(coin.symbol)) count++;
    }
    return count;
  }, [tickers]);

  return { coins, status, liveCount };
}

/**
 * Get a single coin's live ticker data
 */
export function useLiveTicker(symbol: string): TickerUpdate | null {
  const { tickers } = useBinanceMarket();
  return tickers.get(symbol) ?? null;
}
