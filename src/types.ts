/**
 * Option type.
 *
 * Defines the kind of value an option accepts and how it is parsed.
 */
export type OptionType =
  | 'flag'
  | 'text'
  | 'int'
  | 'count'
  | 'list'
  | 'alias';

/**
 * Alias target type.
 *
 * Represents the set of option types that an alias may reference.
 *
 * Aliases cannot target other aliases.
 */
export type AliasType =
  | 'flag'
  | 'text'
  | 'int'
  | 'count'
  | 'list';

/**
 * Flag option entry.
 *
 * A flag is a boolean option that is set to true when present.
 */
export type FlagEntry = { type: 'flag' };

/**
 * Text option entry.
 *
 * A text option accepts a string value. A default value may be
 * provided if the option is not present.
 */
export type TextEntry = { type: 'text'; default?: string };

/**
 * Integer option entry.
 *
 * An integer option accepts a numeric value. The value must be a
 * valid integer and may be subject to runtime-specific constraints.
 *
 * A default value may be provided if the option is not present.
 */
export type IntEntry = { type: 'int'; default?: number };

/**
 * Count option entry.
 *
 * A count option increments a numeric counter each time the option
 * is provided.
 */
export type CountEntry = { type: 'count' };

/**
 * List option entry.
 *
 * A list option accepts a string value and splits it into multiple
 * entries using a separator.
 *
 * The separator defaults to a comma if not specified.
 */
export type ListEntry = { type: 'list'; sep?: string };

/**
 * Alias option entry.
 *
 * An alias forwards its value to another option.
 *
 * The target must reference a valid, non-alias option.
 */
export type AliasEntry = { type: 'alias'; target: string };

export type ConfigEntry = (
  | FlagEntry
  | TextEntry
  | IntEntry
  | CountEntry
  | ListEntry
  | AliasEntry
);

/**
 * @deprecated
 */
export type LabeledEntry = { option: string } & ConfigEntry;

/**
 * Configuration entries.
 *
 * Represents the full set of option definitions.
 */
export type ConfigEntries = Record<string, ConfigEntry> | LabeledEntry[];

/**
 * Option value.
 *
 * Represents the possible values returned for parsed options.
 */
export type OptionValue = boolean | string | number | string[];

/**
 * Result mapping.
 *
 * A map-like structure used to store parsed key-value pairs.
 *
 * Instances can be frozen to prevent further modifications.
 */
abstract class ResultMapping<K, V> extends Map<K, V> {
  protected isFrozen = false;

  constructor(entries?: [K, V][]) {
    super(entries);

    // Prevent property from showing up in console.log.
    Object.defineProperty(this, 'isFrozen', {
      enumerable: false,
    });

    // Prevent regular object property assignments.
    Object.preventExtensions(this);
  }

  /**
   * Sets a value for the given key.
   *
   * Throws if the mapping is frozen.
   */
  override set(key: K, value: V): this {
    if (this.isFrozen)
      throw new TypeError('you cannot modify option values');
    return super.set(key, value);
  }

  /**
   * Deletes a key from the mapping.
   *
   * Throws if the mapping is frozen.
   */
  override delete(key: K): boolean {
    if (this.isFrozen)
      throw new TypeError('you cannot delete parsed options');
    return super.delete(key);
  }

  /**
   * Clears all entries from the mapping.
   *
   * Throws if the mapping is frozen.
   */
  override clear(): void {
    if (this.isFrozen)
      throw new TypeError('you cannot delete parsed options');
    super.clear();
  }

  /**
   * Freezes the mapping, preventing further modifications.
   */
  public freeze(): void {
    this.isFrozen = true;
    Object.freeze(this);
  }

  /**
   * Serializes the mapping to a plain object.
   */
  public toJSON(): Record<string, V> {
    return Object.fromEntries(this.entries());
  }
}

/**
 * Result list.
 *
 * An array-like structure used to store ordered values.
 *
 * Only numeric indices and the length property may be modified.
 * Assigning any other property will throw an error.
 */
abstract class ResultList<T> extends Array<T> {
  constructor(args?: T[]) {
    const n = (args as T[])?.length ?? 0;
    super(n);
    for (let i = 0; i < n; i++) {
      this[i] = (args as T[])[i];
    }

    return new Proxy(this, {
      set(target, prop, value) {
        if (prop === 'length') {
          target[prop] = value;
          return true;
        } else if (String(Number(prop)) === prop) {
          target[Number(prop)] = value;
          return true;
        }

        throw new TypeError(`Cannot add non-index property: ${String(prop)}`);
      }
    });
  }
}

/**
 * Parsed option values.
 *
 * Values are determined by the parser configuration. Repeated options
 * either overwrite previous values or accumulate them, depending on
 * their type.
 *
 * The mapping is immutable after parsing.
 */
export class Options extends ResultMapping<string, OptionValue> {}

/**
 * Parsed key/value assignments.
 *
 * Parameters are parsed from arguments of the form "key=value" and do
 * not depend on the parser configuration.
 *
 * The mapping is immutable after parsing.
 */
export class Parameters extends ResultMapping<string, string> {}

/**
 * Positional arguments.
 *
 * Operands are arguments that are not parsed as options or parameters.
 *
 * The list is immutable after parsing.
 */
export class Operands extends ResultList<string> {}

/**
 * Parse result.
 *
 * Represents the result of parsing input arguments.
 *
 * - options: parsed option values
 * - parameters: parsed named parameters
 * - operands: positional arguments
 */
export interface ParseResult {
  options: Options;
  parameters: Parameters;
  operands: Operands;
}
