import { Injectable } from '@angular/core';
import { BehaviorSubject, isObservable, map, Observable, shareReplay } from 'rxjs';
import { GetDataFunction, Panel, StackedPanelsController } from './stacked-panels.types';


@Injectable()
export class StackedPanelsService {

  private readonly _panels$: BehaviorSubject<Panel[]> = new BehaviorSubject<Panel[]>([]);

  private readonly _shownPanels$: BehaviorSubject<Panel[]> = new BehaviorSubject<Panel[]>([]);

  private readonly _subPanelsMap: Map<string, Panel[]> = new Map<string, Panel[]>();

  private readonly _panelDataMap: Map<string, Observable<any>> = new Map<string, Observable<any> | any>();

  public readonly panels$: Observable<Panel[]> = this._panels$.asObservable();

  public readonly shownPanels$: Observable<Panel[]> = this._shownPanels$.pipe(
    shareReplay(1)
  );

  public readonly topPanel$: Observable<Panel> = this._shownPanels$.pipe(
    map((shownPanels: Panel[]) => shownPanels[shownPanels.length - 1]),
    shareReplay(1)
  );

  private _rootPanel!: Panel;

  public initRootPanel<T, C>(rootPanel: Panel<T, C>): void {
    this._rootPanel = rootPanel;
    this._subPanelsMap.clear();
    this._panelDataMap.clear();
    this._panels$.next([rootPanel]);
    this._showPanel<T, C>(rootPanel);
  }

  private _hidePanelById(panelId: string): void {
    const panelIndex: number = this._shownPanels.findIndex((panel: Panel) => panel.id === panelId);
    if (panelIndex !== -1) {
      this._removeSubPanels(panelId);
      const newShownPanels: Panel[] = [...this._shownPanels];
      newShownPanels.splice(panelIndex, 1);
      this._shownPanels$.next(newShownPanels);
    }
  }

  private _removeSubPanels(parentPanelId: string, emit: boolean = true): void {
    const subPanelIdsOfParentPanel: string[] | undefined = this._subPanelsMap.get(parentPanelId)?.map((subPanelOfHiddenPanel: Panel) => subPanelOfHiddenPanel.id);
    if (subPanelIdsOfParentPanel && subPanelIdsOfParentPanel.length > 0) {
      subPanelIdsOfParentPanel.forEach((panelId: string) => {
        this._removeSubPanels(panelId, false);
        this._panelDataMap.delete(panelId);
      });
      this._subPanelsMap.delete(parentPanelId);
      if (emit) {
        this._emitPanelsStreamFromSubPanelsMap();
      }
    }
  }

  private _emitPanelsStreamFromSubPanelsMap(): void {
    const panels: Panel[] = Array.from(this._subPanelsMap.values()).flat();
    this._panels$.next([this._rootPanel, ...panels]);
  }

  private _showPanelById<T, C>(panelId: string, context?: C): boolean {
    const targetPanel: Panel<T> | undefined = this._panels.find((panel: Panel) => panel.id === panelId);
    if (!targetPanel) {
      return false;
    }
    this._showPanel<T, C>(targetPanel, context);
    return true;
  }

  private _showPanel<T, C>(panel: Panel<T, C>, context?: C): void {
    if (panel.subPanels && panel.subPanels.length > 0) {
      this._addPanels(panel.id, panel.subPanels);
    }
    if (panel.data) {
      let data: Observable<any> | any;
      if (isFunction(panel.data)) {
        const getData: GetDataFunction<T, C> = panel.data;
        data = getData(context, (parentId: string, panels: Panel[], keepExisting: boolean = true) => {
          if (keepExisting) {
            this._addPanels(parentId, panels);
          } else {
            this._setPanels(parentId, panels);
          }
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

  private _addPanels(parentId: string, panels: Panel[]): void {
    const existingSubPanelsOfParent: Panel[] = this._subPanelsMap.get(parentId) || [];
    const newPanels: Panel[] = [...existingSubPanelsOfParent, ...panels];
    this._subPanelsMap.set(parentId, newPanels);
    this._emitPanelsStreamFromSubPanelsMap();
  }

  private _setPanels(parentId: string, newOrExistingSubPanels: Panel[]): void {
    const existingSubPanelsOfParent: Panel[] | undefined = this._subPanelsMap.get(parentId);
    if (existingSubPanelsOfParent) {
      const newOrExistingPanelIds: string[] = newOrExistingSubPanels.map((panel) => panel.id);
      existingSubPanelsOfParent.forEach((subPanel: Panel) => {
        if (!newOrExistingPanelIds.includes(subPanel.id)) {
          this._panelDataMap.delete(subPanel.id);
          this._removeSubPanels(subPanel.id, false);
        }
      });
    }
    this._subPanelsMap.set(parentId, newOrExistingSubPanels);
    this._emitPanelsStreamFromSubPanelsMap();
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
