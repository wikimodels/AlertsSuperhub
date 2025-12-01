// projects/data-core/src/lib/calculations/vzo.ts (Часть 1)

import { PriceSeries } from '../models/price-series.model';
import { calculateEMA } from '../calculations/ma';

// projects/data-core/src/lib/calculations/vzo.ts (Часть 2)

import { IndicatorResult } from '../models/indicator-result.model';

/**
 * Рассчитывает Volume Zone Oscillator (VZO).
 * @param series Объект числовых серий.
 * @param length Период EMA для NV и Volume (стандартно 14).
 * @param vzoLength Длина кумулятивного сглаживания (стандартно 21).
 */
export function calculateVZO(
  series: PriceSeries,
  length: number = 14,
  vzoLength: number = 21
): IndicatorResult {
  const arrayLength = series.closePrice.length;

  // 1. Расчет Net Volume и Кумулятивного Volume
  const nv = calculateNetVolume(series);
  const volumes = series.volume;

  // 2. Кумулятивный NV и Volume (сумма за весь период)
  const cumulativeNV: number[] = new Array(arrayLength).fill(0);
  const cumulativeVolume: number[] = new Array(arrayLength).fill(0);

  let sumNV = 0;
  let sumVolume = 0;

  for (let i = 0; i < arrayLength; i++) {
    sumNV += nv[i];
    sumVolume += volumes[i];
    cumulativeNV[i] = sumNV;
    cumulativeVolume[i] = sumVolume;
  }

  // 3. Сглаживание кумулятивных значений через EMA
  const vce = calculateEMA(cumulativeVolume, vzoLength); // Volume Cumulative EMA
  const vne = calculateEMA(cumulativeNV, length); // Net Volume EMA

  const vzoValues: number[] = new Array(arrayLength).fill(NaN);

  // 4. Расчет VZO
  // VZO = 100 * (VNE / VCE)
  for (let i = 0; i < arrayLength; i++) {
    const vceVal = vce[i];
    const vneVal = vne[i];

    if (!Number.isNaN(vceVal) && vceVal !== 0) {
      vzoValues[i] = 100 * (vneVal / vceVal);
    }
  }

  return { vzo: vzoValues };
}
/**
 * Рассчитывает массив Чистого Объема (Net Volume).
 */
export function calculateNetVolume(series: PriceSeries): number[] {
  const closePrices = series.closePrice;
  const volumes = series.volume;
  const arrayLength = closePrices.length;

  const nvValues: number[] = new Array(arrayLength).fill(0);

  for (let i = 1; i < arrayLength; i++) {
    const currentClose = closePrices[i];
    const prevClose = closePrices[i - 1];
    const currentVolume = volumes[i];

    if (currentClose > prevClose) {
      // Цена закрылась выше: Volume положительный
      nvValues[i] = currentVolume;
    } else if (currentClose < prevClose) {
      // Цена закрылась ниже: Volume отрицательный
      nvValues[i] = -currentVolume;
    } else {
      // Цена не изменилась: Volume = 0
      nvValues[i] = 0;
    }

    if (Number.isNaN(currentClose) || Number.isNaN(prevClose) || Number.isNaN(currentVolume)) {
      nvValues[i] = 0; // Для расчетов EMA требуется 0, а не NaN
    }
  }
  return nvValues;
}
