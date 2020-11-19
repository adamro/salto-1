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
import { CommanderArgs, CliCommand } from './types'

export type CommandOrGroupDef = CommandsGroupDef | CommandDef<never>

export interface CommandsGroupDef {
  properties: BasicCommandProperties
  subCommands: CommandOrGroupDef[]
}

export type CommandDef<T> = {
  properties: CommandOptions
  build: (
    input: CommanderArgs<T>,
  ) => Promise<CliCommand>
}

export const isCommand = (c: CommandOrGroupDef): c is CommandDef<never> =>
  (c !== undefined && Object.keys(c).includes('build'))

export interface BasicCommandProperties {
  name: string
  description: string
  aliases?: string[]
}

export interface CommandOptions extends BasicCommandProperties {
  options?: KeyedOption[]
  positionals?: PositionalOption[]
}

export enum OptionType {
  boolean,
  string,
  stringsList,
}

export type PositionalOption = {
  name: string
  required: boolean
  description?: string
  list?: true
  default?: string
}

export type KeyedOption = {
  name: string
  required: boolean
  description?: string
  alias?: string
} & ({
  type: OptionType.boolean
  default?: boolean
} | { 
  type: OptionType.string
  default?: string
} | { 
  type: OptionType.stringsList
  default?: string // TODO: Check this
})

export const createCommandDef = <T>(def: CommandDef<T>): CommandDef<T> => def
export const createCommandGroupDef = (def: CommandsGroupDef): CommandsGroupDef => def

