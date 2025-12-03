import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LineAlertChart } from './line-alert-chart';

describe('LineAlertChart', () => {
  let component: LineAlertChart;
  let fixture: ComponentFixture<LineAlertChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LineAlertChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LineAlertChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
