import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
  effect,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LoadingSpinnerComponent } from '../shared/components/loading-spinner/loading-spinner.component';
import { WorkingCoin } from './models/working-coin.model';
import { CoinsService } from './services/coins.service';
import { CoinItemComponent } from '../shared/components/coin-item/coin-item.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GenericSelectionService } from '../shared/services/generic.selection.service';
import { SearchFilterComponent } from '../shared/components/search-filter/search-filter.component';
import { MatRipple } from '@angular/material/core';
import { NotificationService, NotificationType } from '../shared/services/notification.service';
import { CoinLinksService } from '../shared/services/coin-links.service';

// ✅ 4 состояния сортировки
type SortMode = 'name-asc' | 'name-desc' | 'category-asc' | 'category-desc';

@Component({
  selector: 'app-coins',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    CoinItemComponent,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    SearchFilterComponent,
    MatRipple,
  ],
  templateUrl: './coins.html',
  styleUrls: ['./coins.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Coins {
  private coinsService = inject(CoinsService);
  private selectionService = inject(GenericSelectionService<WorkingCoin>);
  private notificationService = inject(NotificationService);
  private linksService = inject(CoinLinksService);

  public coins = signal<WorkingCoin[]>([]);
  public isLoading = signal<boolean>(true);
  public filterText = signal<string>('');

  // ✅ Режим сортировки (стартуем с name-asc)
  public sortMode = signal<SortMode>('name-asc');

  // ✅ Подписываемся на изменения selection через toSignal
  private selectionSignal = toSignal(this.selectionService.selectionChanges$, {
    initialValue: [],
  });

  // ✅ Хранилище открытых окон
  private openedWindows: Window[] = [];

  // ✅ Количество выбранных монет
  public selectionCount = computed(() => this.selectionSignal().length);

  // ✅ Иконка сортировки (динамическая)
  public sortIcon = computed(() => {
    const mode = this.sortMode();
    if (mode === 'name-asc' || mode === 'category-asc') {
      return 'sort-up';
    } else {
      return 'sort-down';
    }
  });

  // ✅ Отфильтрованные И отсортированные монеты
  public filteredCoins = computed(() => {
    let allCoins = [...this.coins()];
    const filter = this.filterText().toLowerCase();

    // Фильтрация
    if (filter) {
      allCoins = allCoins.filter((coin) => coin.symbol.toLowerCase().includes(filter));
    }

    // Сортировка
    const mode = this.sortMode();

    if (mode === 'name-asc') {
      // A → Z
      allCoins.sort((a, b) => a.symbol.localeCompare(b.symbol));
    } else if (mode === 'name-desc') {
      // Z → A
      allCoins.sort((a, b) => b.symbol.localeCompare(a.symbol));
    } else if (mode === 'category-asc') {
      // Category 1 → 6
      allCoins.sort((a, b) => a.category - b.category);
    } else if (mode === 'category-desc') {
      // Category 6 → 1
      allCoins.sort((a, b) => b.category - a.category);
    }

    return allCoins;
  });

  // ✅ Проверяем, есть ли хоть одна выбранная монета (реактивно!)
  public hasSelection = computed(() => {
    return this.selectionSignal().length > 0;
  });

  constructor() {
    this.loadCoins();

    // ✅ Отслеживаем количество выбранных монет
    effect(() => {
      const count = this.selectionCount();
      if (count > 7) {
        this.notificationService.warning('Max selection number is 7');
        // Автоматически удаляем последнюю выбранную монету
        const selected = this.selectionSignal();
        const lastCoin = selected[selected.length - 1];
        this.selectionService.deselect(lastCoin);
      }
    });
  }

  private async loadCoins() {
    try {
      this.isLoading.set(true);
      const coinData = await this.coinsService.getWorkingCoins();
      this.coins.set(coinData);
    } catch (error) {
      console.error('❌ CoinsComponent: Ошибка загрузки монет', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  public onFilterChange(filterValue: string): void {
    this.filterText.set(filterValue);
  }

  // ✅ Циклическое переключение: name-asc → name-desc → category-asc → category-desc → name-asc...
  public sortOut(): void {
    const current = this.sortMode();

    switch (current) {
      case 'name-asc':
        this.sortMode.set('name-desc');
        break;
      case 'name-desc':
        this.sortMode.set('category-asc');
        break;
      case 'category-asc':
        this.sortMode.set('category-desc');
        break;
      case 'category-desc':
        this.sortMode.set('name-asc');
        break;
    }
  }

  public clearSelection(): void {
    this.selectionService.clear();
  }

  // ✅ Переключение: если есть выбранные - очищаем, если нет - выбираем все
  public toggleSelectAll(): void {
    if (this.selectionService.hasValue()) {
      // Если что-то выбрано - очищаем всё
      this.selectionService.clear();
    } else {
      // Если ничего не выбрано - выбираем все отфильтрованные монеты
      this.selectionService.select(this.filteredCoins());
    }
  }

  // ✅ Открыть TradingView для всех выбранных монет
  public async openTradingView(): Promise<void> {
    const selected = this.selectionSignal();

    if (selected.length === 0) {
      this.notificationService.info('No coins selected');
      return;
    }

    for (let i = 0; i < selected.length; i++) {
      const coin = selected[i];
      const link = this.linksService.tradingViewLink(coin.symbol, coin.exchanges);

      if (link) {
        const newWindow = window.open(link, '_blank');
        if (newWindow) {
          this.openedWindows.push(newWindow);
        }
      }

      // Задержка 400мс между окнами (кроме последнего)
      if (i < selected.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  }

  // ✅ Открыть CoinGlass для всех выбранных монет
  public async openCoinGlass(): Promise<void> {
    const selected = this.selectionSignal();

    if (selected.length === 0) {
      this.notificationService.info('No coins selected');
      return;
    }

    for (let i = 0; i < selected.length; i++) {
      const coin = selected[i];
      const link = this.linksService.coinglassLink(coin.symbol, coin.exchanges);

      if (link) {
        const newWindow = window.open(link, '_blank');
        if (newWindow) {
          this.openedWindows.push(newWindow);
        }
      }

      // Задержка 400мс между окнами (кроме последнего)
      if (i < selected.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  }

  // ✅ Закрыть все открытые окна
  public closeWindows(): void {
    let closedCount = 0;

    this.openedWindows.forEach((win) => {
      if (win && !win.closed) {
        win.close();
        closedCount++;
      }
    });

    // Очищаем массив
    this.openedWindows = [];
  }
}
