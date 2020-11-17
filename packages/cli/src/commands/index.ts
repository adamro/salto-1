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
import { CommandOrGroupDef } from '../command_builder'
import fetchBuilder from './fetch'
import { CommanderArgs, CliExitCode } from '../types'
// import deployBuilder from './deploy'
// import initBuilder from './init'
// import servicesBuilder from './service'
// import envsBuilder from './env'
// import restoreBuilder from './restore'
// import elementBuilder from './element'
// import diffBuilder from './diff'
// import cleanBuilder from './clean'

const t1 = {
  options: {
    name: 'try1',
    description: 'try subComm',
    options: {
      force: {
        name: 'force',
        alias: 'f',
        description: 'Accept all incoming changes, even if there\'s a conflict with local changes',
        },
      },
    },
    async build(input: CommanderArgs) {
      return ({
        async execute(): Promise<CliExitCode> {
          console.log(input.force)
          return CliExitCode.AppError
        },
      })
  }
}

const t3 =   {
  options: {
  name: 'try3',
  description: 'try subComm',
  options: {
    force: {
      name: 'force',
      alias: 'f',
      description: 'Accept all incoming changes, even if there\'s a conflict with local changes',
      },
    },
  },
  async build(input: CommanderArgs) {
    return ({
      async execute(): Promise<CliExitCode> {
        console.log(input.force)
        return CliExitCode.AppError
      },
    })
  }
}

const t2 = {
  options: {
    name: 'try2',
    description: 'try subComm'
  },
  subCommands: [
    t3,
  ],
}

const tryBuilder = {
  options: {
    name: 'try',
    description: 'try subComm'
  },
  subCommands: [
    t1,
    t2,
  ],
}


export default [
  fetchBuilder,
  tryBuilder,
] as unknown as CommandOrGroupDef[]

// The order of the builders determines order of appearance in help text
// export default [
  // initBuilder,
  // fetchBuilder,
  // deployBuilder,
  // restoreBuilder,
  // servicesBuilder,
  // envsBuilder,
  // elementBuilder,
  // diffBuilder,
  // cleanBuilder,
// ] as CommanderCommandBuilder[]
