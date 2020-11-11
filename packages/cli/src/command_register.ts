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
// import yargs from 'yargs'
import commander from 'commander'
import { promises } from '@salto-io/lowerdash'
import builders from './commands/index'
import { CommandBuilder, CommanderCommandBuilder, CPositionalOption } from './command_builder'
import { makeArray } from '@salto-io/lowerdash/dist/src/collections/array'

const { promiseWithState } = promises.state

const createOptionString = (name: string, alias?: string): string =>
  alias === undefined ? name : `-${alias}, --${name}`

const commandStr = (name: string, positionals: CPositionalOption[]): string =>
  (`${name} ${positionals.map(positional => positional.required ? `<${positional.name}>` : `[${positional.name}]`).join(' ')}`)

// TODO: Handle aliases + requiredOptions + types of options
const registerBuilder = (
  commanderProgram: commander.Command, { options, build }: CommanderCommandBuilder
  ): Promise<CommandBuilder> =>
    new Promise<CommandBuilder>(resolved => {
      const command = new commander.Command()
        .command(commandStr(options.command, makeArray(Object.values(options.positionals ?? {}))))

      command
        .description(options.description)
      
      makeArray(Object.values(options?.positionals ?? {})).forEach(positional => {
        command
          .requiredOption(positional.name, positional.description)
      })

      makeArray(Object.values(options?.options ?? {})).forEach(option => {
        command
          .option(createOptionString(option.name, option.alias), option.description)
      })
      command.action(() => resolved(build))
      commanderProgram.addCommand(command)
    })

export const registerBuilders = (
  commanderProgram: commander.Command, allBuilders: CommanderCommandBuilder[] = builders
): promises.state.PromiseWithState<CommandBuilder> =>
  promiseWithState(Promise.race(allBuilders.map(builder => registerBuilder(commanderProgram, builder))))
