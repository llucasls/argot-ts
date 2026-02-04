export type OptionType =
  | 'flag'
  | 'text'
  | 'int'
  | 'count'
  | 'list'
  | 'alias';

export type FlagEntry = { type: 'flag' };
export type TextEntry = { type: 'text'; default?: string };
export type IntEntry = { type: 'int'; default?: number };
export type CountEntry = { type: 'count' };
export type ListEntry = { type: 'list'; sep?: string };
export type AliasEntry = { type: 'alias'; target: string };

export type ConfigEntry = (
  | FlagEntry
  | TextEntry
  | IntEntry
  | CountEntry
  | ListEntry
  | AliasEntry
);

export type LabeledEntry = { option: string } & ConfigEntry;

export type OptionValue =
  | boolean
  | string
  | number
  | string[];
