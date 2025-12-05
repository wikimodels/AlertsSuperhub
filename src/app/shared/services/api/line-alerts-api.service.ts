import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { NotificationService } from '../notification.service';
// UPDATED: Added AlertsCollection to imports
import { LineAlert, AlertsCollection } from '../../../models/alerts';

/**
 * API Response типы
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
  // UPDATED: Added field for move operations
  movedCount?: number;
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
 */
@Injectable({
  providedIn: 'root',
})
export class LineAlertsApiService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  private readonly baseUrl = environment.lineAlertsUrl;

  // ============================================
  // 🛠️ Приватные утилиты
  // ============================================

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
  // 📥 GET
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
  // ➕ POST (ADD)
  // ============================================

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
  // ❌ DELETE
  // ============================================

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

  public deleteAlertsBatch(ids: string[]): Observable<AlertActionResponse> {
    // Отправляем массив строк, так как это согласовано с бэкендом
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

  // ============================================
  // 📦 MOVE (UNIVERSAL)
  // ============================================

  /**
   * Универсальное перемещение алертов между коллекциями.
   * POST /api/alerts/line/move
   * Body: { ids: string[], from: string, to: string }
   */
  public moveAlerts(
    ids: string[],
    from: AlertsCollection,
    to: AlertsCollection
  ): Observable<AlertActionResponse> {
    const body = { ids, from, to };

    return this.http.post<AlertActionResponse>(`${this.baseUrl}/move`, body).pipe(
      tap((response) =>
        this.notificationService.success(
          `Перемещено (${from} ⟶ ${to}): ${response.movedCount || 0}`
        )
      ),
      catchError(this.handleError(`Перемещение Line Alerts (${from} -> ${to})`))
    );
  }

  public async moveAlertsAsync(
    ids: string[],
    from: AlertsCollection,
    to: AlertsCollection
  ): Promise<number> {
    return this.safeExecute(async () => {
      const response = await firstValueFrom(this.moveAlerts(ids, from, to));
      return response.movedCount || 0;
    }, `Перемещение Line Alerts (${from} -> ${to})`);
  }
}
