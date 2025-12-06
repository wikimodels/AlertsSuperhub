import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlertsPanelButtons } from './alerts-panel-buttons';

describe('AlertsPanelButtons', () => {
  let component: AlertsPanelButtons;
  let fixture: ComponentFixture<AlertsPanelButtons>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertsPanelButtons]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AlertsPanelButtons);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
