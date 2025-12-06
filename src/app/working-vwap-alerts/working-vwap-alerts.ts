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
  selector: 'app-working-vwap-alerts',
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
  templateUrl: './working-vwap-alerts.html',
  styleUrl: './working-vwap-alerts.scss',
})
export class WorkingVwapAlerts implements OnInit {
  private api = inject(UniversalAlertsApiService);
  public selectionService = inject(GenericSelectionService<LineAlert>);

  private selectionSignal = toSignal(this.selectionService.selectionChanges$, {
    initialValue: [],
  });

  isLoading = signal<boolean>(true);
  alertsCount = signal<number>(0);

  dataSource = new MatTableDataSource<VwapAlert>([]);
  displayedColumns: string[] = [
    'symbol',
    'anchorTimeStr',
    'isActive',
    'links',
    'actions',
    'checkbox',
  ];

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
      const data = await this.api.getAlertsAsync<VwapAlert>('vwap', 'working');
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

  // Логика переключения Active в таблице (остается здесь, так как привязана к строке)
  async toggleActiveState(alert: VwapAlert, event: MatSlideToggleChange) {
    const newValue = event.checked;
    const previousValue = !newValue;

    if (!alert.id) {
      console.error('❌ Ошибка: У алерта нет ID!', alert);
      event.source.checked = previousValue;
      return;
    }

    alert.isActive = newValue;

    try {
      const success = await this.api.updateAlertAsync('line', 'working', alert.id, {
        isActive: newValue,
      });

      if (!success) {
        console.warn('⚠️ API вернул false (не обновлено)');
        alert.isActive = previousValue;
        event.source.checked = previousValue;
      }
    } catch (err) {
      alert.isActive = previousValue;
      event.source.checked = previousValue;
      console.error('❌ Failed to update active state', err);
    }
  }
}
