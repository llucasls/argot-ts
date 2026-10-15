import process from 'node:process';
import { expect } from 'expect';
import { describe, test } from 'node:test';

import { readJSONConfig } from '../src/read_config.ts';
import { ParserConfig } from '../src/parser_config.ts';

describe('test readJSONConfig', () => {
  const testDir = `${process.cwd()}/__tests__`;

  test('return ParserConfig object from JSON map', () => {
    const file = `${testDir}/config_map.json`;

    const parserConfig = readJSONConfig(file);

    expect(parserConfig).toBeInstanceOf(ParserConfig)
  });
});
