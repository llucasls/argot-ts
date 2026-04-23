import {
  AliasTargetNotFoundError,
  InvalidAliasTargetError,
  InvalidIntError,
  InvalidOptionTypeError,
  MissingOptionPropertyError,
  MissingOptionTypeError,
  UnsafeIntegerError,
} from './errors.ts';
import type {
  ConfigEntry,
  OptionType,
  AliasEntry,
  LabeledEntry,
  TextEntry,
  IntEntry,
  ListEntry,
} from './types.ts';

/**
 * Parses a string as an integer.
 *
 * The value must consist only of an optional sign followed by digits.
 * The resulting number must be safely representable by the runtime.
 *
 * Throws:
 * - InvalidIntError if the value is not a valid integer string
 * - UnsafeIntegerError if the parsed value cannot be safely represented
 */
export function parseIntStrict(value: string): number {
  if (!/^(-|\+)?\d+$/.test(value)) {
    throw new InvalidIntError(value);
  }

  const num = Number(value);
  if (!Number.isSafeInteger(num)) {
    throw new UnsafeIntegerError(num);
  }

  return num;
}

/**
 * Validates a single configuration entry.
 *
 * The entry must be a labeled object containing at least the "option"
 * and "type" properties. Additional properties are validated according
 * to the entry type.
 *
 * Throws:
 * - TypeError if the entry is not an object or contains invalid values
 * - MissingOptionPropertyError if a required property is missing
 * - InvalidOptionTypeError if the option type is not supported
 */
export function validateEntry(name: string, entry: ConfigEntry): void {
  if (entry == null || typeof entry !== 'object') {
    throw new TypeError('option config entry must be an object');
  } else if (!Object.hasOwn(entry, 'type')) {
    throw new MissingOptionTypeError(name);
  }

  const tag: OptionType = entry.type;

  switch (tag) {
    case 'flag':
    case 'count': {
      /* these types have no extra mandatory values */
      break;
    }
    case 'text': {
      if (!Object.hasOwn(entry, 'default'))
        break;

      const { default: def } = entry as TextEntry;
      if (typeof def !== 'string')
        throw new TypeError('default value must be a string');

      break;
    }
    case 'int': {
      if (!Object.hasOwn(entry, 'default'))
        break;

      const { default: def } = entry as IntEntry;
      if (typeof def !== 'number' || !Number.isInteger(def))
        throw new TypeError('default value must be an integer');

      break;
    }
    case 'list': {
      if (!Object.hasOwn(entry, 'sep'))
        break;

      const { sep } = entry as ListEntry;
      if (typeof sep !== 'string')
        throw new TypeError('sep value must be a string');

      break;
    }
    case 'alias': {
      if (!Object.hasOwn(entry, 'target')) {
        throw new MissingOptionPropertyError(name, 'target');
      }

      const { target } = entry as AliasEntry;
      if (typeof target !== 'string')
        throw new TypeError('target value must be a string');

      break;
    }
    default: {
      throw new InvalidOptionTypeError(tag);
    }
  }
}

/**
 * Validates a set of configuration entries.
 *
 * Each entry is validated individually. Alias entries are validated
 * after all entries have been processed to ensure that:
 * - the target exists
 * - the target is not itself an alias
 *
 * Throws:
 * - Any error raised by validateEntry
 * - AliasTargetNotFoundError if an alias target does not exist
 * - InvalidAliasTargetError if an alias targets another alias
 */
export function validateEntries(
  entries: Record<string, ConfigEntry>
): void {
  const aliases: [string, string][] = [];

  for (const [name, entry] of Object.entries(entries)) {
    validateEntry(name, entry);
    const tag: OptionType = entry.type;
    if (tag === 'alias') {
      const { target } = entry as AliasEntry;
      aliases.push([name, target]);
    }
  }

  for (const [name, target] of aliases) {
    if (!Object.hasOwn(entries, target)) {
      throw new AliasTargetNotFoundError(name, target);
    }
    const targetEntry: ConfigEntry = entries[target];
    if (targetEntry.type === 'alias') {
      throw new InvalidAliasTargetError(name, target);
    }
  }
}
