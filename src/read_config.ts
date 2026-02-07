import fs from 'node:fs';
import * as toml from '@std/toml';
import { validateEntries } from './utils.ts';
import type { ConfigEntry, LabeledEntry } from './types.ts';

function readTextFileSync(path: string | URL): string {
  return fs.readFileSync(path, { encoding: 'utf8' });
}

export function readJSONConfig(
  configFile: string
): Record<string, ConfigEntry> {
  return normalizeEntries(JSON.parse(readTextFileSync(configFile)));
}

export function readTOMLConfig(
  configFile: string
): Record<string, ConfigEntry> {
  const result = toml.parse(readTextFileSync(configFile));

  if (Array.isArray(result.entries)) {
    return normalizeEntries(result.entries);
  }

  return normalizeEntries(result.entries as Record<string, ConfigEntry>);
}

export function normalizeEntries(
  entryList: LabeledEntry[] | Record<string, ConfigEntry>
): Record<string, ConfigEntry> {
  if (entryList == null || typeof entryList !== 'object')
    throw new TypeError('input value must be an object or an array');

  if (!Array.isArray(entryList)) {
    for (const entry of Object.values(entryList)) {
      if (entry == null)
        throw new TypeError('entry cannot be null');
      if (entry.type == null)
        throw new TypeError('config entry missing "type"');
    }

    const descriptors = Object.getOwnPropertyDescriptors(entryList);
    const output = Object.create(null, descriptors);
    validateEntries(output);
    return Object.freeze(output);
  }

  const output = Object.create(null);
  for (let i = 0, n = entryList.length; i < n; i++) {
    const entry: LabeledEntry = entryList[i];
    if (entry == null)
      throw new TypeError('entry cannot be null');
    if (entry.type == null)
      throw new TypeError('config entry missing "type"');
    const { option, ...entryConfig } = entry;
    output[option] = entryConfig;
  }

  validateEntries(output);
  return Object.freeze(output);
}
