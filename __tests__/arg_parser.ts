import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { assertMappingEquals } from './helpers.ts';

import { ArgParser } from '../src/arg_parser.ts';
import { ParserConfig } from '../src/parser_config.ts';
import type { ConfigEntries } from '../src/types.ts';
import { Options, Parameters, Operands } from '../src/types.ts';
import { NullArgError, NullIntError } from '../src/errors.ts';

describe('test ArgParser', () => {
  const entries: ConfigEntries = {
    strict: { type: 'flag' },
    output: { type: 'text' },
    'output-file': { type: 'alias', target: 'output' },
    logfile: { type: 'text', default: 'access.log' },
    'log-file': { type: 'alias', target: 'logfile' },
    retries: { type: 'int' },
    retry: { type: 'alias', target: 'retries' },
    threads: { type: 'int', default: 0 },
    jobs: { type: 'alias', target: 'threads' },
    loglevel: { type: 'count' },
    verbosity: { type: 'alias', target: 'loglevel' },
    tasks: { type: 'list' },
    path: { type: 'alias', target: 'P' },
    'dry-run': { type: 'alias', target: 'n' },
    user: { type: 'alias', target: 'u' },
    id: { type: 'alias', target: 'i' },
    targets: { type: 'alias', target: 't' },
    permission: { type: 'alias', target: 'p' },
    n: { type: 'flag' },
    u: { type: 'text' },
    U: { type: 'alias', target: 'u' },
    g: { type: 'text' },
    G: { type: 'alias', target: 'g' },
    e: { type: 'text', default: 'test' },
    i: { type: 'int' },
    I: { type: 'alias', target: 'i' },
    j: { type: 'int' },
    J: { type: 'alias', target: 'threads' },
    a: { type: 'int', default: 0 },
    t: { type: 'list' },
    p: { type: 'count' },
    v: { type: 'alias', target: 'loglevel' },
    s: { type: 'alias', target: 'strict' },
    o: { type: 'alias', target: 'output' },
    O: { type: 'alias', target: 'logfile' },
    r: { type: 'alias', target: 'retries' },
    f: { type: 'alias', target: 'logfile' },
    P: { type: 'list', sep: ':' },
    T: { type: 'alias', target: 'tasks' },
    E: { type: 'list' },
  };
  const parserConfig = new ParserConfig(entries);

  const parser = new ArgParser(parserConfig);

  test('create ArgParser object', () => {
    const parser = new ArgParser(parserConfig);
    expect(parser).toBeInstanceOf(ArgParser);
  });

  test('throw error on invalid input type', () => {
    expect(() => {
      parser.parse('spec.txt' as unknown as string[]);
    }).toThrow(TypeError);
  });

  test('produce result with specialized types', () => {
    const result = parser.parse(['--strict', 'CC=clang', 'main.o']);

    expect(result.options).toBeInstanceOf(Options);
    expect(result.parameters).toBeInstanceOf(Parameters);
    expect(result.operands).toBeInstanceOf(Operands);
  });

  test('parse parameters', () => {
    const result = parser.parse(['CC=clang', 'ENV=', '=', '=test']);

    const expected = {
      CC: 'clang',
      ENV: '',
    }
    assertMappingEquals(result.parameters, expected);
    expect(result.operands).toEqual(['=', '=test']);
  });

  test('parse flag options', () => {
    const result = parser.parse(['--strict', 'CC=clang', 'main.o', '-n']);

    expect(result.operands).toEqual(['main.o']);
    assertMappingEquals(result.options, { strict: true, n: true });
  });

  test('parse text options', () => {
    const result = parser.parse([
      '--output=doc.txt',
      '--logfile',
      '-ubob',
      '-g',
      'users',
      '-e',
    ]);
    const expected = {
      output: 'doc.txt',
      logfile: 'access.log',
      u: 'bob',
      g: 'users',
      e: 'test',
    };

    assertMappingEquals(result.options, expected);
  });

  test('parse int options', () => {
    const result = parser.parse([
      '--retries=3',
      '--threads',
      '-j4',
      '-i',
      '2',
      '-a',
    ]);
    const expected = {
      retries: 3,
      threads: 0,
      i: 2,
      j: 4,
      a: 0,
    };

    assertMappingEquals(result.options, expected);
  });

  test('parse count options', () => {
    const result = parser.parse(['--loglevel=2', '-pp', '-p']);
    const expected = {
      loglevel: 2,
      p: 3,
    };

    assertMappingEquals(result.options, expected);
  });

  test('parse list options', () => {
    const result = parser.parse([
      '--tasks=build,test',
      '--path=~/.local/bin:~/bin',
      '-P',
      '~/.cargo/bin',
      '-T',
      'all',
      '-Etest,staging',
      '-E',
      'build',
    ]);
    const expected = {
      tasks: ['build', 'test', 'all'],
      P: ['~/.local/bin', '~/bin', '~/.cargo/bin'],
      E: ['test', 'staging', 'build'],
    };

    assertMappingEquals(result.options, expected);
  });

  test('parse alias options', () => {
    const result = parser.parse([
      '-vvv',
      '-so',
      'doc.txt',
      '-Ujohn',
      '-G',
      'staff',
      '-O',
      '-J',
      '-r4',
      '-I',
      '12',
      '-Tbuild',
      '-T',
      'check',
      '-T',
      '',
    ]);
    const expected = {
      loglevel: 3,
      logfile: 'access.log',
      strict: true,
      output: 'doc.txt',
      threads: 0,
      retries: 4,
      tasks: ['build', 'check'],
      u: 'john',
      g: 'staff',
      i: 12,
    };

    assertMappingEquals(result.options, expected);
  });

  test('parse options as operands', () => {
    const result = parser.parse(['-vvv', '--', '-so', '--', 'doc.txt']);

    assertMappingEquals(result.options, { loglevel: 3 });
    expect(result.operands).toEqual(['-so', '--', 'doc.txt']);
  });

  test('parse list option with empty values', () => {
    const result = parser.parse(['--tasks=', '-P', '']);
    const expected = { tasks: [], P: [] };

    assertMappingEquals(result.options, expected);
  });

  test('parse count option without value', () => {
    const result = parser.parse(['--loglevel']);
    const expected = { loglevel: 1 };

    assertMappingEquals(result.options, expected);
  });

  test('throw error on text option without associated value', () => {
    expect(() => {
      parser.parse(['--output']);
    }).toThrow(NullArgError);

    expect(() => {
      parser.parse(['-u']);
    }).toThrow(NullArgError);

    /* alias to output */
    expect(() => {
      parser.parse(['--output-file']);
    }).toThrow(NullArgError);

    /* alias to output */
    expect(() => {
      parser.parse(['-o']);
    }).toThrow(NullArgError);
  });

  test('throw error on int option without associated value', () => {
    expect(() => {
      parser.parse(['--retries']);
    }).toThrow(NullIntError);

    expect(() => {
      parser.parse(['-j']);
    }).toThrow(NullIntError);

    /* alias to retries */
    expect(() => {
      parser.parse(['--retry']);
    }).toThrow(NullIntError);

    /* alias to retries */
    expect(() => {
      parser.parse(['-r']);
    }).toThrow(NullIntError);
  });

  test('throw error on list option without associated value', () => {
    expect(() => {
      parser.parse(['--tasks']);
    }).toThrow(NullArgError);

    expect(() => {
      parser.parse(['-P']);
    }).toThrow(NullArgError);

    /* alias to P */
    expect(() => {
      parser.parse(['--path']);
    }).toThrow(NullArgError);

    /* alias to tasks */
    expect(() => {
      parser.parse(['-T']);
    }).toThrow(NullArgError);
  });

  test('parse alias long options', () => {
    const result = parser.parse([
      '--dry-run',
      '--user=bob',
      '--id=7525',
      '--targets=build,ci,test',
      '--permission=3',
      '--jobs',
      '--log-file',
      '--verbosity',
      '--path=',
    ]);

    const expected = {
      i: 7525,
      logfile: 'access.log',
      loglevel: 1,
      n: true,
      p: 3,
      t: ['build', 'ci', 'test'],
      threads: 0,
      u: 'bob',
      P: [],
    };

    assertMappingEquals(result.options, expected);
  })
});
