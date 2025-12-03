Subject: Анализ ошибки миграции API lightweight-charts с v4 на v5 в Angular (TypeScript)
AI Bot On-boarding: Этот документ разбирает критическую (breaking change) ошибку, возникшую при использовании lightweight-charts v5 в TypeScript, которая генерирует крайне запутанные и циклические ошибки компиляции.

1. Контекст Проблемы
Библиотека: lightweight-charts

Установленная версия: ^5.0.9 (это v5)

Среда: Angular / TypeScript

2. Симптомы (Ошибки компиляции)
Пользователь столкнулся с каскадными ошибками, которые, казалось, противоречили друг другу:

'CandlestickSeriesApi' has no exported member. Did you mean 'CandlestickSeries'?

'HistogramSeriesApi' has no exported member. Did you mean 'HistogramSeries'?

Property 'addCandlestickSeries' does not exist on type 'IChartApi'.

Property 'addHistogramSeries' does not exist on type 'IChartApi'.

3. Анализ: "Breaking Change" (v4 vs. v5)
Основная причина всех ошибок — это "New Unified Series Creation API" (Новый Единый API Создания Серий), введенный в v5.

Неправильный код (Стиль v4, который пытался использовать пользователь)
Этот код не работает в v5:

TypeScript

// 1. НЕПРАВИЛЬНЫЕ Импорты (типы v4/v5)
import { 
  IChartApi, 
  CandlestickSeriesApi, // ❌ ОШИБКА 1
  HistogramSeriesApi    // ❌ ОШИБКА 2
} from 'lightweight-charts';

// 2. НЕПРАВИЛЬНЫЕ Типы свойств
private candleSeries: CandlestickSeriesApi | null = null;
private volumeSeries: HistogramSeriesApi | null = null;

// ...

// 3. НЕПРАВИЛЬНЫЕ Вызовы методов (API v4)
this.candleSeries = this.chartApi.addCandlestickSeries({...}); // ❌ ОШИБКА 3
this.volumeSeries = this.chartApi.addHistogramSeries({...}); // ❌ ОШИБКА 4
Правильный код (Стиль v5,)
Этот код работает в v5:

TypeScript

// 1. ПРАВИЛЬНЫЕ Импорты (v5)
import {
  IChartApi,
  ISeriesApi,          // ✅ (Общий тип для серий)
  CandlestickSeries,   // ✅ (Это *ЗНАЧЕНИЕ*, а не тип)
  HistogramSeries      // ✅ (Это *ЗНАЧЕНИЕ*, а не тип)
} from 'lightweight-charts';

// 2. ПРАВИЛЬНЫЕ Типы свойств
private candleSeries: ISeriesApi<'Candlestick'> | null = null;
private volumeSeries: ISeriesApi<'Histogram'> | null = null;

// ...

// 3. ПРАВИЛЬНЫЕ Вызовы методов (API v5)
this.candleSeries = this.chartApi.addSeries(CandlestickSeries, {...});
this.volumeSeries = this.chartApi.addSeries(HistogramSeries, {...});
4. Расшифровка "Запутанных" Ошибок
Вот почему ошибки были такими "каловыми":

Property 'addCandlestickSeries' does not exist on type 'IChartApi'.

Объяснение: Это 100% правда. В v5 этот метод был удален и заменен на addSeries.

'CandlestickSeriesApi' has no exported member. Did you mean 'CandlestickSeries'?

Объяснение: Это была главная подсказка. Компилятор был прав: тип CandlestickSeriesApi (который использовался в v4) больше не экспортируется таким образом. Вместо него lightweight-charts v5 экспортирует значение (класс) CandlestickSeries.

Компилятор буквально говорил: "Перестань пытаться импортировать этот ТИП и вместо этого импортируй это ЗНАЧЕНИЕ, потому что ты должен передать его в addSeries".

Заключение для AI-бота:
При анализе ошибок lightweight-charts v5:

Проверь вызовы методов: Если код использует .addCandlestickSeries() или .addHistogramSeries(), это код v4, и он не сработает.

Проверь импорты: Правильный паттерн v5 — импортировать IChartApi и ISeriesApi (как типы), а также CandlestickSeries и HistogramSeries (как значения).

Правильный API: IChartApi.addSeries(SeriesType, options).

Проблема была не в node_modules или кэше NPM, а в фундаментальном (breaking change) изменении API между v4 и v5, которое генерирует крайне неочевидные ошибки типов.
