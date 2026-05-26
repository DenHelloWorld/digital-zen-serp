import { Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private cache = new Map<string, Promise<Translation>>();

  getTranslation(lang: string): Promise<Translation> {
    if (!this.cache.has(lang)) {
      this.cache.set(
        lang,
        fetch(`/assets/i18n/${lang}.json`).then(r => r.json())
      );
    }
    return this.cache.get(lang)!;
  }
}
