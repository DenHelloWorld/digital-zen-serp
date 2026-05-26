import { ChromeStorageKeyType } from '../enums/chrome-storage-key.enum';
import { Injectable } from '@angular/core';

/**
 * Chrome Storage service for interacting with chrome.storage.local API
 * Provides type-safe wrapper around Chrome Extension storage
 *
 * @guidelines
 * - DZ_08: Private fields with # prefix
 * - DZ_11: Universal Logger usage
 *
 * @see /docs/coding-guidelines.md
 * @see https://developer.chrome.com/docs/extensions/reference/api/storage (Chrome Storage API)
 */
@Injectable({
  providedIn: 'root',
})
export class ChromeStorageService {
  /**
   * Writes data to chrome.storage.local.
   *
   * @param key The key under which the data will be stored.
   * @param value The data to be stored.
   * @param callback Optional function to be called upon completion.
   */
  public set<T>(key: ChromeStorageKeyType, value: T, callback?: () => void): void {
    if (this.#isChromeStorageAvailable()) {
      chrome.storage.local.set({ [key]: value }, () => {
        if (chrome.runtime.lastError) {
          console.error('[ChromeStorageService]', 'Error saving data:', chrome.runtime.lastError);
        }
        if (callback) {
          callback();
        }
      });
    }
  }

  /**
   * Reads data from chrome.storage.local.
   *
   * @param key The key from which to retrieve the data.
   * @param callback Function to be called with the retrieved data.
   */
  public get<T>(key: ChromeStorageKeyType, callback: (value: T | null) => void): void {
    if (this.#isChromeStorageAvailable()) {
      chrome.storage.local.get(key, result => {
        if (chrome.runtime.lastError) {
          console.error('[ChromeStorageService]', 'Error reading data:', chrome.runtime.lastError);
          callback(null);
        } else {
          callback((result[key] as T) || null);
        }
      });
    }
  }

  /**
   * Reads multiple data entries from chrome.storage.local.
   *
   * @param keys The keys from which to retrieve the data.
   * @param callback Function to be called with the retrieved data.
   */
  public getMany<T extends object>(
    keys: ChromeStorageKeyType[],
    callback: (value: T | null) => void
  ): void {
    if (this.#isChromeStorageAvailable()) {
      chrome.storage.local.get(keys, result => {
        if (chrome.runtime.lastError) {
          console.error(
            '[ChromeStorageService]',
            'Error reading multiple keys:',
            chrome.runtime.lastError
          );
          callback(null);
        } else {
          callback(result as T);
        }
      });
    }
  }

  /**
   * Removes data from chrome.storage.local.
   *
   * @param key The key to be removed.
   * @param callback Optional function to be called upon completion.
   */
  public remove(key: ChromeStorageKeyType, callback?: () => void): void {
    if (this.#isChromeStorageAvailable()) {
      chrome.storage.local.remove(key as string, () => {
        if (chrome.runtime.lastError) {
          console.error('[ChromeStorageService]', 'Error removing data:', chrome.runtime.lastError);
        }
        if (callback) {
          callback();
        }
      });
    }
  }

  /**
   * Helper method to check if the chrome storage API is available.
   */
  #isChromeStorageAvailable(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
  }
}
