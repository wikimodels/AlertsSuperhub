// projects/data-core/src/lib/models/candle.model.ts

import { CandleIndicatorFields } from './indicator-fields.model';

/**
 * ✅ УЛУЧШЕНО:
 * Интерфейс свечи теперь наследует все поля индикаторов как опциональные (Partial).
 * Это убирает необходимость в '[key: string]: any' и дает полную
 * безопасность типов и автодополнение (IntelliSense).
 */
export interface Candle extends Partial<CandleIndicatorFields> {
  openTime: number; // Время открытия свечи (timestamp в мс)

  // Цены и объемы приходят как строки для сохранения точности
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;

  // Агрегированные/расчетные поля (могут быть строками)
  openInterest: string; // Открытый интерес
  fundingRate: string; // Ставка финансирования
  volumeDelta: string; // Дельта объема
}
