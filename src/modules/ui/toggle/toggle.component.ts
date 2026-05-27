import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'dz-toggle',
  template: `
    <label class="relative inline-flex items-center cursor-pointer">
      <input
        class="sr-only peer"
        [checked]="checked()"
        [disabled]="disabled()"
        (change)="checkedChange.emit(!checked())"
        type="checkbox"
      />
      <div
        class="w-9 h-5 rounded-full transition-all peer-disabled:opacity-40 peer-disabled:cursor-not-allowed
               peer-checked:bg-indigo-500 bg-gray-300
               after:content-[''] after:absolute after:top-0.5 after:start-0.5
               after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all
               peer-checked:after:translate-x-4"
      ></div>
    </label>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'inline-flex' },
})
export class ToggleComponent {
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly checkedChange = output<boolean>();
}
