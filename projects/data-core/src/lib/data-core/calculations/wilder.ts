// projects/data-core/src/lib/calculations/wilder.ts

import { calculateSMA } from '../calculations/ma';

/**
 * Применяет сглаживание Уайлдера (RMA - Running Moving Average).
 * @param series Входной массив.
 * @param length Период сглаживания.
 * @returns Массив сглаженных значений.
 */
export function wilderSmooth(series: number[], length: number): number[] {
  const smoothed: number[] = new Array(series.length).fill(NaN);
  if (series.length < length) return smoothed;

  // 1. Первое значение - это SMA
  const sma = calculateSMA(series, length);
  smoothed[length - 1] = sma[length - 1];

  // 2. Итеративный расчет
  for (let i = length; i < series.length; i++) {
    smoothed[i] = (smoothed[i - 1] * (length - 1) + series[i]) / length;
  }
  return smoothed;
}
