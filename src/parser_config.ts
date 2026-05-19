import type {
  ConfigEntry,
  ConfigEntries,
  ParserConfigInput,
  StrictParserOptions,
} from './types.ts';
import { validateEntries, validateEntriesAggregate } from './utils.ts';

function isObject(obj: unknown): obj is Record<string, unknown> {
  if (Array.isArray(obj) || obj == null || typeof obj !== 'object')
    return false;
  return true;
}

/**
 * Immutable configuration for the argument parser.
 * The configuration defines the set of supported options and their types.
 * Entries are provided as an object mapping option names to configuration
 * entries.
 * The configuration is normalized and validated during construction.
 * The resulting object is immutable.
 */
export class ParserConfig {
  #entries: ConfigEntries;
  #parser: StrictParserOptions;
  #size: number;

  constructor(input: ParserConfigInput) {
    if (!isObject(input)) {
      throw new TypeError('input value must be a plain object');
    } else if (!isObject(input.options)) {
      throw new TypeError('"options" value must be a plain object');
    } else if (input.parser != null && !isObject(input.parser)) {
      throw new TypeError('"parser" value must be a plain object');
    }

    const { options, parser } = input;

    this.#parser = {
      allowUnknown: parser?.allowUnknown ?? false,
      parseParameters: parser?.parseParameters ?? true,
      aggregateErrors: parser?.aggregateErrors ?? false,
    };

    this.#size = 0;
    const entryMap = Object.create(null);
    for (const [key, value] of Object.entries(options)) {
      entryMap[key] = Object.freeze({ ...value });
      this.#size += 1;
    }
    this.#entries = entryMap;

    if (this.#parser.aggregateErrors)
      validateEntriesAggregate(this.#entries);
    else
      validateEntries(this.#entries);
    Object.freeze(this.#entries);
    Object.freeze(this.#parser);
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

  public toJSON(): ParserConfigInput {
    return {
      options: this.#entries,
      parser: this.#parser,
    };
  }

  get size(): number {
    return this.#size;
  }

  get allowUnknown(): boolean {
    return this.#parser.allowUnknown;
  }

  get parseParameters(): boolean {
    return this.#parser.parseParameters;
  }

  get aggregateErrors(): boolean {
    return this.#parser.aggregateErrors;
  }
}
