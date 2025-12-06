import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WorkingLineAlerts } from './working-line-alerts';

describe('WorkingLineAlerts', () => {
  let component: WorkingLineAlerts;
  let fixture: ComponentFixture<WorkingLineAlerts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkingLineAlerts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WorkingLineAlerts);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
