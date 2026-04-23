# Changelog

## v0.3.0-rc.1 -- 2026-04-23
- Added new error types for clearer distinction between runtime and
configuration errors.
- Deprecated `LabeledEntry`; option names should now be defined as object keys
in configuration.

## v0.2.0 -- 2026-02-08
- Added filesystem support for Node.js and Bun runtimes.

## v0.1.0 -- 2026-02-04
- Implemented `argot-cli`, a command-line interface argument parser in
TypeScript. As of its first publication, it is only compatible with Deno.
