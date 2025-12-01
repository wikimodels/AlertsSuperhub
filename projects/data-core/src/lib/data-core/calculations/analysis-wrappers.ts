// projects/data-core/src/lib/indicators.config.ts

// ✅ ИСПРАВЛЕНИЕ ПУТЕЙ: Использовать './models/series.model'
import { PriceSeries } from '../models/price-series.model';
import { IndicatorResult } from '../models/indicator-result.model';

// --- Импорты функций расчетов ---
import { calculateEMA, calculateSMA } from '../calculations/ma';
import { calculateKAMA } from '../calculations/kama';

import { calculateMACD } from '../calculations/macd';

import { calculateOBV } from '../calculations/obv';

import { calculateAnchoredVWAP } from '../calculations/anvwap';

// --- Вспомогательные импорты для оберток ---
import { calculateSlope } from '../calculations/slope';
import { analyzeLineStates } from '../calculations/states';
import { calculateRVWAP } from '../calculations/rvwap';
import { calculateZScore } from '../calculations/z-score';

// --- Типы ---
export interface IndicatorConfig {
  name: string;
  calc: (series: PriceSeries, ...params: any[]) => IndicatorResult;
  params: any[];
}

// -----------------------------------------------------------------------------------
// --- 1. EMA + SLOPE + STATES (50, 100, 150) ---
// -----------------------------------------------------------------------------------

export const calculateEmaSlopeAndStates = (
  series: PriceSeries,
  emaLength: number,
  slopePeriod: number
): IndicatorResult => {
  const emaValues = calculateEMA(series.closePrice, emaLength);
  const slopeValues = calculateSlope(emaValues, slopePeriod);
  const states = analyzeLineStates(series, emaValues, `Ema${emaLength}`);

  return {
    [`ema_${emaLength}`]: emaValues,
    [`ema_${emaLength}_slope`]: slopeValues,
    ...states,
  };
};

// -----------------------------------------------------------------------------------
// --- 2. KAMA + STATES ---
// -----------------------------------------------------------------------------------

export const calculateKamaAndStates = (
  series: PriceSeries,
  length: number,
  fast: number,
  slow: number
): IndicatorResult => {
  const result = calculateKAMA(series, length, fast, slow);
  const kamaValues = result['kama'];
  const states = analyzeLineStates(series, kamaValues, 'KAMA');

  return {
    ...result,
    ...states,
  };
};

// -----------------------------------------------------------------------------------
// --- 3. ROLLING VWAP + STATES (RVWAP) ---
// -----------------------------------------------------------------------------------

export const calculateRVWAPAndStates = (
  series: PriceSeries,
  stdevMults: number[]
): IndicatorResult => {
  // RVWAP берет timeframe из series.timeframe
  const result = calculateRVWAP(series, stdevMults);
  const rvwapValues = result['rvwap'];
  const states = analyzeLineStates(series, rvwapValues, 'RVWAP');

  return {
    ...result,
    ...states,
  };
};

// -----------------------------------------------------------------------------------
// --- 4. ANCHORED VWAP (W/M) + STATES (AVWAP) ---
// -----------------------------------------------------------------------------------

export const calculateAVWAPAndStates = (
  series: PriceSeries,
  anchor: 'W' | 'M',
  stdevMult: number
): IndicatorResult => {
  const result = calculateAnchoredVWAP(series, anchor, stdevMult);
  const prefix = anchor === 'W' ? 'W' : 'M';
  const avwapValues = result[`${prefix.toLowerCase()}_avwap`];
  const states = analyzeLineStates(series, avwapValues, `${prefix}_AVWAP`);

  return {
    ...result,
    ...states,
  };
};

// -----------------------------------------------------------------------------------
// --- 5. OBV + EMA + STATES ---
// -----------------------------------------------------------------------------------

export const calculateObvEmaAndStates = (
  series: PriceSeries,
  emaLength: number
): IndicatorResult => {
  const result = calculateOBV(series);
  const obvValues = result['obv'];

  const obvEmaValues = calculateEMA(obvValues, emaLength);

  const arrayLength = series.closePrice.length;
  const isObvAboveEma: number[] = new Array(arrayLength).fill(0);
  const isObvBelowEma: number[] = new Array(arrayLength).fill(0);

  for (let i = 0; i < arrayLength; i++) {
    const obv = obvValues[i];
    const ema = obvEmaValues[i];

    if (!Number.isNaN(obv) && !Number.isNaN(ema)) {
      if (obv > ema) {
        isObvAboveEma[i] = 1;
      } else if (obv < ema) {
        isObvBelowEma[i] = 1;
      }
    }
  }

  return {
    ...result,
    [`obv_ema_${emaLength}`]: obvEmaValues,
    isObvAboveEma: isObvAboveEma,
    isObvBelowEma: isObvBelowEma,
  };
};

// -----------------------------------------------------------------------------------
// --- 6. MACD ANALYSIS ---
// -----------------------------------------------------------------------------------
// -----------------------------------------------------------------------------------
// --- 6. MACD ANALYSIS ---
// -----------------------------------------------------------------------------------

export const calculateMACD_Analysis = (
  series: PriceSeries,
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): IndicatorResult => {
  const result = calculateMACD(series, fastPeriod, slowPeriod, signalPeriod);

  // ✅ ИСПРАВЛЕНИЕ КЛЮЧЕЙ:
  const macd = result['macd'];
  const signal = result['macd_signal']; // <--- Было 'signal'
  const histogram = result['macd_histogram']; // <--- Было 'histogram'

  const arrayLength = macd.length;

  const isHistAboveZero: number[] = new Array(arrayLength).fill(0);
  // ... (остальной код файла без изменений) ...
  const isHistCrossedUp: number[] = new Array(arrayLength).fill(0);
  const isHistCrossedDown: number[] = new Array(arrayLength).fill(0);
  const isMacdCrossedUpSignal: number[] = new Array(arrayLength).fill(0);
  const isMacdCrossedDownSignal: number[] = new Array(arrayLength).fill(0);

  for (let i = 1; i < arrayLength; i++) {
    const h = histogram[i];
    const h_prev = histogram[i - 1];
    const m = macd[i];
    // ... (остальной код файла без изменений) ...
    const s = signal[i];
    const m_prev = macd[i - 1];
    const s_prev = signal[i - 1];

    if (Number.isNaN(h) || Number.isNaN(h_prev)) continue;

    // ... (остальной код файла без изменений) ...
  }

  return {
    ...result,
    isHistAboveZero: isHistAboveZero,
    // ... (остальной код файла без изменений) ...
  };
};

// -----------------------------------------------------------------------------------
// --- 7. Z-SCORE ANALYSIS (с Наклоном) ---
// -----------------------------------------------------------------------------------

export const calculateZScoreAnalysis = (series: PriceSeries): IndicatorResult => {
  const Z_SCORE_WINDOW = 50;
  const Z_SCORE_SLOPE_PERIOD = 5;

  const results: IndicatorResult = {};

  const fieldsToAnalyze = [
    { key: 'closePrice', name: 'closePrice' },
    { key: 'volume', name: 'volume' },
    { key: 'volumeDelta', name: 'volumeDelta' },
    { key: 'openInterest', name: 'openInterest' },
    { key: 'fundingRate', name: 'fundingRate' },
  ] as const;

  for (const field of fieldsToAnalyze) {
    const seriesData = series[field.key];

    if (seriesData && seriesData.length > 0) {
      const zScores = calculateZScore(seriesData as number[], Z_SCORE_WINDOW);
      const zScoreSlopes = calculateSlope(zScores, Z_SCORE_SLOPE_PERIOD);

      results[`${field.name}_z_score`] = zScores;
      results[`${field.name}_z_score_slope`] = zScoreSlopes;
    }
  }

  return results;
};
