import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewLineAlert } from './new-line-alert';

describe('NewLineAlert', () => {
  let component: NewLineAlert;
  let fixture: ComponentFixture<NewLineAlert>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewLineAlert]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewLineAlert);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
