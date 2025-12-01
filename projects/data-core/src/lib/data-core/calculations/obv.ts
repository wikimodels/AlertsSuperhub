// projects/data-core/src/lib/calculations/obv.ts

import { PriceSeries } from '../models/price-series.model';
import { IndicatorResult } from '../models/indicator-result.model';

/**
 * Рассчитывает On Balance Volume (OBV).
 * @param series Объект числовых серий.
 */
export function calculateOBV(series: PriceSeries): IndicatorResult {
  const closePrices = series.closePrice;
  const volumes = series.volume;
  const arrayLength = closePrices.length;

  const obvValues: number[] = new Array(arrayLength).fill(0);

  if (arrayLength === 0) {
    return { obv: [] };
  }

  // Инициализация: Первое значение OBV равно объему первой свечи.
  // Если volume[0] не является числом, начинаем с 0.
  obvValues[0] = volumes[0];

  // Итеративный расчет: начиная со второй свечи
  for (let i = 1; i < arrayLength; i++) {
    const currentClose = closePrices[i];
    const prevClose = closePrices[i - 1];
    const currentVolume = volumes[i];
    const prevOBV = obvValues[i - 1];

    if (currentClose > prevClose) {
      // Цена закрылась выше: Volume прибавляется к предыдущему OBV
      obvValues[i] = prevOBV + currentVolume;
    } else if (currentClose < prevClose) {
      // Цена закрылась ниже: Volume вычитается из предыдущего OBV
      obvValues[i] = prevOBV - currentVolume;
    } else {
      // Цена закрытия не изменилась: OBV остается прежним
      obvValues[i] = prevOBV;
    }

    // Обработка NaN: Если предыдущий OBV или текущий Volume был NaN, текущий OBV тоже должен быть NaN
    if (Number.isNaN(prevOBV) || Number.isNaN(currentVolume)) {
      obvValues[i] = NaN;
    }
  }

  return { obv: obvValues };
}
