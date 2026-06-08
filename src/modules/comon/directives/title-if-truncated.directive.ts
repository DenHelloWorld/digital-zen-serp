import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
} from '@angular/core';

@Directive({
  selector: '[dzTitleIfTruncated]',
  standalone: true,
})
export class TitleIfTruncatedDirective implements AfterViewInit, OnDestroy {
  readonly #el = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly titleText = input('', { alias: 'dzTitleIfTruncated' });

  #observer: ResizeObserver | null = null;
  #raf: ReturnType<typeof requestAnimationFrame> | null = null;

  constructor() {
    effect(() => {
      this.titleText();
      this.#scheduleUpdate();
    });
  }

  ngAfterViewInit() {
    this.#observer = new ResizeObserver(() => this.#scheduleUpdate());
    this.#observer.observe(this.#el.nativeElement);
  }

  ngOnDestroy() {
    this.#observer?.disconnect();
    if (this.#raf !== null) cancelAnimationFrame(this.#raf);
  }

  #scheduleUpdate() {
    if (this.#raf !== null) cancelAnimationFrame(this.#raf);
    this.#raf = requestAnimationFrame(() => {
      const el = this.#el.nativeElement;
      el.title =
        el.scrollWidth > el.clientWidth ? this.titleText() || el.textContent?.trim() || '' : '';
    });
  }
}
