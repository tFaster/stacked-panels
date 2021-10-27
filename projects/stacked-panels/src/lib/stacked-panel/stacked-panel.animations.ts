import { animate, group, state, style, transition, trigger } from '@angular/animations';

export interface AnimationParams {
  contentFadeAndScaleTime?: string;
  hiddenContentScale?: number;
  panelGrowHeightTime?: string;
  panelShrinkHeightTime?: string;
  panelSlideInTime?: string;
  panelSlideOutTime?: string;
}

const animationDefaultParams: AnimationParams = {
  contentFadeAndScaleTime: '200ms',
  hiddenContentScale: 0.95,
  panelGrowHeightTime: '200ms',
  panelShrinkHeightTime: '500ms',
  panelSlideInTime: '100ms',
  panelSlideOutTime: '100ms'
}

export type ShowHideAnimationState = 'shown' | 'shownAndLoaded' | 'hidden';

export const showHideTrigger = trigger('showHide', [
  state('shown', style({
    height: '*',
    transform: 'translateX(0)'
  })),
  state('shownAndLoaded', style({
    height: '*',
    transform: 'translateX(0)'
  })),
  state('hidden', style({
    height: 0,
    transform: 'translateX(calc(100% + 15px))',
    overflow: 'hidden'
  })),
  transition('hidden => shown', [
    group([
      animate('{{ panelGrowHeightTime }} ease-in', style({height: '*'})),
      animate('{{ panelSlideInTime }} {{ panelGrowHeightTime }} ease-out', style({transform: 'translateX(0)'}))
    ])
  ], {
    params: animationDefaultParams
  }),
  transition('hidden => shownAndLoaded', [
    group([
      animate('{{ panelGrowHeightTime }} ease-out', style({height: '*'})),
      animate('{{ panelSlideInTime }} {{ panelGrowHeightTime }} ease-out', style({transform: 'translateX(0)'}))
    ])
  ], {
    params: animationDefaultParams
  }),
  transition('shown => shownAndLoaded', [
    style({
      height: 0,
      opacity: 0
    }),
    group([
      animate('{{ panelGrowHeightTime }} ease-out', style({height: '*'})),
      animate('{{ contentFadeAndScaleTime }} {{ panelGrowHeightTime }} ease-out', style({opacity: 1}))
    ])
  ], {
    params: animationDefaultParams
  }),
  transition('shownAndLoaded => hidden', [
    group([
      animate('{{ panelSlideOutTime }} ease-out', style({transform: 'translateX(calc(100% + 15px))'})),
      animate('{{ panelShrinkHeightTime }} {{ panelSlideOutTime }} ease-out', style({height: 0}))
    ])
  ], {
    params: animationDefaultParams
  })
]);

export type ContentVisibleState = 'visible' | 'hidden';

export const showHideContentTrigger = trigger('visibleHiddenContent', [
  state('visible', style({
    opacity: 1,
    visibility: 'visible',
    transform: 'scale(1)'
  })),
  state('hidden', style({
    opacity: 0,
    visibility: 'hidden',
    transform: 'scale({{ hiddenContentScale }})'
  }), {
    params: animationDefaultParams
  }),
  transition('* => hidden', [
    animate('{{ contentFadeAndScaleTime }} ease-out')
  ], {
    params: animationDefaultParams
  }),
  transition('hidden => visible', [
    animate('{{ contentFadeAndScaleTime }} ease-in')
  ], {
    params: animationDefaultParams
  })
])
