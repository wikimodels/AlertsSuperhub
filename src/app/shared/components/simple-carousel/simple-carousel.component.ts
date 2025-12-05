import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-simple-carousel',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './simple-carousel.component.html',
  styleUrls: ['./simple-carousel.component.scss'],
})
export class SimpleCarouselComponent {
  @Input() images: string[] = [];
  activeSlide = signal(0);

  // 🚀 FIX: Логика зацикливания (Loop)
  navigate(el: HTMLElement, direction: number) {
    const total = this.images.length;
    if (total === 0) return;

    const current = this.activeSlide();
    let nextIndex = current + direction;

    // Loop logic
    if (nextIndex >= total) {
      nextIndex = 0; // С конца в начало
    } else if (nextIndex < 0) {
      nextIndex = total - 1; // С начала в конец
    }

    this.scrollToIndex(el, nextIndex);
  }

  scrollToIndex(el: HTMLElement, index: number) {
    const width = el.clientWidth;
    el.scrollTo({ left: width * index, behavior: 'smooth' });
  }

  onScroll(el: HTMLElement) {
    // Определяем текущий индекс при скролле
    const index = Math.round(el.scrollLeft / el.clientWidth);
    this.activeSlide.set(index);
  }
}
