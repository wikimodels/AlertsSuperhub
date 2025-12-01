import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
// ✅ ИСПРАВЛЕНО: Импортируем 'AppComponent', а не 'App'
import { AppComponent } from './app/app';

bootstrapApplication(AppComponent, appConfig) // ✅ ИСПРАВЛЕНО: Запускаем 'AppComponent'
  .catch((err) => console.error(err));
