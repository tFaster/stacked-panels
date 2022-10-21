import { ChangeDetectionStrategy, Component, HostListener, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { Observable } from 'rxjs';
import { Panel } from './stacked-panels.types';
import { StackedPanelsService } from './stacked-panels.service';
import { AnimationParams } from './stacked-panel/stacked-panel.animations';

@Component({
  selector: 'tfaster-stacked-panels',
  templateUrl: './stacked-panels.component.html',
  styleUrls: ['./stacked-panels.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    StackedPanelsService
  ]
})
export class StackedPanelsComponent implements OnChanges {

  @Input()
  public animationParams: AnimationParams | undefined;

  @Input()
  public rootPanel: Panel | undefined;

  @Input()
  public panelClass: string | undefined;

  @Input()
  public enableFocusTrap: boolean = true;

  @Input()
  public loadingInfoTemplate: TemplateRef<any> | undefined;

  @HostListener('scroll', ['$event.target'])
  public preventScroll(scrollContainerEl: HTMLElement) {
    scrollContainerEl.scrollLeft = 0;
  }

  public readonly panels$: Observable<Panel[]> = this._stackedPanelsService.panels$;

  constructor(private _stackedPanelsService: StackedPanelsService) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.rootPanel) {
      this._stackedPanelsService.initRootPanel(changes.rootPanel.currentValue);
    }
  }

  public panelTrackByFn(index: number, panel: Panel) {
    return panel.id;
  }

}
