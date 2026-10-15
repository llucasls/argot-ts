# ArgotCLI

ArgotCLI is a command-line argument parser designed around a simple, language-
independent configuration model. It separates command-line options, parameters,
and operands, providing a consistent approach to argument parsing across
programming languages.

This package provides the TypeScript implementation of ArgotCLI.

## Installation

```sh
npm install argot-cli
```

## Usage

```typescript
import assert from 'node:assert/strict';
import { ParserConfig, ArgParser } from 'argot-cli';

const configs = new ParserConfig({
  options: {
    a: { type: 'flag' },
    o: { type: 'text' },
    jobs: { type: 'int' },
    j: { type: 'alias', target: 'jobs' }
  }
});

const parser = new ArgParser(configs);

const result = parser.parse(['name=John', '-j4', '-o', 'report.log', 'start']);
assert.equal(result.operands[0], 'start');
assert.equal(result.options.get('o'), 'report.log');
assert.equal(result.options.get('jobs'), 4);
assert.equal(result.parameters.get('name'), 'John');
```

### Argument categories

ArgotCLI distinguishes three categories of command-line input:

- **Options** represent explicitly declared arguments, such as flags and
options that accept values.
- **Parameters** use the `name=value` syntax to associate a name with a string
value.
- **Operands** are positional arguments that do not belong to the other
categories.

### Option types

Options are declared in the `options` configuration object. Supported types
include:

- `flag` — a boolean-style option.
- `text` — an option that accepts a text value.
- `int` — an option that accepts an integer.
- `float` — an option that accepts a floating-point number.
- `count` — a counter option.
- `list` — an option that collects values.
- `alias` — an alias for another option.

An alias refers to its target option, allowing multiple option names to share
the same behavior.

## Runtime compatibility

The package is distributed through npm and is intended for use in JavaScript
runtimes that support its generated JavaScript and module format. Node.js is
supported.

## License

ISC
