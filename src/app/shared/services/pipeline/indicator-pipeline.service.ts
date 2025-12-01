import { Injectable } from '@angular/core';
import { calculateADX } from '../../../calculations/adx';
import { calculateAnchoredVWAP } from '../../../calculations/anvwap';
import { calculateBollingerBands } from '../../../calculations/bollinger';
import { analyzeBreakouts } from '../../../calculations/breakout';
import { calculateCHV } from '../../../calculations/chv';
import { calculateCMF } from '../../../calculations/cmf';
import { calculateEmaFan } from '../../../calculations/fan';
import { calculateKAMA } from '../../../calculations/kama';
import { calculateEMA } from '../../../calculations/ma';
import { calculateMACD } from '../../../calculations/macd';
import { calculateOBV } from '../../../calculations/obv';
import { recognizeCandlePatterns } from '../../../calculations/patterns';
import { calculateLowestLow, calculateHighestHigh } from '../../../calculations/rolling-max-min';
import { calculateRSI } from '../../../calculations/rsi';
import { calculateRVWAP } from '../../../calculations/rvwap';
import { calculateSlope } from '../../../calculations/slope';
import { analyzeLineStates } from '../../../calculations/states';
import { calculateVZO } from '../../../calculations/vzo';
import { calculateZScore } from '../../../calculations/z-score';
import { Candle, MarketData, PriceSeries } from '../../../models/kline.model';

// Вспомогательный интерфейс для динамического добавления индикаторов
interface CandleWithIndicators extends Candle {
  [key: string]: any;
}

/**
 * ШАГ 2: Pipeline Сервис
 *
 * Отвечает ТОЛЬКО за расчет индикаторов.
 * Получает "сырые" MarketData, возвращает "обработанные" MarketData.
 */
@Injectable({
  providedIn: 'root',
})
export class IndicatorPipelineService {
  constructor() {
    console.log('✅ IndicatorPipelineService initialized');
  }

  /**
   * Главный метод, прогоняющий "сырые" данные через все расчеты.
   * (Это бывший processMarketData)
   * @param data "Сырые" MarketData из API
   * @returns "Обработанные" MarketData с индикаторами
   */
  public process(data: MarketData): MarketData {
    // (Вся эта логика скопирована 1-в-1 из kline-data.service.ts)
    for (const coin of data.data) {
      const closePrices = coin.candles.map((c) => c.closePrice);
      const arrayLength = closePrices.length;

      const priceSeries: PriceSeries = {
        openTime: coin.candles.map((c) => c.openTime),
        openPrice: coin.candles.map((c) => c.openPrice),
        highPrice: coin.candles.map((c) => c.highPrice),
        lowPrice: coin.candles.map((c) => c.lowPrice),
        closePrice: closePrices,
        volume: coin.candles.map((c) => c.volume),
        timeframe: data.timeframe,
        openInterest: coin.candles.map((c) => c.openInterest ?? NaN),
        fundingRate: coin.candles.map((c) => c.fundingRate ?? NaN),
        volumeDelta: coin.candles.map((c) => c.volumeDelta ?? NaN),
      };

      // --- РАСЧЁТ ИНДИКАТОРОВ ---
      const ema50Values = calculateEMA(closePrices, 50);
      const ema100Values = calculateEMA(closePrices, 100);
      const ema150Values = calculateEMA(closePrices, 150);

      const adxResult = calculateADX(priceSeries, 14);
      const wAvwapResult = calculateAnchoredVWAP(priceSeries, 'W');
      const mAvwapResult = calculateAnchoredVWAP(priceSeries, 'M');
      const bbResult = calculateBollingerBands(priceSeries, 20, 2.0);
      const chvResult = calculateCHV(priceSeries, 10, 10);
      const cmfResult = calculateCMF(priceSeries, 20);
      const macdResult = calculateMACD(priceSeries, 12, 26, 9);
      const rsiResult = calculateRSI(priceSeries, 14);
      const obvResult = calculateOBV(priceSeries);
      const rVwwapResult = calculateRVWAP(priceSeries, [1.0, 2.0]);
      const kamaResult = calculateKAMA(priceSeries, 10, 2, 30);
      const patternResult = recognizeCandlePatterns(priceSeries);
      const lowestLowResult = calculateLowestLow(priceSeries, [50, 100]);
      const highestHighResult = calculateHighestHigh(priceSeries, [50, 100]);
      const vzoResult = calculateVZO(priceSeries);

      const zScoreClose = calculateZScore(priceSeries.closePrice, 50);
      const zScoreVolume = calculateZScore(priceSeries.volume, 50);
      const zScoreVolDelta = calculateZScore(priceSeries.volumeDelta || [], 50);
      const zScoreFunding = calculateZScore(priceSeries.fundingRate || [], 50);
      const zScoreOI = calculateZScore(priceSeries.openInterest || [], 50);

      // --- SLOPE ---
      const slopePeriod = 5;
      const slopeEma20 = calculateSlope(ema50Values, slopePeriod);
      const slopeEma50 = calculateSlope(ema100Values, slopePeriod);
      const slopeEma150 = calculateSlope(ema150Values, slopePeriod);
      const slopeRvwap = calculateSlope(rVwwapResult['rvwap'], slopePeriod);
      const slopeMAvwap = calculateSlope(mAvwapResult['mAvwap'], slopePeriod); // ✅ camelCase
      const slopeWAvwap = calculateSlope(wAvwapResult['wAvwap'], slopePeriod); // ✅ camelCase
      const slopeZClose = calculateSlope(zScoreClose, slopePeriod);
      const slopeZVolume = calculateSlope(zScoreVolume, slopePeriod);
      const slopeZVolDelta = calculateSlope(zScoreVolDelta, slopePeriod);
      const slopeZoi = calculateSlope(zScoreOI, slopePeriod);
      const slopeZFunding = calculateSlope(zScoreFunding, slopePeriod);

      // --- STATES (включая W/M-AVWAP) ---
      const statesRvwap = analyzeLineStates(priceSeries, rVwwapResult['rvwap'], 'Rvwap');
      const statesKama = analyzeLineStates(priceSeries, kamaResult['kama'], 'Kama');
      const statesEma50 = analyzeLineStates(priceSeries, ema50Values, 'Ema50');
      const statesEma100 = analyzeLineStates(priceSeries, ema100Values, 'Ema100');
      const statesEma150 = analyzeLineStates(priceSeries, ema150Values, 'Ema150');
      // ✅ ДОБАВЛЕНО:
      const statesWAvwap = analyzeLineStates(priceSeries, wAvwapResult['wAvwap'], 'WAvwap');
      const statesMAvwap = analyzeLineStates(priceSeries, mAvwapResult['mAvwap'], 'MAvwap');

      const rvwapUpper = rVwwapResult['rvwap_upper_band_1'];
      const rvwapLower = rVwwapResult['rvwap_lower_band_1'];
      const rvwapBetweenBands = new Array(arrayLength).fill(false);

      for (let i = 0; i < arrayLength; i++) {
        const close = closePrices[i];
        const upper = rvwapUpper[i];
        const lower = rvwapLower[i];

        if (!Number.isNaN(upper) && !Number.isNaN(lower) && !Number.isNaN(close)) {
          if (close <= upper && close >= lower) {
            rvwapBetweenBands[i] = true;
          }
        }
      }

      const stateResults: Record<string, boolean[]> = {
        ...statesRvwap,
        ...statesKama,
        ...statesEma50,
        ...statesEma100,
        ...statesEma150,
        ...statesWAvwap, // ✅
        ...statesMAvwap, // ✅
        isBetweenRvwapBands: rvwapBetweenBands,
      };

      // --- EMA FAN ---
      const fanResult = calculateEmaFan(
        ema50Values,
        ema100Values,
        ema150Values,
        priceSeries.highPrice,
        priceSeries.lowPrice
      );

      // --- BREAKOUTS ---
      const breakout50 = analyzeBreakouts(
        closePrices,
        highestHighResult['highest50'],
        lowestLowResult['lowest50'],
        50
      );
      const breakout100 = analyzeBreakouts(
        closePrices,
        highestHighResult['highest100'],
        lowestLowResult['lowest100'],
        100
      );

      // --- ДОБАВЛЕНИЕ ИНДИКАТОРОВ К СВЕЧАМ ---
      coin.candles.forEach((candle, index) => {
        // EMA
        (candle as CandleWithIndicators)['ema50'] = ema50Values[index];
        (candle as CandleWithIndicators)['ema100'] = ema100Values[index];
        (candle as CandleWithIndicators)['ema150'] = ema150Values[index];

        // ADX
        (candle as CandleWithIndicators)['adx'] = adxResult['adx'][index];
        (candle as CandleWithIndicators)['diPlus'] = adxResult['di_plus'][index];
        (candle as CandleWithIndicators)['diMinus'] = adxResult['di_minus'][index];

        // Weekly AVWAP — ✅ camelCase везде
        (candle as CandleWithIndicators)['wAvwap'] = wAvwapResult['wAvwap'][index];
        (candle as CandleWithIndicators)['wAvwapUpperBand'] =
          wAvwapResult['wAvwapUpperBand'][index];
        (candle as CandleWithIndicators)['wAvwapLowerBand'] =
          wAvwapResult['wAvwapLowerBand'][index];

        // Monthly AVWAP
        (candle as CandleWithIndicators)['mAvwap'] = mAvwapResult['mAvwap'][index];
        (candle as CandleWithIndicators)['mAvwapUpperBand'] =
          mAvwapResult['mAvwapUpperBand'][index];
        (candle as CandleWithIndicators)['mAvwapLowerBand'] =
          mAvwapResult['mAvwapLowerBand'][index];

        // Bollinger Bands
        (candle as CandleWithIndicators)['bbBasis'] = bbResult['bb_basis'][index];
        (candle as CandleWithIndicators)['bbUpper'] = bbResult['bb_upper'][index];
        (candle as CandleWithIndicators)['bbLower'] = bbResult['bb_lower'][index];
        (candle as CandleWithIndicators)['bbWidth'] = bbResult['bb_width'][index];

        (candle as CandleWithIndicators)['chv'] = chvResult['chv'][index];
        (candle as CandleWithIndicators)['cmf'] = cmfResult['cmf'][index];

        (candle as CandleWithIndicators)['macd'] = macdResult['macd'][index];
        (candle as CandleWithIndicators)['macdSignal'] = macdResult['macd_signal'][index];
        (candle as CandleWithIndicators)['macdHistogram'] = macdResult['macd_histogram'][index];

        (candle as CandleWithIndicators)['rsi'] = rsiResult['rsi'][index];
        (candle as CandleWithIndicators)['obv'] = obvResult['obv'][index];
        (candle as CandleWithIndicators)['obvEma20'] = obvResult['obv_ema_20'][index];

        // RVWAP
        (candle as CandleWithIndicators)['rvwap'] = rVwwapResult['rvwap'][index];
        (candle as CandleWithIndicators)['rvwapUpperBand1'] =
          rVwwapResult['rvwap_upper_band_1'][index];
        (candle as CandleWithIndicators)['rvwapUpperBand2'] =
          rVwwapResult['rvwap_upper_band_2'][index];
        (candle as CandleWithIndicators)['rvwapLowerBand1'] =
          rVwwapResult['rvwap_lower_band_1'][index];
        (candle as CandleWithIndicators)['rvwapLowerBand2'] =
          rVwwapResult['rvwap_lower_band_2'][index];
        (candle as CandleWithIndicators)['rvwapWidth1'] = rVwwapResult['rvwap_width_1'][index];
        (candle as CandleWithIndicators)['rvwapWidth2'] = rVwwapResult['rvwap_width_2'][index];

        (candle as CandleWithIndicators)['kama'] = kamaResult['kama'][index];

        // PATTERNS
        (candle as CandleWithIndicators)['isDoji'] = patternResult['isDoji'][index];
        (candle as CandleWithIndicators)['isBullishEngulfing'] =
          patternResult['isBullishEngulfing'][index];
        (candle as CandleWithIndicators)['isBearishEngulfing'] =
          patternResult['isBearishEngulfing'][index];
        (candle as CandleWithIndicators)['isHammer'] = patternResult['isHammer'][index];
        (candle as CandleWithIndicators)['isPinbar'] = patternResult['isPinbar'][index];

        // Highest / Lowest
        (candle as CandleWithIndicators)['lowest50'] = lowestLowResult['lowest50'][index];
        (candle as CandleWithIndicators)['lowest100'] = lowestLowResult['lowest100'][index];
        (candle as CandleWithIndicators)['highest50'] = highestHighResult['highest50'][index];
        (candle as CandleWithIndicators)['highest100'] = highestHighResult['highest100'][index];

        (candle as CandleWithIndicators)['vzo'] = vzoResult['vzo'][index];

        // Z-SCORE
        (candle as CandleWithIndicators)['closePriceZScore'] = zScoreClose[index];
        (candle as CandleWithIndicators)['volumeZScore'] = zScoreVolume[index];
        (candle as CandleWithIndicators)['volumeDeltaZScore'] = zScoreVolDelta[index];
        (candle as CandleWithIndicators)['fundingRateZScore'] = zScoreFunding[index];
        (candle as CandleWithIndicators)['openInterestZScore'] = zScoreOI[index];

        // SLOPE
        (candle as CandleWithIndicators)['slopeEma50'] = slopeEma50[index];
        (candle as CandleWithIndicators)['slopeEma100'] = slopeEma150[index];
        (candle as CandleWithIndicators)['slopeEma150'] = slopeEma150[index];
        (candle as CandleWithIndicators)['slopeRvwap'] = slopeRvwap[index];
        (candle as CandleWithIndicators)['slopeMAvwap'] = slopeMAvwap[index];
        (candle as CandleWithIndicators)['slopeWAvwap'] = slopeWAvwap[index];
        (candle as CandleWithIndicators)['slopeZClose'] = slopeZClose[index];
        (candle as CandleWithIndicators)['slopeZVolume'] = slopeZVolume[index];
        (candle as CandleWithIndicators)['slopeZVolumeDelta'] = slopeZVolDelta[index];
        (candle as CandleWithIndicators)['slopeZOi'] = slopeZoi[index];
        (candle as CandleWithIndicators)['slopeZFunding'] = slopeZFunding[index];

        // STATES — ✅ ВСЕ включая W/M-AVWAP
        (candle as CandleWithIndicators)['isAboveRvwap'] = stateResults['isAboveRvwap'][index];
        (candle as CandleWithIndicators)['isBelowRvwap'] = stateResults['isBelowRvwap'][index];
        (candle as CandleWithIndicators)['isCrossedUpRvwap'] =
          stateResults['isCrossedUpRvwap'][index];
        (candle as CandleWithIndicators)['isCrossedDownRvwap'] =
          stateResults['isCrossedDownRvwap'][index];
        (candle as CandleWithIndicators)['isBetweenRvwapBands'] =
          stateResults['isBetweenRvwapBands'][index];

        (candle as CandleWithIndicators)['isAboveKama'] = stateResults['isAboveKama'][index];
        (candle as CandleWithIndicators)['isBelowKama'] = stateResults['isBelowKama'][index];
        (candle as CandleWithIndicators)['isCrossedUpKama'] =
          stateResults['isCrossedUpKama'][index];
        (candle as CandleWithIndicators)['isCrossedDownKama'] =
          stateResults['isCrossedDownKama'][index];

        (candle as CandleWithIndicators)['isAboveEma50'] = stateResults['isAboveEma50'][index];
        (candle as CandleWithIndicators)['isBelowEma50'] = stateResults['isBelowEma50'][index];
        (candle as CandleWithIndicators)['isCrossedUpEma50'] =
          stateResults['isCrossedUpEma50'][index];
        (candle as CandleWithIndicators)['isCrossedDownEma50'] =
          stateResults['isCrossedDownEma50'][index];

        (candle as CandleWithIndicators)['isAboveEma100'] = stateResults['isAboveEma100'][index];
        (candle as CandleWithIndicators)['isBelowEma100'] = stateResults['isBelowEma100'][index];
        (candle as CandleWithIndicators)['isCrossedUpEma100'] =
          stateResults['isCrossedUpEma100'][index];
        (candle as CandleWithIndicators)['isCrossedDownEma100'] =
          stateResults['isCrossedDownEma100'][index];

        (candle as CandleWithIndicators)['isAboveEma150'] = stateResults['isAboveEma150'][index];
        (candle as CandleWithIndicators)['isBelowEma150'] = stateResults['isBelowEma150'][index];
        (candle as CandleWithIndicators)['isCrossedUpEma150'] =
          stateResults['isCrossedUpEma150'][index];
        (candle as CandleWithIndicators)['isCrossedDownEma150'] =
          stateResults['isCrossedDownEma150'][index];

        // ✅ W-AVWAP states
        (candle as CandleWithIndicators)['isAboveWAvwap'] = stateResults['isAboveWAvwap'][index];
        (candle as CandleWithIndicators)['isBelowWAvwap'] = stateResults['isBelowWAvwap'][index];
        (candle as CandleWithIndicators)['isCrossedUpWAvwap'] =
          stateResults['isCrossedUpWAvwap'][index];
        (candle as CandleWithIndicators)['isCrossedDownWAvwap'] =
          stateResults['isCrossedDownWAvwap'][index];

        // ✅ M-AVWAP states
        (candle as CandleWithIndicators)['isAboveMAvwap'] = stateResults['isAboveMAvwap'][index];
        (candle as CandleWithIndicators)['isBelowMAvwap'] = stateResults['isBelowMAvwap'][index];
        (candle as CandleWithIndicators)['isCrossedUpMAvwap'] =
          stateResults['isCrossedUpMAvwap'][index];
        (candle as CandleWithIndicators)['isCrossedDownMAvwap'] =
          stateResults['isCrossedDownMAvwap'][index];

        // EMA FAN
        (candle as CandleWithIndicators)['isBullishFan'] = fanResult['isBullishFan'][index];
        (candle as CandleWithIndicators)['isBearishFan'] = fanResult['isBearishFan'][index];
        (candle as CandleWithIndicators)['isMessFan'] = fanResult['isMessFan'][index];
        (candle as CandleWithIndicators)['isBullishPunch'] = fanResult['isBullishPunch'][index];
        (candle as CandleWithIndicators)['isBearishPunch'] = fanResult['isBearishPunch'][index];

        // BREAKOUTS
        (candle as CandleWithIndicators)['isCrossedUpHighest50'] =
          breakout50['isCrossedUpHighest50'][index];
        (candle as CandleWithIndicators)['isCrossedDownLowest50'] =
          breakout50['isCrossedDownLowest50'][index];
        (candle as CandleWithIndicators)['isCrossedUpHighest100'] =
          breakout100['isCrossedUpHighest100'][index];
        (candle as CandleWithIndicators)['isCrossedDownLowest100'] =
          breakout100['isCrossedDownLowest100'][index];
      });
    }
    return data;
  }
}
