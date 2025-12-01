import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
  importProvidersFrom,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

// 📝 Для поддержки Reactive Forms (Правильный способ)
import { ReactiveFormsModule } from '@angular/forms';

// 🔧 Глобальные настройки для Angular Material (пример)
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

export const appConfig: ApplicationConfig = {
  providers: [
    // --- Стандартная настройка ---
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    // --- Формы ---
    // ✅ ПРАВИЛЬНЫЙ СПОСОБ для ReactiveFormsModule
    //importProvidersFrom(ReactiveFormsModule),

    // --- HTTP-клиент с поддержкой Interceptors ---
    provideHttpClient(withInterceptors([])),

    // --- Провайдеры для Angular Material ---
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: { appearance: 'outline' },
    },
  ],
};
