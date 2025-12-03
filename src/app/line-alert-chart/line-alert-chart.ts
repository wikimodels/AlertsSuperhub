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

// Lightweight Charts
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
} from 'lightweight-charts';
import { ChartDataService } from '../shared/services/chart-data.service';
import { PanelButtonComponent } from '../shared/components/panel-button/panel-button.component';
import { LineAlert } from '../models/alerts';

interface OHLCVData extends CandlestickData {
  volume: number;
}

interface ChartLineObject {
  id: string;
  price: number;
  series: ISeriesApi<'Line'>;
  color: string;
  createdAt: string;
}

@Component({
  selector: 'app-line-alert-chart',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, PanelButtonComponent],
  templateUrl: './line-alert-chart.html',
  styleUrls: ['./line-alert-chart.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LineAlertChart implements AfterViewInit, OnDestroy {
  public isLoading = signal(true);
  private chartDataService = inject(ChartDataService);
  private route = inject(ActivatedRoute);
  private zone = inject(NgZone);
  private coinWindowService = inject(CoinWindowService);

  private queryParams = toSignal(this.route.queryParamMap);
  public symbol = computed(() => this.queryParams()?.get('symbol') ?? '');

  // ✅ Signals to hold real category/exchanges from API
  public category = signal<number>(0);
  public exchanges = signal<string[]>(['BYBIT']);

  @ViewChild('chartContainer')
  private chartContainerRef!: ElementRef<HTMLDivElement>;

  private chartApi: IChartApi | null = null;
  private candleSeries: ISeriesApi<'Candlestick'> | null = null;
  private volumeSeries: ISeriesApi<'Histogram'> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  private candleData: CandlestickData[] = [];
  private horizontalLines: ChartLineObject[] = [];
  private lineColors = ['#2962FF', '#F23645', '#089981', '#FF6D00', '#7C4DFF'];

  constructor() {
    effect(() => {
      const currentSymbol = this.symbol();
      if (currentSymbol) {
        console.log(`[Chart] Эффект: символ изменился на ${currentSymbol}`);
        this.clearAllLines();
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
    this.clearAllLines();
    console.log('[Chart] Уничтожен');
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
    console.log('[Chart] Инициализация...');
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
        visible: false,
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
      console.error('❌ [Chart] Не удалось создать инстанс графика.');
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
      console.log(`[Chart] Загрузка отложена или символ отсутствует.`);
      return;
    }

    this.zone.run(() => this.isLoading.set(true));
    console.log(`[Chart] Загрузка данных для ${symbol}...`);

    const response = await this.chartDataService.getChartData(symbol);

    if (!response || response.chartFormattedData.length === 0) {
      console.warn(`[Chart] Нет данных для ${symbol}, очищаем график.`);
      this.candleSeries.setData([]);
      this.volumeSeries.setData([]);
      this.candleData = [];

      // Fallback values
      this.zone.run(() => {
        this.category.set(0);
        this.exchanges.set(['BYBIT']);
      });
    } else {
      const { chartFormattedData, category, exchanges } = response;

      // ✅ Store real values from API
      this.zone.run(() => {
        this.category.set(category);
        this.exchanges.set(exchanges);
      });

      console.log(`[Chart] 📊 Категория: ${category}, Биржи: ${exchanges.join(', ')}`);

      const candleData: CandlestickData[] = chartFormattedData.map((d) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
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
  // Horizontal Line / Alert Management
  // ============================================

  private subscribeToChartClicks(): void {
    if (!this.chartApi) return;

    this.chartApi.subscribeClick((param) => {
      if (!param?.point || !this.candleSeries) return;

      const clickedPrice = this.candleSeries.coordinateToPrice(param.point.y);
      if (clickedPrice === null || clickedPrice === undefined) return;

      this.zone.run(() => {
        let clickedOnLine = false;

        for (let i = this.horizontalLines.length - 1; i >= 0; i--) {
          const lineObj = this.horizontalLines[i];
          const tolerance = lineObj.price * 0.01;

          if (Math.abs(clickedPrice - lineObj.price) <= tolerance) {
            console.log(`🎯 Клик на существующую линию ID: ${lineObj.id}`);
            this.removeHorizontalLine(lineObj, i);
            clickedOnLine = true;
            break;
          }
        }

        if (!clickedOnLine) {
          console.log('🎯 Добавляем новую линию...');
          this.addHorizontalLine(clickedPrice);
        }
      });
    });

    console.log(
      '[Chart] 💡 Подписка на клики установлена. Кликни на график, чтобы добавить алерт.'
    );
  }

  private addHorizontalLine(price: number): void {
    if (!this.chartApi || this.candleData.length === 0) return;

    const color = this.lineColors[this.horizontalLines.length % this.lineColors.length];
    const lineId = this.generateLineId();

    const lineData = this.candleData.map((candle) => ({
      time: candle.time,
      value: price,
    }));

    const lineSeries = this.chartApi.addSeries(LineSeries, {
      color,
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      lastValueVisible: true,
      priceLineVisible: false,
      crosshairMarkerVisible: true,
    });

    lineSeries.setData(lineData);

    const lineObject: ChartLineObject = {
      id: lineId,
      price,
      series: lineSeries,
      color,
      createdAt: new Date().toISOString(),
    };

    this.horizontalLines.push(lineObject);
    const newAlert = this.createLineAlertFromLine(lineObject);
    console.log('%c✅ СОЗДАН LineAlert:', 'color: green; font-weight: bold;', newAlert);
  }

  private removeHorizontalLine(lineObject: ChartLineObject, index: number): void {
    if (!this.chartApi) return;
    this.chartApi.removeSeries(lineObject.series);
    this.horizontalLines.splice(index, 1);

    const deletedAlert = this.createLineAlertFromLine(lineObject);
    console.log('%c🗑️ УДАЛЕН LineAlert:', 'color: red; font-weight: bold;', deletedAlert);
  }

  private clearAllLines(): void {
    if (!this.chartApi) return;
    [...this.horizontalLines].forEach((lineObj) => {
      const realIndex = this.horizontalLines.indexOf(lineObj);
      if (realIndex > -1) {
        this.removeHorizontalLine(lineObj, realIndex);
      }
    });
    this.horizontalLines = [];
    console.log('[Chart] Все горизонтальные линии очищены.');
  }

  private generateLineId(): string {
    return `hline_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  private createLineAlertFromLine(lineObject: ChartLineObject): LineAlert {
    return {
      symbol: this.symbol(),
      alertName: `Line Alert @ ${lineObject.price.toFixed(4)}`,
      action: 'cross',
      price: lineObject.price,
      description: `Chart Line Color: ${lineObject.color}`,
      exchanges: this.exchanges(), // ✅ Real value
      category: this.category(), // ✅ Real value
      id: lineObject.id,
      creationTime: new Date(lineObject.createdAt).getTime(),
      isActive: true,
      imagesUrls: [],
    };
  }

  // Метод для обработки ошибки загрузки логотипа
  onLogoError(event: any): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/logo/no-name.svg';
    img.alt = 'LOGO';
  }
}
