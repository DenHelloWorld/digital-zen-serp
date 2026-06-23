/// <reference types="chrome"/>
import { extractMetaTags } from '../shared/helpers/og-extractor.helper';
import { validateMetaTags } from '../shared/helpers/og-validator.helper';
import { extractSchemaBlocks } from '../shared/helpers/schema-extractor.helper';
import { validateSchemaBlock } from '../shared/helpers/schema-validator.helper';
import type { SchemaOgData } from '../shared/models/og-data.model';

export class SchemaOgService {
  async collect(tabId: number, pageUrl: string): Promise<SchemaOgData> {
    const [schemaResult, metaResult] = await Promise.all([
      chrome.scripting.executeScript({ target: { tabId }, func: extractSchemaBlocks }),
      chrome.scripting.executeScript({ target: { tabId }, func: extractMetaTags }),
    ]);

    const rawBlocks = schemaResult[0]?.result ?? [];
    const rawMeta = metaResult[0]?.result ?? [];

    const schemaBlocks = rawBlocks.map((b: ReturnType<typeof extractSchemaBlocks>[number]) =>
      validateSchemaBlock(b)
    );
    const metaTags = validateMetaTags(rawMeta);

    return { schemaBlocks, metaTags, pageUrl };
  }
}
