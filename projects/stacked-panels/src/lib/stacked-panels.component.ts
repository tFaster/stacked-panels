import { ChangeDetectionStrategy, Component, HostListener, inject, Input, OnChanges, SimpleChanges, TemplateRef } from '@angular/core';
import { Observable } from 'rxjs';
import { Panel } from './stacked-panels.types';
import { StackedPanelsService } from './stacked-panels.service';
import { AnimationParams } from './stacked-panel/stacked-panel.animations';
import { AsyncPipe } from '@angular/common';
import { StackedPanelComponent } from './stacked-panel/stacked-panel.component';

@Component({
  selector: 'tfaster-stacked-panels',
  standalone: true,
  templateUrl: './stacked-panels.component.html',
  styleUrls: ['./stacked-panels.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    StackedPanelComponent
  ],
  providers: [
    StackedPanelsService
  ]
})
export class StackedPanelsComponent implements OnChanges {

  private _stackedPanelsService: StackedPanelsService = inject(StackedPanelsService)

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
  public preventScroll(scrollContainerEl: HTMLElement): void {
    scrollContainerEl.scrollLeft = 0;
  }

  public readonly panels$: Observable<Panel[]> = this._stackedPanelsService.panels$;

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes.rootPanel) {
      this._stackedPanelsService.initRootPanel(changes.rootPanel.currentValue);
    }
  }

  public panelTrackByFn(index: number, panel: Panel): string {
    return panel.id;
  }

}
