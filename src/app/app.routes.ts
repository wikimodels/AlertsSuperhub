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
  {
    path: 'working-line-alerts',
    // Ленивая загрузка (Lazy Loading):
    // Компонент загрузится, только когда пользователь перейдет на /coins
    loadComponent: () =>
      import('./working-line-alerts/working-line-alerts').then((m) => m.WorkingLineAlerts),
  },
  {
    path: 'triggered-line-alerts',
    // Ленивая загрузка (Lazy Loading):
    // Компонент загрузится, только когда пользователь перейдет на /coins
    loadComponent: () =>
      import('./triggered-line-alerts/triggered-line-alerts').then((m) => m.TriggeredLineAlerts),
  },
  {
    path: 'archived-line-alerts',
    // Ленивая загрузка (Lazy Loading):
    // Компонент загрузится, только когда пользователь перейдет на /coins
    loadComponent: () =>
      import('./archived-line-alerts/archived-line-alerts').then((m) => m.ArchivedLineAlerts),
  },
];
