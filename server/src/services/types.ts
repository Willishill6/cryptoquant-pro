export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export enum Signal {
  BUY = "BUY",
  SELL = "SELL",
  HOLD = "HOLD",
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  parameters: any;
  execute: (candles: Candle[]) => Signal;
}
