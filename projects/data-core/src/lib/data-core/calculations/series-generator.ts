// projects/data-core/src/lib/calculations/series-generator.ts (ФИНАЛЬНАЯ ВЕРСИЯ)

import { Candle } from '../models/candle.model';
import { PriceSeries } from '../models/price-series.model';

/**
 * Преобразует массив свечей (Candle[]) в объект числовых серий (PriceSeries).
 * Использует parseFloat, который корректно обработает строки и вернет NaN
 * для отсутствующих или некорректных данных (например, если нет FR)./**
 * Преобразует массив свечей (Candle[]) в структурированный объект PriceSeries.
 * * @param candles Исходный массив свечей.
 * @param timeframe Таймфрейм, на котором получены свечи (например, '4h').
 */
export function generatePriceSeries(candles: Candle[], timeframe: string): PriceSeries {
  return {
    // ✅ ДОБАВЛЕНО: openTime
    openTime: candles.map((c) =>
      typeof c.openTime === 'string' ? parseInt(c.openTime) : c.openTime
    ),

    // ✅ ДОБАВЛЕНО: timeframe (передается как аргумент)
    timeframe: timeframe,

    // --- Стандартные поля (Цены и Объем) ---
    openPrice: candles.map((c) => parseFloat(c.open)),
    highPrice: candles.map((c) => parseFloat(c.high)),
    lowPrice: candles.map((c) => parseFloat(c.low)),
    closePrice: candles.map((c) => parseFloat(c.close)),
    volume: candles.map((c) => parseFloat(c.volume)),

    // --- АГРЕГИРОВАННЫЕ ПОЛЯ (как вход для индикаторов) ---
    openInterest: candles.map((c) => parseFloat(c.openInterest)),
    fundingRate: candles.map((c) => parseFloat(c.fundingRate)),
    volumeDelta: candles.map((c) => parseFloat(c.volumeDelta)),
  };
}
