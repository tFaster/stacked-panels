import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, map, Observable, of, tap, timer } from 'rxjs';
import { faker } from '@faker-js/faker';
import { AddSubPanelsFunction, AnimationParams, Panel, StackedPanelTemplateOutletContext } from '@tfaster/stacked-panels';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {

  @ViewChild('bodyTemplate', {static: true})
  private _demoBodyTemplate!: TemplateRef<StackedPanelTemplateOutletContext<DemoPanelData>>;

  public rootPanel: Panel<DemoPanelData> | undefined;

  public animationParams: AnimationParams = {
    /*hiddenContentScale: 0.95,
    panelSlideInTime: '1s',
    panelSlideOutTime: '1s',
    panelGrowHeightTime: '1s',
    panelShrinkHeightTime: '1s',
    contentFadeAndScaleTime: '1s'*/
  };

  constructor(private _http: HttpClient) {
  }

  public ngOnInit() {
    this._initStaticModelDemo();
  }

  private _initStaticModelDemo(): void {
    const rootPanelData: DemoPanelData = {
      header: 'Pedigree',
      footerText: 'Click CHILDREN to drill down...',
      items: [
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName(), drilldown: 'subPanel1'}
      ]
    };
    const subPanel1Data: DemoPanelData = {
      header: 'Children',
      footerText: 'Click CHILDREN to drill down even more...',
      items: [
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName(), drilldown: 'subPanel2a'},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName(), drilldown: 'subPanel2b'}
      ]
    };
    const subPanel2aData: DemoPanelData = {
      header: 'Children',
      items: [
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()}
      ]
    };
    const subPanel2bData: DemoPanelData = {
      header: 'Children',
      items: [
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName(), drilldown: 'subPanel3'},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()}
      ]
    };
    const subPanel3Data: DemoPanelData = {
      header: 'Children',
      items: [
        {firstName: faker.name.firstName(), lastName: faker.name.lastName()},
        {firstName: faker.name.firstName(), lastName: faker.name.lastName(), drilldown: 'subPanel4'}
      ]
    };

    const subPanel1Data$ = timer(1000).pipe(
      map(() => subPanel1Data)
    );

    const subPanel1: Panel<DemoPanelData, string> = {
      id: 'subPanel1',
      bodyTemplate: this._demoBodyTemplate,
      data: (context: string | undefined, addSubPanels: AddSubPanelsFunction) => { //async sub panel definitions based on data
        return subPanel1Data$.pipe(
          tap(() => {
            const subPanel2a: Panel<DemoPanelData> = {
              id: 'subPanel2a',
              bodyTemplate: this._demoBodyTemplate,
              data: of(subPanel2aData)
            };
            addSubPanels('subPanel1', [subPanel2a]);
          }),
          map((data: DemoPanelData) => {
            const subPanel1DataMod: DemoPanelData = {
              ...data,
              header: data.header + ': ' + context
            };
            return subPanel1DataMod;
          })
        );
      },
      subPanels: [
        {
          id: 'subPanel2b',
          bodyTemplate: this._demoBodyTemplate,
          data: subPanel2bData,
          subPanels: [
            {
              id: 'subPanel3',
              data: subPanel3Data,
              bodyTemplate: this._demoBodyTemplate,
              subPanels: [
                {
                  id: 'subPanel4',
                  bodyTemplate: this._demoBodyTemplate
                }
              ]
            }
          ]
        }
      ]
    };

    this.rootPanel = {
      id: 'rootPanel',
      bodyTemplate: this._demoBodyTemplate,
      data: of(rootPanelData).pipe(delay(1500)),
      subPanels: [subPanel1]
    };
  }

  public getPanelData$(data$: Observable<DemoPanelData>): Observable<DemoPanelData> {
    return data$;
  }
}


interface DemoPanelData {
  header: string;
  items: DemoItem[];
  footerText?: string;
}

interface DemoItem {
  firstName: string;
  lastName: string;
  drilldown?: string;
}
