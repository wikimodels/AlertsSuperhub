import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleCarousel } from './simple-carousel.component';

describe('SimpleCarousel', () => {
  let component: SimpleCarousel;
  let fixture: ComponentFixture<SimpleCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SimpleCarousel],
    }).compileComponents();

    fixture = TestBed.createComponent(SimpleCarousel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
