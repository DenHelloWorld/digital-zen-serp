import { ContentAnalysisComponent } from '../../content-analysis/content-analysis.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dz-content-page',
  imports: [ContentAnalysisComponent],
  template: `<dz-content-analysis />`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'w-full flex flex-col items-center' },
})
export class ContentPageComponent {}
