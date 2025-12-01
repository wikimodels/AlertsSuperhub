// projects/data-core/src/lib/calculations/avwap.ts

import { PriceSeries } from '../models/price-series.model';
import { IndicatorResult } from '../models/indicator-result.model';

/**
 * Определяет, является ли текущая свеча началом нового периода (недели или месяца).
 * @param openTime Время открытия свечи в миллисекундах.
 * @param anchor Период привязки ('W' или 'M').
 * @param prevTime Предыдущее время открытия в миллисекундах.
 */
function isNewAnchorPeriod(openTime: number, anchor: string, prevTime: number): boolean {
  const date = new Date(openTime);
  const prevDate = new Date(prevTime);

  if (anchor === 'W') {
    // Начало недели (Понедельник)
    const isNewWeek = date.getDay() === 1 && prevDate.getDay() !== 1;

    // Дополнительная проверка на начало недели в рамках месяца,
    // чтобы избежать ложных срабатываний, если данные пропущены
    const dayOfMonth = date.getDate();
    const prevDayOfMonth = prevDate.getDate();

    if (dayOfMonth < prevDayOfMonth) {
      // Переход через месяц, но не понедельник,
      // если prevDate была последним днем месяца, а date - первым.
      // Стандартный Grouper Pandas начинается с понедельника ('W-MON').
      // Просто сравниваем номер недели.
      const weekOfYear = Math.floor(
        (date.getTime() - new Date(date.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
      );
      const prevWeekOfYear = Math.floor(
        (prevDate.getTime() - new Date(prevDate.getFullYear(), 0, 1).getTime()) /
          (7 * 24 * 60 * 60 * 1000)
      );

      return weekOfYear !== prevWeekOfYear;
    }

    return isNewWeek;
  } else if (anchor === 'M') {
    // Начало месяца
    return date.getMonth() !== prevDate.getMonth();
  }
  return false;
}

/**
 * Рассчитывает Anchored VWAP (AVWAP).
 * @param series Серии цен (PriceSeries).
 * @param anchor Период привязки ('W' для недели, 'M' для месяца).
 * @param stdevMult Множитель стандартного отклонения (стандартно 1.0).
 */
export function calculateAnchoredVWAP(
  series: PriceSeries,
  anchor: 'W' | 'M',
  stdevMult: number = 1.0
): IndicatorResult {
  const arrayLength = series.closePrice.length;
  const prefix = anchor === 'W' ? 'w' : 'm';

  // Массивы результатов
  const vwapValues: number[] = new Array(arrayLength).fill(NaN);
  const upperBand: number[] = new Array(arrayLength).fill(NaN);
  const lowerBand: number[] = new Array(arrayLength).fill(NaN);

  if (arrayLength === 0) {
    return {
      [`${prefix}_avwap`]: vwapValues,
      [`${prefix}_avwap_upper_band`]: upperBand,
      [`${prefix}_avwap_lower_band`]: lowerBand,
    };
  }

  let cumSrcVol = 0;
  let cumVol = 0;
  let cumSrcSrcVol = 0;

  // Начальные условия для проверки сброса
  let prevOpenTime = series.openTime[0];

  for (let i = 0; i < arrayLength; i++) {
    const high = series.highPrice[i];
    const low = series.lowPrice[i];
    const close = series.closePrice[i];
    const volume = series.volume[i];
    const openTime = series.openTime[i];

    // 1. Проверка на сброс аккумуляторов
    // Используем > 0, чтобы сброс происходил после первой свечи
    if (i > 0 && isNewAnchorPeriod(openTime, anchor, prevOpenTime)) {
      cumSrcVol = 0;
      cumVol = 0;
      cumSrcSrcVol = 0;
    }

    // Обновляем prevOpenTime для следующей итерации
    prevOpenTime = openTime;

    // 2. Расчет базовых величин и накопление
    const src = (high + low + close) / 3;

    cumSrcVol += src * volume;
    cumVol += volume;
    cumSrcSrcVol += src ** 2 * volume;

    // 3. Расчет VWAP и полос
    if (cumVol > 0) {
      // VWAP
      const vwap = cumSrcVol / cumVol;
      vwapValues[i] = vwap;

      // Дисперсия и Ст. отклонение
      let variance = cumSrcSrcVol / cumVol - vwap ** 2;
      variance = Math.max(0, variance); // Дисперсия не может быть отрицательной
      const stdev = Math.sqrt(variance);

      // Полосы
      upperBand[i] = vwap + stdev * stdevMult;
      lowerBand[i] = vwap - stdev * stdevMult;
    } else {
      // Если объема нет, оставляем NaN
      vwapValues[i] = NaN;
      upperBand[i] = NaN;
      lowerBand[i] = NaN;
    }
  }

  return {
    [`${prefix}_avwap`]: vwapValues,
    [`${prefix}_avwap_upper_band`]: upperBand,
    [`${prefix}_avwap_lower_band`]: lowerBand,
  };
}
