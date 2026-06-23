export interface SchemaTypeRule {
  type: string;
  required: string[];
  recommended: string[];
  urlFields: string[];
  dateFields: string[];
  enumFields: Record<string, string[]>;
}
