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
import { CommandBuilder, CommanderCommandBuilder } from './command_builder'
import { makeArray } from '@salto-io/lowerdash/dist/src/collections/array'

const { promiseWithState } = promises.state

const createOptionString = (name: string, alias?: string): string =>
  alias === undefined ? name : `-${alias}, ${name}`

// TODO: Handle aliases + requiredOptions + types of options
const registerBuilder = (
  commanderProgram: commander.Command, { options, build }: CommanderCommandBuilder
  ): Promise<CommandBuilder> =>
    new Promise<CommandBuilder>(resolved => {
      const command = new commander.Command(options.command)

      command
        .description(options.description)
      
      makeArray(Object.values(options?.options ?? {})).forEach(option => {
        command
          .option(createOptionString(option.name, option.alias), option.description)
      })
      command.action(() => resolved(build))
      commanderProgram.addCommand(command)
    })

// const registerBuilderOld = (
//   yargsParser: yargs.Argv, { yargsModule, build }: YargsCommandBuilder
// ): Promise<CommandBuilder> =>
//   new Promise<CommandBuilder>(resolved => yargsParser.command({
//     ...yargsModule,
//     handler: () => resolved(build),
//   }))

export const registerBuilders = (
  commanderProgram: commander.Command, allBuilders: CommanderCommandBuilder[] = builders
): promises.state.PromiseWithState<CommandBuilder> =>
  promiseWithState(Promise.race(allBuilders.map(builder => registerBuilder(commanderProgram, builder))))

// export const registerBuildersOld = (
//   parser: yargs.Argv, allBuilders: YargsCommandBuilder[] = builders
// ): promises.state.PromiseWithState<CommandBuilder> =>
//   promiseWithState(Promise.race(allBuilders.map(builder => registerBuilder(parser, builder))))
