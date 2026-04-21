import { assertEquals, assertObjectMatch } from '@std/assert';

type Key = string | number | symbol;

export function assertMappingMatches<K extends Key, V>(
  actual: Map<K, V>,
  expected: Record<K, V>,
  msg?: string
): void {
  const actualObj = Object.create(null) as Record<K, V>;

  for (const [key, value] of actual.entries()) {
    actualObj[key] = value;
  }

  assertObjectMatch(actualObj, expected, msg);
}

export function assertMappingEquals<K extends Key, V>(
  actual: Map<K, V>,
  expected: Record<K, V>,
  msg?: string
): void {
  const actualObj = {} as Record<K, V>;

  for (const [key, value] of actual.entries()) {
    actualObj[key] = value;
  }

  assertEquals(actualObj, expected, msg);
}
