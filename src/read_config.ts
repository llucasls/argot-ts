import fs from 'node:fs';
import * as toml from '@std/toml';
import { ParserConfig } from './parser_config.ts';
import type { ConfigEntry } from './types.ts';

function readTextFileSync(path: string | URL): string {
  return fs.readFileSync(path, { encoding: 'utf8' });
}

export function readJSONConfig(
  configFile: string
): Record<string, ConfigEntry> {
  return ParserConfig(JSON.parse(readTextFileSync(configFile)));
}

export function readTOMLConfig(
  configFile: string
): Record<string, ConfigEntry> {
  const result = toml.parse(readTextFileSync(configFile));

  return ParserConfig(result.entries);
}
