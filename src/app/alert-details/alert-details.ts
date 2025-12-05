import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SimpleCarouselComponent } from '../shared/components/simple-carousel/simple-carousel.component';
import { LineAlert, VwapAlert } from '../models/alerts';

@Component({
  selector: 'app-alert-details',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, SimpleCarouselComponent],
  templateUrl: './alert-details.html',
  styleUrls: ['./alert-details.scss'],
})
export class AlertDetails {
  constructor(
    public dialogRef: MatDialogRef<AlertDetails>,
    @Inject(MAT_DIALOG_DATA) public data: { alert: LineAlert | VwapAlert }
  ) {}

  onLogoError(event: Event) {
    (event.target as HTMLImageElement).src = 'assets/logo/no-name.svg';
  }

  close() {
    this.dialogRef.close();
  }
}
