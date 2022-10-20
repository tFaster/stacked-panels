import { Observable } from 'rxjs';
import { TemplateRef } from '@angular/core';

export type AddSubPanelsFunction = (parentId: string, panels: Panel[], keepExisting?: boolean) => void
export type GetDataFunction<T, C> = (context: C, addSubPanels: AddSubPanelsFunction) => Observable<T>;

export interface Panel<T = any, C = any> {
  readonly id: string;
  readonly bodyTemplate: TemplateRef<StackedPanelTemplateOutletContext<T>>;
  readonly data?: T | Observable<T> | GetDataFunction<T, C>;
  readonly subPanels?: Panel[];
}

export interface StackedPanelsController {
  back(): void;

  goTo(panelId: string, context?: any): boolean;

  canGoBack(): boolean;
}

export type StackedPanelTemplateOutletContext<T> = { $implicit: Panel<T>, controller: StackedPanelsController, panelId: string };
