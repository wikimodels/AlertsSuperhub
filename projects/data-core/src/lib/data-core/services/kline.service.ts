import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { IndicatorService } from '../services/indicator.service';
import { IndexDbService } from '../services/index-db.service';
import { ExchangeApiService, Timeframe, ApiSource } from '../api/exchange-api.service';
import { generatePriceSeries } from '../calculations/series-generator';

import { DataCoreRoot } from '../models/data-core-root.model';
import { Candle } from '../models/candle.model';
import { KlineData } from '../models/kline-data.model';
import { CoinData } from '../models/coin-data.model';
import { CandleIndicatorFields } from '../models/indicator-fields.model';

export type { Timeframe, ApiSource };

@Injectable({
  providedIn: 'root',
})
export class KlineService {
  constructor(
    private indexDbService: IndexDbService,
    private exchangeApi: ExchangeApiService,
    private indicatorService: IndicatorService
  ) {}

  private getApiSource(timeframe: Timeframe): ApiSource {
    return ['1h', '12h', '1d'].includes(timeframe) ? 'bazzar' : 'bizzar';
  }

  private isDataStale(rootData: DataCoreRoot): boolean {
    const STALE_THRESHOLD_MS = 60000; // 1 минута устаревания данных
    return rootData.closeTime + STALE_THRESHOLD_MS < Date.now();
  }

  // -----------------------------------------------------------------------
  // --- 1. Основной метод получения данных Kline (DataCoreRoot) ---
  // -----------------------------------------------------------------------
  public async getDataCoreRoot(timeframe: Timeframe): Promise<DataCoreRoot> {
    let rootData = await this.indexDbService.getDataCoreRoot(timeframe);

    if (rootData && !this.isDataStale(rootData)) {
      console.log(`KlineService: [${timeframe}] Данные свежие, берем из IndexDB.`);
      return rootData;
    }

    console.log(`KlineService: [${timeframe}] Данные устарели. Обновление через API.`);
    const apiSource = this.getApiSource(timeframe);

    // ВЫЗОВ 1: (Лог "1. ЗАПРОС KLINE")
    const freshDataObservable = this.exchangeApi.fetchDataCoreRoot(apiSource, timeframe);
    const freshData = (await firstValueFrom(freshDataObservable)) as DataCoreRoot;

    if (!freshData || freshData.data.length === 0) {
      throw new Error(`Failed to fetch fresh data for ${timeframe}.`);
    }

    const analyzedData = this.analyzeAndPrepareData(freshData);
    await this.indexDbService.saveDataCoreRoot(analyzedData);

    // ✅ ИСПРАВЛЕНИЕ ЛОГИКИ + ЯСНЫЙ ЛОГ:
    // Мы обновляем мастер-список CoinData (166 монет) каждый раз,
    // когда обращаемся к API 'bazzar', так как 'bizzar'
    // не имеет доступа к эндпоинту '/coins/filtered'.
    if (apiSource === 'bazzar') {
      console.log(
        `%c[KlineService] Источник '${apiSource}'. Запускаем обновление МАСТЕР-СПИСКА (CoinData)...`,
        'color: yellow; font-weight: bold;'
      );

      // ВЫЗОВ 2: (Лог "2. ЗАПРОС МАСТЕР-СПИСКА")
      await this.refreshAndCacheCoins();
    } else {
      console.log(
        `%c[KlineService] Источник '${apiSource}'. Обновление мастер-списка CoinData пропущено.`,
        'color: gray;'
      );
    }

    return analyzedData;
  }

  /**
   * ✅ ИСПРАВЛЕННАЯ процедура обработки и анализа данных, полученных с биржи.
   *
   * ГЛАВНЫЕ ИЗМЕНЕНИЯ:
   * 1. Убрана дублирующая обрезка candles (теперь обрезка только в IndicatorService)
   * 2. Добавлена проверка синхронизации длин массивов
   * 3. Улучшено логирование для отладки
   */
  private analyzeAndPrepareData(rootData: DataCoreRoot): DataCoreRoot {
    const analyzedKlineData: KlineData[] = [];

    for (const klineDataItem of rootData.data) {
      const symbol = klineDataItem.symbol;
      let candles = klineDataItem.data;

      // ✅ ИСПРАВЛЕНИЕ 1: Убрана обрезка здесь
      // Обрезка будет происходить ТОЛЬКО в IndicatorService.trimSeries()
      // Это избегает двойной обрезки и потери данных

      // ❌ УДАЛЕНО:
      // if (candles.length > MAX_CANDLES) {
      //   const startIndex = candles.length - MAX_CANDLES;
      //   candles = candles.slice(startIndex);
      // }

      console.log(`[${symbol}] Исходных свечей: ${candles.length}`);

      // ✅ ИСПРАВЛЕНИЕ 2: Генерируем PriceSeries из ВСЕХ свечей
      const priceSeries = generatePriceSeries(candles, rootData.timeframe);

      // ✅ Индикаторы рассчитываются и автоматически обрезаются внутри
      const indicatorResults = this.indicatorService.calculateAll(priceSeries);

      // ✅ ИСПРАВЛЕНИЕ 3: Получаем финальные openTime ПОСЛЕ обрезки
      const openTimes = this.indicatorService.getOpenTimes(priceSeries);
      console.log(`[${symbol}] После обработки индикаторов: ${openTimes.length} свечей`);

      // ✅ ИСПРАВЛЕНИЕ 4: Обрезаем исходные свечи до той же длины
      // Берём последние N свечей, где N = длина массива после обрезки в IndicatorService
      const startIndex = candles.length - openTimes.length;
      const alignedCandles = candles.slice(startIndex);

      // ✅ ПРОВЕРКА: Длины должны совпадать
      if (alignedCandles.length !== openTimes.length) {
        console.error(
          `❌ [${symbol}] ОШИБКА СИНХРОНИЗАЦИИ: candles=${alignedCandles.length}, openTimes=${openTimes.length}`
        );
        console.error(`   Исходных свечей было: ${candles.length}`);
        continue; // Пропускаем эту монету, чтобы избежать крашей
      }

      // ✅ Дополнительная проверка: совпадают ли openTime
      if (alignedCandles[0].openTime !== openTimes[0]) {
        console.warn(
          `⚠️ [${symbol}] OpenTime не совпадают: candle=${alignedCandles[0].openTime}, indicator=${openTimes[0]}`
        );
      }

      const analyzedCandles: Candle[] = [];

      for (let i = 0; i < openTimes.length; i++) {
        const baseCandle = alignedCandles[i];
        const enrichedCandle: Partial<Candle> = { ...baseCandle };

        // Добавляем все поля индикаторов
        for (const key in indicatorResults) {
          if (indicatorResults.hasOwnProperty(key)) {
            const indicatorKey = key as keyof CandleIndicatorFields;
            enrichedCandle[indicatorKey] = indicatorResults[key][i];
          }
        }

        analyzedCandles.push(enrichedCandle as Candle);
      }

      console.log(`✅ [${symbol}] Финальных свечей с индикаторами: ${analyzedCandles.length}`);

      analyzedKlineData.push({
        symbol: symbol,
        data: analyzedCandles,
      });
    }

    return {
      ...rootData,
      data: analyzedKlineData,
    };
  }

  // -----------------------------------------------------------------------
  // --- 2. Методы для списка монет (CoinData) ---
  // -----------------------------------------------------------------------
  public async getCoins() {
    return this.indexDbService.getCoinsData();
  }

  private async refreshAndCacheCoins(): Promise<void> {
    // ✅ ЯСНЫЙ ЛОГ
    console.log(`[KlineService/refreshAndCacheCoins] Вызываем exchangeApi.fetchCoinDataList()...`);

    const freshCoinDataObservable = this.exchangeApi.fetchCoinDataList();
    const freshCoinDataList = (await firstValueFrom(freshCoinDataObservable)) as CoinData[];

    if (freshCoinDataList && freshCoinDataList.length > 0) {
      // ✅ ИСПРАВЛЕНИЕ (DataError):
      // "Нормализуем" данные, чтобы они соответствовали требованиям IndexedDB.
      // IndexedDB не может хранить ключи с '$' (как в MongoDB { $date: ... }).
      const normalizedCoinList = freshCoinDataList.map((coin) => {
        // (coin as any) используется, чтобы обойти строгую типизацию CoinData,
        // так как модель ожидает { $date: string }, а мы хотим это исправить.
        const analyzedAtDate = (coin.analyzed_at as any)?.$date;

        return {
          ...coin,
          // Заменяем { $date: "..." } на "..." (string)
          // Если $date не найден, оставляем как есть, чтобы не сломать.
          analyzed_at: analyzedAtDate || coin.analyzed_at,
        };
      });

      // Сохраняем "очищенный" список
      await this.indexDbService.saveCoinsData(normalizedCoinList);
    }
  }
}
