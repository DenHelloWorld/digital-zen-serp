import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private cache = new Map<string, Promise<Translation>>();

  getTranslation(lang: string): Promise<Translation> {
    if (!this.cache.has(lang)) {
      this.cache.set(
        lang,
        fetch(`/assets/i18n/${lang}.json`)
          .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          })
          .catch(err => {
            this.cache.delete(lang);
            throw err;
          })
      );
    }
    return this.cache.get(lang)!;
  }
}
