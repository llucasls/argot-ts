# Changelog

## v0.4.0 -- 2026-10-15

- Added `float` option type.
- Added support for GNU-style long option syntax (`--name value`).
- Added `ArgParser.slice()` for splitting argument lists while preserving
  parser semantics.
- Changed the parser configuration format. Options must now be defined in the
  `options` object. Global parser options are now supported, and labeled
  entries have been removed.
- Added aggregate configuration validation errors (`aggregateErrors`).
- Added the option to ignore unknown options (`allowUnknown`).
- Added the option to treat parameter assignments as regular operands
  (`parseParameters`).
- Removed support for TOML configuration format.

## v0.3.1 -- 2026-10-15

- Updated documentation to direct users to the npm package.

## v0.3.0 -- 2026-04-23
- Added new error types for clearer distinction between runtime and
  configuration errors.
- Deprecated `LabeledEntry`; option names should now be defined as object keys
  in configuration.

## v0.2.0 -- 2026-02-08
- Added filesystem support for Node.js and Bun runtimes.

## v0.1.0 -- 2026-02-04
- Implemented `argot-cli`, a command-line interface argument parser in
  TypeScript. As of its first publication, it is only compatible with Deno.
