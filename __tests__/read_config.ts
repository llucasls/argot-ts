import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';

import { readJSONConfig, readTOMLConfig } from '../src/read_config.ts';
import { ParserConfig } from '../src/parser_config.ts';

describe('test readJSONConfig', () => {
  const testDir = `${Deno.cwd()}/__tests__`;

  test('return ParserConfig object from JSON map', () => {
    const file = `${testDir}/config_map.json`;

    const parserConfig = readJSONConfig(file);

    expect(parserConfig).toBeInstanceOf(ParserConfig)
  });

  test('return ParserConfig object from JSON array', () => {
    const file = `${testDir}/config_array.json`;

    const parserConfig = readJSONConfig(file);

    expect(parserConfig).toBeInstanceOf(ParserConfig)
  });

  test('return ParserConfig object from TOML map', () => {
    const file = `${testDir}/config_map.toml`;

    const parserConfig = readTOMLConfig(file);

    expect(parserConfig).toBeInstanceOf(ParserConfig)
  });
});
