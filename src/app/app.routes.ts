import { inject } from '@angular/core';
import { Auth, authState } from '@angular/fire/auth';
import { Router, Routes } from '@angular/router';
import { take, map } from 'rxjs';

// Компоненты
import { AuthComponent } from './auth/auth.component';

// --- GUARDS ---

// Пропускает только авторизованных. Гостей шлет на /login
const privateGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map((user) => (user ? true : router.createUrlTree(['/login'])))
  );
};

// Пропускает только гостей. Авторизованных шлет домой (чтобы не видели форму логина зря)
const publicGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return authState(auth).pipe(
    take(1),
    map((user) => (user ? router.createUrlTree(['/']) : true))
  );
};

export const routes: Routes = [
  // 1. СТРАНИЦА ВХОДА
  {
    path: 'login',
    component: AuthComponent,
    canActivate: [publicGuard],
  },

  // 2. ЗАЩИЩЕННАЯ ГРУППА МАРШРУТОВ
  // Используем пустой путь '' как контейнер для children
  {
    path: '',
    canActivate: [privateGuard], // ⛔ ОДИН гард защищает всё, что внутри
    children: [
      {
        path: 'coins',
        loadComponent: () => import('./coins/coins').then((m) => m.Coins),
      },
      {
        path: 'line-alert-chart',
        loadComponent: () =>
          import('./line-alert-chart/line-alert-chart').then((m) => m.LineAlertChart),
      },
      {
        path: 'vwap-alert-chart',
        loadComponent: () =>
          import('./vwap-alert-chart/vwap-alert-chart').then((m) => m.VwapAlertChart),
      },
      {
        path: 'working-coins',
        loadComponent: () => import('./working-coins/working-coins').then((m) => m.WorkingCoins),
      },
      {
        path: 'working-line-alerts',
        loadComponent: () =>
          import('./working-line-alerts/working-line-alerts').then((m) => m.WorkingLineAlerts),
      },
      {
        path: 'triggered-line-alerts',
        loadComponent: () =>
          import('./triggered-line-alerts/triggered-line-alerts').then(
            (m) => m.TriggeredLineAlerts
          ),
      },
      {
        path: 'archived-line-alerts',
        loadComponent: () =>
          import('./archived-line-alerts/archived-line-alerts').then((m) => m.ArchivedLineAlerts),
      },
      {
        path: 'working-vwap-alerts',
        loadComponent: () =>
          import('./working-vwap-alerts/working-vwap-alerts').then((m) => m.WorkingVwapAlerts),
      },
      {
        path: 'triggered-vwap-alerts',
        loadComponent: () =>
          import('./triggered-vwap-alerts/triggered-vwap-alerts').then(
            (m) => m.TriggeredVwapAlerts
          ),
      },
      {
        path: 'archived-vwap-alerts',
        loadComponent: () =>
          import('./archived-vwap-alerts/archived-vwap-alerts').then((m) => m.ArchivedVwapAlerts),
      },

      // Дефолтный редирект для залогиненного юзера на рабочие алерты
      { path: '', redirectTo: 'working-line-alerts', pathMatch: 'full' },
    ],
  },

  // 3. Глобальный перехватчик (404 -> на главную, а там разберутся гарды)
  { path: '**', redirectTo: '' },
];
