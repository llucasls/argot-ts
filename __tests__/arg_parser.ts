import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';
import { assertMappingEquals } from './helpers.ts';

import { ArgParser } from '../src/arg_parser.ts';
import { ParserConfig } from '../src/parser_config.ts';
import type { ConfigEntries } from '../src/types.ts';
import { Options, Parameters, Operands } from '../src/types.ts';
import {
  NullArgError,
  NullFloatError,
  NullIntError,
  UnknownOptionError,
  UnsafeIntegerError,
} from '../src/errors.ts';

describe('test ArgParser', () => {
  const options: ConfigEntries = {
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
  const parserConfig = new ParserConfig({ options });

  const parser = new ArgParser(parserConfig);

  test('create ArgParser object', () => {
    const parser = new ArgParser(parserConfig);
    expect(parser).toBeInstanceOf(ArgParser);
  });

  test('throw error on invalid parser config', () => {
    expect(() => {
      new ArgParser(options as unknown as ParserConfig);
    }).toThrow(TypeError);
  });

  test('throw error on invalid input type', () => {
    expect(() => {
      parser.parse('spec.txt' as unknown as string[]);
    }).toThrow(TypeError);
    expect(() => {
      parser.parse([1, 2] as unknown as string[]);
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
    assertMappingEquals(result.parameters!, expected);
    expect(result.operands).toEqual(['=', '=test']);
  });

  test('parse parameters as normal operands', () => {
    const parser = new ArgParser(new ParserConfig({
      options,
      parser: {
        parseParameters: false,
      },
    }));
    const result = parser.parse(['CC=clang', 'ENV=', '=', '=test']);

    expect(result.operands).toEqual(['CC=clang', 'ENV=', '=', '=test']);
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

  test('parse float options', () => {
    const parser = new ArgParser(new ParserConfig({
      options: {
        opacity: { type: 'float' },
        O: { type: 'alias', target: 'opacity' },
        z: { type: 'float' },
        zoom: { type: 'alias', target: 'z' },
        scale: { type: 'float', default: 1.0 },
        S: { type: 'float', default: 1.0 },
        s: { type: 'alias', target: 'S' },
        'bg-scale': { type: 'alias', target: 'scale' },
        'bg-opacity': { type: 'alias', target: 'opacity' },
      }
    }));

    let result = parser.parse(['-O', '0.95', '-S1.25', '--zoom=1.5']);
    assertMappingEquals(result.options, {
      opacity: 0.95,
      S: 1.25,
      z: 1.5,
    });

    result = parser.parse([
      '--opacity=0.8',
      '-z1',
      '--scale=2',
    ]);
    assertMappingEquals(result.options, {
      opacity: 0.8,
      z: 1.0,
      scale: 2.0,
    });

    result = parser.parse(['--scale', '-S']);
    assertMappingEquals(result.options, {
      scale: 1.0,
      S: 1.0
    });

    result = parser.parse(['--bg-scale', '-s']);
    assertMappingEquals(result.options, {
      scale: 1.0,
      S: 1.0
    });

    result = parser.parse(['-z', '2', '-O.95']);
    assertMappingEquals(result.options, {
      z: 2.0,
      opacity: 0.95,
    });

    expect(() => {
      parser.parse(['--opacity']);
    }).toThrow(NullFloatError);

    expect(() => {
      parser.parse(['-z']);
    }).toThrow(NullFloatError);

    expect(() => {
      parser.parse(['-O']);
    }).toThrow(NullFloatError);

    expect(() => {
      parser.parse(['--bg-opacity']);
    }).toThrow(NullFloatError);
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
  });

  test('throw error on unsupported options', () => {
    expect(() => {
      parser.parse(['esto', '--non-ecxiste']);
    }).toThrow(UnknownOptionError);
    expect(() => {
      parser.parse(['-Z']);
    }).toThrow(UnknownOptionError);
  });

  test('throw error on int option unsafe value', () => {
    expect(() => {
      parser.parse(['-i', '9007199254740992']);
    }).toThrow(UnsafeIntegerError);
  });

  test('parse arguments with unknown options allowed', () => {
    const parser = new ArgParser(new ParserConfig({
      options,
      parser: {
        parseParameters: true,
        allowUnknown: true,
      },
    }));

    expect(() => {
      const result = parser.parse(['--silent', '-xV']);
      expect(result.operands).toEqual([]);
    }).not.toThrow(Error);
  });
});

describe('test slice', () => {
  test('separate head and tail arrays', () => {
    const configs = new ParserConfig({
      options: {
        repo: { type: 'text' },
        'git-dir': { type: 'text' },
        r: { type: 'alias', target: 'repo' },
        d: { type: 'alias', target: 'git-dir' },
      },
      parser: {
        parseParameters: true,
      }
    });
    const parser = new ArgParser(configs);

    const url = 'https://github.com/llucasls/bare-estate.git';
    const input = [
      'estate',
      'GIT_DIR=some_dir',
      'clone',
      '-r',
      'bare_estate',
      url,
      'bare-estate',
    ];

    let [head, tail] = parser.slice(input, 0);
    expect(head).toEqual([]);
    expect(tail).toEqual([
      'estate',
      'GIT_DIR=some_dir',
      'clone',
      '-r',
      'bare_estate',
      url,
      'bare-estate'
    ]);

    [head, tail] = parser.slice(input, 1);
    expect(head).toEqual(['estate']);
    expect(tail).toEqual([
      'GIT_DIR=some_dir',
      'clone',
      '-r',
      'bare_estate',
      url,
      'bare-estate'
    ]);

    [head, tail] = parser.slice(input, 2);
    expect(head).toEqual(['estate', 'GIT_DIR=some_dir', 'clone']);
    expect(tail).toEqual(['-r', 'bare_estate', url, 'bare-estate']);

    [head, tail] = parser.slice(input, 3);
    expect(head).toEqual([
      'estate',
      'GIT_DIR=some_dir',
      'clone',
      '-r',
      'bare_estate',
      url
    ]);
    expect(tail).toEqual(['bare-estate']);
  });

  test('separate head and tail without parsing parameters', () => {
    const configs = new ParserConfig({
      options: {
        repo: { type: 'text' },
        'git-dir': { type: 'text' },
        r: { type: 'alias', target: 'repo' },
        d: { type: 'alias', target: 'git-dir' },
        'dry-run': { type: 'flag' },
      },
      parser: {
        parseParameters: false,
      }
    });
    const parser = new ArgParser(configs);

    const url = 'https://github.com/llucasls/bare-estate.git';
    const input = [
      'estate',
      '--dry-run',
      'GIT_DIR=some_dir',
      'clone',
      '-r',
      'bare_estate',
      url,
      'bare-estate',
    ];

    let [head, tail] = parser.slice(input, 0);
    expect(head).toEqual([]);
    expect(tail).toEqual([
      'estate',
      '--dry-run',
      'GIT_DIR=some_dir',
      'clone',
      '-r',
      'bare_estate',
      url,
      'bare-estate'
    ]);

    [head, tail] = parser.slice(input, 2);
    expect(head).toEqual(['estate', '--dry-run', 'GIT_DIR=some_dir']);
    expect(tail).toEqual(['clone', '-r', 'bare_estate', url, 'bare-estate']);
  });

  test('separate head and tail with unknown options', () => {
    const configs = new ParserConfig({
      options: {
        repo: { type: 'text' },
        'git-dir': { type: 'text' },
        r: { type: 'alias', target: 'repo' },
        d: { type: 'alias', target: 'git-dir' },
      },
      parser: {
        allowUnknown: true,
      }
    });
    const parser = new ArgParser(configs);

    const url = 'https://github.com/llucasls/bare-estate.git';
    const input = [
      'estate',
      '--dry-run',
      'clone',
      '-r',
      'bare_estate',
      url,
      'bare-estate',
    ];

    const [head, tail] = parser.slice(input, 2);
    expect(head).toEqual(['estate', '--dry-run', 'clone']);
    expect(tail).toEqual(['-r', 'bare_estate', url, 'bare-estate']);
  });

  test('separate head and tail with -- terminator', () => {
    const configs = new ParserConfig({
      options: {
        repo: { type: 'text' },
        'git-dir': { type: 'text' },
        r: { type: 'alias', target: 'repo' },
        d: { type: 'alias', target: 'git-dir' },
        'dry-run': { type: 'flag' },
        n: { type: 'alias', target: 'dry-run' },
      },
      parser: {
        parseParameters: true,
      }
    });
    const parser = new ArgParser(configs);

    let [head, tail] = parser.slice(['estate', '-r', 'vim', 'init'], 2);
    expect(head).toEqual(['estate', '-r', 'vim', 'init']);
    expect(tail).toEqual([]);

    [head, tail] = parser.slice(['estate', '--', '-r', 'vim', 'init'], 2);
    expect(head).toEqual(['estate', '--', '-r']);
    expect(tail).toEqual(['vim', 'init']);
  });

  test('throw error when slicing input with unknown option', () => {
    const configs = new ParserConfig({
      options: {
        repo: { type: 'text' },
        'git-dir': { type: 'text' },
        r: { type: 'alias', target: 'repo' },
        d: { type: 'alias', target: 'git-dir' },
      },
      parser: {
        allowUnknown: false,
      }
    });
    const parser = new ArgParser(configs);

    expect(() => {
      parser.slice(['estate', '-n', 'GIT_DIR=~/git/bare', 'init'], 1);
    }).not.toThrow(Error);
    expect(() => {
      parser.slice(['estate', '-n', 'GIT_DIR=~/git/bare', 'init'], 2);
    }).toThrow(UnknownOptionError);
    expect(() => {
      parser.slice(['estate', 'init', '-r'], 3);
    }).toThrow(NullArgError);
  });
});
