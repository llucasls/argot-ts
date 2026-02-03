export type OptionType =
  | 'flag'
  | 'text'
  | 'int'
  | 'count'
  | 'list'
  | 'alias';

export type ConfigEntry = (
  | { type: 'flag' }
  | { type: 'text'; default?: string }
  | { type: 'int'; default?: number }
  | { type: 'count' }
  | { type: 'list'; sep?: string }
  | { type: 'alias'; target: string }
);

export type LabeledEntry = { option: string } & ConfigEntry;

export type OptionValue =
  | boolean
  | string
  | number
  | string[];

export type FlagEntry = Extract<ConfigEntry, { type: 'flag' }>;
export type TextEntry = Extract<ConfigEntry, { type: 'text' }>;
export type IntEntry = Extract<ConfigEntry, { type: 'int' }>;
export type CountEntry = Extract<ConfigEntry, { type: 'count' }>;
export type ListEntry = Extract<ConfigEntry, { type: 'list' }>;
export type AliasEntry = Extract<ConfigEntry, { type: 'alias' }>;
