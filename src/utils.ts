import { InvalidIntError } from './errors.ts';
import type {
  ConfigEntry,
  OptionType,
  AliasEntry,
  LabeledEntry,
  TextEntry,
  ListEntry,
} from './types.ts';

export function validateNumber(value: string): void {
  if (Number.isNaN(Number(value))) {
    const msg = `'${value}' is not a valid number`;
    throw new InvalidIntError(msg);
  }
}

export function validateEntry(entry: LabeledEntry): void {
  if (entry == null || typeof entry !== 'object') {
    throw new TypeError('option config entry must be an object');
  }
  for (const key of ['option', 'type']) {
    if (!Object.hasOwn(entry, key)) {
      throw new Error(`'${key}' not found in config entry`);
    }
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

      const { default: def } = entry as TextEntry;
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
        const { option } = entry;
        const msg = `'target' not found in alias option ${option}`;
        throw new Error(msg);
      }

      const { target } = entry as AliasEntry;
      if (typeof target !== 'string')
        throw new TypeError('target value must be a string');

      break;
    }
    default: {
      const msg = `option type '${tag}' is not supported`;
      throw new Error(msg);
    }
  }
}

export function validateEntries(
  entries: Record<string, ConfigEntry>
): void {
  const aliases: [string, string][] = [];

  for (const [option, config] of Object.entries(entries)) {
    const entry = { option, ...config } as LabeledEntry;
    validateEntry(entry);
    const tag: OptionType = entry.type;
    if (tag === 'alias') {
      const { target } = entry as AliasEntry;
      aliases.push([option, target]);
    }
  }

  for (const [name, target] of aliases) {
    if (!Object.hasOwn(entries, target)) {
      throw new Error(
        `target value '${target}' for option '${name}' was not found`
      );
    }
  }
}
