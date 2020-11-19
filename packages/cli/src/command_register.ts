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
import { promises, collections } from '@salto-io/lowerdash'
import builders from './commands/index'
import { PositionalOption, CommandOrGroupDef, isCommand, CommandDef, CommandsGroupDef, OptionType } from './command_builder'
import { CliCommand } from './types'

const { makeArray } = collections.array
const { promiseWithState } = promises.state

const LIST_SUFFIX = '...'

const wrapWithRequired = (innerStr: string): string =>
  (`<${innerStr}>`)

const wrapWithOptional = (innerStr: string): string =>
  (`[${innerStr}]`)

const createOptionString = (name: string, type: OptionType, alias?: string): string => {
  const aliasAndName = alias ? `-${alias}, --${name}` : `--${name}`
  const varDef = (type === OptionType.boolean)
    ? ''
    // Keyed string/stringList options are always wrapped with <> because [] is a way to define it can also be a boolean
    : (wrapWithRequired(type === OptionType.stringsList ? `${name}${LIST_SUFFIX}` : `${name}`))
  return `${aliasAndName} ${varDef}`
}

const positionalsStr = (positionals: PositionalOption[]): string => {
  return positionals.map(positional => {
    const innerStr = positional.list ? `${positional.name}${LIST_SUFFIX}` : positional.name
    return positional.required ? wrapWithRequired(`${innerStr}`) : wrapWithOptional(`${innerStr}`)
  }).join(' ')
}

const addOption = (
  command: commander.Command,
  optionStr: string,
  required: boolean,
  description?: string,
  defaultVal?: boolean | string
): void => {
  if (required) {
    command.requiredOption(optionStr, description, defaultVal)
  } else {
    command.option(optionStr, description, defaultVal)
  }
}

const createPositionalsMapping = (
  positionals: PositionalOption[],
  values: (string | string[] | undefined)[]
): Record<string, string | string[] | undefined> => {
  const positionalsNames = positionals.map(p => p.name)
  return Object.fromEntries(
    _.zip(positionalsNames, values)
  )
}

// TODO: Handle aliases + requiredOptions + types of options
const registerCommand = <T>(
  resolved: (val: CliCommand | PromiseLike<CliCommand> | undefined) => void,
  parentCommand: commander.Command,
  commandDef: CommandDef<T>
): void => {
  const { properties, build } = commandDef
  const positionals = properties.positionals ?? []
  const command = new commander.Command()
    .passCommandToAction(false)
    .command(`${properties.name} ${positionalsStr(positionals)}`)
  command.description(properties.description)
  makeArray(positionals).forEach(positional => {
    // Positionals are added as non-required Options because for positionals
    // requireness derives from <> or [] in the command and not option definition
    addOption(command, positional.name, false, positional.description, positional.default)
  })
  makeArray(properties.options ?? []).forEach(option => {
    const optionDefStr = createOptionString(option.name, option.type, option.alias)
    addOption(command, optionDefStr, option.required, option.description, option.default)
  })
  command.action(
    (...options) => {
    console.log('%o', options)
    const indexOfKeyedOptions = options.findIndex(o => _.isPlainObject(o))
    const positionalValues = options.slice(0, indexOfKeyedOptions)
    const args = {
      ...options[indexOfKeyedOptions],
      ...createPositionalsMapping(positionals, positionalValues)
    }
    return resolved(build(args))
  })
  parentCommand.addCommand(command)
}

const registerGroup = (
  resolved: (val: CliCommand | PromiseLike<CliCommand> | undefined) => void,
  parentCommand: commander.Command,
  containerDef: CommandsGroupDef
): void => {
  const { properties: options, subCommands } = containerDef
  const groupCommand = new commander.Command()
    .command(`${options.name}`)
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
