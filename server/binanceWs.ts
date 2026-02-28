/**
 * Binance WebSocket Proxy Service
 *
 * Connects to Binance's combined mini-ticker stream for all USDT pairs,
 * then broadcasts normalized price updates to connected frontend clients
 * via a local WebSocket server attached to the HTTP server.
 *
 * Architecture:
 *   Binance WS  →  Backend (normalize + aggregate)  →  Frontend WS clients
 *
 * Binance stream: wss://stream.binance.com:9443/ws/!miniTicker@arr
 * This gives us all symbol mini-tickers every ~1s with price, volume, change data.
 */

import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import RawWebSocket from "ws";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface TickerUpdate {
  /** Symbol without USDT suffix, e.g. "BTC" */
  symbol: string;
  /** Current price */
  price: number;
  /** 24h price change percentage */
  change24h: number;
  /** 24h quote volume in USDT */
  volume: number;
  /** 24h high */
  high: number;
  /** 24h low */
  low: number;
  /** Open price */
  open: number;
  /** Timestamp */
  ts: number;
}

/** Binance mini-ticker payload */
interface BinanceMiniTicker {
  e: "24hrMiniTicker";
  E: number; // Event time
  s: string; // Symbol e.g. "BTCUSDT"
  c: string; // Close price
  o: string; // Open price
  h: string; // High price
  l: string; // Low price
  v: string; // Base asset volume
  q: string; // Quote asset volume
}

// ─── State ───────────────────────────────────────────────────────────────────

/** Latest ticker data keyed by base symbol (e.g. "BTC") */
const latestTickers = new Map<string, TickerUpdate>();

/** Symbols we care about (populated from mockData coin list) */
let trackedSymbols: Set<string> | null = null;

let binanceWs: RawWebSocket | null = null;
let wss: WebSocketServer | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let broadcastTimer: ReturnType<typeof setInterval> | null = null;
let isShuttingDown = false;

// ─── Binance Connection ──────────────────────────────────────────────────────

const BINANCE_WS_URL = "wss://stream.binance.com:9443/ws/!miniTicker@arr";
const RECONNECT_DELAY_MS = 3_000;
const MAX_RECONNECT_DELAY_MS = 30_000;
const BROADCAST_INTERVAL_MS = 1_000; // Aggregate and broadcast every 1s
const HEARTBEAT_INTERVAL_MS = 20_000; // 每20秒发送ping
const HEARTBEAT_TIMEOUT_MS = 10_000; // 10秒内未收到pong则重连
let reconnectAttempts = 0;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let heartbeatTimeoutTimer: ReturnType<typeof setTimeout> | null = null;

function clearHeartbeat() {
  if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  if (heartbeatTimeoutTimer) { clearTimeout(heartbeatTimeoutTimer); heartbeatTimeoutTimer = null; }
}

function startHeartbeat() {
  clearHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (binanceWs && binanceWs.readyState === RawWebSocket.OPEN) {
      heartbeatTimeoutTimer = setTimeout(() => {
        console.log("[BinanceWS] Heartbeat timeout, reconnecting...");
        binanceWs?.terminate();
      }, HEARTBEAT_TIMEOUT_MS);
      binanceWs.ping();
    }
  }, HEARTBEAT_INTERVAL_MS);
}

function connectToBinance() {
  if (isShuttingDown) return;

  const delay = Math.min(RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY_MS);
  if (reconnectAttempts > 0) {
    console.log(`[BinanceWS] Reconnecting (attempt ${reconnectAttempts}, delay ${Math.round(delay/1000)}s)...`);
  } else {
    console.log("[BinanceWS] Connecting to Binance stream...");
  }

  binanceWs = new RawWebSocket(BINANCE_WS_URL, { handshakeTimeout: 10000 });

  binanceWs.on("open", () => {
    console.log("[BinanceWS] Connected to Binance mini-ticker stream");
    reconnectAttempts = 0;
    startHeartbeat();
    // 通知所有前端客户端连接已恢复
    broadcastStatus("connected");
  });

  binanceWs.on("pong", () => {
    if (heartbeatTimeoutTimer) { clearTimeout(heartbeatTimeoutTimer); heartbeatTimeoutTimer = null; }
  });

  binanceWs.on("message", (data: RawWebSocket.Data) => {
    try {
      const tickers: BinanceMiniTicker[] = JSON.parse(data.toString());

      for (const t of tickers) {
        // Only process USDT pairs
        if (!t.s.endsWith("USDT")) continue;

        const baseSymbol = t.s.replace("USDT", "");

        // If we have a tracked set, only process those symbols
        if (trackedSymbols && !trackedSymbols.has(baseSymbol)) continue;

        const closePrice = parseFloat(t.c);
        const openPrice = parseFloat(t.o);
        const change24h =
          openPrice > 0
            ? ((closePrice - openPrice) / openPrice) * 100
            : 0;

        latestTickers.set(baseSymbol, {
          symbol: baseSymbol,
          price: closePrice,
          change24h: Math.round(change24h * 100) / 100,
          volume: parseFloat(t.q),
          high: parseFloat(t.h),
          low: parseFloat(t.l),
          open: openPrice,
          ts: t.E,
        });
      }
    } catch {
      // Silently ignore parse errors
    }
  });

  binanceWs.on("close", () => {
    console.log("[BinanceWS] Disconnected from Binance");
    clearHeartbeat();
    broadcastStatus("disconnected");
    scheduleReconnect();
  });

  binanceWs.on("error", (err: Error) => {
    console.error("[BinanceWS] Error:", err.message);
    clearHeartbeat();
    binanceWs?.terminate();
  });
}

function scheduleReconnect() {
  if (isShuttingDown) return;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  const delay = Math.min(RECONNECT_DELAY_MS * Math.pow(1.5, reconnectAttempts), MAX_RECONNECT_DELAY_MS);
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    connectToBinance();
  }, delay);
}

/** 向所有前端客户端广播连接状态 */
function broadcastStatus(status: "connected" | "disconnected") {
  if (!wss) return;
  const payload = JSON.stringify({ type: "status", status, ts: Date.now() });
  Array.from(wss.clients).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try { client.send(payload); } catch { /* ignore */ }
    }
  });
}

// ─── Frontend WebSocket Server ───────────────────────────────────────────────

function broadcastToClients() {
  if (!wss || latestTickers.size === 0) return;

  const updates = Array.from(latestTickers.values());
  const payload = JSON.stringify({
    type: "tickers",
    data: updates,
    ts: Date.now(),
  });

  Array.from(wss.clients).forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Initialize the Binance WebSocket proxy.
 * Attaches a WS server to the given HTTP server on path /ws/market.
 */
export function initBinanceWsProxy(
  httpServer: HttpServer,
  symbols?: string[]
) {
  // Set tracked symbols
  if (symbols && symbols.length > 0) {
    trackedSymbols = new Set(symbols);
    console.log(
      `[BinanceWS] Tracking ${trackedSymbols.size} symbols`
    );
  }

  // Create WebSocket server for frontend clients
  wss = new WebSocketServer({
    server: httpServer,
    path: "/ws/market",
  });

  wss.on("connection", (ws) => {
    console.log(
      `[BinanceWS] Frontend client connected (total: ${wss!.clients.size})`
    );

    // Send current snapshot immediately
    if (latestTickers.size > 0) {
      const snapshot = Array.from(latestTickers.values());
      ws.send(
        JSON.stringify({
          type: "snapshot",
          data: snapshot,
          ts: Date.now(),
        })
      );
    }

    ws.on("close", () => {
      console.log(
        `[BinanceWS] Frontend client disconnected (total: ${wss!.clients.size})`
      );
    });
  });

  // Connect to Binance
  connectToBinance();

  // Start periodic broadcast
  broadcastTimer = setInterval(broadcastToClients, BROADCAST_INTERVAL_MS);

  console.log("[BinanceWS] Proxy initialized on /ws/market");
}

/**
 * Get the latest ticker for a specific symbol
 */
export function getLatestTicker(symbol: string): TickerUpdate | undefined {
  return latestTickers.get(symbol);
}

/**
 * Get all latest tickers
 */
export function getAllTickers(): TickerUpdate[] {
  return Array.from(latestTickers.values());
}

/**
 * Gracefully shut down
 */
export function shutdownBinanceWs() {
  isShuttingDown = true;
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (broadcastTimer) clearInterval(broadcastTimer);
  clearHeartbeat();
  binanceWs?.terminate();
  wss?.close();
}
