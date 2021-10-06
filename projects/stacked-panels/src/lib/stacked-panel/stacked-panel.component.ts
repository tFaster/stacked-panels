import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostBinding,
  Input,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { ConfigurableFocusTrapFactory, FocusTrap } from '@angular/cdk/a11y';
import { animate, group, state, style, transition, trigger } from '@angular/animations';
import { isObservable, Observable, of, ReplaySubject, Subject, Subscription } from 'rxjs';
import { delay, distinctUntilChanged, map, skip, takeUntil } from 'rxjs/operators';
import { Panel, StackedPanelsController } from '../stacked-panels.types';
import { StackedPanelsService } from '../stacked-panels.service';

@Component({
  selector: 'tfaster-stacked-panel',
  templateUrl: './stacked-panel.component.html',
  styleUrls: ['./stacked-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('showHide', [
      state('shown', style({
        height: '*',
        transform: 'translateX(0)'
      })),
      state('hidden', style({
        overflow: 'hidden',
        height: 0,
        transform: 'translateX(calc(100% + 15px))'
      })),
      transition('shown => hidden', [
        style({
          overflow: 'hidden'
        }),
        group([
          animate('175ms ease-out', style({transform: 'translateX(calc(100% + 15px))'})),
          animate('100ms 175ms ease-out', style({height: 0}))
        ])
      ]),
      transition('hidden => shown', [
        group([
          animate('75ms ease-out', style({height: '*'})),
          animate('175ms 75ms ease-out', style({transform: 'translateX(0)'}))
        ])
      ])
    ]),
    trigger('visibleHiddenContent', [
      state('visible', style({
        opacity: 1,
        visibility: 'visible',
        transform: 'scale(1)'
      })),
      state('hidden', style({
        opacity: 0,
        visibility: 'hidden',
        transform: 'scale(0.95)'
      })),
      transition('visible => hidden', [
        animate('150ms ease-in')
      ]),
      transition('hidden => visible', [
        animate('150ms ease-in')
      ]),
    ]),
  ]
})
export class StackedPanelComponent<T> implements OnInit, AfterViewInit, OnDestroy {

  private _showHideState: string;

  @HostBinding('@showHide')
  public get showHideState(): string {
    return this._showHideState;
  }

  @Input()
  public loadingInfoTemplate: TemplateRef<any>;

  @Input()
  public panel: Panel<T>;

  @Input()
  public enableFocusTrap: boolean = true;

  public controller: StackedPanelsController;

  public readonly shownPanels$: Observable<Panel[]> = this._stackedPanelsService.shownPanels$;

  public readonly topPanel$: Observable<Panel> = this._stackedPanelsService.topPanel$;

  public isLoading: boolean = false;

  private _focusTrap: FocusTrap;

  private readonly _destroy$: Subject<void> = new Subject<void>();

  private readonly _panelData$: Subject<T> = new ReplaySubject<T>(1);

  private _dataSubscription: Subscription;

  public readonly panelData$: Observable<T> = this._panelData$.asObservable();

  constructor(private _cdr: ChangeDetectorRef,
              private _focusTrapFactory: ConfigurableFocusTrapFactory,
              private _viewContainer: ViewContainerRef,
              private _stackedPanelsService: StackedPanelsService) {
  }

  public ngOnInit(): void {
    this.controller = this._stackedPanelsService.getController(this.panel);
    this._initShowHideAnimation();
  }

  public ngAfterViewInit(): void {
    this._registerFocusTrap();
  }

  public ngOnDestroy(): void {
    this._cleanup();
  }

  public isShown(panelId: string): boolean {
    return this._stackedPanelsService.isPanelShown(panelId);
  }

  public getPanelObservable<T>(panel: Panel<T> | Observable<Panel<T>>): Observable<Panel<T>> {
    return isObservable(panel) ? panel : of(panel);
  }

  private _initShowHideAnimation(): void {
    const shownOrHidden$: Observable<string> = this.shownPanels$.pipe(
      map((shownPanels: Panel[]) => shownPanels.map((panel: Panel) => panel.id).includes(this.panel.id) ? 'shown' : 'hidden'),
      distinctUntilChanged()
    );
    shownOrHidden$.pipe(
      takeUntil(this._destroy$)
    ).subscribe((showHideState: 'shown' | 'hidden') => {
      this._showHideState = showHideState;
      if (showHideState === 'shown') {
        this._subscribePanelData();
      } else {
        this._unsubscribePanelData();
      }
    });
  }

  private _subscribePanelData(): void {
    const panelData$: Observable<T> = this._stackedPanelsService.getPanelData$(this.panel.id);
    if (panelData$) {
      console.info('load data for panel', this.panel.id);
      this.isLoading = true;
      this._dataSubscription = panelData$.pipe(
        takeUntil(this._destroy$)
      ).subscribe((data) => {
        console.info('data for panel', this.panel.id, 'loaded. Data: ', data);
        this.isLoading = false;
        this._panelData$.next(data);
        this._cdr.markForCheck();
        if (this._focusTrap) {
          setTimeout(() => {
            this._focusTrap.focusFirstTabbableElement();
          });
        }
      });
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
      this.shownPanels$.pipe(
        map((shownPanels: Panel[]) => !!this.panel && shownPanels[shownPanels.length - 1].id === this.panel.id),
        distinctUntilChanged(),
        skip(1),
        takeUntil(this._destroy$),
        delay(1)
      ).subscribe((isTop: boolean) => {
        if (isTop) {
          this._focusTrap.attachAnchors();
          this._focusTrap.focusFirstTabbableElement();
        }
      });
    }
  }

  private _cleanup(): void {
    this._focusTrap?.destroy();
    this._destroy$.next();
    this._destroy$.complete();
  }
}
