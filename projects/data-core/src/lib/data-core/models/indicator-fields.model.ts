// projects/data-core/src/lib/models/indicator-fields.model.ts

/**
 * Интерфейс, который явно перечисляет ВСЕ динамически генерируемые поля (индикаторы и сигналы),
 * которые добавляются к объекту Candle после анализа.
 * * Все поля имеют тип number, так как они представляют рассчитанные значения или булевы флаги (0/1).
 */
export interface CandleIndicatorFields {
  // --------------------------------------------------------------------------
  // 1. СКОЛЬЗЯЩИЕ СРЕДНИЕ (EMA 50/100/150 + KAMA Analysis)
  // --------------------------------------------------------------------------

  // EMA 50
  ema_50: number;
  ema_50_slope: number;
  isAboveEma50: number;
  isCrossedUpEma50: number;
  isCrossedDownEma50: number;

  // EMA 100
  ema_100: number;
  ema_100_slope: number;
  isAboveEma100: number;
  isCrossedUpEma100: number;
  isCrossedDownEma100: number;

  // EMA 150
  ema_150: number;
  ema_150_slope: number;
  isAboveEma150: number;
  isCrossedUpEma150: number;
  isCrossedDownEma150: number;

  // KAMA Analysis (10, 2, 30)
  kama: number;
  isAboveKAMA: number;
  isCrossedUpKAMA: number;
  isCrossedDownKAMA: number;

  // --------------------------------------------------------------------------
  // 2. ВОЛАТИЛЬНОСТЬ И КАНАЛЫ (ATR, Keltner, Bollinger, CHV)
  // --------------------------------------------------------------------------

  // ATR
  atr: number;

  // Keltner Channel (20, 2.0, 10)
  kc_upper: number;
  kc_middle: number;
  kc_lower: number;

  // Bollinger Bands (20, 2.0)
  bb_upper: number;
  bb_middle: number;
  bb_lower: number;

  // CHV (Chaikin Volatility)
  chv: number;

  // --------------------------------------------------------------------------
  // 3. МОМЕНТУМ И ТРЕНД (MACD, RSI, ADX)
  // --------------------------------------------------------------------------

  // MACD Analysis (12, 26, 9)
  macd: number;
  signal: number;
  histogram: number;
  isHistAboveZero: number;
  isHistCrossedUp: number;
  isHistCrossedDown: number;
  isMacdCrossedUpSignal: number;
  isMacdCrossedDownSignal: number;

  // RSI
  rsi: number;

  // ADX
  adx: number;
  di_plus: number;
  di_minus: number;

  // --------------------------------------------------------------------------
  // 4. ОБЪЕМ И VWAP (CMF, OBV, VZO)
  // --------------------------------------------------------------------------

  // CMF (Chaikin Money Flow)
  cmf: number;

  // OBV Analysis (с EMA 20)
  obv: number;
  obv_ema_20: number;
  isObvAboveEma: number;
  isObvBelowEma: number;

  // VZO (Volume Zone Oscillator)
  vzo: number;

  // RVWAP Analysis (Rolling VWAP)
  rvwap: number;
  rvwap_stdev_1_0: number;
  rvwap_stdev_2_0: number;
  rvwap_stdev_3_0: number;
  isAboveRVWAP: number;
  isCrossedUpRVWAP: number;
  isCrossedDownRVWAP: number;

  // W_AVWAP Analysis (Weekly Anchored VWAP)
  w_avwap: number;
  w_avwap_stdev_1_0: number;
  isAboveW_AVWAP: number;
  isCrossedUpW_AVWAP: number;
  isCrossedDownW_AVWAP: number;

  // M_AVWAP Analysis (Monthly Anchored VWAP)
  m_avwap: number;
  m_avwap_stdev_1_0: number;
  isAboveM_AVWAP: number;
  isCrossedUpM_AVWAP: number;
  isCrossedDownM_AVWAP: number;

  // --------------------------------------------------------------------------
  // 5. РОЛЛИНГОВЫЕ ИНДИКАТОРЫ И ПАТТЕРНЫ
  // --------------------------------------------------------------------------

  // Highest High / Lowest Low (50/100)
  highest_high_50: number;
  highest_high_100: number;
  lowest_low_50: number;
  lowest_low_100: number;

  // Candle Patterns
  pattern_bullish_engulfing: number;
  pattern_bearish_engulfing: number;
  pattern_hammer: number;
  pattern_shooting_star: number;
  // ... другие паттерны ...

  // --------------------------------------------------------------------------
  // 6. Z-SCORE ANALYSIS (с Наклоном)
  // --------------------------------------------------------------------------

  closePrice_z_score: number;
  closePrice_z_score_slope: number;

  volume_z_score: number;
  volume_z_score_slope: number;

  volumeDelta_z_score: number;
  volumeDelta_z_score_slope: number;

  openInterest_z_score: number;
  openInterest_z_score_slope: number;

  fundingRate_z_score: number;
  fundingRate_z_score_slope: number;
}
