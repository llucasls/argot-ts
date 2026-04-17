export type OptionType =
  | 'flag'
  | 'text'
  | 'int'
  | 'count'
  | 'list'
  | 'alias';

export type FlagEntry = { type: 'flag' };
export type TextEntry = { type: 'text'; default?: string };
export type IntEntry = { type: 'int'; default?: number };
export type CountEntry = { type: 'count' };
export type ListEntry = { type: 'list'; sep?: string };
export type AliasEntry = { type: 'alias'; target: string };

export type ConfigEntry = (
  | FlagEntry
  | TextEntry
  | IntEntry
  | CountEntry
  | ListEntry
  | AliasEntry
);

export type LabeledEntry = { option: string } & ConfigEntry;

export type ConfigEntries = Record<string, ConfigEntry> | LabeledEntry[];

export type OptionValue = boolean | string | number | string[];

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

  override set(key: K, value: V): this {
    if (this.isFrozen)
      throw new TypeError('you cannot modify option values');
    return super.set(key, value);
  }

  override delete(key: K): boolean {
    if (this.isFrozen)
      throw new TypeError('you cannot delete parsed options');
    return super.delete(key);
  }

  override clear(): void {
    if (this.isFrozen)
      throw new TypeError('you cannot delete parsed options');
    super.clear();
  }

  public freeze(): void {
    this.isFrozen = true;
    Object.freeze(this);
  }

  public toJSON(): Record<string, V> {
    return Object.fromEntries(this.entries());
  }
}

export class Options extends ResultMapping<string, OptionValue> {}
export class Parameters extends ResultMapping<string, string> {}
export class Operands extends Array<string> {}

export interface ParseResult {
  options: Options;
  parameters: Parameters;
  operands: Operands;
}
