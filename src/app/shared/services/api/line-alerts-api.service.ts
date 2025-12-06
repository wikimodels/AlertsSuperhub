import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

import { NotificationService } from '../notification.service';
import { LineAlert, AlertsCollection } from '../../../models/alerts';

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
  movedCount?: number;
}

export class LineAlertsApiError extends Error {
  constructor(message: string, public statusCode?: number, public originalError?: any) {
    super(message);
    this.name = 'LineAlertsApiError';
  }
}

@Injectable({
  providedIn: 'root',
})
export class LineAlertsApiService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  // Базовый URL: .../api/alerts/line
  private readonly baseUrl = environment.lineAlertsUrl;

  // 👇 ДОБАВЛЕНО: Хардкодим статус 'working', так как этот сервис пока для рабочих алертов.
  // Если потом понадобятся triggered/archived, лучше передавать статус аргументом в методы.
  private readonly workingStatus = 'working';

  // ============================================
  // 🛠️ Приватные утилиты (без изменений)
  // ============================================
  private handleError(operation: string, showNotification = true) {
    return (error: HttpErrorResponse): Observable<never> => {
      let errorMessage = '';
      if (error.error instanceof ErrorEvent) {
        errorMessage = `Ошибка: ${error.error.message}`;
      } else {
        errorMessage = `Ошибка ${error.status}: ${error.error?.message || error.message}`;
      }
      const fullMessage = `${operation} - ${errorMessage}`;
      console.error(`[LineAlertsApiService] ${fullMessage}`, error);
      if (showNotification) this.notificationService.error(fullMessage);
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
      if (showNotification && !(error instanceof LineAlertsApiError)) {
        this.notificationService.error(`${operationName} - Неизвестная ошибка`);
      }
      throw error;
    }
  }

  // ============================================
  // 📥 GET
  // ============================================

  public getAllAlerts(): Observable<AlertsApiResponse> {
    // 🚀 FIX: Добавляем /working
    const url = `${this.baseUrl}/${this.workingStatus}`;
    return this.http
      .get<AlertsApiResponse>(url)
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
    // 🚀 FIX: Добавляем /working
    const url = `${this.baseUrl}/${this.workingStatus}`;
    return this.http.post<AlertActionResponse>(url, alert).pipe(
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
    // 🚀 FIX: Добавляем /working
    const url = `${this.baseUrl}/${this.workingStatus}/batch`;
    return this.http.post<AlertActionResponse>(url, alerts).pipe(
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
    // 🚀 FIX: Добавляем /working
    const url = `${this.baseUrl}/${this.workingStatus}/${id}`;
    return this.http.delete<AlertActionResponse>(url).pipe(
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
    // 🚀 FIX: Добавляем /working
    const url = `${this.baseUrl}/${this.workingStatus}/delete-batch`;
    return this.http.post<AlertActionResponse>(url, ids).pipe(
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
    // 🚀 FIX: Добавляем /working
    const url = `${this.baseUrl}/${this.workingStatus}/all`;
    return this.http.delete<AlertActionResponse>(url).pipe(
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

  public moveAlerts(
    ids: string[],
    from: AlertsCollection,
    to: AlertsCollection
  ): Observable<AlertActionResponse> {
    // Для мува URL немного другой: /alerts/line/move (без статуса в середине, так как он в body)
    // Смотрим роут: alertRoutes.post("/alerts/:type/move", ...)
    const url = `${this.baseUrl}/move`;
    const body = { ids, from, to };

    return this.http.post<AlertActionResponse>(url, body).pipe(
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
