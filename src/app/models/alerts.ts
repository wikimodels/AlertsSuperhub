// --- Общие поля всех алертов ---
export interface AlertBase {
  symbol: string;
  alertName: string;
  price: number;
  description?: string;
  tvScreensUrls?: string[];
  exchanges: string[];
  category?: number;
  color: string;
  createdAt?: string;

  // Общие для всех алертов поля состояния
  _id?: string; // MongoDB _id (опционально, только при сохранении)
  id: string; // UUID (обязательно)
  creationTime?: number;
  activationTime?: number;
  activationTimeStr?: string;
  highPrice?: number;
  lowPrice?: number;
  isActive: boolean;
  imagesUrls?: string[];
}

// --- Line Alert: наследует всё от AlertBase ---
export interface LineAlert extends AlertBase {}

// --- VWAP Alert: расширяет AlertBase специфичными полями ---
export interface VwapAlert extends AlertBase {
  // VWAP-специфичные поля
  anchorTime?: number; // timestamp в миллисекундах
  anchorTimeStr?: string;
  anchorPrice?: number; // рассчитанный VWAP на момент активации
}

// --- Тип коллекции ---
export type AlertsCollection = 'working' | 'triggered' | 'archived';
