// projects/data-core/src/lib/data-core/calculations/keltner.ts (ИСПРАВЛЕН)

import { PriceSeries } from '../models/price-series.model';
import { IndicatorResult } from '../models/indicator-result.model';
import { calculateEMA } from './ma';
import { calculateATR } from './atr';

/**
 * Calculates the Keltner Channel (KC).
 */
export function calculateKeltnerChannel(
  series: PriceSeries,
  length: number = 20,
  multiplier: number = 2.0,
  atrLength: number = 10
): IndicatorResult {
  const closePrices = series.closePrice;
  const arrayLength = closePrices.length;

  // 1. Middle Line: EMA
  const middleLine = calculateEMA(closePrices, length);

  // 2. Range Component: ATR
  const atrResults = calculateATR(series, atrLength);
  // ИСПРАВЛЕНИЕ: Используем скобочную нотацию для IndicatorResult
  const atr = atrResults['atr'];

  const upperLine: number[] = new Array(arrayLength).fill(NaN);
  const lowerLine: number[] = new Array(arrayLength).fill(NaN);
  const kcWidth: number[] = new Array(arrayLength).fill(NaN);

  // 3. Bands and Width Calculation
  for (let i = 0; i < arrayLength; i++) {
    // Используем !Number.isNaN для корректной проверки
    if (!Number.isNaN(middleLine[i]) && !Number.isNaN(atr[i])) {
      const range = atr[i] * multiplier;
      upperLine[i] = middleLine[i] + range;
      lowerLine[i] = middleLine[i] - range;

      // Width = (Upper - Lower) / Middle
      if (middleLine[i] !== 0) {
        kcWidth[i] = (upperLine[i] - lowerLine[i]) / middleLine[i];
      } else {
        kcWidth[i] = NaN;
      }
    }
  }

  return {
    kc_middle: middleLine,
    kc_upper: upperLine,
    kc_lower: lowerLine,
    kc_width: kcWidth,
    atr: atr, // Возвращаем ATR, так как оно было рассчитано
  };
}
