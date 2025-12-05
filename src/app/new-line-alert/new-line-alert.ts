import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { v4 as uuidv4 } from 'uuid';
import { WorkingCoin } from '../shared/models/working-coin.model';
import { UniversalAlertsApiService } from '../shared/services/api/universal-alerts-api.service';
import { C } from '@angular/cdk/keycodes';
import { LineAlert } from '../models/alerts';

@Component({
  selector: 'app-new-line-alert',
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
  templateUrl: './new-line-alert.html',
  styleUrls: ['./new-line-alert.scss'],
})
export class NewLineAlert implements OnInit {
  private api = inject(UniversalAlertsApiService);
  private fb = inject(FormBuilder);

  public form!: FormGroup;
  public coin: WorkingCoin;

  constructor(
    public dialogRef: MatDialogRef<NewLineAlert>,
    @Inject(MAT_DIALOG_DATA) public data: { coin: WorkingCoin }
  ) {
    this.coin = data.coin;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      price: [0, [Validators.required, Validators.pattern(/^\d*\.?\d*$/)]],
      action: ['Line Cross', Validators.required],
      description: [''],
      // Массив ссылок на картинки
      tvScreensUrls: this.fb.array([]),
    });
  }

  // --- Работа с массивом картинок ---
  get imagesArray() {
    return this.form.get('tvScreensUrls') as FormArray;
  }

  createImageControl() {
    return this.fb.control('', [
      Validators.required,
      // Простая валидация URL
      Validators.pattern(/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/),
    ]);
  }

  addLink() {
    this.imagesArray.push(this.createImageControl());
  }

  removeLink(index: number) {
    this.imagesArray.removeAt(index);
  }

  // --- Сохранение ---
  async onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const formVal = this.form.getRawValue(); // getRawValue чтобы получить disabled symbol

    // Формируем AlertName: Symbol @ Price
    const generatedAlertName = `${this.coin.symbol} @ ${formVal.price}`;

    // Собираем объект алерта
    const newAlert: LineAlert = {
      id: uuidv4(),
      symbol: this.coin.symbol,
      price: Number(formVal.price),
      alertName: generatedAlertName,
      description: formVal.description,
      tvScreensUrls: formVal.tvScreensUrls,

      // Данные из монеты
      exchanges: this.coin.exchanges || [],
      category: this.coin.category,
      logoUrl: this.coin.logoUrl, // Если нужно сохранять лого

      // Дефолтные поля
      isActive: true,
      color: '#ffffff', // Дефолтный цвет
      createdAt: new Date().toISOString(),
    };

    try {
      // Сохраняем через универсальный сервис
      const success = await this.api.addAlertAsync('line', 'working', newAlert);

      if (success) {
        this.dialogRef.close(true);
      }
    } catch (e) {
      console.error('Error creating alert', e);
    }
  }

  onCancel() {
    this.dialogRef.close();
  }
}
