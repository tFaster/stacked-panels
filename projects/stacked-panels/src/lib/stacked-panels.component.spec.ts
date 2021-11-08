import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StackedPanelsComponent } from './stacked-panels.component';

describe('StackedPanelsComponent', () => {
  let component: StackedPanelsComponent;
  let fixture: ComponentFixture<StackedPanelsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StackedPanelsComponent ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StackedPanelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
