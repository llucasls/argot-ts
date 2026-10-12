import fs from 'node:fs';
import { ParserConfig } from './parser_config.ts';
import type { ParserConfigInput } from './types.ts';

/**
 * Reads a parser configuration from a JSON file.
 * The file must contain a valid configuration object that can be
 * passed to the ParserConfig constructor.
 */
export function readJSONConfig(configFile: string): ParserConfig {
  const content: string = fs.readFileSync(configFile, { encoding: 'utf8' });
  const configObj: ParserConfigInput = JSON.parse(content);
  return new ParserConfig(configObj);
}
