import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';

import {
  parseIntStrict,
  validateEntry,
  validateEntries,
} from '../src/utils.ts';
import { InvalidIntError } from '../src/errors.ts';
import type { LabeledEntry, ConfigEntries } from '../src/types.ts';

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

describe('test validateEntry', () => {
  test('throw error on null input', () => {
    expect(() => {
      validateEntry(null!);
    }).toThrow(TypeError);
  });

  test('throw error on non-object input', () => {
    expect(() => {
      validateEntry(4 as unknown as LabeledEntry);
    }).toThrow(TypeError);
  });

  test('throw error if entry does not have option', () => {
    expect(() => {
      validateEntry({ type: 'flag' } as LabeledEntry);
    }).toThrow(Error);
  });

  test('throw error if entry does not have type', () => {
    expect(() => {
      validateEntry({ option: 'x' } as LabeledEntry);
    }).toThrow(Error);
  });

  test('throw error if text default value is not a string', () => {
    const entry = { option: 'file', type: 'text', default: ['config.json'] };
    expect(() => {
      validateEntry(entry as LabeledEntry);
    }).toThrow(TypeError);
  });

  test('throw error if int default value is not a number', () => {
    const entry = { option: 'jobs', type: 'int', default: true };
    expect(() => {
      validateEntry(entry as LabeledEntry);
    }).toThrow(TypeError);
  });

  test('throw error if int default value is not an integer', () => {
    const entry = { option: 'jobs', type: 'int', default: 12.5 };
    expect(() => {
      validateEntry(entry as LabeledEntry);
    }).toThrow(TypeError);
  });

  test('throw error if list sep value is not a string', () => {
    const entry = { option: 'tasks', type: 'list', sep: 33 };
    expect(() => {
      validateEntry(entry as LabeledEntry);
    }).toThrow(TypeError);
  });

  test('throw error on alias without a target', () => {
    const entry = { option: 't', type: 'alias' };
    expect(() => {
      validateEntry(entry as LabeledEntry);
    }).toThrow(Error);
  });

  test('throw error if alias target value is not a string', () => {
    const entry = { option: 't', type: 'alias', target: 7 };
    expect(() => {
      validateEntry(entry as LabeledEntry);
    }).toThrow(TypeError);
  });

  test('throw error on unknown type', () => {
    const entry = { option: 't', type: 'string' };
    expect(() => {
      validateEntry(entry as LabeledEntry);
    }).toThrow(Error);
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
    }).toThrow(Error);
  });
});
