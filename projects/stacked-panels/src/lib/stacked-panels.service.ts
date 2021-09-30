import { Injectable } from '@angular/core';
import { BehaviorSubject, isObservable, Observable, of } from 'rxjs';
import { GetDataFunction, Panel, StackedPanelsController } from './stacked-panels.types';
import { distinctUntilChanged } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class StackedPanelsService {

  private readonly _panels$: BehaviorSubject<Panel[]> = new BehaviorSubject<Panel[]>([]);
  private readonly _shownPanels$: BehaviorSubject<Panel[]> = new BehaviorSubject<Panel[]>([]);

  public readonly panels$: Observable<Panel[]> = this._panels$.pipe(distinctUntilChanged((oldVal, newVal) => oldVal.length === newVal.length));
  public readonly shownPanels$: Observable<Panel[]> = this._shownPanels$.asObservable();

  private _subPanelsMap: Map<string, Panel[]> = new Map<string, Panel[]>();
  private _panelData$Map: Map<string, Observable<any>> = new Map<string, Observable<any>>();

  constructor() {
  }

  public initRootPanel<T, C>(rootPanel: Panel<T, C>): void {
    this._panels$.next([rootPanel]);
    this._showPanel<T, C>(rootPanel);
  }

  private _hideTopPanel(): void {
    const newShownPanels: Panel[] = [...this._shownPanels];
    const hiddenPanel = newShownPanels.pop();
    this.removeSubPanels(hiddenPanel.id);
    this._shownPanels$.next(newShownPanels);
  }

  private removeSubPanels(parentPanelId: string): void {
    const subPanelIdsOfParentPanel: string[] = this._subPanelsMap.get(parentPanelId)?.map((subPanelOfHiddenPanel: Panel) => subPanelOfHiddenPanel.id);
    if (subPanelIdsOfParentPanel?.length > 0) {
      const allPanelsWithoutSubPanelsOfParentPanel: Panel[] = this._panels.filter((panel: Panel) => !subPanelIdsOfParentPanel.includes(panel.id));
      subPanelIdsOfParentPanel.forEach((panelId: string) => {
        this._panelData$Map.delete(panelId);
      })
      this._panels$.next(allPanelsWithoutSubPanelsOfParentPanel);
    }
  }

  private _showPanelId<T, C>(panelId: string, context?: C): boolean {
    console.debug('Show panel:', panelId, 'context:', context);
    const targetPanel: Panel<T> = this._panels.find((panel: Panel) => panel.id === panelId);
    if (!targetPanel) {
      return false;
    }
    this._showPanel<T, C>(targetPanel, context);
    return true;
  }

  private _showPanel<T, C>(panel: Panel<T, C>, context?: C): void {
    if (panel.subPanels?.length > 0) {
      this.addPanels(panel.id, panel.subPanels);
    }
    if (panel.data) {
      let data$: Observable<any>;
      if (isFunction(panel.data)) {
        const getData: GetDataFunction<T, C> = panel.data;
        data$ = getData(context, (parentId: string, panels: Panel[]) => {
          this.addPanels(parentId, panels);
        });
      } else if (isObservable(panel.data)) {
        data$ = panel.data;
      } else {
        data$ = of(panel.data);
      }
      this._panelData$Map.set(panel.id, data$);
    }
    this._shownPanels$.next([...this._shownPanels, panel]);
  }

  public getController<T, C>(panel: Panel<T, C>): StackedPanelsController {
    return {
      back: () => {
        this._hideTopPanel();
      },
      goTo: (targetPanelId: string, context?: any) => {
        return this._showPanelId(targetPanelId, context);
      },
      canGoBack: () => {
        return this._isRootPanel(panel.id);
      }
    };
  }

  public getPanelData$(panelId: string): Observable<any> {
    return this._panelData$Map.get(panelId);
  }

  private _isRootPanel(panelId: string): boolean {
    return this._shownPanels[0].id !== panelId;
  }

  public isPanelShown(panelId: string): boolean {
    return Boolean(this._shownPanels.find((panel: Panel) => panel.id === panelId));
  }

  public addPanels(parentId: string, panels: Panel[]): void {
    this._subPanelsMap.set(parentId, panels);
    this._panels$.next([...this._panels, ...panels]);
  }

  private get _panels(): Panel[] {
    return this._panels$.getValue();
  }

  private get _shownPanels(): Panel[] {
    return this._shownPanels$.getValue();
  }
}

export function isFunction(x: any): x is Function {
  return typeof x === 'function';
}
