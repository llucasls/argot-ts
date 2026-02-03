export class InvalidIntError extends Error {}

export class NullArgError extends Error {
  constructor(name: string, target?: string) {
    const msg = target
      ? `option '${name}' (alias for '${target}') must take an argument`
      : `option '${name}' must take an argument`;
    super(msg);
  }
}

export class NullIntError extends Error {
  constructor(name: string, target?: string) {
    const msg = target
      ? `option '${name}' (alias for '${target}') requires a numeric argument`
      : `option '${name}' requires a numeric argument`;
    super(msg);
  }
}
