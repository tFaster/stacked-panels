import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  Input,
  OnChanges,
  SimpleChanges,
  TemplateRef
} from '@angular/core';
import { Panel } from './stacked-panels.types';
import { StackedPanelsService } from './stacked-panels.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'tfaster-stacked-panels',
  templateUrl: './stacked-panels.component.html',
  styleUrls: ['./stacked-panels.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StackedPanelsComponent implements OnChanges {

  @Input()
  public rootPanel: Panel;

  @Input()
  public panelClass: string;

  @Input()
  public loadingInfoTemplate: TemplateRef<any>;

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

  public panelTrackByFn(index, panel: Panel) {
    return panel.id;
  }

}
