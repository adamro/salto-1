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
import { EOL } from 'os'
// import yargonaut from 'yargonaut' // this must appear before the import from yargs
// import yargs from 'yargs/yargs'
import commander from 'commander'
// import { Arguments } from 'yargs'
// import { streams } from '@salto-io/lowerdash'
// import chalk from 'chalk'
import { CommanderRawArgs, WriteStream } from './types'
import { CommandBuilder, CommanderCommandBuilder } from './command_builder'
import { registerBuilders } from './command_register'
import { versionString } from './version'
import * as fonts from './fonts'

const LOGO_TEXT = '\u00B0 salto' // \u00B0 is for the salto 'dot'
const LOGO_FONT = fonts.Font.Standard
// const MAX_WIDTH = 100
// const DO_NOT_SHOW = '***<><><>DO NOT SHOW THIS ERROR<><><>***'
// const USAGE_PREFIX = 'Usage: '
export const ERROR_STYLE = 'red.bold'

const writeLogo = (outStream: WriteStream): void => {
  outStream.write(fonts.renderSync(LOGO_FONT, LOGO_TEXT))
  outStream.write(EOL)
}

// const getUsagePrefix = (outStream: WriteStream): string =>
//   (streams.hasColors(outStream) ? chalk.bold(USAGE_PREFIX) : USAGE_PREFIX)

// const showHelpMessage = (parser: Argv, outStream: WriteStream): void => {
//   // Pending PR: https://github.com/yargs/yargs/pull/1386
//   // @ts-ignore TS2345
//   parser.showHelp((s: string) => {
//     outStream.write(getUsagePrefix(outStream))
//     outStream.write(s)
//     outStream.write(EOL)
//   })
// }

const onNoArgs = (program: commander.Command, outStream: WriteStream): void => {
  outStream.write('HEREEEEE')
  if (outStream.isTTY) {
    writeLogo(outStream)
  }
  program.outputHelp((s: string) => {
    //outStream.write(s)
    //outStream.write(EOL)
    return s
  })
  outStream.write(EOL)
}

const createCommanderProgram = ():
  commander.Command => {
    const program = new commander.Command('salto')
      .version(`${versionString}\n`)
    return program
}

export type ParseResult =
  { status: 'command'; parsedArgs: CommanderRawArgs, builder: CommandBuilder} |
  { status: 'error' } |
  { status: 'help' } |
  { status: 'empty' }

const parse = (
  commandBuilders: CommanderCommandBuilder[],
  { args }: { args: string[] },
  { stdout, stderr }: { stdout: WriteStream; stderr: WriteStream },
): Promise<ParseResult> => new Promise<ParseResult>(async (resolve, reject) => {
  // const parser = createYargsParser(stdout, stderr)
  const program = createCommanderProgram()
  const commandSelected = registerBuilders(program, commandBuilders)
  try {
    await program.parseAsync(args, { from: 'user' })
    if (_.isEmpty(program.rawArgs)) {
      stdout.write('EMPTY EMPTY ME+TLTYFDSFDS')
      onNoArgs(program, stderr)
      resolve({ status: 'error' })
      return
    }
    // Handle empty args (spaces)
    setTimeout(() => {
      if (commandSelected.done) {
        commandSelected.then(builder => resolve({
          status: 'command',
          parsedArgs: program.rawArgs as CommanderRawArgs,
          builder,
        }))
      }
    }, 0)
  } catch (error) {
    stderr.write('here?')
    // Need to see if this makes sense
    resolve({ status: 'error'})
    reject(error)
  }
})

export default parse
