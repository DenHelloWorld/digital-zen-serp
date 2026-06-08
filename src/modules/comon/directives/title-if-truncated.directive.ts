import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';

@Directive({
  selector: '[dzTitleIfTruncated]',
  standalone: true,
})
export class TitleIfTruncatedDirective implements AfterViewInit, OnDestroy {
  readonly #el = inject<ElementRef<HTMLElement>>(ElementRef);
  #observer: ResizeObserver | null = null;

  @Input('dzTitleIfTruncated') titleText = '';

  ngAfterViewInit() {
    this.#update();
    this.#observer = new ResizeObserver(() => this.#update());
    this.#observer.observe(this.#el.nativeElement);
  }

  ngOnDestroy() {
    this.#observer?.disconnect();
  }

  #update() {
    const el = this.#el.nativeElement;
    el.title =
      el.scrollWidth > el.clientWidth ? this.titleText || el.textContent?.trim() || '' : '';
  }
}
