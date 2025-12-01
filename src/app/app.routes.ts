import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'coins',
    // Ленивая загрузка (Lazy Loading):
    // Компонент загрузится, только когда пользователь перейдет на /coins
    loadComponent: () => import('./coins/coins').then((m) => m.Coins),
  },
];
