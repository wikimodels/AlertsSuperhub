// projects/data-core/src/lib/calculations/rolling_max_min.ts

import { PriceSeries } from '../models/kline.model';

/**
 * Вспомогательная функция: Рассчитывает скользящий максимум или минимум за период.
 */
function rollingMaxMin(series: number[], period: number, operation: 'max' | 'min'): number[] {
  const result: number[] = new Array(series.length).fill(NaN);

  if (series.length < period) return result;

  const opFunc = operation === 'max' ? Math.max : Math.min;

  // Итерация начинается, когда окно заполнено
  for (let i = period - 1; i < series.length; i++) {
    // Извлекаем окно данных
    const window = series.slice(i - period + 1, i + 1);
    // Вычисляем максимум/минимум
    result[i] = opFunc(...window);
  }
  return result;
}

/**
 * Рассчитывает скользящий максимум (Highest High) для списка периодов.
 */
export function calculateHighestHigh(
  series: PriceSeries,
  periods: number[]
): { [key: string]: number[] } {
  const highPrices = series.highPrice;
  const results: { [key: string]: number[] } = {};

  for (const period of periods) {
    const values = rollingMaxMin(highPrices, period, 'max');
    results[`highest${period}`] = values;
  }
  return results;
}

/**
 * Рассчитывает скользящий минимум (Lowest Low) для списка периодов.
 */
export function calculateLowestLow(
  series: PriceSeries,
  periods: number[]
): { [key: string]: number[] } {
  const lowPrices = series.lowPrice;
  const results: { [key: string]: number[] } = {};

  for (const period of periods) {
    const values = rollingMaxMin(lowPrices, period, 'min');
    results[`lowest${period}`] = values;
  }
  return results;
}
