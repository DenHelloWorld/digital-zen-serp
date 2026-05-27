export enum CHROME_COMMAND_ENUM {
  OPEN_SIDE_PANEL_APP = 'openSidePanel',
  SCRAP_CURRENT_TAB = 'scrapCurrentTab',
  GET_ACTIVE_TAB = 'getActiveTab',
  BASE_SEO_AUDIT = 'baseSeoAudit',
  HIGHLIGHT_HEADERS = 'highlightHeaders',
}

export type ChromeCommandType =
  | CHROME_COMMAND_ENUM.OPEN_SIDE_PANEL_APP
  | CHROME_COMMAND_ENUM.GET_ACTIVE_TAB
  | CHROME_COMMAND_ENUM.SCRAP_CURRENT_TAB
  | CHROME_COMMAND_ENUM.BASE_SEO_AUDIT
  | CHROME_COMMAND_ENUM.HIGHLIGHT_HEADERS;

/** Keepalive port name between side panel and background */
export const CHROME_KEEPALIVE_PORT = 'dz-keepalive';
