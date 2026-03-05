import { ICONS } from '../comon/constants/icons.const';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'dz-google-serp',
  imports: [NgTemplateOutlet],
  templateUrl: './google-serp.component.html',
  styleUrl: './google-serp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dz-google-serp',
  },
})
export class GoogleSerpComponent {
  protected readonly selectedDevice = signal<'desktop' | 'mobile'>('desktop');
  protected readonly icons = ICONS;
}
