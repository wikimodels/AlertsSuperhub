import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { VwapAlert } from '../../../models/alerts';
import { NotificationService } from '../notification.service';

/**
 * API Response типы (Аналогично LineAlertsApiService, но с VwapAlert)
 */
interface AlertsApiResponse {
  success: boolean;
  count: number;
  data: VwapAlert[];
}

interface AlertActionResponse {
  success: boolean;
  id?: string; // ID для одиночных операций
  count?: number; // Количество добавленных (для batch)
  deletedCount?: number; // Количество удаленных (для delete-batch/all)
}

/**
 * Кастомный класс ошибки для API операций VWAP
 */
export class VwapAlertsApiError extends Error {
  constructor(message: string, public statusCode?: number, public originalError?: any) {
    super(message);
    this.name = 'VwapAlertsApiError';
  }
}

/**
 * Сервис для работы с VWAP Alerts API
 * Использует environment.alertsUrl/vwap для всех запросов
 */
@Injectable({
  providedIn: 'root',
})
export class VwapAlertsApiService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  // Базовый URL: предполагаем environment.alertsUrl = /api/alerts
  private readonly baseUrl = environment.vwapAlertsUrl;

  // ============================================
  // 🛠️ Приватные утилиты для обработки ошибок
  // ============================================

  /**
   * Обработчик HTTP ошибок с уведомлениями
   */
  private handleError(operation: string, showNotification = true) {
    return (error: HttpErrorResponse): Observable<never> => {
      let errorMessage = '';

      if (error.error instanceof ErrorEvent) {
        errorMessage = `Ошибка: ${error.error.message}`;
      } else {
        switch (error.status) {
          case 0:
            errorMessage = 'Нет соединения с сервером';
            break;
          case 400:
            errorMessage = error.error?.message || 'Некорректный запрос';
            break;
          case 404:
            errorMessage = 'Ресурс не найден';
            break;
          case 409:
            errorMessage = error.error?.message || 'Конфликт данных';
            break;
          case 500:
            errorMessage = 'Внутренняя ошибка сервера';
            break;
          default:
            errorMessage = `Ошибка ${error.status}: ${error.error?.message || error.message}`;
        }
      }

      const fullMessage = `${operation} - ${errorMessage}`;
      console.error(`[VwapAlertsApiService] ${fullMessage}`, error);

      if (showNotification) {
        this.notificationService.error(fullMessage);
      }

      // Используем кастомный класс ошибки для VWAP
      return throwError(() => new VwapAlertsApiError(fullMessage, error.status, error));
    };
  }

  /**
   * Обёртка для безопасного выполнения async операций
   */
  private async safeExecute<T>(
    operation: () => Promise<T>,
    operationName: string,
    showNotification = true
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const errorMessage =
        error instanceof VwapAlertsApiError
          ? error.message
          : `${operationName} - Неизвестная ошибка`;

      console.error(`[VwapAlertsApiService] ${errorMessage}`, error);

      if (showNotification && !(error instanceof VwapAlertsApiError)) {
        this.notificationService.error(errorMessage);
      }

      throw error;
    }
  }

  // ============================================
  // 📥 GET - Получение алертов (GET /api/alerts/vwap)
  // ============================================

  /**
   * Получить все активные VWAP Alerts (Observable)
   */
  public getAllAlerts(): Observable<AlertsApiResponse> {
    return this.http
      .get<AlertsApiResponse>(this.baseUrl)
      .pipe(catchError(this.handleError('Получение списка VWAP Alerts')));
  }

  /**
   * Получить все активные VWAP Alerts (Promise)
   */
  public async getAllAlertsAsync(): Promise<VwapAlert[]> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.getAllAlerts());
      return response.data;
    }, 'Получение списка VWAP Alerts');
  }

  // ============================================
  // ➕ POST - Добавление алертов
  // ============================================

  /**
   * POST /api/alerts/vwap (Добавить один)
   */
  public addAlert(alert: VwapAlert): Observable<AlertActionResponse> {
    return this.http.post<AlertActionResponse>(this.baseUrl, alert).pipe(
      tap(() =>
        this.notificationService.success(`VWAP Alert для ${alert.symbol} успешно добавлен`)
      ),
      catchError(this.handleError('Добавление VWAP Alert'))
    );
  }

  /**
   * POST /api/alerts/vwap (Promise)
   */
  public async addAlertAsync(alert: VwapAlert): Promise<AlertActionResponse> {
    return this.safeExecute(async () => {
      return await firstValueFrom(this.addAlert(alert));
    }, 'Добавление VWAP Alert');
  }

  /**
   * POST /api/alerts/vwap/batch (Добавить пакетом)
   */
  public addAlertsBatch(alerts: VwapAlert[]): Observable<AlertActionResponse> {
    return this.http.post<AlertActionResponse>(`${this.baseUrl}/batch`, alerts).pipe(
      tap((response) =>
        this.notificationService.success(`Добавлено VWAP Alerts: ${response.count || 0}`)
      ),
      catchError(this.handleError('Пакетное добавление VWAP Alerts'))
    );
  }

  /**
   * POST /api/alerts/vwap/batch (Promise)
   */
  public async addAlertsBatchAsync(alerts: VwapAlert[]): Promise<number> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.addAlertsBatch(alerts));
      return response.count || 0;
    }, 'Пакетное добавление VWAP Alerts');
  }

  // ============================================
  // ❌ DELETE - Удаление алертов
  // ============================================

  /**
   * DELETE /api/alerts/vwap/:id (Удалить один по ID)
   */
  public deleteAlert(id: string): Observable<AlertActionResponse> {
    return this.http.delete<AlertActionResponse>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.notificationService.success(`VWAP Alert (ID: ${id.slice(0, 8)}...) удален`)),
      catchError(this.handleError('Удаление VWAP Alert'))
    );
  }

  /**
   * DELETE /api/alerts/vwap/:id (Promise)
   */
  public async deleteAlertAsync(id: string): Promise<boolean> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.deleteAlert(id));
      return response.success;
    }, 'Удаление VWAP Alert');
  }

  /**
   * POST /api/alerts/vwap/delete-batch (Удалить пакетом)
   */
  public deleteAlertsBatch(ids: string[]): Observable<AlertActionResponse> {
    // Внимание: API использует POST с телом для delete-batch
    return this.http.post<AlertActionResponse>(`${this.baseUrl}/delete-batch`, ids).pipe(
      tap((response) =>
        this.notificationService.success(`Удалено VWAP Alerts: ${response.deletedCount || 0}`)
      ),
      catchError(this.handleError('Пакетное удаление VWAP Alerts'))
    );
  }

  /**
   * POST /api/alerts/vwap/delete-batch (Promise)
   */
  public async deleteAlertsBatchAsync(ids: string[]): Promise<number> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.deleteAlertsBatch(ids));
      return response.deletedCount || 0;
    }, 'Пакетное удаление VWAP Alerts');
  }

  /**
   * DELETE /api/alerts/vwap/all (Удалить все)
   */
  public deleteAllAlerts(): Observable<AlertActionResponse> {
    return this.http.delete<AlertActionResponse>(`${this.baseUrl}/all`).pipe(
      tap((response) =>
        this.notificationService.warning(`Все VWAP Alerts удалены (${response.deletedCount || 0})`)
      ),
      catchError(this.handleError('Удаление всех VWAP Alerts'))
    );
  }

  /**
   * DELETE /api/alerts/vwap/all (Promise)
   */
  public async deleteAllAlertsAsync(): Promise<number> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.deleteAllAlerts());
      return response.deletedCount || 0;
    }, 'Удаление всех VWAP Alerts');
  }
}
