import { TestBed } from '@angular/core/testing';

import { StackedPanelsService } from './stacked-panels.service';

describe('StackedPanelsService', () => {
  let service: StackedPanelsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        StackedPanelsService
      ]
    });
    service = TestBed.inject(StackedPanelsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
