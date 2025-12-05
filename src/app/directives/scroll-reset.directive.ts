import { Directive, ElementRef, Input, OnChanges, SimpleChanges, inject } from '@angular/core';

@Directive({
  selector: '[appScrollReset]',
  standalone: true,
})
export class ScrollResetDirective implements OnChanges {
  private el = inject(ElementRef);

  // Триггер: передаем сюда данные, при изменении которых нужно сбросить скролл
  @Input() appScrollReset: any;

  ngOnChanges(changes: SimpleChanges): void {
    // Если значение изменилось (даже если это первое изменение)
    if (changes['appScrollReset']) {
      this.scrollToTop();
    }
  }

  private scrollToTop() {
    // 1. Сброс скролла самого элемента (контейнера таблицы)
    const nativeEl = this.el.nativeElement;
    if (nativeEl) {
      nativeEl.scrollTop = 0;
      nativeEl.scrollLeft = 0;
    }

    // 2. Сброс скролла всего окна браузера
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto', // или 'smooth', если нужна анимация
    });
  }
}
