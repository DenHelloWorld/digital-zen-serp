import { ChromeStorageKeyType } from '../../../shared/enums/chrome-storage-key.enum';
import { Injectable } from '@angular/core';

/**
 * Chrome Storage service for interacting with chrome.storage.local API.
 * Provides a type-safe Promise-based wrapper around Chrome Extension storage.
 */
@Injectable({
  providedIn: 'root',
})
export class ChromeStorageService {
  /**
   * Writes data to chrome.storage.local.
   */
  public async set<T>(key: ChromeStorageKeyType, value: T): Promise<void> {
    if (!this.#isAvailable()) return;
    await chrome.storage.local.set({ [key]: value });
  }

  /**
   * Reads data from chrome.storage.local.
   */
  public async get<T>(key: ChromeStorageKeyType): Promise<T | null> {
    if (!this.#isAvailable()) return null;
    const result = await chrome.storage.local.get(key);
    return (result[key] as T) ?? null;
  }

  /**
   * Reads multiple data entries from chrome.storage.local.
   */
  public async getMany<T extends Record<string, unknown>>(
    keys: ChromeStorageKeyType[]
  ): Promise<T | null> {
    if (!this.#isAvailable()) return null;
    const result = await chrome.storage.local.get(keys);
    return (result as T) || null;
  }

  /**
   * Removes data from chrome.storage.local.
   */
  public async remove(key: ChromeStorageKeyType): Promise<void> {
    if (!this.#isAvailable()) return;
    await chrome.storage.local.remove(key as string);
  }

  #isAvailable(): boolean {
    return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
  }
}
