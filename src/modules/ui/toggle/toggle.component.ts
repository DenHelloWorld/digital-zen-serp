import { Component, input, output } from '@angular/core';

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
        class="w-7 h-4 rounded-full transition-all peer-disabled:opacity-40 peer-disabled:cursor-not-allowed
               peer-checked:bg-indigo-500 bg-gray-300
               after:content-[''] after:absolute after:top-0.5 after:start-0.5
               after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all
               peer-checked:after:translate-x-3"
      ></div>
    </label>
  `,
  host: { class: 'inline-flex' },
})
export class ToggleComponent {
  readonly checked = input(false);
  readonly disabled = input(false);
  readonly checkedChange = output<boolean>();
}
