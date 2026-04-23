import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';

import { ParserConfig } from '../src/parser_config.ts';
import type { ConfigEntries } from '../src/types.ts';
import { InvalidAliasTargetError } from '../src/errors.ts';

describe('test ParserConfig', () => {
  const parserConfig = new ParserConfig({
    output: { type: 'text' },
    users: { type: 'list' },
    logLevel: { type: 'count' },
    workers: { type: 'int' },
  });

  test('create ParserConfig from object', () => {
    const parserConfig = new ParserConfig({
      quiet: { type: 'flag' },
      output: { type: 'text' },
    });

    expect(parserConfig).toBeInstanceOf(ParserConfig);
    expect(parserConfig.get('quiet')).toMatchObject({ type: 'flag' });
    expect(parserConfig.get('output')).toMatchObject({ type: 'text' });
  });

  test('create ParserConfig from array', () => {
    const parserConfig = new ParserConfig([
      { option: 'quiet', type: 'flag' },
      { option: 'output', type: 'text' },
    ]);

    expect(parserConfig).toBeInstanceOf(ParserConfig);
    expect(parserConfig.get('quiet')).toMatchObject({ type: 'flag' });
    expect(parserConfig.get('output')).toMatchObject({ type: 'text' });
  });

  test('throw error on invalid input', () => {
    expect(() => {
      new ParserConfig(null!);
    }).toThrow(TypeError);
  });

  test('throw error on alias chains', () => {
    expect(() => {
      new ParserConfig({
        version: { type: 'int' },
        v: { type: 'alias', target: 'version' },
        V: { type: 'alias', target: 'v' },
      });
    }).toThrow(InvalidAliasTargetError);
  });

  test('read properties from ParserConfig object', () => {
    expect(parserConfig.size).toBe(4);

    expect(parserConfig.has('output')).toBe(true);
    expect(parserConfig.has('logLevel')).toBe(true);
    expect(parserConfig.has('quiet')).toBe(false);
  });

  test('iterate over keys', () => {
    for (const key of parserConfig.keys()) {
      expect(typeof key).toBe('string');
      expect(parserConfig.has(key)).toBe(true);
    }
  });

  test('iterate over values', () => {
    for (const value of parserConfig.values()) {
      expect(value).toHaveProperty('type');
      expect(typeof value.type).toBe('string');
    }
  });

  test('iterate over entries', () => {
    for (const [key, value] of parserConfig.entries()) {
      expect(typeof key).toBe('string');
      expect(parserConfig.has(key)).toBe(true);

      expect(value).toHaveProperty('type');
      expect(typeof value.type).toBe('string');

      expect(parserConfig.get(key)).toBe(value);
    }
  });

  test('serialize ParserConfig object to JSON', () => {
    const serialized = JSON.stringify(parserConfig);
    const parsed = JSON.parse(serialized);
    expect(parsed).toMatchObject({
      output: { type: 'text' },
      users: { type: 'list' },
      logLevel: { type: 'count' },
      workers: { type: 'int' },
    });
  });

  test('return correct number of entries', () => {
    const configObj: ConfigEntries = {
      output: { type: 'text' },
      users: { type: 'list' },
      logLevel: { type: 'count' },
      workers: { type: 'int' },
    };
    const configArray: ConfigEntries = [
      { option: 'output', type: 'text' },
      { option: 'users', type: 'list' },
      { option: 'logLevel', type: 'count' },
      { option: 'workers', type: 'int' },
    ];
    const parser1 = new ParserConfig(configObj);
    const parser2 = new ParserConfig(configArray);

    expect(parser1.size).toEqual(Object.keys(configObj).length);
    expect(parser2.size).toEqual(configArray.length);
  });
});
