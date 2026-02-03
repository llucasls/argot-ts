import * as toml from '@std/toml';
import type { ConfigEntry, LabeledEntry } from './types.ts';

export function readJSONConfig(
  configFile: string
): LabeledEntry[] | Record<string, ConfigEntry> {
  return JSON.parse(Deno.readTextFileSync(configFile));
}

export function readTOMLConfig(
  configFile: string
): LabeledEntry[] | Record<string, ConfigEntry> {
  const result = toml.parse(Deno.readTextFileSync(configFile));

  if (Array.isArray(result.entries)) {
    return result.entries as LabeledEntry[];
  }

  return result.entries as Record<string, ConfigEntry>;
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

  return Object.freeze(output);
}
