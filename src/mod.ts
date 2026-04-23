/**
 * Argot CLI argument parser.
 *
 * This module provides a schema-based command-line argument parser.
 * The parser processes an array of strings and produces a structured
 * result containing options, parameters, and operands.
 *
 * Parsing behavior is fully determined by a configuration object.
 *
 * Example:
 *
 * ```typescript
 * import { ArgParser, ParserConfig } from '@argot-cli/argot';
 *
 * const config = new ParserConfig({
 *   verbose: { type: 'flag' },
 *   count: { type: 'int' },
 *   name: { type: 'text', default: 'world' },
 * });
 *
 * const parser = new ArgParser(config);
 *
 * const result = parser.parse([
 *   '--verbose',
 *   '--count=3',
 *   'mode=fast',
 *   'file.txt',
 * ]);
 *
 * console.log(result.options.get('verbose')); // true
 * console.log(result.options.get('count'));   // 3
 * console.log(result.options.get('name'));    // "world"
 *
 * console.log(result.parameters.get('mode')); // "fast"
 *
 * console.log(result.operands); // ["file.txt"]
 * ```
 * @module
 */
export { ArgParser } from './arg_parser.ts';
export { ParserConfig } from './parser_config.ts';
export { readJSONConfig, readTOMLConfig } from './read_config.ts';
export type { ConfigEntry, LabeledEntry } from './types.ts';
