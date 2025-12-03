import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'coins',
    // Ленивая загрузка (Lazy Loading):
    // Компонент загрузится, только когда пользователь перейдет на /coins
    loadComponent: () => import('./coins/coins').then((m) => m.Coins),
  },
  {
    path: 'line-alert-chart',
    // Ленивая загрузка (Lazy Loading):
    // Компонент загрузится, только когда пользователь перейдет на /coins
    loadComponent: () =>
      import('./line-alert-chart/line-alert-chart').then((m) => m.LineAlertChart),
  },
  {
    path: 'vwap-alert-chart',
    // Ленивая загрузка (Lazy Loading):
    // Компонент загрузится, только когда пользователь перейдет на /coins
    loadComponent: () =>
      import('./vwap-alert-chart/vwap-alert-chart').then((m) => m.VwapAlertChart),
  },
  {
    path: 'working-coins',
    // Ленивая загрузка (Lazy Loading):
    // Компонент загрузится, только когда пользователь перейдет на /coins
    loadComponent: () => import('./working-coins/working-coins').then((m) => m.WorkingCoins),
  },
];
