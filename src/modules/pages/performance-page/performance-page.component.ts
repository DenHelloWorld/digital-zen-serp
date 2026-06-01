import { WebVitalsComponent } from '../../web-vitals/web-vitals.component';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dz-performance-page',
  imports: [WebVitalsComponent],
  template: ` <dz-web-vitals /> `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'w-full flex flex-col items-center',
  },
})
export class PerformancePageComponent {}
