import { expect } from 'jsr:@std/expect';
import { describe, test } from "jsr:@std/testing/bdd";

import { Parameters } from './types.ts';

describe('test Parameters', () => {
  const parameters = new Parameters([['name', 'John']]);

  test('prevent extra properties in a map object', () => {
    const anyParameters = parameters as any;
    expect(() => {
      anyParameters.name = 'John';
    }).toThrow(TypeError);
  });

  test('add a new parameter', () => {
    expect(() => {
      parameters.set('job', 'carpenter');
    }).not.toThrow(TypeError);
  })

  test('freeze parameters', () => {
    parameters.freeze();
    expect(() => {
      parameters.set('schooling', 'high school');
    }).toThrow(TypeError);
  });
});
