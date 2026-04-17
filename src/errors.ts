/**
 * Invalid integer argument error.
 *
 * Raised when an option of type "int" is provided with an associated
 * value that cannot be parsed as an integer.
 *
 * This error only applies when a value is present. Missing values are
 * reported using NullIntError.
 */
export class InvalidIntError extends Error {}

/**
 * Missing argument error.
 *
 * Raised when an option that requires an associated value is provided
 * without one.
 *
 * If the option is an alias, the error message includes both the
 * alias name and its target.
 */
export class NullArgError extends Error {
  constructor(name: string, target?: string) {
    const msg = target
      ? `option '${name}' (alias for '${target}') must take an argument`
      : `option '${name}' must take an argument`;
    super(msg);
  }
}

/**
 * Missing integer argument error.
 *
 * Raised when an option of type "int" is provided without an
 * associated value.
 *
 * This error does not cover invalid integer values. Invalid values
 * are reported using InvalidIntError.
 *
 * If the option is an alias, the error message includes both the
 * alias name and its target.
 */
export class NullIntError extends Error {
  constructor(name: string, target?: string) {
    const msg = target
      ? `option '${name}' (alias for '${target}') requires a numeric argument`
      : `option '${name}' requires a numeric argument`;
    super(msg);
  }
}
