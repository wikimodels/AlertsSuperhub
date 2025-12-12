import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

// --- НАШИ НОВЫЕ СЕРВИСЫ ---
import { KlineDataApiService } from './api/kline-data-api.service';
import { IndicatorPipelineService } from './pipeline/indicator-pipeline.service';
import { TF, MarketData } from '../../models/kline.model';
import { KlineCacheService } from './cache/kline-cache.service';
import { NotificationService, NotificationType } from './notification.service';
import { CoinsApiService } from './api/coins-api.service';
import { BUFFER_MS } from '../../../environments/environment';

// --- МОДЕЛИ ---

// Тип таймфрейма (экспортируем для удобства)
export type Timeframe = TF;

/**
 * ФИНАЛЬНЫЙ ШАГ: Оркестратор
 *
 * Управляет потоком данных:
 * 1. Проверяет Кеш
 * 2. Применяет логику свежести
 * 3. Запрашивает API
 * 4. Запускает Pipeline
 * 5. Сохраняет в Кеш
 * 6. Управляет состоянием загрузки и ошибками
 */
@Injectable({
  providedIn: 'root',
})
export class KlineDataService {
  // --- ВНЕДРЕНИЕ СЕРВИСОВ (DI) ---
  // (Современный способ через inject())
  private api = inject(KlineDataApiService);
  private pipeline = inject(IndicatorPipelineService);
  private cache = inject(KlineCacheService);
  private coinsApi = inject(CoinsApiService);
  private notification = inject(NotificationService);

  /**
   * (Для нашего neon-spinner)
   * Компоненты могут подписаться на isLoading$
   */
  public isLoading$ = new BehaviorSubject<boolean>(false);

  constructor() {
    console.log('✅ KlineDataService (Оркестратор) initialized');
  }

  /**
   * Главный метод получения данных, реализующий ВАШУ логику.
   */
  public async getKlines(timeframe: Timeframe): Promise<MarketData | null> {
    this.isLoading$.next(true);

    try {
      // 1. Пытаемся взять из кеша
      const cachedData = await this.cache.getMarketData(timeframe);

      if (cachedData) {
        // 2. Проверяем свежесть данных по вашей логике
        const isStale = this.isDataStale(cachedData, timeframe);

        if (!isStale) {
          // ✅ ЛОГИКА: "take it from indexDb"
          console.log(`[Оркестратор] ${timeframe}: Взят из кеша (свежий).`);
          this.isLoading$.next(false);
          return cachedData;
        }
        console.log(`[Оркестратор] ${timeframe}: В кеше, но устарел.`);
      }

      // 3. ✅ ЛОГИКА: "download from render.com"
      // (Данных нет в кеше, или они устарели)
      console.log(`[Оркестратор] ${timeframe}: Загрузка с Render...`);

      // ШАГ 1: Получаем "сырые" данные (конвертируем Observable в Promise)
      const apiResponse = await firstValueFrom(this.api.getKlines(timeframe));

      if (!apiResponse || !apiResponse.data) {
        throw new Error('API вернул пустой ответ');
      }

      // ШАГ 2: Обрабатываем индикаторы
      const processedData = this.pipeline.process(apiResponse.data);

      // ШАГ 3: Сохраняем в кеш
      await this.cache.saveMarketData(processedData);

      // 4. ✅ ЛОГИКА: "if timeframe is 1h take fresh coins"
      if (timeframe === '1h') {
        this.triggerCoinListUpdate();
      }

      this.isLoading$.next(false);
      return processedData;
    } catch (error) {
      console.error(`[Оркестратор] ${timeframe}: КРИТИЧЕСКАЯ ОШИБКА.`, error);
      // Показываем нашу "неоновую" ошибку
      this.notification.show(`Ошибка загрузки данных [${timeframe}]`, NotificationType.Error);
      this.isLoading$.next(false);
      return null;
    }
  }

  // ========================================
  // --- Вспомогательные методы ---
  // ========================================

  /**
   * Запускает фоновое обновление мастер-списка монет (Правило "1h")
   */
  private triggerCoinListUpdate(): void {
    console.log(`[Оркестратор] 1h: Запрос на обновление мастер-списка монет...`);
    // .subscribe() - запускаем в фоне, не ждем завершения
    this.coinsApi.fetchCoinDataList().subscribe({
      next: (coins) => {
        // Сохраняем в кеш (Шаг 3)
        this.cache.saveCoinsData(coins);
        this.notification.show(
          `Мастер-список монет обновлен (${coins.length} шт.)`,
          NotificationType.Info
        );
      },
      error: (err) => {
        console.error('[Оркестратор] Не удалось обновить мастер-список.', err);
        this.notification.show('Не удалось обновить список монет', NotificationType.Warning);
      },
    });
  }

  /**
   * Реализация ВАШЕЙ логики проверки свежести
   * (current time > openTime + 2 * timeframe)
   */
  private isDataStale(data: MarketData, timeframe: Timeframe): boolean {
    try {
      // Ищем последнюю свечу у первой монеты
      const lastCoin = data.data[0];
      const lastCandle = lastCoin.candles[lastCoin.candles.length - 1];

      if (!lastCandle) return true; // Если свечей нет, данные "битые"

      const lastOpenTime = lastCandle.openTime; // Это ваш "openTime"
      const timeframeMs = this.parseTimeframeToMs(timeframe);

      if (timeframeMs === 0) return false; // Неизвестный TF, считаем свежим

      const currentTime = Date.now();

      // Ваше правило:
      const expiryTime = lastOpenTime + 2 * timeframeMs + BUFFER_MS;

      // true = Просрочено (Надо качать)
      // false = Свежее (Берем из кеша)
      return currentTime > expiryTime;
    } catch (e) {
      // Если структура данных битая (напр. data.data[0] нет),
      // лучше скачать заново.
      return true;
    }
  }

  /**
   * Вспомогательная утилита для isDataStale
   * (Используем ваши рабочие таймфреймы)
   */
  private parseTimeframeToMs(timeframe: Timeframe): number {
    const msInHour = 60 * 60 * 1000;
    switch (timeframe) {
      case '1h':
        return msInHour;
      case '4h':
        return 4 * msInHour;
      case '8h':
        return 8 * msInHour;
      case '12h':
        return 12 * msInHour;
      case 'D': // Ваш 'D' -> '1d'
        return 24 * msInHour;
      default:
        return 0; // Неизвестный таймфрейм
    }
  }
}
