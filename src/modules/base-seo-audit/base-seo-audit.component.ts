import { SeoAuditStore } from '../comon/stores/seo-audit.store';
import { LoadingBarComponent } from '../ui/loading-bar/loading-bar.component';
import { UrlBarComponent } from '../ui/url-bar/url-bar.component';
import { Component, computed, inject } from '@angular/core';
import { TranslocoDirective } from '@jsverse/transloco';

@Component({
  selector: 'dz-base-seo-audit',
  imports: [TranslocoDirective, UrlBarComponent, LoadingBarComponent],
  templateUrl: './base-seo-audit.component.html',
  host: {
    class: 'flex flex-col gap-[var(--spacing)] w-full',
  },
})
export class BaseSeoAuditComponent {
  protected readonly store = inject(SeoAuditStore);

  protected readonly auditData = computed(() => this.store.auditData());
  protected readonly isLoading = computed(() => this.store.isLoading());
  protected readonly error = computed(() => this.store.error());

  protected readonly statusColor = computed(() => {
    const status = this.auditData()?.status;
    if (status == null || status === 0) return 'bg-gray-200';
    if (status >= 200 && status < 300) return 'bg-green-500';
    if (status >= 300 && status < 400) return 'bg-blue-500';
    if (status >= 400 && status < 500) return 'bg-orange-500';
    return 'bg-red-500';
  });

  protected refresh(): void {
    this.store.loadAudit();
  }
}
