import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';

import { ParserConfig } from '../src/parser_config.ts';
import type { ConfigEntries, ParserOptions } from '../src/types.ts';
import { InvalidAliasTargetError } from '../src/errors.ts';

describe('test ParserConfig', () => {
  const options: ConfigEntries = {
    output: { type: 'text' },
    users: { type: 'list' },
    logLevel: { type: 'count' },
    workers: { type: 'int' },
  };
  const parser: ParserOptions = {
    allowUnknown: false,
    parseParameters: true,
    aggregateErrors: false,
  }
  const parserConfig = new ParserConfig({ options, parser });

  test('create ParserConfig from object', () => {
    const parserConfig = new ParserConfig({
      options: {
        quiet: { type: 'flag' },
        output: { type: 'text' },
      }
    });

    expect(parserConfig).toBeInstanceOf(ParserConfig);
    expect(parserConfig.get('quiet')).toMatchObject({ type: 'flag' });
    expect(parserConfig.get('output')).toMatchObject({ type: 'text' });
  });

  test('read parser options from ParserConfig object', () => {
    expect(parserConfig.allowUnknown).toBe(false);
    expect(parserConfig.parseParameters).toBe(true);
    expect(parserConfig.aggregateErrors).toBe(false);
  });

  test('throw error on invalid input', () => {
    expect(() => {
      new ParserConfig(null!);
    }).toThrow(TypeError);

    expect(() => {
      new ParserConfig({
        options: [
          { option: 'output', type: 'text' },
          { option: 'users', type: 'list' },
        ] as unknown as ConfigEntries
      });
    }).toThrow(TypeError);

    expect(() => {
      new ParserConfig({
        options: {
          a: { type: 'flag' },
          o: { type: 'text' },
        },
        parser: [
          { allowUnknown: true },
          { parseParameters: true },
        ] as unknown as ParserOptions
      });
    }).toThrow(TypeError);
  });

  test('throw error on alias chains', () => {
    expect(() => {
      new ParserConfig({
        options: {
          version: { type: 'int' },
          v: { type: 'alias', target: 'version' },
          V: { type: 'alias', target: 'v' },
        }
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
      options: {
        output: { type: 'text' },
        users: { type: 'list' },
        logLevel: { type: 'count' },
        workers: { type: 'int' },
      },
      parser: {
        allowUnknown: false,
        parseParameters: true,
        aggregateErrors: false,
      },
    });
  });

  test('return correct number of entries', () => {
    const options: ConfigEntries = {
      output: { type: 'text' },
      users: { type: 'list' },
      logLevel: { type: 'count' },
      workers: { type: 'int' },
    };
    const parser = new ParserConfig({ options });

    expect(parser.size).toEqual(Object.keys(options).length);
  });
});
