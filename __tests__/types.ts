import { expect } from '@std/expect';
import { describe, test } from '@std/testing/bdd';

import { Options, Parameters, Operands } from '../src/types.ts';

describe('test Options', () => {
  const options = new Options([['jobs', 4]]);

  test('prevent extra properties in an options object', () => {
    const anyOptions = options as { output?: string };
    expect(() => {
      anyOptions.output = 'build.log';
    }).toThrow(TypeError);
  });

  test('add a new option', () => {
    expect(() => {
      options.set('list', true);
    }).not.toThrow(TypeError);
    expect(options.has('list')).toBe(true);
  });

  test('serialize options', () => {
    const serialized = JSON.stringify(options);
    const parsedObj = JSON.parse(serialized);
    expect(parsedObj).toEqual({ jobs: 4, list: true });
  });

  test('delete option', () => {
    expect(options.delete('list')).toBe(true);
    expect(options.has('list')).toBe(false);
  });

  test('clear options', () => {
    options.clear();
    expect(options.size).toBe(0);
  });

  test('freeze options', () => {
    options.freeze();
    expect(() => {
      options.set('silent', true);
    }).toThrow(TypeError);
    expect(() => {
      options.clear();
    }).toThrow(TypeError);
  });
});

describe('test Parameters', () => {
  const parameters = new Parameters([['name', 'John']]);

  test('prevent extra properties in a parameters object', () => {
    const anyParameters = parameters as { name?: string };
    expect(() => {
      anyParameters.name = 'John';
    }).toThrow(TypeError);
  });

  test('add a new parameter', () => {
    expect(() => {
      parameters.set('job', 'carpenter');
    }).not.toThrow(TypeError);
    expect(parameters.has('job')).toBe(true);
  });

  test('serialize parameters', () => {
    const serialized = JSON.stringify(parameters);
    const parsedObj = JSON.parse(serialized);
    expect(parsedObj).toEqual({ name: 'John', job: 'carpenter' });
  });

  test('delete parameter', () => {
    expect(parameters.get('name')).toBe('John');
    expect(parameters.delete('name')).toBe(true);
    expect(parameters.get('name')).toBeUndefined();
  });

  test('freeze parameters', () => {
    parameters.freeze();
    expect(() => {
      parameters.set('schooling', 'high school');
    }).toThrow(TypeError);
    expect(() => {
      parameters.delete('job');
    }).toThrow(TypeError);
  });
});

describe('test Operands', () => {
  const operands = new Operands(['output.log', 'error.log']);

  test('prevent extra properties in an operands object', () => {
    expect(() => {
      const anyOperands = operands as { file?: string };
      anyOperands.file = 'build.log';
    }).toThrow(TypeError);
  });

  test('add a new operand', () => {
    expect(() => {
      operands.push('extra.log');
    }).not.toThrow(TypeError);
  })

  test('serialize operands', () => {
    const serialized = JSON.stringify(operands);
    const parsedList = JSON.parse(serialized);
    expect(parsedList).toEqual(['output.log', 'error.log', 'extra.log']);
  });

  test('freeze operands', () => {
    Object.freeze(operands);
    expect(() => {
      operands.push('linter.log');
    }).toThrow(TypeError);
  });

  test('spawn empty operands list', () => {
    const operands = new Operands();
    expect(operands).toEqual([]);
  });
});
