import { App } from './app/app';
import { appConfig } from './app/app.config';
import { CHROME_KEEPALIVE_PORT } from './shared/enums/chrome-command.enum';
import { bootstrapApplication } from '@angular/platform-browser';

bootstrapApplication(App, appConfig).catch(err => console.error(err));

const isChrome = typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
if (isChrome) {
  chrome.runtime.connect({ name: CHROME_KEEPALIVE_PORT });
}
