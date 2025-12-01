import { Candle } from './candle.model';

export interface KlineData {
  symbol: string;
  data: Candle[]; // Массив свечей
}
