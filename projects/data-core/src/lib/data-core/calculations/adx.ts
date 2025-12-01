// projects/data-core/src/lib/calculations/adx.ts (Часть 1)

import { PriceSeries } from '../models/price-series.model';

/**
 * Рассчитывает +DM и -DM (Positive/Negative Directional Movement)
 */
// projects/data-core/src/lib/calculations/adx.ts (Часть 2: ADX)

import { IndicatorResult } from '../models/indicator-result.model';
import { wilderSmooth } from '../calculations/wilder'; // 👈 Вспомогательная функция для сглаживания Уайлдера (RMA)
import { calculateTrueRange } from '../calculations/atr'; // 👈 Вспомогательная функция для True Range
// import { calculateDirectionalMovement } from './adx'; // Импортировать из Части 1, но в этом файле оно уже определено

/**
 * Рассчитывает Average Directional Index (ADX), +DI, и -DI.
 * @param series Объект числовых серий.
 * @param length Период (стандартно 14).
 */
export function calculateADX(series: PriceSeries, length: number = 14): IndicatorResult {
  const arrayLength = series.closePrice.length;

  // --- 1. Подготовка компонентов ---
  const tr = calculateTrueRange(series);
  const { plusDM, minusDM } = calculateDirectionalMovement(series);

  // --- 2. Сглаживание компонентов (Wilder Smoothing / RMA) ---
  // ATR = Wilder Smooth(TR)
  const atr = wilderSmooth(tr, length);
  const plusDMSmooth = wilderSmooth(plusDM, length);
  const minusDMSmooth = wilderSmooth(minusDM, length);

  // --- 3. Расчет DI (+DI, -DI) ---
  const diPlus: number[] = new Array(arrayLength).fill(NaN);
  const diMinus: number[] = new Array(arrayLength).fill(NaN);

  // Расчет DI начинается после периода сглаживания
  for (let i = length; i < arrayLength; i++) {
    const atrVal = atr[i];

    // Предотвращаем деление на 0
    if (atrVal !== 0 && !Number.isNaN(atrVal)) {
      diPlus[i] = 100 * (plusDMSmooth[i] / atrVal);
      diMinus[i] = 100 * (minusDMSmooth[i] / atrVal);
    }
  }

  // --- 4. Расчет DX (Directional Movement Index) ---
  const dx: number[] = new Array(arrayLength).fill(NaN);
  for (let i = length; i < arrayLength; i++) {
    const diSum = diPlus[i] + diMinus[i];

    if (diSum !== 0 && !Number.isNaN(diSum)) {
      const diDiff = Math.abs(diPlus[i] - diMinus[i]);
      dx[i] = 100 * (diDiff / diSum);
    }
  }

  // --- 5. Расчет ADX (Сглаживание DX) ---
  // ADX - это Wilder Smoothing от DX
  const adx = wilderSmooth(dx, length);

  return {
    adx: adx,
    di_plus: diPlus,
    di_minus: diMinus,
  };
}

export function calculateDirectionalMovement(series: PriceSeries): {
  plusDM: number[];
  minusDM: number[];
} {
  const arrayLength = series.closePrice.length;
  const plusDM: number[] = new Array(arrayLength).fill(0);
  const minusDM: number[] = new Array(arrayLength).fill(0);

  for (let i = 1; i < arrayLength; i++) {
    const moveUp = series.highPrice[i] - series.highPrice[i - 1];
    const moveDown = series.lowPrice[i - 1] - series.lowPrice[i];

    // 1. +DM (Если движение вверх > движения вниз И движение вверх > 0)
    if (moveUp > moveDown && moveUp > 0) {
      plusDM[i] = moveUp;
    } else {
      plusDM[i] = 0;
    }

    // 2. -DM (Если движение вниз > движения вверх И движение вниз > 0)
    if (moveDown > moveUp && moveDown > 0) {
      minusDM[i] = moveDown;
    } else {
      minusDM[i] = 0;
    }
  }

  return { plusDM, minusDM };
}
