import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { NotificationService } from '../notification.service';
import { LineAlert } from '../../../models/alerts';

/**
 * API Response типы (Аналогично WorkingCoinsApiService)
 */
interface AlertsApiResponse {
  success: boolean;
  count: number;
  data: LineAlert[];
}

interface AlertActionResponse {
  success: boolean;
  id?: string;
  count?: number;
  deletedCount?: number;
}

/**
 * Кастомный класс ошибки для API операций
 */
export class LineAlertsApiError extends Error {
  constructor(message: string, public statusCode?: number, public originalError?: any) {
    super(message);
    this.name = 'LineAlertsApiError';
  }
}

/**
 * Сервис для работы с Line Alerts API
 * Использует environment.alertsUrl для всех запросов
 */
@Injectable({
  providedIn: 'root',
})
export class LineAlertsApiService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  // ⚠️ Предполагаем, что alertsUrl настроен на базовый путь для алертов (например, /api/alerts)
  private readonly baseUrl = environment.lineAlertsUrl;

  // ============================================
  // 🛠️ Приватные утилиты для обработки ошибок
  // (Скопированы и адаптированы из WorkingCoinsApiService)
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
      console.error(`[LineAlertsApiService] ${fullMessage}`, error);

      if (showNotification) {
        this.notificationService.error(fullMessage);
      }

      return throwError(() => new LineAlertsApiError(fullMessage, error.status, error));
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
        error instanceof LineAlertsApiError
          ? error.message
          : `${operationName} - Неизвестная ошибка`;

      console.error(`[LineAlertsApiService] ${errorMessage}`, error);

      if (showNotification && !(error instanceof LineAlertsApiError)) {
        this.notificationService.error(errorMessage);
      }

      throw error;
    }
  }

  // ============================================
  // 📥 GET - Получение алертов (GET /api/alerts/line)
  // ============================================

  public getAllAlerts(): Observable<AlertsApiResponse> {
    return this.http
      .get<AlertsApiResponse>(this.baseUrl)
      .pipe(catchError(this.handleError('Получение списка Line Alerts')));
  }

  public async getAllAlertsAsync(): Promise<LineAlert[]> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.getAllAlerts());
      return response.data;
    }, 'Получение списка Line Alerts');
  }

  // ============================================
  // ➕ POST - Добавление алертов
  // ============================================

  /**
   * POST /api/alerts/line
   */
  public addAlert(alert: LineAlert): Observable<AlertActionResponse> {
    return this.http.post<AlertActionResponse>(this.baseUrl, alert).pipe(
      tap(() =>
        this.notificationService.success(`Line Alert для "${alert.symbol}" успешно добавлен`)
      ),
      catchError(this.handleError('Добавление Line Alert'))
    );
  }

  public async addAlertAsync(alert: LineAlert): Promise<boolean> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.addAlert(alert));
      return response.success;
    }, 'Добавление Line Alert');
  }

  /**
   * POST /api/alerts/line/batch
   */
  public addAlertsBatch(alerts: LineAlert[]): Observable<AlertActionResponse> {
    return this.http.post<AlertActionResponse>(`${this.baseUrl}/batch`, alerts).pipe(
      tap((response) =>
        this.notificationService.success(`Добавлено Line Alerts: ${response.count || 0}`)
      ),
      catchError(this.handleError('Пакетное добавление Line Alerts'))
    );
  }

  public async addAlertsBatchAsync(alerts: LineAlert[]): Promise<number> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.addAlertsBatch(alerts));
      return response.count || 0;
    }, 'Пакетное добавление Line Alerts');
  }

  // ============================================
  // ❌ DELETE - Удаление алертов
  // ============================================

  /**
   * DELETE /api/alerts/line/:id
   */
  public deleteAlert(id: string): Observable<AlertActionResponse> {
    return this.http.delete<AlertActionResponse>(`${this.baseUrl}/${id}`).pipe(
      tap(() => this.notificationService.success(`Line Alert успешно удален`)),
      catchError(this.handleError('Удаление Line Alert'))
    );
  }

  public async deleteAlertAsync(id: string): Promise<boolean> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.deleteAlert(id));
      return response.success;
    }, 'Удаление Line Alert');
  }

  /**
   * POST /api/alerts/line/delete-batch
   */
  public deleteAlertsBatch(ids: string[]): Observable<AlertActionResponse> {
    // Внимание: API использует POST с телом для delete-batch
    return this.http.post<AlertActionResponse>(`${this.baseUrl}/delete-batch`, ids).pipe(
      tap((response) =>
        this.notificationService.success(`Удалено Line Alerts: ${response.deletedCount || 0}`)
      ),
      catchError(this.handleError('Пакетное удаление Line Alerts'))
    );
  }

  public async deleteAlertsBatchAsync(ids: string[]): Promise<number> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.deleteAlertsBatch(ids));
      return response.deletedCount || 0;
    }, 'Пакетное удаление Line Alerts');
  }

  /**
   * DELETE /api/alerts/line/all
   */
  public deleteAllAlerts(): Observable<AlertActionResponse> {
    return this.http.delete<AlertActionResponse>(`${this.baseUrl}/all`).pipe(
      tap((response) =>
        this.notificationService.warning(`Все Line Alerts удалены (${response.deletedCount || 0})`)
      ),
      catchError(this.handleError('Удаление всех Line Alerts'))
    );
  }

  public async deleteAllAlertsAsync(): Promise<number> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.deleteAllAlerts());
      return response.deletedCount || 0;
    }, 'Удаление всех Line Alerts');
  }
}
