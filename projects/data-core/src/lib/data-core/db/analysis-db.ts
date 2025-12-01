// projects/data-core/src/lib/db/analysis-db.ts

import Dexie, { Table } from 'dexie';
import { DataCoreRoot } from '../models/data-core-root.model';
import { CoinData } from '../models/coin-data.model';

const DB_NAME = 'CryptoAnalysisDB';
const DB_VERSION = 1;

/**
 * Wrapper для хранения массива CoinData с ID
 */
export interface CoinsDataWrapper {
  id: string;
  coins: CoinData[];
}

/**
 * Расширение класса Dexie для определения схемы базы данных.
 */
export class AnalysisDB extends Dexie {
  // Таблица для хранения DataCoreRoot (ключ - timeframe)
  dataRoots!: Table<DataCoreRoot, string>;

  // ✅ Таблица для хранения массива CoinData
  coinsData!: Table<CoinsDataWrapper, string>;

  constructor() {
    super(DB_NAME);
    this.version(DB_VERSION).stores({
      // DataCoreRoot: primary key 'timeframe' (string)
      dataRoots: '&timeframe',

      // ✅ CoinsDataWrapper: primary key 'id' (string)
      coinsData: '&id',
    });
  }
}
