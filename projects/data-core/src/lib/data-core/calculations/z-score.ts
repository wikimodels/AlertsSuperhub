// projects/data-core/src/lib/calculations/z_score.ts

import { calculateSMA } from './ma'; // Предполагаем, что calculateSMA - чистая функция
import { calculateStDev } from './stdev'; // Предполагаем, что calculateStDev - чистая функция

/**
 * Рассчитывает скользящий Z-score для временного ряда.
 * Чистая функция: принимает ряд значений (number[]) и период.
 * * @param series Временной ряд, для которого рассчитывается Z-score.
 * @param window Размер скользящего окна.
 * @returns Массив со значениями Z-score (number[]).
 */
export function calculateZScore(series: number[], window: number = 50): number[] {
  const arrayLength = series.length;
  const zScoreValues: number[] = new Array(arrayLength).fill(NaN);

  if (arrayLength < window) return zScoreValues;

  // 1. Рассчитываем скользящее среднее (SMA)
  const rollingMean = calculateSMA(series, window);

  // 2. Рассчитываем скользящее стандартное отклонение (StDev)
  const rollingStd = calculateStDev(series, window);

  // 3. Расчет Z-score
  // Начинаем с window-1, где доступны первые полные значения SMA/StDev
  for (let i = window - 1; i < arrayLength; i++) {
    const value = series[i];
    const mean = rollingMean[i];
    const std = rollingStd[i];

    // (Текущее значение - Среднее) / Стандартное отклонение
    if (std !== 0 && !Number.isNaN(std)) {
      zScoreValues[i] = (value - mean) / std;
    } else {
      zScoreValues[i] = NaN;
    }
  }

  return zScoreValues;
}
