import { Component, ChangeDetectionStrategy, input, inject, output } from '@angular/core'; // 1. Добавили output
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// Проверь путь
import { WorkingCoin } from '../../models/working-coin.model';
import { LineAlert, VwapAlert, AlertStatus } from '../../../models/alerts';
import { EditLineAlert } from '../../../edit-line-alert/edit-line-alert';
import { AlertDetails } from '../../../alert-details/alert-details';
import { EditVwapAlert } from '../../../edit-vwap-alert/edit-vwap-alert';

type LinkableObject = WorkingCoin | LineAlert | VwapAlert;

@Component({
  selector: 'app-chart-actions',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatDialogModule],
  templateUrl: './chart-actions.component.html',
  styleUrls: ['./chart-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartActionsComponent {
  private dialog = inject(MatDialog);

  linkableObject = input.required<LinkableObject>();
  status = input<AlertStatus>('working');

  // 🚀 НОВОЕ: Событие, которое полетит наверх, когда алерт обновлен
  alertUpdated = output<void>();
  // Если angular старый (до v17.3), используй: @Output() alertUpdated = new EventEmitter<void>();

  goToLineAlertCharts(event: MouseEvent): void {
    event.stopPropagation();
    window.open(
      `/line-alert-chart?symbol=${encodeURIComponent(this.linkableObject().symbol)}`,
      '_blank'
    );
  }

  goToVwapAlertCharts(event: MouseEvent): void {
    event.stopPropagation();
    window.open(
      `/vwap-alert-chart?symbol=${encodeURIComponent(this.linkableObject().symbol)}`,
      '_blank'
    );
  }

  goToDetails(event: MouseEvent): void {
    event.stopPropagation();
    const obj = this.linkableObject();

    // Проверяем, что это Алерт (Line или VWAP)
    // У working-coin может не быть описания/картинок так, как у алертов
    if ('alertName' in obj) {
      // Простая проверка на AlertBase
      this.dialog.open(AlertDetails, {
        // Настройки Full Screen
        width: '98vw',
        height: '98vh',
        maxWidth: '100vw',
        panelClass: 'details-modal-panel', // Можно добавить в styles.scss если нужно убрать скругления
        autoFocus: false,
        data: { alert: obj },
      });
    } else {
      console.warn('Details view is not implemented for Coins yet.');
    }
  }

  goToEdit(event: MouseEvent): void {
    event.stopPropagation();
    const obj = this.linkableObject();

    if ('alertName' in obj && !('anchorTime' in obj)) {
      const dialogRef = this.dialog.open(EditLineAlert, {
        data: {
          alert: obj as LineAlert,
          status: this.status(),
        },
      });

      // 🚀 НОВОЕ: Слушаем закрытие диалога
      dialogRef.afterClosed().subscribe((result) => {
        // Если result === true (мы передавали это в dialogRef.close(true))
        if (result === true) {
          // Сообщаем родителю: "Обнови список!"
          this.alertUpdated.emit();
        }
      });
    } else if ('anchorTime' in obj) {
      const dialogRef = this.dialog.open(EditVwapAlert, {
        data: {
          alert: obj as VwapAlert,
          status: this.status(),
        },
      });

      // 🚀 НОВОЕ: Слушаем закрытие диалога
      dialogRef.afterClosed().subscribe((result) => {
        // Если result === true (мы передавали это в dialogRef.close(true))
        if (result === true) {
          // Сообщаем родителю: "Обнови список!"
          this.alertUpdated.emit();
          this.dialog.closeAll();
        }
      });
    } else {
      console.warn('Edit view is not implemented for this model yet.');
    }
  }
}
