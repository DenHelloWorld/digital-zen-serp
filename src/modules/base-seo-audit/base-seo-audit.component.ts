import { IS_CHROME_EXTENSION } from '../comon/constants/chrome-runtime.token';
import { SeoAuditStore } from '../comon/stores/seo-audit.store';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-base-seo-audit',
  imports: [TranslocoDirective],
  templateUrl: './base-seo-audit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class:
      'dz-base-seo-audit p-[var(--spacing)] flex justify-center flex-col gap-[var(--spacing)] w-full max-w-[calc(var(--google-container-width)+var(--spacing)*2)]',
  },
})
export class BaseSeoAuditComponent {
  protected readonly store = inject(SeoAuditStore);
  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  readonly #destroyRef = inject(DestroyRef);

  protected readonly auditData = computed(() => this.store.auditData());
  protected readonly isLoading = computed(() => this.store.isLoading());
  protected readonly error = computed(() => this.store.error());

  protected readonly isAuditReady = computed(
    () => !this.isLoading() && !this.error() && this.auditData()
  );

  protected readonly statusColor = computed(() => {
    const status = this.auditData()?.status;
    if (status == null || status === 0) return 'bg-gray-200';
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 300 && status < 400) return 'bg-blue-500';
    if (status >= 400 && status < 500) return 'bg-orange-500';
    return 'bg-red-500';
  });

  constructor() {
    this.#listenToTabChanges();
  }

  #listenToTabChanges(): void {
    if (!this.#isChrome) return;

    // первый вызов при монтировании
    this.store.loadAudit();

    const onActivated = () => this.store.loadAudit();
    const onUpdated = (_tabId: number, changeInfo: { status?: string }) => {
      if (changeInfo.status === 'complete') {
        this.store.loadAudit();
      }
    };

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);

    this.#destroyRef.onDestroy(() => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
    });
  }

  protected refresh(): void {
    this.store.loadAudit();
  }
}
