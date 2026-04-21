import fs from 'node:fs';
import * as toml from '@std/toml';
import { ParserConfig } from './parser_config.ts';
import type { ConfigEntries } from './types.ts';

function readTextFileSync(path: string): string {
  return fs.readFileSync(path, { encoding: 'utf8' });
}

export function readJSONConfig(
  configFile: string
): ParserConfig {
  return new ParserConfig(JSON.parse(readTextFileSync(configFile)));
}

export function readTOMLConfig(
  configFile: string
): ParserConfig {
  const result = toml.parse(readTextFileSync(configFile)) as {
    entries: ConfigEntries,
  };

  return new ParserConfig(result.entries);
}
