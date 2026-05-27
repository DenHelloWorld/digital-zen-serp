import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'dz-toggle',
  imports: [],
  template: `
    <label class="relative inline-flex items-center cursor-pointer">
      <input
        class="sr-only peer"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="checked.set(!checked())"
        type="checkbox"
      />
      <div
        class="w-9 h-5 rounded-full bg-gray-300 transition-colors peer-checked:bg-indigo-500 peer-disabled:opacity-40 peer-disabled:cursor-not-allowed after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:shadow-sm after:transition-all peer-checked:after:translate-x-4"
      ></div>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'dz-toggle inline-flex',
  },
})
export class ToggleComponent {
  readonly checked = model(false);
  readonly disabled = input(false);
}
