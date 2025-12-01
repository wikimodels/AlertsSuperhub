// projects/data-core/src/lib/models/indicator-result.model.ts

/** * Стандартный тип, возвращаемый каждой функцией расчета.
 * Ключ: Имя поля в Candle (e.g., 'macd', 'bb_upper').
 * Значение: Массив рассчитанных чисел (number[]).
 */
export type IndicatorResult = { [key: string]: number[] };
