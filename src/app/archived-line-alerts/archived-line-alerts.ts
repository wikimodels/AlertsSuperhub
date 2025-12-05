import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';

import { LineAlert } from '../models/alerts';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';
import { PanelButtonComponent } from '../shared/components/panel-button/panel-button.component';

// 🚀 CHANGE #1: Import Universal Service
import { UniversalAlertsApiService } from '../shared/services/api/universal-alerts-api.service';

import { SearchFilterComponent } from '../shared/components/search-filter/search-filter.component';
import { LinksComponent } from '../shared/components/links/links.component';
import { ChartActionsComponent } from '../shared/components/chart-actions/chart-actions.component';
import { GenericSelectionService } from '../shared/services/generic.selection.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ScrollResetDirective } from '../directives/scroll-reset.directive';

@Component({
  selector: 'app-archived-line-alerts', // 🚀 FIXED: Selector name to match component
  standalone: true,
  imports: [
    CommonModule,
    SearchFilterComponent,
    PanelButtonComponent,
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
  ],
  templateUrl: './archived-line-alerts.html',
  styleUrl: './archived-line-alerts.scss',
})
export class ArchivedLineAlerts implements OnInit {
  // 🚀 CHANGE #2: Inject Universal Service
  private api = inject(UniversalAlertsApiService);

  public selectionService = inject(GenericSelectionService<LineAlert>);

  private selectionSignal = toSignal(this.selectionService.selectionChanges$, {
    initialValue: [],
  });

  isLoading = signal<boolean>(true);
  alertsCount = signal<number>(0);

  dataSource = new MatTableDataSource<LineAlert>([]);
  displayedColumns: string[] = ['symbol', 'alertName', 'links', 'actions', 'checkbox'];

  @ViewChild(MatPaginator) set paginator(pager: MatPaginator) {
    if (pager) this.dataSource.paginator = pager;
  }

  @ViewChild(MatSort) set sort(sorter: MatSort) {
    if (sorter) this.dataSource.sort = sorter;
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

  async loadAlerts() {
    this.isLoading.set(true);
    try {
      // 🚀 CHANGE #3: Fetch ('line', 'archived')
      const data = await this.api.getAlertsAsync<LineAlert>('line', 'archived');

      this.dataSource.data = data;
      this.alertsCount.set(data.length);
      this.selectionService.clear();

      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    } catch (error) {
      console.error('Failed to load archived alerts', error);
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

  // --- SELECTION LOGIC ---

  isAllSelected() {
    const numSelected = this.selectionService.selectedValues().length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selectionService.clear()
      : this.selectionService.select(this.dataSource.data);
  }

  hasSelection(): boolean {
    return this.selectionService.hasValue();
  }

  getSelectAllIcon(): string {
    if (this.isAllSelected()) return 'check_box';
    if (this.hasSelection()) return 'indeterminate_check_box';
    return 'check_box_outline_blank';
  }

  // --- ACTIONS ---

  async deleteSelected() {
    const selected = this.selectionService.selectedValues();
    if (selected.length === 0) return;

    const ids = selected.map((a) => a.id).filter((id): id is string => !!id);
    if (ids.length === 0) return;

    // 🚀 CHANGE #4: Delete from ('line', 'archived')
    const deletedCount = await this.api.deleteAlertsBatchAsync('line', 'archived', ids);

    if (deletedCount > 0) {
      const deletedIdsSet = new Set(ids);
      const newData = this.dataSource.data.filter((a) => !deletedIdsSet.has(a.id!));

      this.dataSource.data = newData;
      this.alertsCount.set(newData.length);
      this.selectionService.clear();
    }
  }

  // 🚀 CHANGE #5: Renamed to restoreSelected (Archived -> Working)
  async restoreSelected() {
    const selected = this.selectionService.selectedValues();
    if (selected.length === 0) return;

    const ids = selected.map((a) => a.id).filter((id): id is string => !!id);
    if (ids.length === 0) return;

    // Move FROM 'archived' TO 'working'
    const movedCount = await this.api.moveAlertsAsync(
      'line', // Type
      'archived', // From
      'working', // To
      ids
    );

    if (movedCount > 0) {
      // Remove restored items from the archive table
      const movedIdsSet = new Set(ids);
      const newData = this.dataSource.data.filter((a) => !movedIdsSet.has(a.id!));

      this.dataSource.data = newData;
      this.alertsCount.set(newData.length);
      this.selectionService.clear();
    }
  }

  refresh() {
    this.loadAlerts();
  }

  closeWindows() {
    console.log('Close windows');
  }
}
