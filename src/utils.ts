import { InvalidIntError } from './errors.ts';
import type { ConfigEntry, OptionType, AliasEntry } from './types.ts';

export function validateNumber(value: string): void {
  if (Number.isNaN(Number(value))) {
    const msg = `'${value}' is not a valid number`;
    throw new InvalidIntError(msg);
  }
}

export function validateEntry(entry: ConfigEntry): void {
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
    case 'text':
    case 'int':
    case 'list': {
      break;
    }
    case 'alias': {
      if (!Object.hasOwn(entry, 'target')) {
        const { target } = entry as AliasEntry;
        const msg = `'target' not found in alias option ${target}`;
        throw new Error(msg);
      }
      break;
    }
    default: {
      const msg = `option type '${tag}' is not supported`;
      throw new Error(msg);
    }
  }
}

export function validateEntries(
  entries: Record<string, Omit<ConfigEntry, 'option'>>
): void {
  const aliases = new Map();

  for (const [option, config] of Object.entries(entries)) {
    const entry = { option, ...config } as ConfigEntry;
    validateEntry(entry);
    const tag: OptionType = entry.type;
    if (tag === 'alias') {
      const { target } = entry as AliasEntry;
      aliases.set(option, target);
    }
  }

  for (const [name, target] of aliases.entries()) {
    if (!Object.hasOwn(entries, target)) {
      throw new Error(
        `target value '${target}' for option '${name}' was not found`
      );
    }
  }
}
