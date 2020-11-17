/*
*                      Copyright 2020 Salto Labs Ltd.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with
* the License.  You may obtain a copy of the License at
*
*     http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
// import commander from 'commander'
import { ParsedCliInput, CliCommand } from './types'
// import { Filter } from './filter'

export type CommandBuilder<
  TArgs = {},
  TParsedCliInput extends ParsedCliInput<TArgs> = ParsedCliInput<TArgs>,
  > =
  // Create a CliCommand given a parsed CLI input (output of parser)
  (input: TParsedCliInput) => Promise<CliCommand>

export type CommandOrGroupDef = CommandsGroupDef | CommandDef

export interface CommandsGroupDef {
  options: BasicCommandOptions
  subCommands: CommandOrGroupDef[]
}

export interface CommandDef {
  options: CommandOptions
  build: (
    input: ParsedCliInput,
  ) => Promise<CliCommand>, 
}

export const isCommand = (c: any): c is CommandDef =>
  (c !== undefined && c.build !== undefined)

export interface BasicCommandOptions {
  name: string
  description: string
  aliases?: string[]
}

export interface CommandOptions extends BasicCommandOptions {
  options?: KeyedOptions
  positionals?: PositionalOptions
}

export interface PositionalOption {
  name: string
  required?: boolean
  array?: boolean
  description?: string
  alias?: string
  default?: string | boolean
}

export interface PositionalOptions { [key: string]: PositionalOption }

export interface KeyedOption {
  name: string
  alias?: string
  description?: string
  boolean?: boolean
  required?: boolean
  default?: string | boolean
}

export interface KeyedOptions { [key: string]: KeyedOption }

