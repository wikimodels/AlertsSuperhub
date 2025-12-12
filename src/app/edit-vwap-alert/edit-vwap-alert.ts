import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { formatDate } from '@angular/common';
// 🚀 ДОБАВЛЕНО: AlertStatus
import { AlertStatus, VwapAlert } from '../models/alerts';
import { UniversalAlertsApiService } from '../shared/services/api/universal-alerts-api.service';

@Component({
  selector: 'app-edit-vwap-alert',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './edit-vwap-alert.html',
  styleUrls: ['./edit-vwap-alert.scss'],
})
export class EditVwapAlert implements OnInit {
  private api = inject(UniversalAlertsApiService);
  private fb = inject(FormBuilder);

  public form!: FormGroup;
  public alert: VwapAlert;
  // 🚀 НОВОЕ: Свойство для статуса
  public status: AlertStatus;

  constructor(
    public dialogRef: MatDialogRef<EditVwapAlert>,
    // 🚀 ОБНОВЛЕНО: Принимаем { alert, status }
    @Inject(MAT_DIALOG_DATA) public data: { alert: VwapAlert; status: AlertStatus }
  ) {
    this.alert = data.alert;
    // Если статус не передан, ставим 'working' как fallback (для обратной совместимости)
    this.status = data.status || 'working';
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      anchorTime: [
        {
          value: formatDate(
            this.alert.anchorTimeStr || new Date().toISOString(),
            'yyyy-MM-dd HH:mm:ss',
            'en'
          ),
          disabled: true,
        },
        Validators.required,
      ],
      description: [this.alert.description || ''],
      tvScreensUrls: this.fb.array([]),
    });

    if (this.alert.tvScreensUrls && this.alert.tvScreensUrls.length > 0) {
      this.alert.tvScreensUrls.forEach((url) => {
        this.imagesArray.push(this.createImageControl(url));
      });
    }
  }

  get imagesArray() {
    return this.form.get('tvScreensUrls') as FormArray;
  }

  createImageControl(initialValue: string = '') {
    return this.fb.control(initialValue, [
      Validators.required,
      Validators.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/),
    ]);
  }

  addLink() {
    this.imagesArray.push(this.createImageControl());
  }

  removeLink(index: number) {
    this.imagesArray.removeAt(index);
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formVal = this.form.value;

    const updatePayload = {
      description: formVal.description,
      tvScreensUrls: formVal.tvScreensUrls,
    };

    try {
      console.log('🚀 Sending Update:', updatePayload);
      console.log('🚀 Status:', this.status);
      console.log('🚀 Alert ID:', this.alert.id);
      // 🚀 ИСПОЛЬЗУЕМ this.status
      const success = await this.api.updateAlertAsync(
        'vwap',
        this.status, // Динамический статус (working/archived)
        this.alert.id,
        updatePayload
      );

      if (success) {
        this.dialogRef.close(true);
      }
    } catch (e) {
      console.error('Error updating alert', e);
    }
  }

  onLogoError(event: Event) {
    const element = event.target as HTMLImageElement;
    element.src = 'assets/logo/no-name.svg';
  }

  onCancel() {
    this.dialogRef.close();
  }
}
