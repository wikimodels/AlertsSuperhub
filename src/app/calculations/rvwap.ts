// projects/data-core/src/lib/calculations/rvwap.ts

import { PriceSeries } from '../models/kline.model';

// Карта для перевода таймфреймов в миллисекунды.
const TIMEFRAME_MS_MAP: { [key: string]: number } = {
  '1m': 60000,
  '5m': 300000,
  '15m': 900000,
  '30m': 1800000,
  '1h': 3600000,
  '4h': 14400000,
  '8h': 28800000,
  '12h': 43200000,
  '1d': 86400000,
};

/**
 * Определяет размер временного окна в миллисекундах, повторяя логику TradingView,
 * на основе таймфрейма, на котором рассчитывается RVWAP.
 */
function _getTimeWindowMs(timeframe: string): number {
  const tfInMs = TIMEFRAME_MS_MAP[timeframe] || 0;

  const MS_IN_MIN = 60000;
  const MS_IN_HOUR = 3600000;
  const MS_IN_DAY = 86400000;

  let windowSizeMs = 0;

  // Логика TradingView, определяющая rolling window size
  if (tfInMs <= MS_IN_MIN) {
    windowSizeMs = 1 * MS_IN_HOUR; // 1H
  } else if (tfInMs <= MS_IN_MIN * 5) {
    windowSizeMs = 4 * MS_IN_HOUR; // 4H
  } else if (tfInMs <= MS_IN_HOUR) {
    windowSizeMs = 1 * MS_IN_DAY; // 1D
  } else if (tfInMs <= MS_IN_HOUR * 4) {
    windowSizeMs = 3 * MS_IN_DAY; // 3D
  } else if (tfInMs <= MS_IN_HOUR * 12) {
    windowSizeMs = 7 * MS_IN_DAY; // 7D
  } else if (tfInMs <= MS_IN_DAY) {
    windowSizeMs = 30 * MS_IN_DAY; // 30D
  } else {
    windowSizeMs = 90 * MS_IN_DAY; // 90D
  }

  return windowSizeMs;
}

/**
 * Рассчитывает Rolling VWAP (RVWAP) и его полосы стандартного отклонения.
 * @param series Объект PriceSeries, включая PriceSeries.timeframe.
 * @param stdevMults Список множителей для полос стандартного отклонения.
 */
export function calculateRVWAP(series: PriceSeries, stdevMults: number[] = [1.0, 2.0, 3.0]) {
  const arrayLength = series.closePrice.length;
  // ✅ ИСПОЛЬЗУЕМ: Получаем timeframe из PriceSeries
  const windowSizeMs = _getTimeWindowMs(series.timeframe);

  // Массивы данных (для читаемости)
  const { openTime, highPrice, lowPrice, closePrice, volume } = series;

  // Результаты
  const results: any = {};
  const rvwapValues: number[] = new Array(arrayLength).fill(NaN);

  if (arrayLength === 0 || windowSizeMs === 0) {
    return results;
  }

  let leftIndex = 0; // Левый указатель скользящего окна
  let cumSrcVol = 0;
  let cumVol = 0;
  let cumSrcSrcVol = 0;

  // Компоненты для расчета полос
  const stdValues: number[] = new Array(arrayLength).fill(NaN);

  for (let i = 0; i < arrayLength; i++) {
    const currentOpenTime = openTime[i];

    // 1. Подготовка компонентов текущей свечи
    const src = (highPrice[i] + lowPrice[i] + closePrice[i]) / 3;
    const vol = volume[i];

    const srcVolume = src * vol;
    const srcSrcVolume = vol * src ** 2;

    // Добавляем данные текущей свечи к кумулятивным суммам
    cumSrcVol += srcVolume;
    cumVol += vol;
    cumSrcSrcVol += srcSrcVolume;

    // 2. Сдвиг окна (удаление старых свечей)
    // Пока свеча на leftIndex находится вне временного окна, удаляем ее вклад
    while (openTime[leftIndex] < currentOpenTime - windowSizeMs && leftIndex < i) {
      const leftSrc = (highPrice[leftIndex] + lowPrice[leftIndex] + closePrice[leftIndex]) / 3;
      const leftVol = volume[leftIndex];

      // Вычитаем вклад свечи, покидающей окно
      cumSrcVol -= leftSrc * leftVol;
      cumVol -= leftVol;
      cumSrcSrcVol -= leftVol * leftSrc ** 2;

      leftIndex++;
    }

    // 3. Расчет RVWAP и StDev
    if (cumVol > 0) {
      const rvwap = cumSrcVol / cumVol;
      rvwapValues[i] = rvwap;

      // Дисперсия и Ст. отклонение
      let variance = cumSrcSrcVol / cumVol - rvwap ** 2;
      variance = Math.max(0, variance); // Дисперсия >= 0
      stdValues[i] = Math.sqrt(variance);
    } else {
      rvwapValues[i] = NaN;
      stdValues[i] = NaN;
    }
  }

  // 4. Расчет полос и ширины
  results['rvwap'] = rvwapValues;

  for (const mult of stdevMults) {
    const upperBand: number[] = new Array(arrayLength).fill(NaN);
    const lowerBand: number[] = new Array(arrayLength).fill(NaN);
    const width: number[] = new Array(arrayLength).fill(NaN);

    const multStr = String(mult).replace('.', '_');

    for (let i = 0; i < arrayLength; i++) {
      if (!Number.isNaN(rvwapValues[i]) && !Number.isNaN(stdValues[i])) {
        upperBand[i] = rvwapValues[i] + stdValues[i] * mult;
        lowerBand[i] = rvwapValues[i] - stdValues[i] * mult;

        if (rvwapValues[i] !== 0) {
          width[i] = (upperBand[i] - lowerBand[i]) / rvwapValues[i];
        }
      }
    }

    results[`rvwap_upper_band_${multStr}`] = upperBand;
    results[`rvwap_lower_band_${multStr}`] = lowerBand;
    results[`rvwap_width_${multStr}`] = width;
  }

  return results;
}
