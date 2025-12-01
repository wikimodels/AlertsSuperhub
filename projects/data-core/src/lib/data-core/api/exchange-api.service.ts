import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError, retry, tap } from 'rxjs/operators';

// Импорты из других файлов (окружение, модели)
import { environment } from '../../../environment/environment';
import { CoinData } from '../models/coin-data.model';
import { DataCoreRoot } from '../models/data-core-root.model';

// Типы, используемые в KlineService
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '8h' | '12h' | '1d';
export type ApiSource = 'bazzar' | 'bizzar';

// Тип ответа от защищенного эндпоинта /coins/filtered
interface CoinFilterResponse {
  count: number;
  data: CoinData[];
}

@Injectable({
  providedIn: 'root',
})
export class ExchangeApiService {
  private readonly COIN_SIFTER_URL = environment.coinSifterUrl;
  private readonly BAZZAR_URL = environment.bazzarUrl;
  private readonly BIZZAR_URL = environment.bizzarUrl;
  private readonly SECRET_TOKEN = environment.token;

  private readonly MAX_RETRIES = 2;
  private readonly RETRY_DELAY_MS = 1000;

  private readonly CACHE_ENDPOINT = '/get-cache/';
  private readonly FILTERED_COINS_ENDPOINT = '/coins/filtered';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse, endpoint: string) {
    let errorMessage = '';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `[${endpoint}] Client-side or network error: ${error.error.message}`;
    } else {
      errorMessage = `[${endpoint}] Server-side error: Code ${error.status}. Message: ${error.message}`;
      if (error.status === 401) {
        errorMessage += ' (Invalid X-Auth-Token or Token Value).';
      }
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  private getKlineBaseUrl(source: ApiSource): string {
    return source === 'bazzar' ? this.BAZZAR_URL : this.BIZZAR_URL;
  }

  private getAuthHeaders(): { [header: string]: string } {
    if (!this.SECRET_TOKEN) {
      console.error('WARNING: SECRET_TOKEN is not configured.');
    }
    return {
      // ✅ ИСПРАВЛЕНО (401): Отправляем 'X-Auth-Token', как ожидает сервер
      'X-Auth-Token': this.SECRET_TOKEN || '',
    };
  }

  // -----------------------------------------------------------------------
  // --- 1. ПУБЛИЧНЫЕ МЕТОДЫ (Получение DataCoreRoot) ---
  // -----------------------------------------------------------------------
  public fetchDataCoreRoot(source: ApiSource, timeframe: Timeframe): Observable<DataCoreRoot> {
    const baseUrl = this.getKlineBaseUrl(source);
    const url = `${baseUrl}${this.CACHE_ENDPOINT}${timeframe}`;
    const name = `GET ${timeframe} from ${source}`;

    return this.http.get<DataCoreRoot>(url).pipe(
      tap((data) => {
        if (data) {
          // ✅ УЛУЧШЕННЫЙ ЛОГ
          console.groupCollapsed(`[ExchangeApi] 1. ЗАПРОС KLINE (СВЕЧИ) [${timeframe}] - УСПЕХ`);
          console.log(`API Источник: ${source} (${url})`);
          console.log('Timeframe:', data.timeframe);
          console.log('CloseTime:', new Date(data.closeTime).toLocaleString());
          console.log('Кол-во монет (в этом файле):', data.data.length); // <--- ЭТО 158 или 132
          console.log('ПОЛНЫЙ ОБЪЕКТ:', data);
          console.groupEnd();
        } else {
          console.error(`[ExchangeApi] 1. ЗАПРОС KLINE (СВЕЧИ) [${timeframe}] - ПУСТОЙ ОТВЕТ`);
        }
      }),
      retry({ count: this.MAX_RETRIES, delay: this.RETRY_DELAY_MS }),
      catchError((err) => this.handleError(err, name))
    );
  }

  // -----------------------------------------------------------------------
  // --- 2. ЗАЩИЩЕННЫЕ МЕТОДЫ (Получение CoinData и Триггеры) ---
  // -----------------------------------------------------------------------
  public fetchCoinDataList(): Observable<CoinData[]> {
    const url = `${this.COIN_SIFTER_URL}${this.FILTERED_COINS_ENDPOINT}`;
    const name = `GET CoinDataList`;

    return this.http.get<CoinFilterResponse>(url, { headers: this.getAuthHeaders() }).pipe(
      tap((response) => {
        // ✅ УЛУЧШЕННЫЙ ЛОГ
        console.groupCollapsed(`[ExchangeApi] 2. ЗАПРОС МАСТЕР-СПИСКА (CoinData) - УСПЕХ`);
        console.log(`API Источник: coinSifter (${url})`);
        console.log('Кол-во монет (ВСЕГО):', response.count); // <--- ЭТО ДОЛЖНО БЫТЬ 166
        console.log('ПОЛНЫЙ ОБЪЕКТ:', response.data);
        console.groupEnd();
      }),
      map((response) => response.data),
      retry({ count: this.MAX_RETRIES, delay: this.RETRY_DELAY_MS }),
      catchError((err) => this.handleError(err, name))
    );
  }

  public triggerInternalOperation(internalPath: string): Observable<any> {
    const url = `${this.COIN_SIFTER_URL}/${internalPath}`;
    const name = `POST ${internalPath}`;

    return this.http.post(url, null, { headers: this.getAuthHeaders() }).pipe(
      tap(() => console.log(`[API] ✅ Successfully triggered ${name}`)),
      retry({ count: 1, delay: this.RETRY_DELAY_MS }),
      catchError((err) => this.handleError(err, name))
    );
  }
}
