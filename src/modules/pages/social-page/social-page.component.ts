import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'dz-social-page',
  template: `
    <div
      class="p-[var(--spacing)] flex flex-col items-center gap-[var(--spacing)] w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]"
    >
      <h1 class="text-sm font-bold text-gray-900">Тут будет настройка для соцсетей ?</h1>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'w-full flex flex-col items-center' },
})
export class SocialPageComponent {}
