# ArgotCLI

**A language-independent command-line argument parsing specification and its
implementations.**

ArgotCLI aims to make command-line argument parsing consistent across
programming languages. It defines a configuration model for describing options
and parsing arguments, allowing implementations in different languages to
follow the same general conventions.

The project prioritizes a simple, explicit configuration model over language-
specific abstractions or a large collection of parser features.

> **Development status:** ArgotCLI is pre-1.0.0. The specification and its
> implementations are still evolving, and compatibility between implementations
> is not yet guaranteed.

## Goals

- **Language independence:** Define a common configuration model that can be
implemented in different programming languages.
- **Explicit configuration:** Describe supported options and their types
instead of relying on implicit conventions.
- **Predictable parsing:** Keep argument classification and value assignment
rules consistent.
- **Minimal dependencies:** Keep implementations lightweight and avoid
unnecessary runtime dependencies.
- **Interoperability:** Allow applications written in different languages to
use the same general argument-parsing conventions.

## Concepts

ArgotCLI distinguishes three categories of input:

- **Options** — explicitly configured command-line options, such as flags and
options that accept values.
- **Parameters** — named values written using the `name=value` syntax.
- **Operands** — positional arguments that do not belong to either of the other
categories.

This distinction lets applications handle command-line input without conflating
named parameters, declared options, and positional arguments.

### Option types

The configuration model supports the following option types:

| Type    | Purpose                              |
|---------|--------------------------------------|
| `flag`  | Represents the presence of an option |
| `text`  | Accepts a text value                 |
| `int`   | Accepts an integer value             |
| `float` | Accepts a floating-point value       |
| `count` | Counts occurrences of an option      |
| `list`  | Collects multiple values             |
| `alias` | Refers to another configured option  |

The exact value representations and language-specific types are documented by
each implementation.

## TypeScript example

The following example demonstrates the TypeScript API.

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

The parser returns an object containing `options`, `parameters`, and
`operands`. Returned results are intended to be immutable.

For installation and TypeScript-specific usage, see the
[npm package documentation](https://www.npmjs.com/package/argot-cli).

## Specification

The specification defines the shared configuration model and parsing rules
independently of any particular programming language.

It is intended to guide implementations toward consistent behavior while
allowing them to use idiomatic language-specific types and APIs.

The specification is still under development. The current implementations
should therefore be treated as evolving implementations rather than finalized,
strictly conforming releases.

## Development

Clone the repository and navigate to the implementation you want to work on.
Each implementation may have its own dependencies, build process, and test
commands.

For the TypeScript implementation, install the dependencies with npm:

```sh
npm install
```

Run the tests:

```sh
npm test
```

Run the coverage report:

```sh
npm run coverage
```

Consult the relevant package configuration for additional build and development
scripts.

## Contributing

Contributions, bug reports, and suggestions are welcome.

When contributing, consider whether a change affects only one implementation or
changes the shared behavior expected across implementations. Changes to shared
parsing rules should be considered alongside their implications for the
specification and other languages.

## License

ISC
