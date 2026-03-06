import { InjectionToken } from '@angular/core';

export const IS_CHROME_EXTENSION = new InjectionToken<boolean>('IS_CHROME_EXTENSION', {
  providedIn: 'root',
  factory: () => typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id,
});
