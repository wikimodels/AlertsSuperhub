import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// --- ИМПОРТ МОДЕЛЕЙ ---
// (Этот сервис знает только о моделях API-ответов)
import { TF, KlineApiResponse, KlineApiAllResponse } from '../../../models/kline.model';

// Экспортируем тип таймфрейма для использования в других компонентах
export type Timeframe = TF;

/**
 * ШАГ 1: API Сервис
 *
 * Отвечает ТОЛЬКО за получение "сырых" данных с сервера.
 * Не содержит никакой бизнес-логики или расчетов.
 */
@Injectable({
  providedIn: 'root',
})
export class KlineDataApiService {
  private klineUrls = environment.klineDataUrls;
  private token = environment.token;

  constructor(private http: HttpClient) {}

  /**
   * Получает "сырые" klines для одного таймфрейма.
   * (БЕЗ .pipe(map(...)) - это "сырой" ответ)
   */
  getKlines(timeframe: Timeframe): Observable<KlineApiResponse> {
    const url = this.klineUrls[timeframe];
    const headers = this.createAuthHeaders();

    return this.http.get<KlineApiResponse>(url, { headers });
  }

  /**
   * Получает "сырые" klines для ВСЕХ таймфреймов.
   * (БЕЗ .pipe(map(...)) - это "сырой" ответ)
   */
  getAllKlines(): Observable<KlineApiAllResponse> {
    const baseUrl = this.klineUrls['1h'].replace('/api/cache/1h', '');
    const url = `${baseUrl}/api/cache/all`;
    const headers = this.createAuthHeaders();

    return this.http.get<KlineApiAllResponse>(url, { headers });
  }

  /**
   * Создает заголовки авторизации.
   */
  private createAuthHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.token}`,
    });
  }
}
