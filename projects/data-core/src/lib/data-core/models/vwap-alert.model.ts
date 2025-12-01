export interface VwapAlert {
  _id?: string;
  id: string; // UUID
  creationTime?: number;
  activationTime?: number;
  activationTimeStr?: string;

  // --- Основные поля ---
  price?: number; // Цена срабатывания
  high?: number;
  low?: number;
  tvScreensUrls?: string[];
  isActive: boolean;
  symbol: string;

  // --- Дополнительные поля ---
  alertName?: string;
  category?: string;
  tvLink?: string;
  cgLink?: string;
  exchanges?: string[];
  imageUrl?: string;

  // --- Поля "Якоря" VWAP ---
  anchorTime?: number; // Время "якоря"
  anchorPrice?: number; // Рассчитанный VWAP
  anchorTimeStr?: string;
}
