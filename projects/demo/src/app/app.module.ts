import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { StackedPanelsModule } from '../../../stacked-panels/src/lib/stacked-panels.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    StackedPanelsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
