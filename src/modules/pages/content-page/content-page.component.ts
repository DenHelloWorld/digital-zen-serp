import { ContentAnalysisComponent } from '../../content-analysis/content-analysis.component';
import { Component } from '@angular/core';

@Component({
  selector: 'dz-content-page',
  imports: [ContentAnalysisComponent],
  template: `<dz-content-analysis />`,
  host: { class: 'w-full flex flex-col items-center' },
})
export class ContentPageComponent {}
