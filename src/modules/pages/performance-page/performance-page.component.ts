import { WebVitalsComponent } from '../../web-vitals/web-vitals.component';
import { Component } from '@angular/core';

@Component({
  selector: 'dz-performance-page',
  imports: [WebVitalsComponent],
  template: ` <dz-web-vitals /> `,
  host: {
    class: 'w-full flex flex-col items-center',
  },
})
export class PerformancePageComponent {}
