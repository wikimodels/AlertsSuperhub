import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VwapAlertChart } from './vwap-alert-chart';

describe('VwapAlertChart', () => {
  let component: VwapAlertChart;
  let fixture: ComponentFixture<VwapAlertChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VwapAlertChart]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VwapAlertChart);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
