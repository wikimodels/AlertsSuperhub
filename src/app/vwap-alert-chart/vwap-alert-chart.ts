import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-vwap-alert-chart',
  standalone: true,
  templateUrl: './vwap-alert-chart.html',
})
export class VwapAlertChart implements OnInit {
  private route = inject(ActivatedRoute);
  public symbol: string = '';

  ngOnInit(): void {
    // Читаем symbol из query params
    this.route.queryParamMap.subscribe((params) => {
      this.symbol = params.get('symbol') || '';
      console.log('📊 VwapAlertChart loaded for symbol:', this.symbol);

      // Здесь можно загрузить данные для этого symbol
      this.loadChartData();
    });
  }

  private loadChartData(): void {
    if (!this.symbol) return;

    // Загружаем данные чарта для this.symbol
    console.log('Loading VWAP data for', this.symbol);
  }
}
