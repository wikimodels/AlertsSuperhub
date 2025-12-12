import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleChange, MatSlideToggleModule } from '@angular/material/slide-toggle';

import { LineAlert, VwapAlert } from '../models/alerts';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';
import { UniversalAlertsApiService } from '../shared/services/api/universal-alerts-api.service';
import { SearchFilterComponent } from '../shared/components/search-filter/search-filter.component';
import { LinksComponent } from '../shared/components/links/links.component';
import { ChartActionsComponent } from '../shared/components/chart-actions/chart-actions.component';
import { GenericSelectionService } from '../shared/services/generic.selection.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ScrollResetDirective } from '../directives/scroll-reset.directive';
import { AlertsPanelButtonsComponent } from '../shared/components/alerts-panel-buttons/alerts-panel-buttons';

@Component({
  selector: 'app-archived-vwap-alerts',
  standalone: true,
  imports: [
    CommonModule,
    SearchFilterComponent,
    LoadingSpinnerComponent,
    ChartActionsComponent,
    LinksComponent,
    ScrollResetDirective,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    // 👇 Добавляем компонент в импорты
    AlertsPanelButtonsComponent,
  ],
  templateUrl: './archived-vwap-alerts.html',
  styleUrl: './archived-vwap-alerts.scss',
})
export class ArchivedVwapAlerts implements OnInit {
  private api = inject(UniversalAlertsApiService);
  public selectionService = inject(GenericSelectionService<LineAlert>);

  private selectionSignal = toSignal(this.selectionService.selectionChanges$, {
    initialValue: [],
  });

  isLoading = signal<boolean>(true);
  alertsCount = signal<number>(0);

  dataSource = new MatTableDataSource<VwapAlert>([]);
  displayedColumns: string[] = ['symbol', 'anchorTimeStr', 'links', 'actions', 'checkbox'];

  @ViewChild(MatPaginator) set paginator(pager: MatPaginator) {
    if (pager) {
      this.dataSource.paginator = pager;
      // Фикс для корректного отображения кол-ва страниц после загрузки
      if (this.dataSource.data.length > 0) {
        pager.length = this.dataSource.data.length;
      }
    }
  }

  @ViewChild(MatSort) set sort(sorter: MatSort) {
    if (sorter) this.dataSource.sort = sorter;
  }

  constructor() {
    this.dataSource.filterPredicate = (data: VwapAlert, filter: string) => {
      const dataStr = (data.symbol + data.price + (data.description || '')).toLowerCase();
      return dataStr.indexOf(filter) !== -1;
    };
  }

  ngOnInit() {
    this.loadAlerts();
  }

  async loadAlerts() {
    this.isLoading.set(true);
    try {
      const data = await this.api.getAlertsAsync<VwapAlert>('vwap', 'archived');
      this.dataSource.data = data;
      this.alertsCount.set(data.length);
      this.selectionService.clear();

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
}
