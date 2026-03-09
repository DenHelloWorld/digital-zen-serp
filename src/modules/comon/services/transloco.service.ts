import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private http = inject(HttpClient);
  private cache = new Map<string, Observable<Translation>>();

  getTranslation(lang: string) {
    if (!this.cache.has(lang)) {
      const request$ = this.http
        .get<Translation>(`/assets/i18n/${lang}.json`)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this.cache.set(lang, request$);
    }
    return this.cache.get(lang)!;
  }
}
