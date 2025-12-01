// projects/data-core/src/lib/indicators.config.ts

import { PriceSeries } from './models/price-series.model';
import { IndicatorResult } from './models/indicator-result.model';

// --- A. Импорты "СЛОЖНЫХ" оберток (которые мы определим ниже) ---
import { calculateEMA } from './calculations/ma';
import { calculateKAMA } from './calculations/kama';
import { calculateMACD } from './calculations/macd';
import { calculateOBV } from './calculations/obv';
import { calculateAnchoredVWAP } from './calculations/anvwap';
import { calculateSlope } from './calculations/slope';
import { analyzeLineStates } from './calculations/states';
import { calculateRVWAP } from './calculations/rvwap';
import { calculateZScore } from './calculations/z-score';

// --- Б. Импорты "ПРОСТЫХ" оберток (чистые расчеты, 1-в-1) ---
import { calculateBollingerBands } from './calculations/bollinger';
import { calculateKeltnerChannel } from './calculations/keltner';
import { calculateRSI } from './calculations/rsi';
import { calculateADX } from './calculations/adx';
import { calculateCMF } from './calculations/cmf';
import { calculateCHV } from './calculations/chv';
import { calculateVZO } from './calculations/vzo';
import { calculateHighestHigh, calculateLowestLow } from './calculations/rolling-max-min';
import { recognizeCandlePatterns } from './calculations/patterns';

// --- Типы ---
export interface IndicatorConfig {
  name: string; // Имя для отладки
  calc: (series: PriceSeries, ...params: any[]) => IndicatorResult; // Функция расчета
  params: any[]; // Параметры для функции
}

// -----------------------------------------------------------------------------------
// --- ЧАСТЬ 1: Определение "СЛОЖНЫХ" оберток (Комбинированные индикаторы) ---
// -----------------------------------------------------------------------------------

// --- 1. EMA + SLOPE + STATES (50, 100, 150) ---
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

// --- 2. KAMA + STATES ---
export const calculateKamaAndStates = (
  series: PriceSeries,
  length: number,
  fast: number,
  slow: number
): IndicatorResult => {
  const result = calculateKAMA(series, length, fast, slow);
  const kamaValues = result['kama'];
  const states = analyzeLineStates(series, kamaValues, 'KAMA');
  return { ...result, ...states };
};

// --- 3. ROLLING VWAP + STATES (RVWAP) ---
export const calculateRVWAPAndStates = (
  series: PriceSeries,
  stdevMults: number[]
): IndicatorResult => {
  const result = calculateRVWAP(series, stdevMults);
  const rvwapValues = result['rvwap'];
  const states = analyzeLineStates(series, rvwapValues, 'RVWAP');
  return { ...result, ...states };
};

// --- 4. ANCHORED VWAP (W/M) + STATES (AVWAP) ---
export const calculateAVWAPAndStates = (
  series: PriceSeries,
  anchor: 'W' | 'M',
  stdevMult: number
): IndicatorResult => {
  const result = calculateAnchoredVWAP(series, anchor, stdevMult);
  const prefix = anchor === 'W' ? 'W' : 'M';
  const avwapValues = result[`${prefix.toLowerCase()}_avwap`];
  const states = analyzeLineStates(series, avwapValues, `${prefix}_AVWAP`);
  return { ...result, ...states };
};

// --- 5. OBV + EMA + STATES ---
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
      if (obv > ema) isObvAboveEma[i] = 1;
      else if (obv < ema) isObvBelowEma[i] = 1;
    }
  }
  return {
    ...result,
    [`obv_ema_${emaLength}`]: obvEmaValues,
    isObvAboveEma: isObvAboveEma,
    isObvBelowEma: isObvBelowEma,
  };
};

// --- 6. MACD ANALYSIS ---
export const calculateMACD_Analysis = (
  series: PriceSeries,
  fastPeriod: number,
  slowPeriod: number,
  signalPeriod: number
): IndicatorResult => {
  const result = calculateMACD(series, fastPeriod, slowPeriod, signalPeriod);
  const macd = result['macd'];
  const signal = result['macd_signal'];
  const histogram = result['macd_histogram'];
  const arrayLength = macd.length;
  const isHistAboveZero: number[] = new Array(arrayLength).fill(0);
  const isHistCrossedUp: number[] = new Array(arrayLength).fill(0);
  const isHistCrossedDown: number[] = new Array(arrayLength).fill(0);
  const isMacdCrossedUpSignal: number[] = new Array(arrayLength).fill(0);
  const isMacdCrossedDownSignal: number[] = new Array(arrayLength).fill(0);

  for (let i = 1; i < arrayLength; i++) {
    const h = histogram[i];
    const h_prev = histogram[i - 1];
    const m = macd[i];
    const s = signal[i];
    const m_prev = macd[i - 1];
    const s_prev = signal[i - 1];
    if (Number.isNaN(h) || Number.isNaN(h_prev)) continue;
    if (h > 0) isHistAboveZero[i] = 1;
    if (h_prev < 0 && h > 0) isHistCrossedUp[i] = 1;
    if (h_prev > 0 && h < 0) isHistCrossedDown[i] = 1;
    if (m_prev < s_prev && m > s) isMacdCrossedUpSignal[i] = 1;
    if (m_prev > s_prev && m < s) isMacdCrossedDownSignal[i] = 1;
  }
  return {
    ...result,
    isHistAboveZero,
    isHistCrossedUp,
    isHistCrossedDown,
    isMacdCrossedUpSignal,
    isMacdCrossedDownSignal,
  };
};

// --- 7. Z-SCORE ANALYSIS (с Наклоном) ---
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

// -----------------------------------------------------------------------------------
// --- ЧАСТЬ 2: ГЛАВНЫЙ КОНФИГ ДЛЯ INDICATOR SERVICE ---
// -----------------------------------------------------------------------------------
// Это "меню", которое IndicatorService использует для запуска конвейера.
// -----------------------------------------------------------------------------------

export const INDICATOR_CONFIG: IndicatorConfig[] = [
  // --- 1. СКОЛЬЗЯЩИЕ СРЕДНИЕ ---
  { name: 'EMA_50', calc: calculateEmaSlopeAndStates, params: [50, 5] },
  { name: 'EMA_100', calc: calculateEmaSlopeAndStates, params: [100, 5] },
  { name: 'EMA_150', calc: calculateEmaSlopeAndStates, params: [150, 5] },
  { name: 'KAMA', calc: calculateKamaAndStates, params: [10, 2, 30] },

  // --- 2. VWAP ---
  { name: 'RVWAP', calc: calculateRVWAPAndStates, params: [[1.0, 2.0, 3.0]] }, // Параметр - массив
  { name: 'W_AVWAP', calc: calculateAVWAPAndStates, params: ['W', 1.0] },
  { name: 'M_AVWAP', calc: calculateAVWAPAndStates, params: ['M', 1.0] },

  // --- 3. ИНДИКАТОРЫ ОБЪЕМА ---
  { name: 'OBV_EMA_20', calc: calculateObvEmaAndStates, params: [20] },
  { name: 'CMF_20', calc: calculateCMF, params: [20] },
  { name: 'VZO', calc: calculateVZO, params: [14, 21] },

  // --- 4. МОМЕНТУМ / ТРЕНД ---
  { name: 'MACD', calc: calculateMACD_Analysis, params: [12, 26, 9] },
  { name: 'RSI_14', calc: calculateRSI, params: [14] },
  { name: 'ADX_14', calc: calculateADX, params: [14] },

  // --- 5. КАНАЛЫ / ВОЛАТИЛЬНОСТЬ ---
  { name: 'Bollinger_20_2', calc: calculateBollingerBands, params: [20, 2.0] },
  { name: 'Keltner_20_2_10', calc: calculateKeltnerChannel, params: [20, 2.0, 10] },
  { name: 'CHV_10_10', calc: calculateCHV, params: [10, 10] },

  // --- 6. МАКСИМУМЫ / МИНИМУМЫ ---
  { name: 'HighestHigh', calc: calculateHighestHigh, params: [[50, 100]] }, // Параметр - массив
  { name: 'LowestLow', calc: calculateLowestLow, params: [[50, 100]] }, // Параметр - массив

  // --- 7. ПАТТЕРНЫ ---
  { name: 'CandlePatterns', calc: recognizeCandlePatterns, params: [] },

  // --- 8. Z-SCORES ---
  { name: 'ZScoreAnalysis', calc: calculateZScoreAnalysis, params: [] },
];
