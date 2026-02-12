import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PanelButtonComponent } from '../panel-button/panel-button.component';
import { CoinWindowService } from '../../services/coin-window.service';
import { GenericSelectionService } from '../../services/generic.selection.service';
import { UniversalAlertsApiService } from '../../services/api/universal-alerts-api.service';
import { AlertType, AlertStatus, LineAlert, VwapAlert } from '../../../models/alerts';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { WorkingCoin } from '../../models/working-coin.model';

@Component({
  selector: 'app-alerts-panel-buttons',
  standalone: true,
  imports: [CommonModule, PanelButtonComponent, MatDialogModule],
  templateUrl: './alerts-panel-buttons.html',
  // styleUrl: './alerts-panel-buttons.scss' // Если нужен, создай пустой или перенеси стили
})
export class AlertsPanelButtonsComponent {
  // 👇 Инъекции сервисов
  private coinWindowService = inject(CoinWindowService);
  public selectionService = inject(GenericSelectionService<any>); // <any> чтобы принимать и LineAlert и VwapAlert
  private api = inject(UniversalAlertsApiService);
  private dialog = inject(MatDialog);

  // 👇 Входящие параметры (чтобы компонент знал, с чем работает)
  @Input({ required: true }) type!: AlertType; // 'line' | 'vwap'
  @Input({ required: true }) status!: AlertStatus; // 'working' | 'archived' | 'triggered'
  @Input() data: any[] = []; // Данные таблицы (нужны для "Select All")

  // 👇 События наверх
  @Output() refreshClicked = new EventEmitter<void>();
  @Output() dataChanged = new EventEmitter<void>(); // Удаление/Архивация прошли успешно -> обнови таблицу

  private readonly bitcoinUrl = 'https://www.tradingview.com/chart?symbol=BYBIT:BTCUSDT.P';

  // --- ЛОГИКА ВЫДЕЛЕНИЯ ---

  hasSelection(): boolean {
    return this.selectionService.hasValue();
  }

  isAllSelected(): boolean {
    const numSelected = this.selectionService.selectedValues().length;
    const numRows = this.data.length;
    return numSelected === numRows && numRows > 0;
  }

  masterToggle() {
    this.isAllSelected() ? this.selectionService.clear() : this.selectionService.select(this.data);
  }

  getSelectAllIcon(): string {
    if (this.isAllSelected()) return 'check_box';
    if (this.hasSelection()) return 'indeterminate_check_box';
    return 'check_box_outline_blank';
  }

  // --- ЛОГИКА ОКОН ---

  async openTradingView() {
    const selected = this.selectionService.selectedValues();
    if (selected.length === 0) return;
    await this.coinWindowService.openTradingView(this.mapToWorkingCoins(selected));
  }

  async openCoinGlass() {
    const selected = this.selectionService.selectedValues();
    if (selected.length === 0) return;
    await this.coinWindowService.openCoinGlass(this.mapToWorkingCoins(selected));
  }

  async goToVwapAlertCharts() {
    const selected = this.selectionService.selectedValues();
    if (selected.length === 0) return;
    await this.coinWindowService.openVwapAlertCharts(this.mapToWorkingCoins(selected));
  }

  async goToLineAlertCharts() {
    const selected = this.selectionService.selectedValues();
    if (selected.length === 0) return;
    await this.coinWindowService.openLineAlertCharts(this.mapToWorkingCoins(selected));
  }

  openBitcoinChart() {
    this.coinWindowService.openSingleWindow(this.bitcoinUrl);
  }

  closeWindows() {
    this.coinWindowService.closeAllWindows();
  }

  // --- ЛОГИКА ДЕЙСТВИЙ (API) ---

  onRefresh() {
    this.refreshClicked.emit();
  }

  async deleteSelected() {
    const selected = this.selectionService.selectedValues();
    if (selected.length === 0) return;

    const ids = selected.map((a) => a.id).filter((id): id is string => !!id);
    if (ids.length === 0) return;

    // 🚀 Stylish & Larger Dialog
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '600px', // Much larger width
      // height: 'auto', // Let content dictate height, but ensure it's spacious
      panelClass: 'custom-confirm-dialog', // We'll verify if this class is used/needed
      data: {
        title: 'Delete Alerts',
        message: `Are you sure you want to delete <b>${ids.length}</b> alerts?<br><span style="font-size: 0.9em; opacity: 0.7">This action cannot be undone.</span>`,
        confirmText: 'Delete',
        cancelText: 'Cancel',
      },
    });

    const result = await dialogRef.afterClosed().toPromise();
    if (!result) return;

    // Используем универсальный сервис
    const count = await this.api.deleteAlertsBatchAsync(this.type, this.status, ids);

    if (count > 0) {
      this.selectionService.clear();
      this.dataChanged.emit(); // Сигнализируем родителю обновить таблицу
    }
  }

  async moveToArchive() {
    // Эта кнопка имеет смысл только для Working/Triggered
    if (this.status === 'archived') return;

    const selected = this.selectionService.selectedValues();
    if (selected.length === 0) return;

    const ids = selected.map((a) => a.id).filter((id): id is string => !!id);
    if (ids.length === 0) return;

    // Перемещаем в 'archived'
    const count = await this.api.moveAlertsAsync(this.type, this.status, 'archived', ids);

    if (count > 0) {
      this.selectionService.clear();
      this.dataChanged.emit();
    }
  }

  // Хелпер для преобразования Alert -> WorkingCoin
  private mapToWorkingCoins(alerts: any[]): WorkingCoin[] {
    return alerts.map((a) => ({
      symbol: a.symbol,
      category: a.category || 0,
      exchanges: a.exchanges || ['BYBIT'],
    }));
  }
}
