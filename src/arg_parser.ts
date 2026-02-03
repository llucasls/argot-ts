import type * as t from './types.ts';
import { NullArgError, NullIntError } from './errors.ts';
import { validateNumber } from './utils.ts';

abstract class ArgParserResult<K, V> extends Map<K, V> {
  protected frozen = false;

  constructor(entries: [K, V][]) {
    super(entries);
    Object.defineProperty(this, 'frozen', {
      writable: true,
      enumerable: false,
    });
  }

  override set(key: K, value: V): this {
    if (this.frozen)
      throw new TypeError('you cannot modify option values');
    return super.set(key, value);
  }

  override delete(key: K): boolean {
    if (this.frozen)
      throw new TypeError('you cannot delete parsed options');
    return super.delete(key);
  }

  override clear(): void {
    if (this.frozen)
      throw new TypeError('you cannot delete parsed options');
    super.clear();
  }

  public freeze() {
    this.frozen = true;
    Object.freeze(this);
  }

  public toJSON(): Record<string, V> {
    return Object.fromEntries(this.entries());
  }
}

class Options extends ArgParserResult<string, t.OptionValue> {}
class Parameters extends ArgParserResult<string, string> {}
class Operands extends Array<string> {}

export class ArgParser {
  private longOptExp: RegExp = /^--/;
  private shortOptExp: RegExp = /^-[^-]/;
  private assignmentExp: RegExp = /^--([^=]+)=(.+)?/d;
  private parameterExp: RegExp = /^([^=]+)=(.+)?/d;
  private configs: Record<string, t.ConfigEntry>;

  constructor(configs: Record<string, t.ConfigEntry>) {
    this.configs = configs;
  }

  public parse(argList: string[]): {
    options: Options,
    parameters: Parameters,
    operands: Operands,
  } {
    // options: short options and GNU-style long options
    const options = new Options();

    // parameters: name=value variable assignments
    const parameters = new Parameters();

    // operands: command-line positional arguments
    const operands = new Operands();

    if (!Array.isArray(argList)) {
      throw new TypeError(`argList must be an array of strings`);
    }

    let stopParsing = false;

    for (let i = 0, n = argList.length; i < n; i++) {
      const arg: string = argList[i]!;
      if (arg === '--' && !stopParsing) {
        stopParsing = true;
        continue;
      }

      if (stopParsing) {
        operands.push(arg);
        continue;
      }

      if (this.longOptExp.test(arg)) {
        const [name, value] = this.parseLongOption(arg);
        if (this.configs[name].type === 'count') {
          const oldValue = options.get(name) as number ?? 0;
          const newValue = value as number;
          options.set(name, oldValue + newValue);
        } else if (this.configs[name].type === 'list') {
          const oldValue = options.get(name) as string[] ?? [];
          const newValue = value as string[];
          options.set(name, oldValue.concat(newValue));
        } else {
          options.set(name, value);
        }
      } else if (this.shortOptExp.test(arg)) {
        const [
          shouldSkip,
          pairs,
        ] = this.parseShortOption(arg, argList[i+1] ?? null);
        for (const [name, value] of Object.entries(pairs)) {
          if (this.configs[name].type === 'count') {
            const oldValue = options.get(name) as number ?? 0;
            const newValue = value as number;
            options.set(name, oldValue + newValue);
          } else if (this.configs[name].type === 'list') {
            const oldValue = options.get(name) as string[] ?? [];
            const newValue = value as string[];
            options.set(name, oldValue.concat(newValue));
          } else {
            options.set(name, value);
          }
        }
        if (shouldSkip)
          i += 1;
      } else if (this.parameterExp.test(arg)) {
        const [, name, value] = this.parameterExp.exec(arg)!;
        parameters.set(name, value ?? '');
      } else {
        operands.push(arg);
      }
    }

    const result = { options, parameters, operands } as const;

    return result;
  }

  private parseLongOption(arg: string): [string, t.OptionValue] {
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

    const entry: t.ConfigEntry = this.configs[name];
    const tag: t.OptionType = entry.type;

    switch (tag) {
      case 'flag': {
        return [name, true];
      }
      case 'text': {
        if (value != null) {
          return [name, value];
        } else if (Object.hasOwn(entry, 'default')) {
          const { default: value } = entry as t.TextEntry;
          return [name, value!];
        }

        throw new NullArgError(name);
      }
      case 'int': {
        if (value != null && value !== '') {
          validateNumber(value);
          return [name, Number(value)];
        } else if (Object.hasOwn(entry, 'default')) {
          const { default: value } = entry as t.IntEntry;
          return [name, Number(value)];
        }

        throw new NullIntError(name);
      }
      case 'count': {
        if (value != null)
          validateNumber(value);
        return [name, Number(value ?? 1)];
      }
      case 'list': {
        if (value === '') {
          return [name, []];
        } else if (value != null) {
          const { sep } = entry as t.ListEntry;
          return [name, value.split(sep ?? ',')];
        }
        throw new NullArgError(name);
      }
      case 'alias': {
        const { target } = entry as t.AliasEntry;
        const targetEntry: t.ConfigEntry = this.configs[target];
        const targetType: t.OptionType = targetEntry.type;

        switch (targetType) {
          case 'flag': {
            return [target, true];
          }
          case 'text': {
            if (value != null) {
              return [target, value];
            } else if (Object.hasOwn(entry, 'default')) {
              const { default: value } = targetEntry as t.TextEntry;
              return [target, value!];
            }

            throw new NullArgError(name, target);
          }
          case 'int': {
            if (value != null && value !== '') {
              validateNumber(value);
              return [target, Number(value)];
            } else if (Object.hasOwn(entry, 'default')) {
              const { default: value } = targetEntry as t.IntEntry;
              return [target, Number(value)];
            }

            throw new NullIntError(name, target);
          }
          case 'count': {
            if (value != null)
              validateNumber(value);
            return [target, Number(value ?? 1)];
          }
          case 'list': {
            if (value === '') {
              return [target, []];
            } else if (value != null) {
              const { sep } = targetEntry as t.ListEntry;
              return [target, value.split(sep ?? ',')];
            }
            throw new NullArgError(name, target);
          }
          default: {
            throw new Error(`type '${targetType}' is not supported`);
          }
        }
      }
      default: {
        throw new Error(`type '${tag}' is not supported`);
      }
    }
  }

  private parseShortOption(
    arg: string,
    nextArg: string | null,
  ): [boolean, Record<string, t.OptionValue>] {
    let name: string;
    let value: string | null;
    let entry: t.ConfigEntry;

    const pairs: Record<string, t.OptionValue> = Object.create(null);

    for (let i = 1, n = arg.length; i < n; i++) {
      name = arg[i] as string;
      value = nextArg ?? null;
      entry = this.configs[name];
      const tag: t.OptionType = entry.type;

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
            const { default: value } = entry as t.TextEntry;
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
            validateNumber(value);
            pairs[name] = Number(value);
            return [false, pairs];
          } else if (Object.hasOwn(entry, 'default')) {
            const { default: value } = entry as t.TextEntry;
            validateNumber(value!);
            pairs[name] = Number(value);
            return [false, pairs];
          } else if (value != null) {
            validateNumber(value);
            pairs[name] = Number(value);
            return [true, pairs];
          }

          throw new NullIntError(name);
        }
        case 'count': {
          const oldValue = pairs[name] as number ?? 0;
          pairs[name] = oldValue + 1;
          break;
        }
        case 'list': {
          if (i < n - 1) {
            value = arg.slice(i + 1, n);
            const { sep } = entry as t.ListEntry;
            pairs[name] = value.split(sep ?? ',');
            return [false, pairs];
          } else if (value === '') {
            pairs[name] = [];
            return [true, pairs];
          } else if (value != null) {
            const { sep } = entry as t.ListEntry;
            pairs[name] = value.split(sep ?? ',');
            return [true, pairs];
          }

          throw new NullArgError(name);
        }
        case 'alias': {
          const { target } = entry as t.AliasEntry;
          const targetEntry: t.ConfigEntry = this.configs[target];
          const targetType: t.OptionType = targetEntry.type;

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
                const { default: value } = targetEntry as t.TextEntry;
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
                validateNumber(value);
                pairs[target] = Number(value);
                return [false, pairs];
              } else if (Object.hasOwn(targetEntry, 'default')) {
                const { default: value } = targetEntry as t.TextEntry;
                validateNumber(value!);
                pairs[target] = Number(value);
                return [false, pairs];
              } else if (value != null) {
                validateNumber(value);
                pairs[target] = Number(value);
                return [true, pairs];
              }

              throw new NullIntError(name, target);
            }
            case 'count': {
              const oldValue = pairs[target] as number ?? 0;
              pairs[target] = oldValue + 1;
              break;
            }
            case 'list': {
              if (i < n - 1) {
                value = arg.slice(i + 1, n);
                const { sep } = targetEntry as t.ListEntry;
                pairs[target] = value.split(sep ?? ',');
                return [false, pairs];
              } else if (value === '') {
                pairs[target] = [];
                return [true, pairs];
              } else if (value != null) {
                const { sep } = targetEntry as t.ListEntry;
                pairs[target] = value.split(sep ?? ',');
                return [true, pairs];
              }

              throw new NullArgError(name, target);
            }
            default: {
              throw new Error(`type ${targetType} is not supported`);
            }
          }
          break;
        }
        default: {
          throw new Error(`type ${tag} is not supported`);
        }
      }
    }

    return [false, pairs];
  }
}
