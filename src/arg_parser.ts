import type {
  AliasEntry,
  AliasType,
  ConfigEntry,
  FloatEntry,
  IntEntry,
  ListEntry,
  OptionType,
  OptionValue,
  ParseResult,
  TextEntry,
} from './types.ts';
import { ParserConfig } from './parser_config.ts';
import { Options, Parameters, Operands } from './types.ts';
import {
   NullArgError,
   NullFloatError,
   NullIntError,
   UnknownOptionError,
} from './errors.ts';
import { parseFloatStrict, parseIntStrict } from './utils.ts';

/**
 * Command-line argument parser.
 * The parser processes an array of strings according to a
 * configuration and produces a structured result.
 * Parsing follows UNIX-style short options and GNU-style long
 * options.
 */
export class ArgParser {
  private longOptExp: RegExp = /^--/;
  private shortOptExp: RegExp = /^-[^-]/;
  private assignmentExp: RegExp = /^--([^=]+)=(.+)?/d;
  private parameterExp: RegExp = /^([^=]+)=(.+)?/d;
  private configs: ParserConfig;

  constructor(configs: ParserConfig) {
    if (!(configs instanceof ParserConfig)) {
      throw new TypeError('input value must be an instance of ParserConfig');
    }
    this.configs = configs;
  }

  /**
   * Parse an array of command-line arguments.
   * Arguments are processed from left to right. Each argument is
   * classified as one of:
   * - option: matches a configured short or long option
   * - parameter: of the form "key=value"
   * - operand: any other argument
   * Parsing rules:
   * - The literal "--" stops option parsing. All subsequent
   *   arguments are treated as operands.
   * - Short options may be combined (e.g. "-abc").
   * - If a short option that accepts an associated value is not the
   *   last character in a group, the remainder of the argument is
   *   used as its value (e.g. "-n10").
   * - If a short option that accepts an associated value appears as
   *   the last character:
   *   - If the option has a default value, no additional argument
   *     is consumed.
   *   - Otherwise, the next argument is used as its value.
   * - Long options must be provided in the form "--name" if they do
   *   not accept an associated value, or "--name=value" if they do.
   * - Long options that accept an associated value never consume
   *   the next argument.
   * - Parameters are parsed from arguments matching "key=value" and
   *   are stored separately from options.
   * - If an option is repeated:
   *   - count and list options accumulate values
   *   - other options overwrite previous values
   * - Alias options store their values under the target option's
   *   name.
   * Returns:
   * - options: parsed option values
   * - parameters: key/value assignments
   * - operands: positional arguments
   * Throws:
   * - UnknownOptionError if an unrecognized option is encountered
   * - NullArgError or NullIntError if a required value is missing
   * - InvalidIntError or UnsafeIntegerError for invalid numeric values
   */
  public parse(argList: string[]): Readonly<ParseResult> {
    // options: parsed option values
    const options = new Options();

    // parameters: name=value variable assignments
    const parameters = new Parameters();

    // operands: command-line positional arguments
    const operands = new Operands();

    if (!Array.isArray(argList)) {
      throw new TypeError(`argList must be an array of strings`);
    }

    for (let i = 0, n = argList.length; i < n; i++) {
      if (typeof argList[i] !== 'string') {
        throw new TypeError(`argList must be an array of strings`);
      }
    }

    let stopParsing = false;

    for (let i = 0, n = argList.length; i < n; i++) {
      const arg: string = argList[i]!;

      if (stopParsing) {
        operands.push(arg);
        continue;
      }

      if (arg === '--') {
        stopParsing = true;
        continue;
      }

      try {
        if (this.longOptExp.test(arg)) {
          const {
            name,
            value,
            shouldSkip
          } = this.parseLongOption(arg, argList[i+1] ?? null);
          if (this.configs.get(name)?.type === 'count') {
            const oldValue = options.get(name) as number ?? 0;
            const newValue = value as number;
            options.set(name, oldValue + newValue);
          } else if (this.configs.get(name)?.type === 'list') {
            const oldValue = options.get(name) as string[] ?? [];
            const newValue = value as string[];
            options.set(name, oldValue.concat(newValue));
          } else {
            options.set(name, value);
          }
          if (shouldSkip)
            i += 1;
        } else if (this.shortOptExp.test(arg)) {
          const [
            shouldSkip,
            pairs,
          ] = this.parseShortOption(arg, argList[i+1] ?? null);
          for (const [name, value] of Object.entries(pairs)) {
            if (this.configs.get(name)?.type === 'count') {
              const oldValue = options.get(name) as number ?? 0;
              const newValue = value as number;
              options.set(name, oldValue + newValue);
            } else if (this.configs.get(name)?.type === 'list') {
              const oldValue = options.get(name) as string[] ?? [];
              const newValue = value as string[];
              options.set(name, oldValue.concat(newValue));
            } else {
              options.set(name, value);
            }
          }
          if (shouldSkip)
            i += 1;
        } else if (this.configs.parseParameters && this.parameterExp.test(arg)) {
          const [, name, value] = this.parameterExp.exec(arg)!;
          parameters.set(name!, value ?? '');
        } else {
          operands.push(arg);
        }
      } catch (err) {
        if (!(err instanceof UnknownOptionError) || !this.configs.allowUnknown)
          throw err;
      }
    }

    options.freeze();
    parameters.freeze();
    Object.freeze(operands);

    if (this.configs.parseParameters) {
      const result = { options, parameters, operands } as const;
      return Object.freeze(result);
    } else {
      const result = { options, operands } as const;
      return Object.freeze(result);
    }
  }

  public slice(argList: string[], index: number): [string[], string[]] {
    let i: number;
    let operands = 0;
    let stopParsing = false;
    for (i = 0; i < argList.length; i++) {
      if (operands >= index)
        break;

      const arg: string = argList[i]!;
      if (arg === '--' && !stopParsing) {
        stopParsing = true;
        continue;
      }

      if (stopParsing) {
        operands += 1;
        continue;
      }

      try {
        if (this.longOptExp.test(arg)) {
          const { shouldSkip } = this.parseLongOption(arg, argList[i+1] ?? null);
          if (shouldSkip)
            i += 1;
        } else if (this.shortOptExp.test(arg)) {
          const [shouldSkip,] = this.parseShortOption(arg, argList[i+1] ?? null);
          if (shouldSkip)
            i += 1;
        } else if (this.configs.parseParameters && this.parameterExp.test(arg)) {
          continue;
        } else {
          operands += 1;
        }
      } catch (err) {
        if (!(err instanceof UnknownOptionError) || !this.configs.allowUnknown)
          throw err;
      }
    }
    return [argList.slice(0, i), argList.slice(i)];
  }

  private parseLongOption(arg: string, nextArg: string | null): {
    name: string;
    value: OptionValue;
    shouldSkip: boolean;
  } {
    const offset = 2;

    let name: string;
    let value: string | null;
    try {
      const [, _name, _value] = this.assignmentExp.exec(arg)!;
      name = _name!;
      value = _value ?? '';
    } catch {
      name = arg.slice(offset);
      value = null;
    }

    const entry: ConfigEntry = this.configs.get(name)!;
    if (entry == null) {
      throw new UnknownOptionError(name);
    }
    const tag: OptionType = entry.type;

    switch (tag) {
      case 'flag': {
        return { name, value: true, shouldSkip: false };
      }
      case 'text': {
        if (value != null) {
          return { name, value, shouldSkip: false };
        } else if (Object.hasOwn(entry, 'default')) {
          const { default: value } = entry as TextEntry;
          return { name, value: value!, shouldSkip: false };
        } else if (nextArg != null) {
          return { name, value: nextArg, shouldSkip: true };
        }

        throw new NullArgError(name);
      }
      case 'int': {
        if (value != null) {
          return { name, value: parseIntStrict(value), shouldSkip: false };
        } else if (Object.hasOwn(entry, 'default')) {
          const { default: value } = entry as IntEntry;
          return { name, value: value!, shouldSkip: false };
        } else if (nextArg != null) {
          return { name, value: parseIntStrict(nextArg), shouldSkip: true };
        }

        throw new NullIntError(name);
      }
      case 'float': {
        if (value != null) {
          return { name, value: parseFloatStrict(value), shouldSkip: false };
        } else if (Object.hasOwn(entry, 'default')) {
          const { default: value } = entry as FloatEntry;
          return { name, value: value!, shouldSkip: false };
        } else if (nextArg != null) {
          return { name, value: parseFloatStrict(nextArg), shouldSkip: true };
        }

        throw new NullFloatError(name);
      }
      case 'count': {
        if (value != null)
          return { name, value: parseIntStrict(value), shouldSkip: false };
        return { name, value: 1, shouldSkip: false };
      }
      case 'list': {
        if (value === '') {
          return { name, value: [], shouldSkip: false };
        } else if (value != null) {
          const { sep } = entry as ListEntry;
          return { name, value: value.split(sep ?? ','), shouldSkip: false };
        } else if (nextArg != null) {
          const { sep } = entry as ListEntry;
          return { name, value: nextArg.split(sep ?? ','), shouldSkip: true };
        }

        throw new NullArgError(name);
      }
      case 'alias': {
        const { target } = entry as AliasEntry;
        const targetEntry: ConfigEntry = this.configs.get(target)!;
        const targetType = targetEntry.type as AliasType;

        switch (targetType) {
          case 'flag': {
            return { name: target, value: true, shouldSkip: false };
          }
          case 'text': {
            if (value != null) {
              return { name: target, value, shouldSkip: false };
            } else if (Object.hasOwn(targetEntry, 'default')) {
              const { default: value } = targetEntry as TextEntry;
              return { name: target, value: value!, shouldSkip: false };
            } else if (nextArg != null) {
              return { name: target, value: nextArg, shouldSkip: true };
            }

            throw new NullArgError(name, target);
          }
          case 'int': {
            if (value != null) {
              return {
                name: target,
                value: parseIntStrict(value),
                shouldSkip: false,
              };
            } else if (Object.hasOwn(targetEntry, 'default')) {
              const { default: value } = targetEntry as IntEntry;
              return { name: target, value: value!, shouldSkip: false };
            } else if (nextArg != null) {
              return {
                name: target,
                value: parseIntStrict(nextArg),
                shouldSkip: true
              };
            }

            throw new NullIntError(name, target);
          }
          case 'float': {
            if (value != null) {
              return {
                name: target,
                value: parseFloatStrict(value),
                shouldSkip: false,
              };
            } else if (Object.hasOwn(targetEntry, 'default')) {
              const { default: value } = targetEntry as FloatEntry;
              return { name: target, value: value!, shouldSkip: false };
            } else if (nextArg != null) {
              return {
                name: target,
                value: parseFloatStrict(nextArg),
                shouldSkip: true,
              };
            }

            throw new NullFloatError(name, target);
          }
          case 'count': {
            if (value != null)
              return {
                name: target,
                value: parseIntStrict(value),
                shouldSkip: false
              };
            return { name: target, value: 1, shouldSkip: false };
          }
          case 'list': {
            if (value === '') {
              return { name: target, value: [], shouldSkip: false };
            } else if (value != null) {
              const { sep } = targetEntry as ListEntry;
              return {
                name: target,
                value: value.split(sep ?? ','),
                shouldSkip: false
              };
            } else if (nextArg != null) {
              const { sep } = targetEntry as ListEntry;
              return {
                name: target,
                value: nextArg.split(sep ?? ','),
                shouldSkip: true
              };
            }

            throw new NullArgError(name, target);
          }
        }
      }
    }
  }

  private parseShortOption(
    arg: string,
    nextArg: string | null,
  ): [boolean, Record<string, OptionValue>] {
    let name: string;
    let value: string | null;
    let entry: ConfigEntry;

    const pairs: Record<string, OptionValue> = Object.create(null);

    for (let i = 1, n = arg.length; i < n; i++) {
      name = arg[i] as string;
      value = nextArg ?? null;
      entry = this.configs.get(name)!;
      if (entry == null && this.configs.allowUnknown) {
        /* silently skip unknown options */
        continue;
      } else if (entry == null) {
        throw new UnknownOptionError(name);
      }
      const tag: OptionType = entry.type;

      switch (tag) {
        case 'flag': {
          pairs[name] = true;
          break;
        }
        case 'text': {
          if (i < n - 1) {
            value = arg.slice(i + 1, n);
            pairs[name] = value;
            return [false, pairs];
          } else if (Object.hasOwn(entry, 'default')) {
            const { default: value } = entry as TextEntry;
            pairs[name] = value!;
            return [false, pairs];
          } else if (value != null) {
            pairs[name] = value;
            return [true, pairs];
          }

          throw new NullArgError(name);
        }
        case 'int': {
          if (i < n - 1) {
            value = arg.slice(i + 1, n);
            pairs[name] = parseIntStrict(value);
            return [false, pairs];
          } else if (Object.hasOwn(entry, 'default')) {
            const { default: value } = entry as IntEntry;
            pairs[name] = value!;
            return [false, pairs];
          } else if (value != null) {
            pairs[name] = parseIntStrict(value);
            return [true, pairs];
          }

          throw new NullIntError(name);
        }
        case 'float': {
          if (i < n - 1) {
            value = arg.slice(i + 1, n);
            pairs[name] = parseFloatStrict(value);
            return [false, pairs];
          } else if (Object.hasOwn(entry, 'default')) {
            const { default: value } = entry as FloatEntry;
            pairs[name] = value!;
            return [false, pairs];
          } else if (value != null) {
            pairs[name] = parseFloatStrict(value);
            return [true, pairs];
          }

          throw new NullFloatError(name);
        }
        case 'count': {
          const oldValue = pairs[name] as number ?? 0;
          pairs[name] = oldValue + 1;
          break;
        }
        case 'list': {
          if (i < n - 1) {
            value = arg.slice(i + 1, n);
            const { sep } = entry as ListEntry;
            pairs[name] = value.split(sep ?? ',');
            return [false, pairs];
          } else if (value === '') {
            pairs[name] = [];
            return [true, pairs];
          } else if (value != null) {
            const { sep } = entry as ListEntry;
            pairs[name] = value.split(sep ?? ',');
            return [true, pairs];
          }

          throw new NullArgError(name);
        }
        case 'alias': {
          const { target } = entry as AliasEntry;
          const targetEntry: ConfigEntry = this.configs.get(target)!;
          const targetType = targetEntry.type as AliasType;

          switch (targetType) {
            case 'flag': {
              pairs[target] = true;
              break;
            }
            case 'text': {
              if (i < n - 1) {
                value = arg.slice(i + 1, n);
                pairs[target] = value;
                return [false, pairs];
              } else if (Object.hasOwn(targetEntry, 'default')) {
                const { default: value } = targetEntry as TextEntry;
                pairs[target] = value!;
                return [false, pairs];
              } else if (value != null) {
                pairs[target] = value;
                return [true, pairs];
              }

              throw new NullArgError(name, target);
            }
            case 'int': {
              if (i < n - 1) {
                value = arg.slice(i + 1, n);
                pairs[target] = parseIntStrict(value);
                return [false, pairs];
              } else if (Object.hasOwn(targetEntry, 'default')) {
                const { default: value } = targetEntry as IntEntry;
                pairs[target] = value!;
                return [false, pairs];
              } else if (value != null) {
                pairs[target] = parseIntStrict(value);
                return [true, pairs];
              }

              throw new NullIntError(name, target);
            }
            case 'float': {
              if (i < n - 1) {
                value = arg.slice(i + 1, n);
                pairs[target] = parseFloatStrict(value);
                return [false, pairs];
              } else if (Object.hasOwn(targetEntry, 'default')) {
                const { default: value } = targetEntry as FloatEntry;
                pairs[target] = value!;
                return [false, pairs];
              } else if (value != null) {
                pairs[target] = parseFloatStrict(value);
                return [true, pairs];
              }

              throw new NullFloatError(name, target);
            }
            case 'count': {
              const oldValue = pairs[target] as number ?? 0;
              pairs[target] = oldValue + 1;
              break;
            }
            case 'list': {
              if (i < n - 1) {
                value = arg.slice(i + 1, n);
                const { sep } = targetEntry as ListEntry;
                pairs[target] = value.split(sep ?? ',');
                return [false, pairs];
              } else if (value === '') {
                pairs[target] = [];
                return [true, pairs];
              } else if (value != null) {
                const { sep } = targetEntry as ListEntry;
                pairs[target] = value.split(sep ?? ',');
                return [true, pairs];
              }

              throw new NullArgError(name, target);
            }
          }
        }
      }
    }

    return [false, pairs];
  }
}
