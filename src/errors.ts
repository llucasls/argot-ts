/**
 * Runtime error.
 * Represents errors that occur while parsing input arguments.
 * These errors are triggered by invalid or unexpected user input,
 * such as unknown options, missing values, or values of the wrong type.
 * Runtime errors are produced during the execution of the `.parse()`
 * method and depend on the provided input rather than the parser
 * configuration.
 */
export class RuntimeError extends Error {}

/**
 * Configuration error.
 * Represents errors caused by an invalid parser configuration.
 * These errors occur when defining or initializing the parser,
 * such as using unsupported option types or referencing invalid
 * alias targets.
 * Configuration errors are independent of user input and are
 * typically raised before any parsing takes place.
 */
export class ConfigError extends Error {}

/**
 * Invalid integer argument error.
 * Raised when an option of type "int" is provided with an associated
 * value that cannot be parsed as an integer.
 * This error only applies when a value is present. Missing values are
 * reported using NullIntError.
 */
export class InvalidIntError extends RuntimeError {
  public value: string;

  constructor(value: string) {
    super(`'${value}' is not a valid integer`);
    this.value = value;
    Object.freeze(this);
  }
}

/**
 * Unsafe integer error.
 * Raised when a parsed integer cannot be safely represented
 * by the underlying runtime.
 * This error only applies to values that are successfully parsed
 * as integers.
 */
export class UnsafeIntegerError extends RuntimeError {
  public value: number;

  constructor(value: number) {
    super(`${value} is not a safe integer`);
    this.value = value;
    Object.freeze(this);
  }
}

/**
 * Missing argument error.
 * Raised when an option that requires an associated value is provided
 * without one.
 * If the option is an alias, the error message includes both the
 * alias name and its target.
 */
export class NullArgError extends RuntimeError {
  public option: string;
  public target?: string;

  constructor(name: string, target?: string) {
    const msg = target
      ? `option '${name}' (alias for '${target}') must take an argument`
      : `option '${name}' must take an argument`;
    super(msg);
    this.option = name;
    if (target) {
      this.target = target;
    }
    Object.freeze(this);
  }
}

/**
 * Missing integer argument error.
 * Raised when an option of type "int" is provided without an
 * associated value.
 * This error does not cover invalid integer values. Invalid values
 * are reported using InvalidIntError.
 * If the option is an alias, the error message includes both the
 * alias name and its target.
 */
export class NullIntError extends RuntimeError {
  public option: string;
  public target?: string;

  constructor(name: string, target?: string) {
    const msg = target
      ? `option '${name}' (alias for '${target}') requires an integer number argument`
      : `option '${name}' requires an integer number argument`;
    super(msg);
    this.option = name;
    if (target) {
      this.target = target;
    }
    Object.freeze(this);
  }
}

/**
 * Unknown option error.
 * Raised when an input contains an option that is not defined in the
 * parser configuration.
 * This applies to both long and short options. The error is triggered
 * as soon as the parser encounters an unrecognized option name.
 */
export class UnknownOptionError extends RuntimeError {
  public option: string;

  constructor(name: string) {
    super(`option '${name}' is not supported`);
    this.option = name;
    Object.freeze(this);
  }
}

/**
 * Invalid option type error.
 * Raised when an option is declared with a type that is not supported
 * by the parser.
 * This is a configuration error and typically occurs during parser
 * initialization rather than at parse time.
 */
export class InvalidOptionTypeError extends ConfigError {
  public type: string;

  constructor(tag: string) {
    super(`option type '${tag}' is not supported`);
    this.type = tag;
    Object.freeze(this);
  }
}

/**
 * Alias target not found error.
 * Raised when an alias references a target option that does not exist
 * in the parser configuration.
 * This is a configuration error and indicates that the alias points
 * to an undefined option.
 */
export class AliasTargetNotFoundError extends ConfigError {
  public option: string;
  public target: string;

  constructor(name: string, target: string) {
    super(`target value '${target}' for option '${name}' was not found`);
    this.option = name;
    this.target = target;
    Object.freeze(this);
  }
}

/**
 * Invalid alias target error.
 * Raised when an alias references a target that is not a valid option
 * for aliasing.
 * This may occur if the target is itself an alias (when alias chaining
 * is not supported) or if the target cannot accept the alias due to
 * type or configuration constraints.
 */
export class InvalidAliasTargetError extends ConfigError {
  public option: string;
  public target: string;

  constructor(name: string, target: string) {
    super(`cannot create an alias to another alias (${name} => ${target})`);
    this.option = name;
    this.target = target;
    Object.freeze(this);
  }
}

/**
 * Missing option property error.
 * Raised when an option entry in the parser configuration is missing
 * one or more required properties.
 * This is a configuration error and indicates that the option
 * definition is incomplete or malformed.
 * Implementations may include the option name and the missing
 * property name to aid debugging.
 */
export class MissingOptionPropertyError extends ConfigError {
  public option: string;
  public property: string;

  constructor(option: string, property: string) {
    super(`option '${option}' is missing required property '${property}'`);
    this.option = option;
    this.property = property;
    Object.freeze(this);
  }
}

/**
 * Missing option type error.
 * Raised when a configuration entry does not define a "type" property.
 * The "type" property is required for all option entries and determines
 * how the option is parsed and validated. Without it, the entry cannot
 * be interpreted by the parser.
 * This is a configuration error and is typically raised during
 * configuration validation.
 */
export class MissingOptionTypeError extends ConfigError {
  public option: string;

  constructor(name: string) {
    const msg = `option '${name}' is missing required property 'type'`;
    super(msg);
    this.option = name;
    Object.freeze(this);
  }
}
