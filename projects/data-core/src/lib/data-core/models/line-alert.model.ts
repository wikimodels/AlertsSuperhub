export interface LineAlert {
  // --- Поля AlertBase ---
  symbol: string;
  alertName: string;
  action: string;
  price: number; // Цена срабатывания
  description?: string;
  tvScreensUrls?: string[];

  // --- Поля Line Alert ---
  _id?: string; // Mongo ID
  id: string; // UUID
  creationTime?: number;
  activationTime?: number;
  activationTimeStr?: string;
  high?: number;
  low?: number;
  isActive: boolean;
  status: string;
  tvLink?: string;
  cgLink?: string;
}
