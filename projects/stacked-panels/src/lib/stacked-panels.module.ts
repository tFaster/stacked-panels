import { NgModule } from '@angular/core';
import { StackedPanelsComponent } from './stacked-panels.component';
import { StackedPanelComponent } from './stacked-panel/stacked-panel.component';
import { CommonModule } from '@angular/common';

@NgModule({
  declarations: [
    StackedPanelComponent,
    StackedPanelsComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    StackedPanelsComponent
  ]
})
export class StackedPanelsModule {
}
