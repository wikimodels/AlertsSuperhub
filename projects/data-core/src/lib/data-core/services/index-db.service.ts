// projects/data-core/src/lib/services/index-db.service.ts

import { Injectable } from '@angular/core';
import { AnalysisDB, CoinsDataWrapper } from '../db/analysis-db';
import { DataCoreRoot } from '../models/data-core-root.model';
import { CoinData } from '../models/coin-data.model';
import { Timeframe } from './kline.service';

const COIN_DATA_KEY = 'COIN_DATA_LIST';

@Injectable({
  providedIn: 'root',
})
export class IndexDbService {
  private db: AnalysisDB;

  constructor() {
    this.db = new AnalysisDB();
    console.log('✅ IndexDbService initialized');
  }

  // ========================================
  // --- DataCoreRoot методы ---
  // ========================================

  public async getDataCoreRoot(timeframe: Timeframe): Promise<DataCoreRoot | null> {
    try {
      const data = await this.db.dataRoots.get(timeframe);
      return data || null;
    } catch (error) {
      console.error(`❌ IndexDb: Failed to get DataCoreRoot for ${timeframe}`, error);
      return null;
    }
  }

  public async saveDataCoreRoot(rootData: DataCoreRoot): Promise<void> {
    try {
      await this.db.dataRoots.put(rootData);
      console.log(`✅ IndexDb: DataCoreRoot saved for ${rootData.timeframe}`);
    } catch (error) {
      console.error(`❌ IndexDb: Failed to save DataCoreRoot for ${rootData.timeframe}`, error);
    }
  }

  // ========================================
  // --- CoinData методы ---
  // ========================================

  public async getCoinsData(): Promise<CoinData[]> {
    try {
      // ✅ Получаем объект CoinsDataWrapper по ID
      const wrapper = await this.db.coinsData.get(COIN_DATA_KEY);

      if (wrapper && wrapper.coins && Array.isArray(wrapper.coins)) {
        console.log(`✅ IndexDb: Retrieved ${wrapper.coins.length} coins from cache`);
        return wrapper.coins;
      }

      console.log('⚠️ IndexDb: No coins data in cache');
      return [];
    } catch (error) {
      console.error('❌ IndexDb: Failed to get CoinData list', error);
      return [];
    }
  }

  public async saveCoinsData(coinsData: CoinData[]): Promise<void> {
    try {
      if (!Array.isArray(coinsData)) {
        console.error('❌ IndexDb: coinsData is not an array');
        return;
      }

      // ✅ Создаём wrapper с ID и массивом монет
      const wrapper: CoinsDataWrapper = {
        id: COIN_DATA_KEY,
        coins: coinsData,
      };

      await this.db.coinsData.put(wrapper);
      console.log(`✅ IndexDb: Saved ${coinsData.length} coins to cache`);
    } catch (error) {
      console.error('❌ IndexDb: Failed to save CoinData list', error);
    }
  }

  // ========================================
  // --- Утилиты ---
  // ========================================

  public async clearAll(): Promise<void> {
    try {
      await this.db.dataRoots.clear();
      await this.db.coinsData.clear();
      console.warn('⚠️ IndexDb: All data cleared');
    } catch (error) {
      console.error('❌ IndexDb: Failed to clear all data', error);
    }
  }
}
