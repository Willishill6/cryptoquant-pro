/**
 * KlineChart - Professional K-line (candlestick) chart component
 * Built with TradingView Lightweight Charts v5
 * Features: multi-timeframe, technical indicators (MA/EMA/BOLL), volume, crosshair, responsive
 * Design: Cyberpunk terminal dark theme
 */
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  type Time,
  ColorType,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from "lightweight-charts";

// ─── Types ───────────────────────────────────────────────────────
export type TimeFrame = "1m" | "5m" | "15m" | "1h" | "4h" | "1d" | "1w";
export type Indicator = "MA" | "EMA" | "BOLL" | "VOL";

interface KlineChartProps {
  symbol?: string;
  initialTimeFrame?: TimeFrame;
  height?: number;
  className?: string;
}

interface CandleDataPoint {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ─── Data Generation ─────────────────────────────────────────────
const COIN_BASE_PRICES: Record<string, number> = {
  "BTC/USDT": 98500, "ETH/USDT": 3840, "BNB/USDT": 625, "SOL/USDT": 187,
  "XRP/USDT": 2.45, "ADA/USDT": 0.82, "DOT/USDT": 8.95, "AVAX/USDT": 42.3,
  "MATIC/USDT": 1.25, "LINK/USDT": 18.75, "DOGE/USDT": 0.185, "SHIB/USDT": 0.0000285,
};

function generateCandleData(symbol: string, timeFrame: TimeFrame, count: number = 200): CandleDataPoint[] {
  const basePrice = COIN_BASE_PRICES[symbol] || 100;
  const data: CandleDataPoint[] = [];
  const now = Math.floor(Date.now() / 1000);

  const intervalMap: Record<TimeFrame, number> = {
    "1m": 60, "5m": 300, "15m": 900, "1h": 3600,
    "4h": 14400, "1d": 86400, "1w": 604800,
  };
  const interval = intervalMap[timeFrame];

  // Volatility scales with timeframe
  const volatilityMap: Record<TimeFrame, number> = {
    "1m": 0.001, "5m": 0.002, "15m": 0.004, "1h": 0.008,
    "4h": 0.015, "1d": 0.03, "1w": 0.06,
  };
  const volatility = volatilityMap[timeFrame];

  let price = basePrice * (1 + (Math.random() - 0.5) * 0.1);

  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i) * interval;
    const trend = Math.sin(i / 30) * volatility * 0.5;
    const change = (Math.random() - 0.48 + trend) * volatility;

    const open = price;
    const close = open * (1 + change);
    const highExtra = Math.abs(change) * (0.5 + Math.random());
    const lowExtra = Math.abs(change) * (0.5 + Math.random());
    const high = Math.max(open, close) * (1 + highExtra);
    const low = Math.min(open, close) * (1 - lowExtra);

    // Volume: higher on big moves, with random spikes
    const moveSize = Math.abs(close - open) / open;
    const volumeBase = basePrice > 1000 ? 50 + Math.random() * 200 : 50000 + Math.random() * 200000;
    const volume = volumeBase * (1 + moveSize * 20) * (Math.random() > 0.95 ? 3 : 1);

    data.push({
      time: timestamp as Time,
      open: parseFloat(open.toPrecision(6)),
      high: parseFloat(high.toPrecision(6)),
      low: parseFloat(low.toPrecision(6)),
      close: parseFloat(close.toPrecision(6)),
      volume: Math.round(volume),
    });

    price = close;
  }

  return data;
}

// ─── Technical Indicator Calculations ────────────────────────────
function calcMA(data: CandleDataPoint[], period: number) {
  return data.map((d, i) => {
    if (i < period - 1) return { time: d.time, value: NaN };
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((s, c) => s + c.close, 0) / period;
    return { time: d.time, value: parseFloat(avg.toPrecision(6)) };
  }).filter(d => !isNaN(d.value));
}

function calcEMA(data: CandleDataPoint[], period: number) {
  const k = 2 / (period + 1);
  const result: { time: Time; value: number }[] = [];
  let ema = data.slice(0, period).reduce((s, c) => s + c.close, 0) / period;

  for (let i = period - 1; i < data.length; i++) {
    if (i === period - 1) {
      result.push({ time: data[i].time, value: parseFloat(ema.toPrecision(6)) });
    } else {
      ema = data[i].close * k + ema * (1 - k);
      result.push({ time: data[i].time, value: parseFloat(ema.toPrecision(6)) });
    }
  }
  return result;
}

function calcBOLL(data: CandleDataPoint[], period: number = 20, multiplier: number = 2) {
  const upper: { time: Time; value: number }[] = [];
  const middle: { time: Time; value: number }[] = [];
  const lower: { time: Time; value: number }[] = [];

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const avg = slice.reduce((s, c) => s + c.close, 0) / period;
    const stdDev = Math.sqrt(slice.reduce((s, c) => s + Math.pow(c.close - avg, 2), 0) / period);

    middle.push({ time: data[i].time, value: parseFloat(avg.toPrecision(6)) });
    upper.push({ time: data[i].time, value: parseFloat((avg + multiplier * stdDev).toPrecision(6)) });
    lower.push({ time: data[i].time, value: parseFloat((avg - multiplier * stdDev).toPrecision(6)) });
  }

  return { upper, middle, lower };
}

// ─── Chart Theme ─────────────────────────────────────────────────
const CHART_THEME = {
  background: "#0a0e17",
  textColor: "#8892a4",
  gridColor: "rgba(255, 255, 255, 0.03)",
  crosshairColor: "#00d4ff",
  upColor: "#00ff88",
  downColor: "#ff3388",
  upWickColor: "#00ff88",
  downWickColor: "#ff3388",
  volumeUpColor: "rgba(0, 255, 136, 0.25)",
  volumeDownColor: "rgba(255, 51, 136, 0.25)",
  maColors: {
    ma7: "#f5a623",
    ma25: "#00d4ff",
    ma99: "#ff3388",
  },
  emaColors: {
    ema12: "#f5a623",
    ema26: "#00d4ff",
    ema50: "#ff3388",
  },
  bollColors: {
    upper: "rgba(255, 51, 136, 0.6)",
    middle: "rgba(0, 212, 255, 0.8)",
    lower: "rgba(0, 255, 136, 0.6)",
  },
};

// ─── Component ───────────────────────────────────────────────────
export default function KlineChart({
  symbol = "BTC/USDT",
  initialTimeFrame = "1h",
  height = 500,
  className = "",
}: KlineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const indicatorSeriesRef = useRef<ISeriesApi<"Line">[]>([]);

  const [timeFrame, setTimeFrame] = useState<TimeFrame>(initialTimeFrame);
  const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(() => new Set<Indicator>(["MA", "VOL"]));
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [highPrice, setHighPrice] = useState<number>(0);
  const [lowPrice, setLowPrice] = useState<number>(0);
  const [volume24h, setVolume24h] = useState<number>(0);

  const candleData = useMemo(
    () => generateCandleData(currentSymbol, timeFrame, 200),
    [currentSymbol, timeFrame]
  );

  const timeFrames: { label: string; value: TimeFrame }[] = [
    { label: "1分", value: "1m" },
    { label: "5分", value: "5m" },
    { label: "15分", value: "15m" },
    { label: "1时", value: "1h" },
    { label: "4时", value: "4h" },
    { label: "日线", value: "1d" },
    { label: "周线", value: "1w" },
  ];

  const indicatorOptions: { label: string; value: Indicator; desc: string }[] = [
    { label: "MA", value: "MA", desc: "移动平均线 (7/25/99)" },
    { label: "EMA", value: "EMA", desc: "指数移动平均 (12/26/50)" },
    { label: "BOLL", value: "BOLL", desc: "布林带 (20,2)" },
    { label: "VOL", value: "VOL", desc: "成交量" },
  ];

  const availableSymbols = useMemo(() => Object.keys(COIN_BASE_PRICES), []);

  const toggleIndicator = useCallback((ind: Indicator) => {
    setActiveIndicators(prev => {
      const next = new Set(prev);
      if (next.has(ind)) next.delete(ind);
      else next.add(ind);
      return next;
    });
  }, []);

  // Update price stats from data
  useEffect(() => {
    if (candleData.length > 0) {
      const last = candleData[candleData.length - 1];
      const first = candleData[0];
      setLastPrice(last.close);
      setPriceChange(((last.close - first.open) / first.open) * 100);
      setHighPrice(Math.max(...candleData.map(d => d.high)));
      setLowPrice(Math.min(...candleData.map(d => d.low)));
      setVolume24h(candleData.slice(-24).reduce((s, d) => s + d.volume, 0));
    }
  }, [candleData]);

  // Create & update chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current = [];
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: height,
      layout: {
        background: { type: ColorType.Solid, color: CHART_THEME.background },
        textColor: CHART_THEME.textColor,
        fontFamily: "'JetBrains Mono', 'Space Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: CHART_THEME.gridColor },
        horzLines: { color: CHART_THEME.gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: CHART_THEME.crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#0d1520",
        },
        horzLine: {
          color: CHART_THEME.crosshairColor,
          width: 1,
          style: LineStyle.Dashed,
          labelBackgroundColor: "#0d1520",
        },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.08)",
        scaleMargins: { top: 0.1, bottom: activeIndicators.has("VOL") ? 0.25 : 0.05 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.08)",
        timeVisible: timeFrame === "1m" || timeFrame === "5m" || timeFrame === "15m" || timeFrame === "1h",
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    chartRef.current = chart;

    // ── Candlestick Series ──
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: CHART_THEME.upColor,
      downColor: CHART_THEME.downColor,
      wickUpColor: CHART_THEME.upWickColor,
      wickDownColor: CHART_THEME.downWickColor,
      borderVisible: false,
    });
    candleSeries.setData(candleData.map(d => ({
      time: d.time, open: d.open, high: d.high, low: d.low, close: d.close,
    })));
    candleSeriesRef.current = candleSeries;

    // ── Volume Histogram ──
    if (activeIndicators.has("VOL")) {
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeries.setData(candleData.map(d => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? CHART_THEME.volumeUpColor : CHART_THEME.volumeDownColor,
      })));
      volumeSeriesRef.current = volumeSeries;
    }

    // ── MA Lines ──
    if (activeIndicators.has("MA")) {
      const periods = [7, 25, 99];
      const colors = [CHART_THEME.maColors.ma7, CHART_THEME.maColors.ma25, CHART_THEME.maColors.ma99];
      periods.forEach((period, idx) => {
        const maData = calcMA(candleData, period);
        const maSeries = chart.addSeries(LineSeries, {
          color: colors[idx],
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        maSeries.setData(maData);
        indicatorSeriesRef.current.push(maSeries);
      });
    }

    // ── EMA Lines ──
    if (activeIndicators.has("EMA")) {
      const periods = [12, 26, 50];
      const colors = [CHART_THEME.emaColors.ema12, CHART_THEME.emaColors.ema26, CHART_THEME.emaColors.ema50];
      periods.forEach((period, idx) => {
        const emaData = calcEMA(candleData, period);
        const emaSeries = chart.addSeries(LineSeries, {
          color: colors[idx],
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false,
        });
        emaSeries.setData(emaData);
        indicatorSeriesRef.current.push(emaSeries);
      });
    }

    // ── Bollinger Bands ──
    if (activeIndicators.has("BOLL")) {
      const boll = calcBOLL(candleData);
      const upperSeries = chart.addSeries(LineSeries, {
        color: CHART_THEME.bollColors.upper,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      upperSeries.setData(boll.upper);
      indicatorSeriesRef.current.push(upperSeries);

      const middleSeries = chart.addSeries(LineSeries, {
        color: CHART_THEME.bollColors.middle,
        lineWidth: 1,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      middleSeries.setData(boll.middle);
      indicatorSeriesRef.current.push(middleSeries);

      const lowerSeries = chart.addSeries(LineSeries, {
        color: CHART_THEME.bollColors.lower,
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      lowerSeries.setData(boll.lower);
      indicatorSeriesRef.current.push(lowerSeries);
    }

    // Fit content
    chart.timeScale().fitContent();

    // ── Resize Observer ──
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        chart.applyOptions({ width });
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      indicatorSeriesRef.current = [];
    };
  }, [candleData, activeIndicators, height, timeFrame]);

  // Format price display
  const formatPrice = (p: number | null) => {
    if (p === null) return "—";
    if (p >= 1000) return p.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (p >= 1) return p.toFixed(4);
    return p.toPrecision(4);
  };

  return (
    <div className={`rounded-lg border border-border bg-[#0a0e17] overflow-hidden ${className}`}>
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-2 p-3 border-b border-border/50">
        {/* Row 1: Symbol selector + Price info */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {/* Symbol Selector */}
            <select
              value={currentSymbol}
              onChange={e => setCurrentSymbol(e.target.value)}
              className="bg-[#0d1520] border border-border/50 rounded px-2 py-1 text-sm font-heading font-bold text-cyber-blue focus:outline-none focus:border-cyber-blue/50 cursor-pointer"
            >
              {availableSymbols.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Price Display */}
            <div className="flex items-center gap-4">
              <span className={`text-lg font-heading font-bold ${priceChange >= 0 ? "text-cyber-green" : "text-cyber-magenta"}`}>
                ${formatPrice(lastPrice)}
              </span>
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${priceChange >= 0 ? "bg-cyber-green/10 text-cyber-green" : "bg-cyber-magenta/10 text-cyber-magenta"}`}>
                {priceChange >= 0 ? "+" : ""}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>

          {/* Price Stats */}
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground">
            <div><span className="text-muted-foreground/60">高 </span><span className="text-cyber-green">{formatPrice(highPrice)}</span></div>
            <div><span className="text-muted-foreground/60">低 </span><span className="text-cyber-magenta">{formatPrice(lowPrice)}</span></div>
            <div><span className="text-muted-foreground/60">量 </span><span className="text-cyber-blue">{volume24h > 1000000 ? `${(volume24h / 1000000).toFixed(1)}M` : volume24h > 1000 ? `${(volume24h / 1000).toFixed(1)}K` : volume24h.toFixed(0)}</span></div>
          </div>
        </div>

        {/* Row 2: Timeframe + Indicators */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Timeframe Buttons */}
          <div className="flex items-center gap-0.5">
            {timeFrames.map(tf => (
              <button
                key={tf.value}
                onClick={() => setTimeFrame(tf.value)}
                className={`px-2.5 py-1 text-[10px] font-mono font-medium rounded transition-all ${
                  timeFrame === tf.value
                    ? "bg-cyber-blue text-background shadow-[0_0_8px_rgba(0,212,255,0.3)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Indicator Toggles */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground/60 mr-1">指标:</span>
            {indicatorOptions.map(ind => (
              <button
                key={ind.value}
                onClick={() => toggleIndicator(ind.value)}
                title={ind.desc}
                className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-all ${
                  activeIndicators.has(ind.value)
                    ? "border-cyber-amber/50 bg-cyber-amber/10 text-cyber-amber"
                    : "border-border/30 text-muted-foreground/60 hover:text-muted-foreground hover:border-border/60"
                }`}
              >
                {ind.label}
              </button>
            ))}
          </div>
        </div>

        {/* Row 3: Indicator Legend */}
        <div className="flex items-center gap-3 text-[9px] font-mono text-muted-foreground/70 flex-wrap">
          {activeIndicators.has("MA") && (
            <>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: CHART_THEME.maColors.ma7 }} />MA7</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: CHART_THEME.maColors.ma25 }} />MA25</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: CHART_THEME.maColors.ma99 }} />MA99</span>
            </>
          )}
          {activeIndicators.has("EMA") && (
            <>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: CHART_THEME.emaColors.ema12 }} />EMA12</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: CHART_THEME.emaColors.ema26 }} />EMA26</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: CHART_THEME.emaColors.ema50 }} />EMA50</span>
            </>
          )}
          {activeIndicators.has("BOLL") && (
            <>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: CHART_THEME.bollColors.upper }} />BOLL上轨</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: CHART_THEME.bollColors.middle }} />BOLL中轨</span>
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 rounded" style={{ background: CHART_THEME.bollColors.lower }} />BOLL下轨</span>
            </>
          )}
          {activeIndicators.has("VOL") && (
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-sm" style={{ background: CHART_THEME.volumeUpColor }} />
              <span className="w-2 h-2 rounded-sm" style={{ background: CHART_THEME.volumeDownColor }} />
              成交量
            </span>
          )}
        </div>
      </div>

      {/* ── Chart Container ── */}
      <div ref={chartContainerRef} className="w-full" />
    </div>
  );
}
