import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, firstValueFrom, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

// Импорт моделей
import { AlertType, AlertStatus } from '../../../models/alerts';
// Импорт сервиса уведомлений (убедись, что путь верный)
import { NotificationService } from '../notification.service';

/**
 * Стандартный ответ от API
 */
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  count?: number; // для get/batch add
  id?: string; // для add one
  deletedCount?: number; // для delete
  movedCount?: number; // для move
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class UniversalAlertsApiService {
  private http = inject(HttpClient);
  private notificationService = inject(NotificationService);

  // Базовый URL (например: http://localhost:3000/api/alerts)
  private readonly baseUrl = environment.alertsUrl;

  // ============================================
  // 🛠️ Хелперы (Private)
  // ============================================

  /**
   * Преобразует "working" -> "Working", "line" -> "Line" для красивых логов
   */
  private fmt(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Централизованная обработка ошибок
   */
  private handleError(action: string) {
    return (error: HttpErrorResponse): Observable<never> => {
      let errorMessage = 'Неизвестная ошибка';

      if (error.error instanceof ErrorEvent) {
        // Ошибка на стороне клиента/сети
        errorMessage = `Network Error: ${error.error.message}`;
      } else {
        // Ошибка от бэкенда
        switch (error.status) {
          case 0:
            errorMessage = 'Нет соединения с сервером';
            break;
          case 400:
            errorMessage =
              error.error?.message || error.error?.error || 'Некорректный запрос (400)';
            break;
          case 404:
            errorMessage = 'Ресурс не найден (404)';
            break;
          case 500:
            errorMessage = 'Внутренняя ошибка сервера (500)';
            break;
          default:
            errorMessage = `Ошибка ${error.status}: ${error.error?.message || error.message}`;
        }
      }

      const fullMessage = `${action} — ${errorMessage}`;
      console.error(`[UniversalApi] ${fullMessage}`, error);

      // Показываем красное уведомление пользователю
      this.notificationService.error(fullMessage);

      return throwError(() => new Error(fullMessage));
    };
  }

  // ============================================
  // 📥 GET
  // ============================================

  public getAlerts<T>(type: AlertType, status: AlertStatus): Observable<ApiResponse<T[]>> {
    return this.http.get<ApiResponse<T[]>>(`${this.baseUrl}/${type}/${status}`).pipe(
      // Для GET обычно уведомление об успехе не нужно (слишком шумно), только об ошибке
      catchError(this.handleError(`Loading ${this.fmt(type)}/${this.fmt(status)}`))
    );
  }

  public async getAlertsAsync<T>(type: AlertType, status: AlertStatus): Promise<T[]> {
    // firstValueFrom автоматически отпишется
    const res = await firstValueFrom(this.getAlerts<T>(type, status));
    return res.data || [];
  }

  // ============================================
  // ➕ ADD
  // ============================================

  public async addAlertAsync(type: AlertType, status: AlertStatus, alert: any): Promise<boolean> {
    const obs$ = this.http.post<ApiResponse>(`${this.baseUrl}/${type}/${status}`, alert).pipe(
      tap(() => {
        this.notificationService.success(`${this.fmt(type)} Alert added to ${this.fmt(status)}`);
      }),
      catchError(this.handleError('Adding Alert'))
    );

    const res = await firstValueFrom(obs$);
    return res.success;
  }

  // ============================================
  // ❌ DELETE
  // ============================================

  public async deleteAlertsBatchAsync(
    type: AlertType,
    status: AlertStatus,
    ids: string[]
  ): Promise<number> {
    const obs$ = this.http
      .post<ApiResponse>(`${this.baseUrl}/${type}/${status}/delete-batch`, ids)
      .pipe(
        tap((res) => {
          this.notificationService.success(
            `Deleted ${res.deletedCount} alerts from ${this.fmt(status)}`
          );
        }),
        catchError(this.handleError('Deleting Alerts'))
      );

    const res = await firstValueFrom(obs$);
    return res.deletedCount || 0;
  }

  // ============================================
  // 📦 MOVE (с красивой стрелочкой)
  // ============================================

  public async moveAlertsAsync(
    type: AlertType,
    from: AlertStatus,
    to: AlertStatus,
    ids: string[]
  ): Promise<number> {
    const body = { ids, from, to };

    const obs$ = this.http.post<ApiResponse>(`${this.baseUrl}/${type}/move`, body).pipe(
      tap((res) => {
        const count = res.movedCount || 0;
        // Используем стрелочку ⟶ для наглядности
        this.notificationService.success(
          `Moved ${count} ${this.fmt(type)} alerts: ${this.fmt(from)} ⟶ ${this.fmt(to)}`
        );
      }),
      catchError(this.handleError(`Move ${this.fmt(from)} ⟶ ${this.fmt(to)}`))
    );

    const res = await firstValueFrom(obs$);
    return res.movedCount || 0;
  }

  // ============================================
  // 🔄 UPDATE
  // ============================================
  public async updateAlertAsync(
    type: AlertType,
    status: AlertStatus,
    id: string,
    payload: any
  ): Promise<boolean> {
    const obs$ = this.http
      .patch<ApiResponse>(`${this.baseUrl}/${type}/${status}/${id}`, payload)
      .pipe(
        tap(() => {
          this.notificationService.success(`Updated ${this.fmt(type)} Alert`);
        }),
        // Уведомление об успехе можно не показывать, чтобы не спамить при переключении
        catchError(this.handleError('Updating Alert'))
      );

    const res = await firstValueFrom(obs$);
    return res.success;
  }
}
