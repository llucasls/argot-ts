import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';

import { readJSONConfig } from '../src/read_config.ts';
import { ParserConfig } from '../src/parser_config.ts';

describe('test readJSONConfig', () => {
  const testDir = `${Deno.cwd()}/__tests__`;

  test('return ParserConfig object from JSON map', () => {
    const file = `${testDir}/config_map.json`;

    const parserConfig = readJSONConfig(file);

    expect(parserConfig).toBeInstanceOf(ParserConfig)
  });
});
