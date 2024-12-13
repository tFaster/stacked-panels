import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  HostBinding,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { ConfigurableFocusTrap, ConfigurableFocusTrapFactory } from '@angular/cdk/a11y';
import {
  combineLatestWith,
  delay,
  distinctUntilChanged,
  isObservable,
  map,
  Observable,
  ReplaySubject,
  skip,
  startWith,
  Subject,
  Subscription
} from 'rxjs';
import { Panel, StackedPanelsController } from '../stacked-panels.types';
import { StackedPanelsService } from '../stacked-panels.service';
import {
  AnimationParams,
  ContentVisibleState,
  ShowHideAnimationState,
  showHideContentTrigger,
  showHideTrigger
} from './stacked-panel.animations';
import { injectLogger } from '../logger/logger';
import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';


@Component({
  selector: 'tfaster-stacked-panel',
  standalone: true,
  templateUrl: './stacked-panel.component.html',
  styleUrls: ['./stacked-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    NgTemplateOutlet
  ],
  animations: [
    showHideTrigger,
    showHideContentTrigger
  ]
})
export class StackedPanelComponent<T> implements OnInit, OnChanges, AfterViewInit, OnDestroy {

  private _cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private _focusTrapFactory: ConfigurableFocusTrapFactory = inject(ConfigurableFocusTrapFactory);
  private _viewContainer: ViewContainerRef = inject(ViewContainerRef);
  private _stackedPanelsService: StackedPanelsService = inject(StackedPanelsService);
  private _destroyRef: DestroyRef = inject(DestroyRef)

  private _showHideAnimationState: ShowHideAnimationState = 'hidden';

  public get isVisible(): boolean {
    return this._showHideAnimationState !== 'hidden';
  }

  @Input()
  public animationParams: AnimationParams | undefined;

  @HostBinding('@showHide')
  public get showHideAnimationState(): { value: ShowHideAnimationState, params: AnimationParams | undefined } {
    return {
      value: this._showHideAnimationState,
      params: this.animationParams
    };
  }

  @Input()
  public loadingInfoTemplate: TemplateRef<any> | undefined;

  @Input()
  public panel!: Panel<T>;

  @Input()
  public enableFocusTrap: boolean = true;

  public controller!: StackedPanelsController;

  public readonly topPanel$: Observable<Panel> = this._stackedPanelsService.topPanel$;

  public isLoading: boolean = false;

  private _focusTrap: ConfigurableFocusTrap | undefined;

  private _panelData$: Subject<T> = new ReplaySubject<T>(1);

  private _shownPanels$: Observable<Panel[]> = this._stackedPanelsService.shownPanels$;

  private _panelChange$: Subject<void> = new Subject<void>();

  public readonly panelData$: Observable<T> = this._panelData$.asObservable();

  public readonly contentVisibleOrHidden$: Observable<ContentVisibleState> = this.topPanel$.pipe(
    map<Panel, ContentVisibleState>((topPanel: Panel) => topPanel.id === this.panel.id ? 'visible' : 'hidden'),
    distinctUntilChanged()
  );

  private _shownOrHidden$: Observable<ShowHideAnimationState> = this._shownPanels$.pipe(
    map<Panel[], ShowHideAnimationState>((shownPanels: Panel[]) => shownPanels.map((panel: Panel) => panel.id).includes(this.panel.id)
                                                                   ? 'shown' : 'hidden'),
    distinctUntilChanged(),
    combineLatestWith(this._panelChange$.pipe(startWith(undefined))),
    map(([showHideState]: [ShowHideAnimationState, void]) => showHideState)
  );

  private _dataSubscription: Subscription | undefined;

  private _logger: Console = injectLogger();

  public ngOnInit(): void {
    this.controller = this._stackedPanelsService.getController(this.panel.id);
    this._initShowHideAnimation();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['panel'] && changes['panel'].currentValue) {
      this._panelChange$.next();
    }
  }

  public ngAfterViewInit(): void {
    this._registerFocusTrap();
  }

  public ngOnDestroy(): void {
    this._cleanup();
  }

  private _initShowHideAnimation(): void {
    this._shownOrHidden$.pipe(
      takeUntilDestroyed(this._destroyRef)
    ).subscribe((showHideState: ShowHideAnimationState) => {
      this._showHideAnimationState = showHideState;
      if (showHideState === 'shown') {
        this._unsubscribePanelData();
        this._subscribePanelData();
      } else {
        this._unsubscribePanelData();
      }
    });
  }

  private _subscribePanelData(): void {
    const panelData: Observable<T> | T = this._stackedPanelsService.getPanelData$(this.panel.id);
    if (panelData) {
      if (isObservable(panelData)) {
        this._logger.debug(`Load data for panel ${this.panel.id}`);
        this.isLoading = true;
        this._dataSubscription = panelData.pipe(
          takeUntilDestroyed(this._destroyRef)
        ).subscribe((loadedData: T) => {
          this._logger.debug(`Loaded data for panel ${this.panel.id}`, 'Data:', loadedData);
          this.isLoading = false;
          this._panelData$.next(loadedData);
          this._showHideAnimationState = 'shownAndLoaded';
          this._cdr.markForCheck();
          if (this._focusTrap) {
            setTimeout(() => {
              this._focusTrap?.focusFirstTabbableElement();
            });
          }
        });
      } else {
        this._panelData$.next(panelData);
        this._showHideAnimationState = 'shownAndLoaded';
      }
    } else {
    }
    this._cdr.markForCheck();
  }

  private _unsubscribePanelData(): void {
    this._dataSubscription?.unsubscribe();
  }

  private _registerFocusTrap() {
    if (this.enableFocusTrap) {
      this._focusTrap = this._focusTrapFactory.create(this._viewContainer.element.nativeElement, {defer: true});
      this._focusTrap.enabled = true;
      this._shownPanels$.pipe(
        map((shownPanels: Panel[]) => !!this.panel && shownPanels[shownPanels.length - 1].id === this.panel.id),
        distinctUntilChanged(),
        skip(1),
        takeUntilDestroyed(this._destroyRef),
        delay(1)
      ).subscribe((isTop: boolean) => {
        if (isTop) {
          this._focusTrap?.attachAnchors();
          this._focusTrap?.focusFirstTabbableElement();
        }
      });
    }
  }

  private _cleanup(): void {
    this._focusTrap?.destroy();
  }
}
