import { deepStrictEqual as assertEquals, partialDeepStrictEqual as assertObjectMatch } from 'node:assert/strict';

export function assertMappingMatches<K extends PropertyKey, V>(
  actual: Map<K, V>,
  expected: Record<K, V>,
  msg?: string
): void {
  const actualObj = Object.create(null) as Record<K, V>;

  for (const [key, value] of actual.entries()) {
    actualObj[key] = value;
  }

  assertObjectMatch(actualObj, expected, msg ?? 'Values are not equal');
}

export function assertMappingEquals<K extends PropertyKey, V>(
  actual: Map<K, V>,
  expected: Record<K, V>,
  msg?: string
): void {
  const actualObj = {} as Record<K, V>;

  for (const [key, value] of actual.entries()) {
    actualObj[key] = value;
  }

  assertEquals(actualObj, expected, msg ?? 'Values are not equal');
  //assertEquals(actualObj, expected, msg);
}
