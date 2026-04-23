import type { ConfigEntry, ConfigEntries } from './types.ts';
import { validateEntries } from './utils.ts';

/**
 * Immutable configuration for the argument parser.
 *
 * The configuration defines the set of supported options and their types.
 * Entries are provided as an object mapping option names to configuration
 * entries.
 * The configuration is normalized and validated during construction.
 * The resulting object is immutable.
 */
export class ParserConfig {
  #entries: Record<string, ConfigEntry>;
  #size: number;

  constructor(entries: ConfigEntries) {
    this.#size = 0;

    if (Array.isArray(entries)) {
      const entryMap = Object.create(null);
      for (const labeledEntry of entries) {
        const { option: name, ...newEntry } = labeledEntry;
        entryMap[name] = Object.freeze(newEntry);
        this.#size += 1;
      }
      this.#entries = entryMap;
    } else if (entries && typeof entries === 'object') {
      const entryMap = Object.create(null);
      for (const [key, value] of Object.entries(entries)) {
        entryMap[key] = Object.freeze({ ...value });
        this.#size += 1;
      }
      this.#entries = entryMap;
    } else {
      throw new TypeError('input value must be an array or object');
    }

    validateEntries(this.#entries);
    Object.freeze(this.#entries);
    Object.freeze(this);
  }

  public entries(): Iterable<[string, ConfigEntry]> {
    return Object.entries(this.#entries);
  }

  public get(key: string): ConfigEntry {
    return this.#entries[key];
  }

  public has(key: string): boolean {
    return Object.hasOwn(this.#entries, key);
  }

  public keys(): Iterable<string> {
    return Object.keys(this.#entries);
  }

  public values(): Iterable<ConfigEntry> {
    return Object.values(this.#entries);
  }

  public toJSON(): Record<string, ConfigEntry> {
    return this.#entries;
  }

  get size(): number {
    return this.#size;
  }
}
