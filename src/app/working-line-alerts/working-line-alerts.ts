import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';

import { LineAlert } from '../models/alerts';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';
import { PanelButtonComponent } from '../shared/components/panel-button/panel-button.component';
import { LineAlertsApiService } from '../shared/services/api/line-alerts-api.service';
import { SearchFilterComponent } from '../shared/components/search-filter/search-filter.component';

@Component({
  selector: 'app-working-line-alerts',
  standalone: true,
  imports: [
    CommonModule,
    SearchFilterComponent,
    PanelButtonComponent,
    LoadingSpinnerComponent,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
  ],
  templateUrl: './working-line-alerts.html',
  styleUrl: './working-line-alerts.scss',
})
export class WorkingLineAlerts implements OnInit {
  private api = inject(LineAlertsApiService);

  // Signals
  isLoading = signal<boolean>(true);
  alertsCount = signal<number>(0);

  // 1. DATA SOURCE
  dataSource = new MatTableDataSource<LineAlert>([]);

  // 2. COLUMNS
  displayedColumns: string[] = ['symbol', 'price', 'type', 'description', 'actions'];

  // 3. VIEW CHILD SETTERS (FIX FOR PAGINATOR BUG)
  // Мы используем set, чтобы при появлении элемента (когда isLoading станет false),
  // он автоматически привязывался к таблице.
  @ViewChild(MatPaginator) set paginator(pager: MatPaginator) {
    if (pager) {
      this.dataSource.paginator = pager;
    }
  }

  @ViewChild(MatSort) set sort(sorter: MatSort) {
    if (sorter) {
      this.dataSource.sort = sorter;
    }
  }

  constructor() {
    this.dataSource.filterPredicate = (data: LineAlert, filter: string) => {
      const dataStr = (data.symbol + data.price + (data.description || '')).toLowerCase();
      return dataStr.indexOf(filter) !== -1;
    };
  }

  ngOnInit() {
    this.loadAlerts();
  }

  // ngAfterViewInit больше не нужен, всё делают сеттеры выше

  async loadAlerts() {
    this.isLoading.set(true);
    try {
      const data = await this.api.getAllAlertsAsync();
      this.dataSource.data = data;
      this.alertsCount.set(data.length);

      // Если пагинатор уже есть, сбрасываем его на 1 страницу
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    } catch (error) {
      console.error('Failed to load alerts', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  onFilterChange(text: string) {
    this.dataSource.filter = text.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.alertsCount.set(this.dataSource.filteredData.length);
  }

  async deleteAlert(id: string) {
    if (!confirm('Delete alert?')) return;
    const success = await this.api.deleteAlertAsync(id);
    if (success) {
      const newData = this.dataSource.data.filter((a) => a._id !== id);
      this.dataSource.data = newData;
      this.alertsCount.set(newData.length);
    }
  }

  async deleteAll() {
    if (!confirm('Delete ALL?')) return;
    const count = await this.api.deleteAllAlertsAsync();
    if (count > 0) {
      this.dataSource.data = [];
      this.alertsCount.set(0);
    }
  }

  refresh() {
    this.loadAlerts();
  }

  closeWindows() {
    console.log('Close windows');
  }
}
