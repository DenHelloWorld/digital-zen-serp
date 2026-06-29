import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'dz-copy-button',
  template: `
    <button
      class="inline-flex items-center justify-center border border-gray-500/30 px-2 py-1 text-sm rounded bg-white transition-all active:scale-95 hover:bg-gray-50 hover:border-gray-400"
      [class.border-green-400]="copied()"
      [class.bg-green-50]="copied()"
      (click)="copy()"
      (mouseenter)="onEnter()"
      (mouseleave)="onLeave()"
      type="button"
    >
      <span class="text-base leading-none">{{ copied() ? '✅' : '📋' }}</span>
    </button>
  `,
  host: { class: 'inline-flex' },
})
export class CopyButtonComponent {
  readonly text = input.required<string>();
  readonly highlightEl = input<HTMLElement>();

  protected readonly copied = signal(false);

  #timeout: ReturnType<typeof setTimeout> | null = null;

  protected async copy(): Promise<void> {
    const value = this.text();
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      this.copied.set(true);

      if (this.#timeout) clearTimeout(this.#timeout);
      this.#timeout = setTimeout(() => this.copied.set(false), 1500);
    } catch {
      /* clipboard not available */
    }
  }

  protected onEnter(): void {
    this.highlightEl()?.classList.add('bg-indigo-50', '-mx-1', 'px-1');
  }

  protected onLeave(): void {
    this.highlightEl()?.classList.remove('bg-indigo-50', '-mx-1', 'px-1');
  }
}
