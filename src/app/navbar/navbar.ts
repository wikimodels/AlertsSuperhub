import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { VwapAlertMenuComponent } from './vwap-alert-menu/vwap-alert-menu.component';
import { LineAlertMenuComponent } from './line-alert-menu/line-alert-menu.component';

@Component({
  selector: 'app-navbar',
  imports: [
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
export class Navbar {}
