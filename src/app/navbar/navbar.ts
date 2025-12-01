import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-navbar',
  imports: [
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    RouterLink, // Only import Router for navigation
  ],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.scss'],
  standalone: true,
})
export class Navbar {}
