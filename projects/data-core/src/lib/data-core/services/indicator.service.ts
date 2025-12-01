// projects/data-core/src/lib/services/indicator.service.ts

// Вам нужно будет реализовать этот импорт
// import { generatePriceSeries } from './calculations/series-generator';

import { Injectable } from '@angular/core';
import { INDICATOR_CONFIG } from '../indicators.config';
import { IndicatorResult } from '../models/indicator-result.model';
import { PriceSeries } from '../models/price-series.model';

/**
 * Сервис, отвечающий за выполнение всего конвейера индикаторов
 * и агрегацию результатов в финальный объект.
 */
@Injectable({ providedIn: 'root' }) // 👈 ДОБАВИТЬ ЭТОТ ДЕКОРАТОР
export class IndicatorService {
  private readonly MAX_CANDLES = 400;

  /**
   * Обрезает PriceSeries до максимального размера (400 свечей).
   * ✅ УЛУЧШЕНО: Этот метод теперь автоматически обрезает ЛЮБОЙ массив
   * в объекте PriceSeries, не требуя ручного обновления 'keysToTrim'.
   */
  private trimSeries(series: PriceSeries): PriceSeries {
    const arrayLength = series.closePrice.length;

    if (arrayLength <= this.MAX_CANDLES) {
      return series;
    }

    const startIndex = arrayLength - this.MAX_CANDLES;
    const trimmedSeries: Partial<PriceSeries> = {};

    // Итерируем по всем ключам объекта PriceSeries
    for (const key in series) {
      if (Object.prototype.hasOwnProperty.call(series, key)) {
        const data = series[key as keyof PriceSeries];

        if (Array.isArray(data)) {
          // Обрезаем, если это массив
          (trimmedSeries as any)[key] = data.slice(startIndex);
        } else {
          // Просто копируем, если это не массив (например, 'timeframe')
          (trimmedSeries as any)[key] = data;
        }
      }
    }

    return trimmedSeries as PriceSeries;
  }

  /**
   * Основной метод для выполнения всех индикаторов.
   * @param series Объект PriceSeries с данными свечей.
   * @returns Объект, где ключи - это имена индикаторов/линий, а значения - массивы.
   */
  public calculateAll(series: PriceSeries): IndicatorResult {
    // 1. Обрезка данных (Guardrail)
    const trimmedSeries = this.trimSeries(series);

    // 2. Инициализация финального результата
    const finalResults: IndicatorResult = {};

    // 3. Запуск конвейера
    for (const config of INDICATOR_CONFIG) {
      const { name, calc, params } = config;

      try {
        // Запуск функции расчета, передача PriceSeries и параметров
        const indicatorOutput = calc(trimmedSeries, ...params);

        // 4. Агрегация результатов
        Object.assign(finalResults, indicatorOutput);
      } catch (error) {
        console.error(`Error calculating indicator ${name}:`, error);
      }
    }

    return finalResults;
  }

  /**
   * Вспомогательный метод для получения финального массива openTime
   * после обрезки (для синхронизации с фронтендом).
   */
  public getOpenTimes(series: PriceSeries): number[] {
    return this.trimSeries(series).openTime;
  }
}
