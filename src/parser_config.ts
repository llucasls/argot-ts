import { validateEntries } from './utils.ts';

export class ParserConfig {
  private _entries: Record<string, ConfigEntry>;

  constructor(entries: ConfigEntries) {
    if (Array.isArray(entries)) {
      const entryMap = Object.create(null);
      for (const labeledEntry of entries) {
        const { option: name, ...newEntry } = labeledEntry;
        entryMap[name] = Object.freeze(newEntry);
      }
      this._entries = entryMap;
    } else if (entries && typeof entries === 'object') {
      const entryMap = Object.create(null);
      for (const [name, newEntry] of Object.values(entries)) {
        entryMap[name] = Object.freeze(newEntry);
      }
      this._entries = entryMap;
    } else {
      throw new TypeError('input value must be an array or object');
    }

    validateEntries(this._entries);
    Object.freeze(this._entries);
    Object.freeze(this);
  }

  public entries(): Iterable<[string, ConfigEntry]> {
    return Object.entries(this._entries);
  }

  public get(key: string): ConfigEntry {
    return this._entries[key];
  }

  public has(key: string): boolean {
    return Object.hasOwn(this._entries, key);
  }

  public keys(): Iterable<string> {
    return Object.keys(this._entries);
  }

  public values(): Iterable<ConfigEntry> {
    return Object.values(this._entries);
  }

  public toJSON(): Record<string, ConfigEntry> {
    return this._entries;
  }

  get size(): number {
    return Object.keys(this._entries).length;
  }
}
