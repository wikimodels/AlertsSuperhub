import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { VwapAlertMenuComponent } from './vwap-alert-menu/vwap-alert-menu.component';
import { LineAlertMenuComponent } from './line-alert-menu/line-alert-menu.component';
import { AuthService } from '../auth/auth.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-navbar',
  imports: [
    AsyncPipe,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterLink,
    VwapAlertMenuComponent,
    LineAlertMenuComponent,
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
  standalone: true,
})
export class Navbar {
  private authService = inject(AuthService);
  // private notification удален

  user$ = this.authService.user$;
  login() {
    // Просто вызываем метод. Уведомления покажет сервис.
    this.authService.loginWithGoogle();
  }

  logout() {
    this.authService.logout();
  }
}
