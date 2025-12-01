// projects/data-core/src/lib/calculations/bollinger.ts

import { PriceSeries } from '../models/price-series.model';
import { IndicatorResult } from '../models/indicator-result.model';
import { calculateSMA } from '../calculations/ma';
import { calculateStDev } from '../calculations/stdev';

/**
 * Рассчитывает Полосы Боллинджера (Bollinger Bands) и их ширину (BBW).
 */
export function calculateBollingerBands(
  series: PriceSeries,
  length: number = 20,
  mult: number = 2.0
): IndicatorResult {
  const closePrices = series.closePrice;
  const arrayLength = closePrices.length;

  // 1. Средняя линия (Basis): SMA
  const basis = calculateSMA(closePrices, length);

  // 2. Стандартное отклонение
  const std = calculateStDev(closePrices, length);

  const upper: number[] = new Array(arrayLength).fill(NaN);
  const lower: number[] = new Array(arrayLength).fill(NaN);
  const width: number[] = new Array(arrayLength).fill(NaN);

  // 3. Расчет полос и ширины
  for (let i = 0; i < arrayLength; i++) {
    if (!Number.isNaN(basis[i]) && !Number.isNaN(std[i])) {
      // Верхняя и нижняя полосы
      upper[i] = basis[i] + mult * std[i];
      lower[i] = basis[i] - mult * std[i];

      // Ширина (BBW) = (Upper - Lower) / Basis
      width[i] = (upper[i] - lower[i]) / basis[i];
    }
  }

  return {
    bb_basis: basis,
    bb_upper: upper,
    bb_lower: lower,
    bb_width: width,
  };
}
