import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  inject,
  computed,
  AfterViewInit,
  OnDestroy,
  effect,
  signal,
  NgZone,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';
import { CoinWindowService } from '../shared/services/coin-window.service';
import { WorkingCoin } from '../shared/models/working-coin.model';

// Lightweight Charts v5
import {
  createChart,
  IChartApi,
  ISeriesApi,
  LineStyle,
  HistogramData,
  CandlestickData,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  Time,
} from 'lightweight-charts';
import { ChartDataService } from '../shared/services/chart-data.service';
import { PanelButtonComponent } from '../shared/components/panel-button/panel-button.component';
import { VwapAlert } from '../models/alerts';

// 🚀 FIX: Заменили старый сервис на универсальный
import { UniversalAlertsApiService } from '../shared/services/api/universal-alerts-api.service';
import { AlertType, AlertStatus } from '../models/alerts';
import { getSmartPriceFormat } from '../shared/functions/get-smart-price-format';

interface OHLCVData extends CandlestickData {
  volume: number;
}

interface VwapLineObject {
  id: string;
  alertId: string; // UUID из БД
  anchorTime: number; // timestamp в секундах
  anchorIndex: number; // индекс в массиве data
  series: ISeriesApi<'Line'>;
  color: string;
  createdAt?: string; // ✅ Всегда string, не optional
  data: Array<{ time: Time; value: number }>;
}

@Component({
  selector: 'app-vwap-alert-chart',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, PanelButtonComponent],
  templateUrl: './vwap-alert-chart.html',
  styleUrls: ['../../app/shared/styles/chart-layout.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VwapAlertChart implements AfterViewInit, OnDestroy {
  public isLoading = signal(true);
  private chartDataService = inject(ChartDataService);

  // 🚀 FIX: Инжектируем новый сервис
  private api = inject(UniversalAlertsApiService);

  // 🚀 FIX: Задаем параметры для VWAP Alerts (Working)
  private readonly alertType: AlertType = 'vwap';
  private readonly alertStatus: AlertStatus = 'working';

  private route = inject(ActivatedRoute);
  private zone = inject(NgZone);
  private coinWindowService = inject(CoinWindowService);

  private queryParams = toSignal(this.route.queryParamMap);
  public symbol = computed(() => this.queryParams()?.get('symbol') ?? '');

  public category = signal<number>(0);
  public exchanges = signal<string[]>(['BYBIT']);

  @ViewChild('chartContainer')
  private chartContainerRef!: ElementRef<HTMLDivElement>;

  private chartApi: IChartApi | null = null;
  private candleSeries: ISeriesApi<'Candlestick'> | null = null;
  private volumeSeries: ISeriesApi<'Histogram'> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private candleData: OHLCVData[] = [];
  private vwapLines: VwapLineObject[] = [];
  private lineColors = ['#2962FF', '#F23645', '#089981', '#FF6D00', '#7C4DFF'];

  constructor() {
    effect(() => {
      const currentSymbol = this.symbol();
      if (currentSymbol) {
        console.log(`[VwapChart] Эффект: символ изменился на ${currentSymbol}`);
        this.clearAllVWAPLines();
        this.loadChartData(currentSymbol);
      }
    });
  }

  ngAfterViewInit(): void {
    if (!this.chartContainerRef) return;
    this.zone.runOutsideAngular(() => {
      this.initChart();
      this.setupResizeObserver();
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chartApi?.remove();
    this.clearAllVWAPLines();
    console.log('[VwapChart] Уничтожен');
  }

  // ============================================
  // Panel Button Handlers
  // ============================================

  private getCurrentCoinAsArray(): WorkingCoin[] {
    const sym = this.symbol();
    if (!sym) return [];
    return [{ symbol: sym, category: this.category() } as WorkingCoin];
  }

  public async openTradingView(): Promise<void> {
    await this.coinWindowService.openTradingView(this.getCurrentCoinAsArray());
  }

  public async openCoinGlass(): Promise<void> {
    await this.coinWindowService.openCoinGlass(this.getCurrentCoinAsArray());
  }

  public openBitcoinChart(): void {
    this.coinWindowService.openSingleWindow(
      'https://www.tradingview.com/chart?symbol=BYBIT:BTCUSDT.P'
    );
  }

  public closeWindows(): void {
    this.coinWindowService.closeAllWindows();
  }

  // ============================================
  // Chart Initialization & Data Loading
  // ============================================

  private initChart(): void {
    console.log('[VwapChart] Инициализация...');
    this.chartApi = createChart(this.chartContainerRef.nativeElement, {
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255, 255, 255, 0.7)',
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.05)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.05)' },
      },
      crosshair: {
        mode: 0,
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        visible: true,
        autoScale: true,
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: true,
      handleScale: true,
    });

    if (!this.chartApi) {
      console.error('❌ [VwapChart] Не удалось создать инстанс графика.');
      return;
    }

    this.candleSeries = this.chartApi.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      priceLineVisible: false,
    });

    this.volumeSeries = this.chartApi.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: '',
      color: 'rgba(128, 128, 255, 0.5)',
      lastValueVisible: false,
      priceLineVisible: false,
    });

    if (this.volumeSeries) {
      this.volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
    }

    this.subscribeToChartClicks();
    this.loadChartData(this.symbol());
  }

  private async loadChartData(symbol: string): Promise<void> {
    if (!this.candleSeries || !this.volumeSeries || !this.chartApi || !symbol) {
      console.log(`[VwapChart] Загрузка отложена или символ отсутствует.`);
      return;
    }

    this.zone.run(() => this.isLoading.set(true));
    console.log(`[VwapChart] Загрузка данных для ${symbol}...`);

    const response = await this.chartDataService.getChartData(symbol);

    if (!response || response.chartFormattedData.length === 0) {
      console.warn(`[VwapChart] Нет данных для ${symbol}, очищаем график.`);
      this.candleSeries.setData([]);
      this.volumeSeries.setData([]);
      this.candleData = [];

      this.zone.run(() => {
        this.category.set(0);
        this.exchanges.set(['BYBIT']);
      });
    } else {
      const { chartFormattedData, category, exchanges } = response;

      this.zone.run(() => {
        this.category.set(category);
        this.exchanges.set(exchanges);
      });

      console.log(`[VwapChart] 📊 Категория: ${category}, Биржи: ${exchanges.join(', ')}`);

      // 🧠 START SMART FORMAT LOGIC
      // 1. Берем цену закрытия последней свечи
      const lastClosePrice = chartFormattedData[chartFormattedData.length - 1].close;

      // 2. Вычисляем формат
      const smartFormat = getSmartPriceFormat(lastClosePrice);
      console.log(`[VwapChart] 🧠 Smart Format для ${symbol} (${lastClosePrice}):`, smartFormat);

      // 3. Применяем к серии свечей
      this.candleSeries.applyOptions({
        priceFormat: smartFormat,
      });
      // 🧠 END SMART FORMAT LOGIC

      const candleData: OHLCVData[] = chartFormattedData.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume,
      }));

      const volumeData: HistogramData[] = chartFormattedData.map((d) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(38, 166, 154, 0.5)' : 'rgba(239, 83, 80, 0.5)',
      }));

      this.candleData = candleData;
      this.candleSeries.setData(candleData);
      this.volumeSeries.setData(volumeData);
      this.chartApi.timeScale().fitContent();

      // ✅ Загружаем существующие VWAP алерты после загрузки свечей
      await this.loadVWAPAlerts(symbol);
    }

    this.zone.run(() => this.isLoading.set(false));
  }

  private setupResizeObserver(): void {
    if (!this.chartContainerRef) return;
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry?.contentRect) {
        const { width, height } = entry.contentRect;
        this.chartApi?.applyOptions({ width, height });
      }
    });
    this.resizeObserver.observe(this.chartContainerRef.nativeElement);
  }

  // ============================================
  // ✅ Load Existing VWAP Alerts from API
  // ============================================

  private async loadVWAPAlerts(symbol: string): Promise<void> {
    if (!this.chartApi || this.candleData.length === 0) return;

    try {
      console.log(`[VwapChart] 🔥 Загрузка существующих VWAP алертов для ${symbol}...`);

      // 🚀 FIX: Используем новый сервис
      const allAlerts = await this.api.getAlertsAsync<VwapAlert>(this.alertType, this.alertStatus);

      const symbolAlerts = allAlerts.filter((alert) => alert.symbol === symbol);

      console.log(`[VwapChart] Найдено ${symbolAlerts.length} VWAP алертов для ${symbol}`);

      for (const alert of symbolAlerts) {
        if (!alert.anchorTime) {
          console.warn(`⚠️ VWAP Alert ${alert.id} не имеет anchorTime, пропускаем`);
          continue;
        }

        // Преобразуем anchorTime (миллисекунды) в секунды для поиска
        const anchorTimeInSeconds = Math.floor(alert.anchorTime / 1000);

        await this.restoreVWAPLine(alert, anchorTimeInSeconds);
      }
    } catch (error) {
      console.error('[VwapChart] ❌ Ошибка загрузки VWAP алертов:', error);
    }
  }

  // ============================================
  // VWAP Calculation & Management
  // ============================================

  private calculateAnchoredVWAP(anchorIndex: number): Array<{ time: Time; value: number }> {
    const vwapData: Array<{ time: Time; value: number }> = [];
    let cumulativePV = 0;
    let cumulativeVolume = 0;

    for (let i = anchorIndex; i < this.candleData.length; i++) {
      const bar = this.candleData[i];
      const typicalPrice = (bar.high + bar.low + bar.close) / 3;

      cumulativePV += typicalPrice * bar.volume;
      cumulativeVolume += bar.volume;

      vwapData.push({
        time: bar.time,
        value: cumulativePV / cumulativeVolume,
      });
    }

    return vwapData;
  }

  private async restoreVWAPLine(alert: VwapAlert, anchorTimeInSeconds: number): Promise<void> {
    const anchorIndex = this.candleData.findIndex((bar) => {
      const barTime = typeof bar.time === 'number' ? bar.time : (bar.time as any).timestamp || 0;
      return barTime >= anchorTimeInSeconds;
    });

    if (anchorIndex === -1 || anchorIndex === this.candleData.length - 1) {
      console.warn(`⚠️ VWAP ${alert.id} не восстановлен: свеча не найдена в текущих данных`);
      return;
    }

    const vwapData = this.calculateAnchoredVWAP(anchorIndex);
    if (vwapData.length === 0) return;

    const color = alert.color || this.lineColors[this.vwapLines.length % this.lineColors.length];

    const vwapSeries = this.chartApi!.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      lastValueVisible: false,
      crosshairMarkerVisible: true,
      priceLineVisible: false,
    });

    vwapSeries.setData(vwapData);

    const vwapObject: VwapLineObject = {
      id: this.generateVWAPId(),
      alertId: alert.id,
      anchorTime: anchorTimeInSeconds,
      anchorIndex,
      series: vwapSeries,
      color,
      createdAt: alert.createdAt || new Date().toISOString(),
      data: vwapData,
    };

    this.vwapLines.push(vwapObject);

    console.log(
      `✅ VWAP восстановлен: ${alert.alertName || alert.symbol} @ anchor ${new Date(
        anchorTimeInSeconds * 1000
      ).toLocaleString()}`
    );
  }

  // ============================================
  // Chart Click Handler
  // ============================================

  private subscribeToChartClicks(): void {
    if (!this.chartApi) return;

    this.chartApi.subscribeClick((param) => {
      if (!param?.point || !param.time || !this.candleSeries) return;

      const candleData = param.seriesData.get(this.candleSeries);
      if (!candleData) return;

      const clickedPrice = this.candleSeries.coordinateToPrice(param.point.y);
      if (clickedPrice === null || clickedPrice === undefined) return;

      this.zone.run(async () => {
        // 🎯 Проверяем клик на VWAP линию
        for (let i = this.vwapLines.length - 1; i >= 0; i--) {
          const vwapObj = this.vwapLines[i];
          const vwapDataPoint = vwapObj.data.find((point) => point.time === param.time);

          if (vwapDataPoint) {
            const vwapValue = vwapDataPoint.value;
            const tolerance = vwapValue * 0.001; // 0.1% толерантность

            if (Math.abs(clickedPrice - vwapValue) <= tolerance) {
              console.log(`🎯 Клик на VWAP линию ID: ${vwapObj.id}`);
              await this.removeVWAPLine(vwapObj, i);
              return;
            }
          }
        }

        // 🎯 Проверяем клик на свечу
        const isOnCandle =
          clickedPrice >= (candleData as any).low && clickedPrice <= (candleData as any).high;

        if (isOnCandle) {
          console.log('🎯 Добавляем новую VWAP линию...');
          await this.addVWAPLine(param.time as number);
        }
      });
    });

    console.log('[VwapChart] 💡 Подписка на клики установлена.');
  }

  // ============================================
  // ✅ Add VWAP Line (Save to API)
  // ============================================

  private async addVWAPLine(clickedTime: number): Promise<void> {
    if (!this.chartApi || this.candleData.length === 0) return;

    const anchorIndex = this.candleData.findIndex((bar) => {
      const barTime = typeof bar.time === 'number' ? bar.time : (bar.time as any).timestamp || 0;
      return barTime >= clickedTime;
    });

    if (anchorIndex === -1 || anchorIndex === this.candleData.length - 1) {
      console.warn('❌ Невозможно добавить VWAP: свеча не найдена');
      return;
    }

    const vwapData = this.calculateAnchoredVWAP(anchorIndex);
    if (vwapData.length === 0) return;

    const color = this.lineColors[this.vwapLines.length % this.lineColors.length];
    const anchorBar = this.candleData[anchorIndex];
    const anchorPrice = (anchorBar.high + anchorBar.low + anchorBar.close) / 3;

    const newAlert: VwapAlert = {
      id: this.generateUUID(),
      symbol: this.symbol(),
      alertName: `VWAP ${this.symbol()}`,
      price: anchorPrice,
      anchorTime: clickedTime * 1000,
      anchorTimeStr: new Date(clickedTime * 1000).toISOString(),
      anchorPrice,
      exchanges: this.exchanges(),
      category: this.category(),
      color,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const vwapSeries = this.chartApi.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      lastValueVisible: false,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
    });

    vwapSeries.setData(vwapData);

    const vwapObject: VwapLineObject = {
      id: this.generateVWAPId(),
      alertId: newAlert.id,
      anchorTime: clickedTime,
      anchorIndex,
      series: vwapSeries,
      color,
      createdAt: newAlert.createdAt,
      data: vwapData,
    };

    try {
      // 🚀 FIX: Используем новый сервис
      await this.api.addAlertAsync(this.alertType, this.alertStatus, newAlert);

      this.vwapLines.push(vwapObject);

      console.log('%c✅ СОЗДАН VWAP Alert:', 'color: green; font-weight: bold;', {
        symbol: newAlert.symbol,
        anchorTime: new Date(clickedTime * 1000).toLocaleString(),
        anchorPrice: anchorPrice.toFixed(2),
      });
    } catch (error) {
      console.error('[VwapChart] ❌ Ошибка сохранения VWAP алерта:', error);
      this.chartApi.removeSeries(vwapSeries);
    }
  }

  // ============================================
  // ✅ Remove VWAP Line (Delete from API)
  // ============================================

  private async removeVWAPLine(vwapObject: VwapLineObject, index: number): Promise<void> {
    if (!this.chartApi) return;

    try {
      // 🚀 FIX: Используем новый сервис (deleteAlertAsync добавлен в UniversalAlertsApiService)
      await this.api.deleteAlertAsync(this.alertType, this.alertStatus, vwapObject.alertId);

      console.log('%c🗑️ УДАЛЁН VWAP Alert:', 'color: red; font-weight: bold;', vwapObject.alertId);

      this.chartApi.removeSeries(vwapObject.series);
      this.vwapLines.splice(index, 1);
    } catch (error) {
      console.error('[VwapChart] ❌ Ошибка удаления VWAP алерта:', error);
    }
  }

  // ============================================
  // Clear All VWAP Lines (Local Only)
  // ============================================

  private clearAllVWAPLines(): void {
    if (!this.chartApi) return;

    const linesToRemove = [...this.vwapLines];

    linesToRemove.forEach((vwapObj) => {
      const realIndex = this.vwapLines.indexOf(vwapObj);
      if (realIndex > -1) {
        this.chartApi!.removeSeries(vwapObj.series);
        this.vwapLines.splice(realIndex, 1);
      }
    });

    this.vwapLines = [];
    console.log('[VwapChart] Все VWAP линии очищены.');
  }

  // ============================================
  // Utilities
  // ============================================

  private generateVWAPId(): string {
    return `vwap_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  goToLineAlertCharts(): void {
    this.coinWindowService.openLineAlertCharts(this.getCurrentCoinAsArray());
  }

  onLogoError(event: any): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/logo/no-name.svg';
    img.alt = 'LOGO';
  }
}
