import { Injectable } from '@angular/core';
import { BehaviorSubject, isObservable, map, Observable } from 'rxjs';
import { GetDataFunction, Panel, StackedPanelsController } from './stacked-panels.types';


@Injectable()
export class StackedPanelsService {

  private readonly _panels$: BehaviorSubject<Panel[]> = new BehaviorSubject<Panel[]>([]);

  private readonly _shownPanels$: BehaviorSubject<Panel[]> = new BehaviorSubject<Panel[]>([]);

  private readonly _subPanelsMap: Map<string, Panel[]> = new Map<string, Panel[]>();

  private readonly _panelDataMap: Map<string, Observable<any>> = new Map<string, Observable<any> | any>();

  public readonly panels$: Observable<Panel[]> = this._panels$.asObservable();

  public readonly shownPanels$: Observable<Panel[]> = this._shownPanels$.asObservable();

  public readonly topPanel$: Observable<Panel> = this._shownPanels$.pipe(
    map((shownPanels: Panel[]) => shownPanels[shownPanels.length - 1])
  );

  public initRootPanel<T, C>(rootPanel: Panel<T, C>): void {
    this._hideAllPanelsExceptRoot()
    this._panels$.next([rootPanel]);
    this._showPanel<T, C>(rootPanel);
  }

  private _hideAllPanelsExceptRoot(): void {
    this._shownPanels$.getValue().forEach((panel, index) => {
      if (index > 0) {
        this._hidePanelById(panel.id);
      }
    })
  }

  private _hidePanelById(panelId: string): void {
    const panelIndex: number = this._shownPanels.findIndex((panel: Panel) => panel.id === panelId);
    if (panelIndex !== -1) {
      this.removeSubPanels(panelId);
      const newShownPanels: Panel[] = [...this._shownPanels];
      newShownPanels.splice(panelIndex, 1);
      this._shownPanels$.next(newShownPanels);
    }
  }

  private removeSubPanels(parentPanelId: string): void {
    const subPanelIdsOfParentPanel: string[] = this._subPanelsMap.get(parentPanelId)?.map((subPanelOfHiddenPanel: Panel) => subPanelOfHiddenPanel.id);
    if (subPanelIdsOfParentPanel?.length > 0) {
      const allPanelsWithoutSubPanelsOfParentPanel: Panel[] = this._panels.filter((panel: Panel) => !subPanelIdsOfParentPanel.includes(panel.id));
      subPanelIdsOfParentPanel.forEach((panelId: string) => {
        this._panelDataMap.delete(panelId);
      });
      this._panels$.next(allPanelsWithoutSubPanelsOfParentPanel);
    }
  }

  private _showPanelById<T, C>(panelId: string, context?: C): boolean {
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
      let data: Observable<any> | any;
      if (isFunction(panel.data)) {
        const getData: GetDataFunction<T, C> = panel.data;
        data = getData(context, (parentId: string, panels: Panel[]) => {
          this.addPanels(parentId, panels);
        });
      } else if (isObservable(panel.data)) {
        data = panel.data;
      } else {
        data = panel.data;
      }
      this._panelDataMap.set(panel.id, data);
    }
    this._shownPanels$.next([...this._shownPanels, panel]);
  }

  public getController<T, C>(panelId: string): StackedPanelsController {
    return {
      back: () => {
        this._hidePanelById(panelId);
      },
      goTo: (targetPanelId: string, context?: any) => {
        return this._showPanelById(targetPanelId, context);
      },
      canGoBack: () => {
        return !this._isRootPanelId(panelId);
      }
    };
  }

  public getPanelData$(panelId: string): Observable<any> | any {
    return this._panelDataMap.get(panelId);
  }

  private _isRootPanelId(panelId: string): boolean {
    return this._shownPanels[0].id === panelId;
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
