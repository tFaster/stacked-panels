import { TestBed } from '@angular/core/testing';

import { StackedPanelsService } from './stacked-panels.service';
import { combineLatest, debounceTime, Observable, of, skip, take } from 'rxjs';
import { AddSubPanelsFunction, GetDataFunction, Panel } from '@tfaster/stacked-panels';
import { TemplateRef } from '@angular/core';

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

  it('should create and show root panel', (done) => {
    getPanelsAndShownPanelsAndTopPanel$(service).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(1);
      expect(panels[0]).toBe(rootPanel);
      expect(shownPanels.length).toBe(1);
      expect(shownPanels[0]).toBe(rootPanel);
      expect(topPanel).toBe(rootPanel);
      done();
    });

    const rootPanel: Panel = createTestPanel('rootPanel');

    service.initRootPanel(rootPanel);

    expect(service.isPanelShown(rootPanel.id)).toBeTrue();
  });

  it('should create and show root panel with subpages', (done) => {
    getPanelsAndShownPanelsAndTopPanel$(service).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(3);
      expect(panels[0]).toBe(rootPanel);
      expect(panels[1]).toBe(subPanel1);
      expect(panels[2]).toBe(subPanel2);
      expect(shownPanels.length).toBe(1);
      expect(shownPanels[0]).toBe(rootPanel);
      expect(topPanel).toBe(rootPanel);
      done();
    });

    const subPanel1: Panel = createTestPanel('subPanel1');
    const subPanel2: Panel = createTestPanel('subPanel2');
    const rootPanel: Panel = createTestPanel('rootPanel', [subPanel1, subPanel2]);

    service.initRootPanel(rootPanel);

    expect(service.isPanelShown(rootPanel.id)).toBeTrue();
    expect(service.isPanelShown(subPanel1.id)).toBeFalse();
    expect(service.isPanelShown(subPanel2.id)).toBeFalse();
  });

  it('should create and show root panel with subpages and navigate to subpage', (done) => {
    const subPanel: Panel = createTestPanel('subPanel');
    const rootPanel: Panel = createTestPanel('rootPanel', [subPanel]);

    getPanelsAndShownPanelsAndTopPanel$(service).pipe(
    ).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(2);
      expect(panels[0]).toBe(rootPanel);
      expect(panels[1]).toBe(subPanel);
      expect(shownPanels.length).withContext('rootPanel and subPanel should be shown').toBe(2);
      expect(shownPanels[0]).toBe(rootPanel);
      expect(shownPanels[1]).toBe(subPanel);
      expect(topPanel).toBe(subPanel);
      done();
    });

    service.initRootPanel(rootPanel);

    expect(service.getController(rootPanel.id).canGoBack()).toBeFalse();
    expect(service.isPanelShown(rootPanel.id)).toBeTrue();
    expect(service.isPanelShown(subPanel.id)).toBeFalse();

    service.getController(rootPanel.id).goTo(subPanel.id);

    expect(service.isPanelShown(rootPanel.id)).toBeTrue();
    expect(service.isPanelShown(subPanel.id)).toBeTrue();
  });

  it('should create and show root panel with subpages and navigate to subpage and back', (done) => {
    const subPanel: Panel = createTestPanel('subPanel');
    const rootPanel: Panel = createTestPanel('rootPanel', [subPanel]);

    getPanelsAndShownPanelsAndTopPanel$(service).pipe(
    ).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(2);
      expect(panels[0]).toBe(rootPanel);
      expect(shownPanels.length).withContext('rootPanel should be shown').toBe(1);
      expect(shownPanels[0]).toBe(rootPanel);
      expect(topPanel).toBe(rootPanel);
      done();
    });

    service.initRootPanel(rootPanel);
    service.getController(rootPanel.id).goTo(subPanel.id);

    expect(service.getController(subPanel.id).canGoBack()).toBeTrue();

    service.getController(subPanel.id).back();

    expect(service.isPanelShown(rootPanel.id)).toBeTrue();
    expect(service.isPanelShown(subPanel.id)).toBeFalse();
  });

  it('should create root panel with data', () => {
    const rootPanel: Panel = createTestPanel('rootPanel', [], 'myData');

    service.initRootPanel(rootPanel);

    const rootPanelData: string = service.getPanelData$(rootPanel.id);

    expect(rootPanelData).toBe(rootPanel.data);
  });

  it('should create root panel with observable data', (done) => {
    const rootPanel: Panel = createTestPanel('rootPanel', [], of('myData'));

    service.initRootPanel(rootPanel);

    const rootPanelData: Observable<string> = service.getPanelData$(rootPanel.id);

    expect(rootPanelData).toBeDefined();
    rootPanelData.subscribe((data: string) => {
      expect(data).toBe('myData');
      done();
    });
  });

  it('should create root panel with subPanel with GetData function', (done) => {

    const getData: GetDataFunction<number, number> = (context: number | undefined) => {
      return of(context + 1);
    };

    const subPanel: Panel = createTestPanel('subPanel', [], getData);
    const rootPanel: Panel = createTestPanel('rootPanel', [subPanel]);

    service.initRootPanel(rootPanel);
    service.getController(rootPanel.id).goTo(subPanel.id, 41);

    const subPanelData$: Observable<number> = service.getPanelData$(subPanel.id);

    expect(subPanelData$).toBeDefined();
    subPanelData$.subscribe((data: number) => {
      expect(data).toBe(42);
      done();
    });
  });

  it('should create root panel with subPanel with GetData function adding sub panels', (done) => {

    const subSubPanel = createTestPanel('sub-subPanel');
    const lazySubSubPanel1 = createTestPanel('dynamic-sub-subPanel1');
    const lazySubSubPanel2 = createTestPanel('dynamic-sub-subPanel2');

    const getDataAddingSubpanels: GetDataFunction<string, any> = (context: any, addSubPanels: AddSubPanelsFunction) => {
      addSubPanels('subPanel', [lazySubSubPanel1, lazySubSubPanel2]);
      return of('myData');
    };

    const subPanel: Panel = createTestPanel('subPanel', [subSubPanel], getDataAddingSubpanels);
    const rootPanel: Panel = createTestPanel('rootPanel', [subPanel]);

    getPanelsAndShownPanelsAndTopPanel$(service).pipe(
      take(1)
    ).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(5);
      expect(panels[0]).toBe(rootPanel);
      expect(panels[1]).toBe(subPanel);
      expect(panels[2]).toBe(subSubPanel);
      expect(panels[3]).toBe(lazySubSubPanel1);
      expect(panels[4]).toBe(lazySubSubPanel2);
      expect(shownPanels.length).withContext('rootPanel and subPanel should be shown').toBe(2);
      expect(shownPanels[0]).toBe(rootPanel);
      expect(shownPanels[1]).toBe(subPanel);
      expect(topPanel).toBe(subPanel);
    });

    getPanelsAndShownPanelsAndTopPanel$(service).pipe(
      skip(1),
      take(1)
    ).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(2);
      expect(panels[0]).toBe(rootPanel);
      expect(panels[1]).toBe(subPanel);
      expect(shownPanels.length).withContext('rootPanel should be shown').toBe(1);
      expect(shownPanels[0]).toBe(rootPanel);
      expect(topPanel).toBe(rootPanel);
      done();
    });

    service.initRootPanel(rootPanel);
    service.getController(rootPanel.id).goTo(subPanel.id);

    setTimeout(() => {
      service.getController(subPanel.id).back();
    }, 100);
  });

  it('should create root panel with subPanel with GetData function adding sub panels removing existing', (done) => {

    const subSubPanel = createTestPanel('sub-subPanel');
    const lazySubSubPanel = createTestPanel('lazy-sub-subPanel');

    const getDataAddingSubpanels: GetDataFunction<string, any> = (context: any, addSubPanels: AddSubPanelsFunction) => {
      addSubPanels('subPanel', [lazySubSubPanel], false);
      return of('myData');
    };

    const subPanel: Panel = createTestPanel('subPanel', [subSubPanel], getDataAddingSubpanels);
    const rootPanel: Panel = createTestPanel('rootPanel', [subPanel]);

    getPanelsAndShownPanelsAndTopPanel$(service).pipe(
      take(1)
    ).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(3);
      expect(panels[0]).toBe(rootPanel);
      expect(panels[1]).toBe(subPanel);
      expect(panels[2]).toBe(lazySubSubPanel);
      expect(shownPanels.length).withContext('rootPanel and subPanel should be shown').toBe(2);
      expect(shownPanels[0]).toBe(rootPanel);
      expect(shownPanels[1]).toBe(subPanel);
      expect(topPanel).toBe(subPanel);
    });

    getPanelsAndShownPanelsAndTopPanel$(service).pipe(
      skip(1),
      take(1)
    ).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(2);
      expect(panels[0]).toBe(rootPanel);
      expect(panels[1]).toBe(subPanel);
      expect(shownPanels.length).withContext('rootPanel should be shown').toBe(1);
      expect(shownPanels[0]).toBe(rootPanel);
      expect(topPanel).toBe(rootPanel);
      done();
    });

    service.initRootPanel(rootPanel);
    service.getController(rootPanel.id).goTo(subPanel.id);

    setTimeout(() => {
      service.getController(subPanel.id).back();
    }, 100);
  });

  it('should create root panel with subPanel with GetData function adding sub panels after delays removing existing on last add call', (done) => {

    const lazySubSubPanel1 = createTestPanel('dynamic-sub-subPanel1');
    const lazySubSubPanel2 = createTestPanel('dynamic-sub-subPanel2');
    const lazySubSubPanel3 = createTestPanel('dynamic-sub-subPanel3');

    const getDataAddingSubpanels: GetDataFunction<string, any> = (context: any, addSubPanels: AddSubPanelsFunction) => {
      setTimeout(() => {
        addSubPanels('subPanel', [lazySubSubPanel2]);
      }, 100)
      setTimeout(() => {
        addSubPanels('subPanel', [lazySubSubPanel3], false);
      }, 200)
      addSubPanels('subPanel', [lazySubSubPanel1]);
      return of('myData');
    };

    const subPanel: Panel = createTestPanel('subPanel', [], getDataAddingSubpanels);
    const rootPanel: Panel = createTestPanel('rootPanel', [subPanel]);

    getPanelsAndShownPanelsAndTopPanel$(service).pipe(
      take(1)
    ).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(3);
      expect(panels[0]).toBe(rootPanel);
      expect(panels[1]).toBe(subPanel);
      expect(panels[2]).toBe(lazySubSubPanel1);
    });

    getPanelsAndShownPanelsAndTopPanel$(service).pipe(
      skip(1),
      take(1)
    ).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(4);
      expect(panels[0]).toBe(rootPanel);
      expect(panels[1]).toBe(subPanel);
      expect(panels[2]).toBe(lazySubSubPanel1);
      expect(panels[3]).toBe(lazySubSubPanel2);
    });

    getPanelsAndShownPanelsAndTopPanel$(service).pipe(
      skip(2),
      take(1)
    ).subscribe(([panels, shownPanels, topPanel]) => {
      expect(panels.length).toBe(3);
      expect(panels[0]).toBe(rootPanel);
      expect(panels[1]).toBe(subPanel);
      expect(panels[2]).toBe(lazySubSubPanel3);
      done();
    });

    service.initRootPanel(rootPanel);
    service.getController(rootPanel.id).goTo(subPanel.id);
  });

});

/*
* Test Helpers
*/
function getPanelsAndShownPanelsAndTopPanel$(service: StackedPanelsService): Observable<[Panel[], Panel[], Panel]> {
  return combineLatest([
    service.panels$,
    service.shownPanels$,
    service.topPanel$
  ]).pipe(debounceTime(0));
}

function createTestPanel(id: string, subPanels?: Panel[], data?: any): Panel {
  return {
    id,
    bodyTemplate: {} as TemplateRef<any>,
    ...(subPanels && {subPanels}),
    ...(data && {data})
  };
}
