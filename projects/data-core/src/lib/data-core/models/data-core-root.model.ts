import { Audit } from './audit.model';
import { KlineData } from './kline-data.model';

export interface DataCoreRoot {
  timeframe: string;
  closeTime: number; // Мастер-таймстамп (используется для проверки свежести)
  audit: Audit;
  data: KlineData[]; // Массив всех обработанных монет
}
