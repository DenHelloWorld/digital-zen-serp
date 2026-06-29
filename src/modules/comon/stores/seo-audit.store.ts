import { CHROME_COMMAND_ENUM } from '../../../shared/enums/chrome-command.enum';
import { SeoAuditData } from '../../../shared/models/seo-audit-data.model';
import { IS_CHROME_EXTENSION } from '../constants/chrome-runtime.token';
import { TabActivityService } from '../services/tab-activity.service';
import { effect, inject, Service, signal } from '@angular/core';

@Service()
export class SeoAuditStore {
  readonly #auditData = signal<SeoAuditData | null>(null);
  readonly #isLoading = signal(false);
  readonly #error = signal<string | null>(null);

  readonly auditData = this.#auditData.asReadonly();
  readonly isLoading = this.#isLoading.asReadonly();
  readonly error = this.#error.asReadonly();

  readonly #isChrome = inject(IS_CHROME_EXTENSION);
  readonly #tabActivity = inject(TabActivityService);

  constructor() {
    effect(() => {
      this.#tabActivity.activeTab();
      this.loadAudit();
    });
  }

  async loadAudit(): Promise<void> {
    this.#isLoading.set(true);
    this.#error.set(null);

    if (!this.#isChrome) {
      this.#isLoading.set(false);
      this.#error.set('CHROME_RUNTIME_NOT_FOUND');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        command: CHROME_COMMAND_ENUM.BASE_SEO_AUDIT,
      });

      if (response?.success) {
        this.#auditData.set(response.data);
      } else {
        this.#error.set(response?.error || 'UNKNOWN_ERROR');
      }
    } catch (err) {
      this.#error.set('MESSAGE_SENDING_FAILED');
      console.error('[SeoAuditStore]', err);
    } finally {
      this.#isLoading.set(false);
    }
  }
}
