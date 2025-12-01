// projects/data-core/src/lib/models/series.model.ts

export interface PriceSeries {
  // Стандартные поля
  openTime: number[];
  openPrice: number[];
  highPrice: number[];
  lowPrice: number[];
  closePrice: number[];
  volume: number[];
  // ✅ ДОБАВЛЕНО: Таймфрейм графика (например, '4h', '1d', '15m')
  timeframe: string;
  // --- АГРЕГИРОВАННЫЕ ПОЛЯ (ОИ, ФР, ДЕЛЬТА) ---
  openInterest?: number[]; // Open Interest (OI)
  fundingRate?: number[]; // Funding Rate (FR)
  volumeDelta?: number[]; // Volume Delta
}
