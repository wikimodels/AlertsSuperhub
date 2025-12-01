// projects/data-core/src/lib/calculations/atr.ts

import { PriceSeries } from '../models/price-series.model';
import { IndicatorResult } from '../models/indicator-result.model';
import { wilderSmooth } from '../calculations/wilder'; // 👈 Необходим для расчета ATR

/**
 * Рассчитывает True Range (TR) - необходимый компонент для ATR.
 * @param series Объект числовых серий (PriceSeries).
 */
export function calculateTrueRange(series: PriceSeries): number[] {
  const length = series.closePrice.length;
  const tr: number[] = new Array(length).fill(NaN);

  if (length === 0) {
    return tr;
  }

  // TR всегда начинается с NaN, т.к. требует предыдущей свечи.
  tr[0] = NaN;

  for (let i = 1; i < length; i++) {
    const high = series.highPrice[i];
    const low = series.lowPrice[i];
    const prevClose = series.closePrice[i - 1];

    // TR = Max(high - low, |high - prevClose|, |low - prevClose|)
    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);

    tr[i] = Math.max(tr1, tr2, tr3);
  }
  return tr;
}

/**
 * Рассчитывает Average True Range (ATR) с использованием сглаживания Уайлдера (RMA).
 * @param series Объект числовых серий.
 * @param length Период сглаживания.
 */
export function calculateATR(series: PriceSeries, length: number = 14): IndicatorResult {
  const trValues = calculateTrueRange(series);

  // ATR - это сглаживание Уайлдера (RMA) от True Range.
  const atrValues = wilderSmooth(trValues, length);

  return { atr: atrValues };
}
