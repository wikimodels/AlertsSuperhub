// projects/data-core/src/lib/calculations/ma.ts (УНИФИЦИРОВАННЫЙ ФАЙЛ)

/**
 * Рассчитывает простое скользящее среднее (SMA).
 */
export function calculateSMA(series: number[], length: number): number[] {
  const sma: number[] = new Array(series.length).fill(NaN);

  for (let i = length - 1; i < series.length; i++) {
    const slice = series.slice(i - length + 1, i + 1);
    const sum = slice.reduce((a, b) => a + b, 0);
    sma[i] = sum / length;
  }
  return sma;
}

/**
 * Рассчитывает экспоненциальное скользящее среднее (EMA).
 */
export function calculateEMA(series: number[], length: number): number[] {
  const ema: number[] = new Array(series.length).fill(NaN);
  if (series.length < length) return ema;

  const k = 2 / (length + 1);

  // 1. Первое значение EMA равно SMA, вызываем из того же файла
  const sma = calculateSMA(series, length);
  ema[length - 1] = sma[length - 1];

  // 2. Итеративный расчет: EMA[i] = (Price[i] * k) + (EMA[i-1] * (1 - k))
  for (let i = length; i < series.length; i++) {
    ema[i] = series[i] * k + ema[i - 1] * (1 - k);
  }
  return ema;
}
