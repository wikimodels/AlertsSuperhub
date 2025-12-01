// projects/data-core/src/lib/calculations/patterns.ts

import { PriceSeries } from '../models/price-series.model';
import { IndicatorResult } from '../models/indicator-result.model';

/**
 * Распознает базовые свечные паттерны Price Action, используя только соотношения цены.
 * @param series Объект числовых серий.
 */
export function recognizeCandlePatterns(series: PriceSeries): IndicatorResult {
  // 👈 УБРАН ПАРАМЕТР ATR
  const arrayLength = series.closePrice.length;
  // Используем обновленную модель с суффиксом 'Price'
  const { openPrice, highPrice: high, lowPrice: low, closePrice: close } = series;

  const results: IndicatorResult = {};

  if (arrayLength < 2) {
    return results;
  }

  // --- Вспомогательные расчеты ---

  const bodyAbs: number[] = new Array(arrayLength).fill(NaN);
  const range: number[] = new Array(arrayLength).fill(NaN);
  const upperShadow: number[] = new Array(arrayLength).fill(NaN);
  const lowerShadow: number[] = new Array(arrayLength).fill(NaN);

  for (let i = 0; i < arrayLength; i++) {
    bodyAbs[i] = Math.abs(close[i] - openPrice[i]);
    range[i] = high[i] - low[i];

    const bodyMax = Math.max(openPrice[i], close[i]);
    const bodyMin = Math.min(openPrice[i], close[i]);

    upperShadow[i] = high[i] - bodyMax;
    lowerShadow[i] = bodyMin - low[i];
  }

  // --- Логика распознавания паттернов ---

  const isDoji: number[] = new Array(arrayLength).fill(0);
  const isBullEngulfing: number[] = new Array(arrayLength).fill(0);
  const isBearEngulfing: number[] = new Array(arrayLength).fill(0);
  const isHammer: number[] = new Array(arrayLength).fill(0);
  const isPinbar: number[] = new Array(arrayLength).fill(0);

  for (let i = 1; i < arrayLength; i++) {
    // 1. Doji
    if (bodyAbs[i] < range[i] * 0.1 && range[i] > 0) {
      isDoji[i] = 1;
    }

    // --- Паттерны Поглощения ---
    const prevIsRed = openPrice[i - 1] > close[i - 1];
    const currIsGreen = close[i] > openPrice[i];
    const prevIsGreen = close[i - 1] > openPrice[i - 1];
    const currIsRed = openPrice[i] > close[i];

    // 2. Bullish Engulfing
    const engulfsBodyBullish = close[i] > openPrice[i - 1] && openPrice[i] < close[i - 1];
    if (prevIsRed && currIsGreen && engulfsBodyBullish) {
      isBullEngulfing[i] = 1;
    }

    // 3. Bearish Engulfing
    const engulfsBodyBearish = openPrice[i] > close[i - 1] && close[i] < openPrice[i - 1];
    if (prevIsGreen && currIsRed && engulfsBodyBearish) {
      isBearEngulfing[i] = 1;
    }

    // --- Паттерны Теней (Убрана зависимость от ATR) ---

    // 4. Hammer (Молот) - Длинная нижняя тень, маленькое тело наверху
    if (lowerShadow[i] > bodyAbs[i] * 2 && upperShadow[i] < bodyAbs[i]) {
      isHammer[i] = 1;
    }

    // 5. Pin Bar (Shooting Star) - Длинная верхняя тень, маленькое тело внизу
    if (upperShadow[i] > bodyAbs[i] * 2 && lowerShadow[i] < bodyAbs[i]) {
      isPinbar[i] = 1;
    }
  }

  results['is_doji'] = isDoji;
  results['is_bullish_engulfing'] = isBullEngulfing;
  results['is_bearish_engulfing'] = isBearEngulfing;
  results['is_hammer'] = isHammer;
  results['is_pinbar'] = isPinbar;

  return results;
}
