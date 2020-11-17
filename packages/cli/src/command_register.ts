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
import _ from 'lodash'
import commander from 'commander'
import { promises } from '@salto-io/lowerdash'
import builders from './commands/index'
import { PositionalOption, CommandOrGroupDef, isCommand, CommandDef, CommandsGroupDef } from './command_builder'
import { makeArray } from '@salto-io/lowerdash/dist/src/collections/array'
import { CliCommand } from './types'

const { promiseWithState } = promises.state

const createOptionString = (name: string, alias?: string): string =>
  alias === undefined ? name : `-${alias}, --${name}`

const commandStr = (name: string, positionals?: PositionalOption[]): string =>
  (`${name} ${makeArray(positionals).map(positional => positional.required ? `<${positional.name}>` : `[${positional.name}]`).join(' ')}`)

// TODO: Handle aliases + requiredOptions + types of options
const registerCommand = (
  resolved: (val: CliCommand | PromiseLike<CliCommand> | undefined) => void,
  parentCommand: commander.Command,
  commandDef: CommandDef
): void => {
  const { options, build } = commandDef
  const command = new commander.Command()
    .passCommandToAction(false)
    .command(commandStr(options.name, makeArray(Object.values(options.positionals ?? {}))))
  command
    .description(options.description)
  makeArray(Object.values(options?.positionals ?? {})).forEach(positional => {
    if (positional.required) {
      command
        .requiredOption(positional.name, positional.description, positional.default)
    } else {
      command
        .option(positional.name, positional.description, positional.default)
    }
  })
  makeArray(Object.values(options?.options ?? {})).forEach(option => {
    command
      .option(createOptionString(option.name, option.alias), option.description, option.default)
  })
  command.action(
    (...options) => {
    console.log('%o', options)
    // TODO: Add the positionals
    const a = {
      ...options.pop(),
    }
    return resolved(build(a))
  })
  parentCommand.addCommand(command)
}

const registerGroup = (
  resolved: (val: CliCommand | PromiseLike<CliCommand> | undefined) => void,
  parentCommand: commander.Command,
  containerDef: CommandsGroupDef
): void => {
  const { options, subCommands } = containerDef
  const groupCommand = new commander.Command()
    // TODO: Add the command names as positionals
    .command(commandStr(options.name))
  subCommands.forEach(subCommand => {
    registerCommandOrGroup(resolved, groupCommand, subCommand)
  })
  parentCommand.addCommand(groupCommand)
}

const registerCommandOrGroup = (
  resolved: (val: CliCommand | PromiseLike<CliCommand> | undefined) => void,
  parentCommand: commander.Command,
  commandOrGroupDef: CommandOrGroupDef
): void => {
  if (isCommand(commandOrGroupDef)) {
    registerCommand(resolved, parentCommand, commandOrGroupDef)
  } else {
    registerGroup(resolved, parentCommand, commandOrGroupDef)
  }
}

const buildCliCommand = 
  (mainCommand: commander.Command,  commandDefinition: CommandOrGroupDef): Promise<CliCommand> => 
    new Promise<CliCommand>(resolved => (registerCommandOrGroup(resolved, mainCommand, commandDefinition)))

export const registerBuilders = (
  commanderProgram: commander.Command, allBuilders: CommandOrGroupDef[] = builders
): promises.state.PromiseWithState<CliCommand> =>
  promiseWithState(Promise.race(allBuilders.map(builder => buildCliCommand(commanderProgram, builder))))
