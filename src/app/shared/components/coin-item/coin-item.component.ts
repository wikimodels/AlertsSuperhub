import { Component, inject, ChangeDetectionStrategy, computed, input } from '@angular/core';
// 🚀 ДОБАВЛЕНО:
import { toSignal } from '@angular/core/rxjs-interop';
import { CommonModule, NgOptimizedImage } from '@angular/common';
// ❌ "SHIT" УДАЛЕН (как и в прошлый раз)
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatTooltipModule } from '@angular/material/tooltip';
import { WorkingCoin } from '../../models/working-coin.model';
import { CoinLinksService } from '../../services/coin-links.service';
import { GenericSelectionService } from '../../services/generic.selection.service';
import { LinksComponent } from '../links/links.component';
import { MatRipple } from '@angular/material/core';

@Component({
  selector: 'app-coin-item',
  standalone: true,
  imports: [CommonModule, MatRipple, LinksComponent],
  templateUrl: './coin-item.component.html',
  styleUrls: ['./coin-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoinItemComponent {
  // --- Внедрение сервисов ---
  private linksService = inject(CoinLinksService);
  // 🚀 ДОБАВЛЕНО: Внедрение сервиса выбора
  private selectionService = inject(GenericSelectionService<WorkingCoin>);

  // --- Входные данные ---
  coin = input.required<WorkingCoin>();

  // --- 🚀 ДОБАВЛЕНО: Реактивное состояние выбора ---
  // 1. Конвертируем Observable в Signal
  private selectionSignal = toSignal(this.selectionService.selectionChanges$, { initialValue: [] });
  // 2. Вычисляем, выбрана ли *эта* монета
  public isSelected = computed(() => this.selectionSignal().includes(this.coin()));

  // --- Производные сигналы для ссылок (БЕЗ ИЗМЕНЕНИЙ) ---
  tvLink = computed(() =>
    this.linksService.tradingViewLink(this.coin().symbol, this.coin().exchanges)
  );
  cgLink = computed(() =>
    this.linksService.coinglassLink(this.coin().symbol, this.coin().exchanges)
  );
  hasBinance = computed(() =>
    this.coin().exchanges.some((ex) => ex.toLowerCase().includes('binance'))
  );
  hasBybit = computed(() => this.coin().exchanges.some((ex) => ex.toLowerCase().includes('bybit')));
  binanceLink = computed(() => this.linksService.exchangeLink(this.coin().symbol, 'Binance'));
  bybitLink = computed(() => this.linksService.exchangeLink(this.coin().symbol, 'Bybit'));
  binanceLogo = computed(() => this.linksService.exchangeLogoLink('Binance'));
  bybitLogo = computed(() => this.linksService.exchangeLogoLink('Bybit'));
  tvLogo = computed(() => 'assets/icons/tv.svg');
  cgLogo = computed(() => 'assets/icons/coinglass.svg');

  /**
   * Обработчик ошибок для <img ngSrc> (БЕЗ ИЗМЕНЕНИЙ)
   */
  public onImageError(event: Event) {
    const element = event.target as HTMLImageElement;
    element.src = 'assets/logo/no-name.svg';
  }

  // --- 🚀 ДОБАВЛЕНО: Клик по всей капсуле ---
  public onPillClick(): void {
    // Переключаем состояние в *общем* сервисе
    this.selectionService.toggle(this.coin());
  }

  // --- 🚀 ИЗМЕНЕНО: Методы кликов по иконкам теперь останавливают всплытие ---

  public clickBinance(event: MouseEvent): void {
    event.stopPropagation(); // ❗️ Предотвращаем клик по капсуле
    if (this.binanceLink()) {
      window.open(this.binanceLink(), '_blank');
    }
  }

  public clickBybit(event: MouseEvent): void {
    event.stopPropagation(); // ❗️ Предотвращаем клик по капсуле
    if (this.bybitLink()) {
      window.open(this.bybitLink(), '_blank');
    }
  }

  public clickTv(event: MouseEvent): void {
    event.stopPropagation(); // ❗️ Предотвращаем клик по капсуле
    if (this.tvLink()) {
      window.open(this.tvLink(), '_blank');
    }
  }

  public clickCg(event: MouseEvent): void {
    event.stopPropagation(); // ❗️ Предотвращаем клик по капсуле
    if (this.cgLink()) {
      window.open(this.cgLink(), '_blank');
    }
  }
}
