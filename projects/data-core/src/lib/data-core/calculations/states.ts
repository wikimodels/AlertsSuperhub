// projects/data-core/src/lib/calculations/states.ts

import { PriceSeries } from '../models/price-series.model';
import { IndicatorResult } from '../models/indicator-result.model';

/**
 * Определяет четыре состояния цены (Cross Up/Down, Above/Below) относительно одной линии.
 * @param series Объект PriceSeries для доступа к ценам закрытия и открытия.
 * @param lineValues Значения линии (EMA, KAMA, VWAP) для сравнения.
 * @param lineName Имя линии (например, 'Ema50', 'W_AVWAP') для формирования ключей результата.
 */
export function analyzeLineStates(
  series: PriceSeries,
  lineValues: number[],
  lineName: string
): IndicatorResult {
  const arrayLength = series.closePrice.length;

  // Результаты, заполненные нулями (0 = False, 1 = True)
  const isCrossedUp: number[] = new Array(arrayLength).fill(0);
  const isCrossedDown: number[] = new Array(arrayLength).fill(0);
  const isAbove: number[] = new Array(arrayLength).fill(0);
  const isBelow: number[] = new Array(arrayLength).fill(0);

  // Состояния цены на текущей и предыдущей свечах
  for (let i = 1; i < arrayLength; i++) {
    // Начинаем с 1, так как требуется предыдущая свеча
    const close = series.closePrice[i];
    const open = series.openPrice[i];
    const prevClose = series.closePrice[i - 1];

    const line = lineValues[i];
    const prevLine = lineValues[i - 1];

    // Пропускаем, если линия еще не рассчитана (начало ряда)
    if (Number.isNaN(line) || Number.isNaN(prevLine)) continue;

    // --- 1. Пересечения (Crosses) ---

    // Пересечение ВВЕРХ: Цена пересекла линию снизу вверх
    if (prevClose < prevLine && close > line) {
      isCrossedUp[i] = 1;
    }

    // Пересечение ВНИЗ: Цена пересекла линию сверху вниз
    if (prevClose > prevLine && close < line) {
      isCrossedDown[i] = 1;
    }

    // --- 2. Позиция (Above/Below) ---
    // Условие: Цена закрытия и открытия должны быть по одну сторону от линии.

    // НАД линией
    if (close > line && open > line) {
      isAbove[i] = 1;
    }

    // ПОД линией
    if (close < line && open < line) {
      isBelow[i] = 1;
    }
  }

  // Формируем ключи: isCrossedUpEma50, isAboveKAMA и т.д.
  return {
    [`isCrossedUp${lineName}`]: isCrossedUp,
    [`isCrossedDown${lineName}`]: isCrossedDown,
    [`isAbove${lineName}`]: isAbove,
    [`isBelow${lineName}`]: isBelow,
  };
}
