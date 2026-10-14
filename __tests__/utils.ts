import { expect } from 'expect';
import { describe, test } from 'node:test';

import {
  parseFloatStrict,
  parseIntStrict,
  validateEntry,
  validateEntries,
  validateEntriesAggregate,
} from '../src/utils.ts';
import {
  AliasTargetNotFoundError,
  ConfigError,
  InvalidFloatError,
  InvalidIntError,
  InvalidAliasTargetError,
  InvalidOptionTypeError,
  MissingOptionTypeError,
  MissingOptionPropertyError,
} from '../src/errors.ts';
import type { ConfigEntry, ConfigEntries } from '../src/types.ts';

describe('test parseIntStrict', () => {
  test('parse positive integer', () => {
    const result = parseIntStrict('65535');
    expect(result).toBe(65535);
  });

  test('parse negative integer', () => {
    const result = parseIntStrict('-200');
    expect(result).toBe(-200);
  });

  test('throw error on float', () => {
    expect(() => {
      parseIntStrict('2.7');
    }).toThrow(InvalidIntError);
  });

  test('throw error on whitespace', () => {
    expect(() => {
      parseIntStrict(' 40 ');
    }).toThrow(InvalidIntError);
  });

  test('throw error on non-numeric input', () => {
    expect(() => {
      parseIntStrict('six');
    }).toThrow(InvalidIntError);
  });
});

describe('test parseFloatStrict', () => {
  test('return float', () => {
    expect(parseFloatStrict('212')).toBe(212.0);
    expect(parseFloatStrict('-12')).toBe(-12.0);
    expect(parseFloatStrict('.25')).toBe(0.25);
    expect(parseFloatStrict('1e6')).toBe(1_000_000.0);
  });

  test('throw error', () => {
    expect(() => {
      parseFloatStrict('	2 ');
    }).toThrow(InvalidFloatError);

    expect(() => {
      parseFloatStrict('Nan');
    }).toThrow(InvalidFloatError);

    expect(() => {
      parseFloatStrict('Infinity');
    }).toThrow(InvalidFloatError);

    expect(() => {
      parseFloatStrict('1e500');
    }).toThrow(InvalidFloatError);
  });
});

describe('test validateEntry', () => {
  test('throw error on null entry', () => {
    expect(() => {
      validateEntry('z', null!);
    }).toThrow(TypeError);
  });

  test('throw error on non-object input', () => {
    expect(() => {
      validateEntry('n', 4 as unknown as ConfigEntry);
    }).toThrow(TypeError);
  });

  test('throw error if entry does not have type', () => {
    expect(() => {
      validateEntry('a', { target: 'x' } as ConfigEntry);
    }).toThrow(MissingOptionTypeError);
  });

  test('throw error if text default value is not a string', () => {
    const entry = { type: 'text', default: ['config.json'] };
    expect(() => {
      validateEntry('file', entry as ConfigEntry);
    }).toThrow(TypeError);
  });

  test('throw error if int default value is not a number', () => {
    const entry = { type: 'int', default: true };
    expect(() => {
      validateEntry('jobs', entry as ConfigEntry);
    }).toThrow(TypeError);
  });

  test('throw error if int default value is not an integer', () => {
    const entry = { type: 'int', default: 12.5 };
    expect(() => {
      validateEntry('jobs', entry as ConfigEntry);
    }).toThrow(TypeError);
  });

  test('throw error if float default value is not a number', () => {
    const entry = { type: 'float', default: '12.5' };
    expect(() => {
      validateEntry('scale', entry as ConfigEntry);
    }).toThrow(TypeError);
  });

  test('throw error if float default value is not finite', () => {
    const entry = { type: 'float', default: Infinity };
    expect(() => {
      validateEntry('scale', entry as ConfigEntry);
    }).toThrow(TypeError);
  });

  test('throw error if list sep value is not a string', () => {
    const entry = { type: 'list', sep: 33 };
    expect(() => {
      validateEntry('tasks', entry as ConfigEntry);
    }).toThrow(TypeError);
  });

  test('throw error on alias without a target', () => {
    const entry = { type: 'alias' };
    expect(() => {
      validateEntry('u', entry as ConfigEntry);
    }).toThrow(MissingOptionPropertyError);
  });

  test('throw error if alias target value is not a string', () => {
    const entry = { type: 'alias', target: 7 };
    expect(() => {
      validateEntry('v', entry as ConfigEntry);
    }).toThrow(TypeError);
  });

  test('throw error on unknown type', () => {
    const entry = { type: 'string' };
    expect(() => {
      validateEntry('version', entry as ConfigEntry);
    }).toThrow(InvalidOptionTypeError);
  });
});

describe('test validateEntries', () => {
  test('do not throw on valid entries', () => {
    const entries: ConfigEntries = {
      strict: { type: 'flag' },
      output: { type: 'text' },
      logFile: { type: 'text', default: 'access.log' },
      retries: { type: 'int' },
      threads: { type: 'int', default: 0 },
      logLevel: { type: 'count' },
      tasks: { type: 'list' },
      path: { type: 'list', sep: ':' },
      v: { type: 'alias', target: 'logLevel' },
      s: { type: 'alias', target: 'strict' },
      o: { type: 'alias', target: 'output' },
    };

    expect(() => {
      validateEntries(entries);
    }).not.toThrow();
  });

  test('throw error if target option is not found', () => {
    const entries: ConfigEntries = {
      s: { type: 'alias', target: 'strict' },
      notStrict: { type: 'flag' },
    };

    expect(() => {
      validateEntries(entries);
    }).toThrow(AliasTargetNotFoundError);
  });

  test('throw error on alias referencing another alias', () => {
    const entries: ConfigEntries = {
      strict: { type: 'flag' },
      s: { type: 'alias', target: 'strict' },
      S: { type: 'alias', target: 's' },
    };

    expect(() => {
      validateEntries(entries);
    }).toThrow(InvalidAliasTargetError);
  });
});

describe('test validateEntriesAggregate', () => {
  test('do not throw on valid entries', () => {
    const entries: ConfigEntries = {
      strict: { type: 'flag' },
      output: { type: 'text' },
      logFile: { type: 'text', default: 'access.log' },
      retries: { type: 'int' },
      threads: { type: 'int', default: 0 },
      logLevel: { type: 'count' },
      tasks: { type: 'list' },
      path: { type: 'list', sep: ':' },
      v: { type: 'alias', target: 'logLevel' },
      s: { type: 'alias', target: 'strict' },
      o: { type: 'alias', target: 'output' },
    };

    expect(() => {
      validateEntriesAggregate(entries);
    }).not.toThrow();
  });

  test('throw error if target option is not found', () => {
    const entries: ConfigEntries = {
      s: { type: 'alias', target: 'strict' },
      notStrict: { type: 'flag' },
    };

    expect(() => {
      validateEntriesAggregate(entries);
    }).toThrow(AliasTargetNotFoundError);
  });

  test('throw error on alias referencing another alias', () => {
    const entries: ConfigEntries = {
      strict: { type: 'flag' },
      s: { type: 'alias', target: 'strict' },
      S: { type: 'alias', target: 's' },
    };

    expect(() => {
      validateEntriesAggregate(entries);
    }).toThrow(InvalidAliasTargetError);
  });

  test('throw ConfigError if multiple targets are not found', () => {
    const entries: ConfigEntries = {
      notStrict: { type: 'flag' },
      s: { type: 'alias', target: 'strict' },
      S: { type: 'alias', target: 'strict' },
    };

    expect(() => {
      validateEntriesAggregate(entries);
    }).toThrow(ConfigError);
  });

  test('throw ConfigError on multiple wrong options', () => {
    const entries = {
      n: { type: 'number' },
      o: { type: 'string' },
    };

    expect(() => {
      validateEntriesAggregate(entries as ConfigEntries);
    }).toThrow(ConfigError);
  });
});
