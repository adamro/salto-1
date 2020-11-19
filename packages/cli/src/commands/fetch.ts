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
import wu from 'wu'
import { getChangeElement, isInstanceElement } from '@salto-io/adapter-api'
import { fetch as apiFetch, FetchFunc, FetchChange, FetchProgressEvents, StepEmitter, Telemetry, PlanItem, CommandConfig } from '@salto-io/core'
import { Workspace, nacl, StateRecency } from '@salto-io/workspace'
import { promises } from '@salto-io/lowerdash'
import { EventEmitter } from 'pietile-eventemitter'
import { logger } from '@salto-io/logging'
import { progressOutputer, outputLine, errorOutputLine } from '../outputer'
// import { environmentFilter } from '../filters/env'
import { OptionType, createCommandDef } from '../command_builder'
import {
  CliCommand, CliOutput,
  CliExitCode, SpinnerCreator, CliTelemetry, CommanderArgs,
} from '../types'
import {
  formatChangesSummary, formatMergeErrors, formatFatalFetchError, formatFetchHeader,
  formatFetchFinish, formatStateChanges,
} from '../formatter'
import {
  getApprovedChanges as cliGetApprovedChanges,
  shouldUpdateConfig as cliShouldUpdateConfig,
  getChangeToAlignAction,
} from '../callbacks'
import {
  loadWorkspace, getWorkspaceTelemetryTags, updateStateOnly, applyChangesToWorkspace,
} from '../workspace/workspace'
import Prompts from '../prompts'
// import { ServicesArgs } from '../filters/service'
import { getCliTelemetry } from '../telemetry'
import { FetchModeArgs, getUpdateMode, fetchModeOptions, } from './commons/fetch_mode'
// import { EnvironmentArgs } from './env'

const log = logger(module)
const { series } = promises.array

type ApproveChangesFunc = (
  changes: ReadonlyArray<FetchChange>,
  interactive: boolean
) => Promise<ReadonlyArray<FetchChange>>

type ShouldUpdateConfigFunc = (
  { stdout }: CliOutput,
  introMessage: string,
  change: PlanItem
) => Promise<boolean>


export type FetchCommandArgs = {
  workspace: Workspace
  force: boolean
  interactive: boolean
  mode: nacl.RoutingMode
  cliTelemetry: CliTelemetry
  output: CliOutput
  fetch: FetchFunc
  getApprovedChanges: ApproveChangesFunc
  shouldUpdateConfig: ShouldUpdateConfigFunc
  shouldCalcTotalSize: boolean
  stateOnly: boolean
  inputServices?: string[]
}

export const fetchCommand = async (
  {
    workspace, force, interactive, mode,
    getApprovedChanges, shouldUpdateConfig, inputServices,
    cliTelemetry, output, fetch, shouldCalcTotalSize,
    stateOnly,
  }: FetchCommandArgs): Promise<CliExitCode> => {
  const bindedOutputline = (text: string): void => outputLine(text, output)
  const workspaceTags = await getWorkspaceTelemetryTags(workspace)
  cliTelemetry.start(workspaceTags)
  const fetchProgress = new EventEmitter<FetchProgressEvents>()
  fetchProgress.on('adaptersDidInitialize', () => {
    bindedOutputline(formatFetchHeader())
  })

  fetchProgress.on('stateWillBeUpdated', (
    progress: StepEmitter,
    numOfChanges: number
  ) => progressOutputer(
    formatStateChanges(numOfChanges),
    Prompts.STATE_ONLY_UPDATE_END,
    Prompts.STATE_ONLY_UPDATE_FAILED(numOfChanges),
    output
  )(progress))

  fetchProgress.on('changesWillBeFetched', (progress: StepEmitter, adapters: string[]) => progressOutputer(
    Prompts.FETCH_GET_CHANGES_START(adapters),
    Prompts.FETCH_GET_CHANGES_FINISH(adapters),
    Prompts.FETCH_GET_CHANGES_FAIL,
    output
  )(progress))

  fetchProgress.on('diffWillBeCalculated', progressOutputer(
    Prompts.FETCH_CALC_DIFF_START,
    Prompts.FETCH_CALC_DIFF_FINISH,
    Prompts.FETCH_CALC_DIFF_FAIL,
    output
  ))
  fetchProgress.on('workspaceWillBeUpdated', (progress: StepEmitter, changes: number, approved: number) =>
    progressOutputer(
      formatChangesSummary(changes, approved),
      Prompts.FETCH_UPDATE_WORKSPACE_SUCCESS,
      Prompts.FETCH_UPDATE_WORKSPACE_FAIL,
      output
    )(progress))

  const applyChangesToState = async (allChanges: readonly FetchChange[]): Promise<boolean> => {
    const updatingStateEmitter = new StepEmitter()
    fetchProgress.emit('stateWillBeUpdated', updatingStateEmitter, allChanges.length)
    const success = await updateStateOnly(workspace, allChanges)
    if (success) {
      updatingStateEmitter.emit('completed')
      return true
    }
    updatingStateEmitter.emit('failed')
    return false
  }
  if (stateOnly && mode !== 'default') {
    throw new Error('The state only flag can only be used in default mode')
  }
  const fetchResult = await fetch(
    workspace,
    fetchProgress,
    inputServices,
  )
  if (fetchResult.success === false) {
    errorOutputLine(formatFatalFetchError(fetchResult.mergeErrors), output)
    cliTelemetry.failure(workspaceTags)
    return CliExitCode.AppError
  }

  // A few merge errors might have occurred,
  // but since it's fetch flow, we omitted the elements
  // and only print the merge errors
  if (!_.isEmpty(fetchResult.mergeErrors)) {
    log.debug(`fetch had ${fetchResult.mergeErrors.length} merge errors`)
    cliTelemetry.mergeErrors(fetchResult.mergeErrors.length, workspaceTags)
    errorOutputLine(formatMergeErrors(fetchResult.mergeErrors), output)
  }

  if (!_.isUndefined(fetchResult.configChanges)) {
    const abortRequests = await series(
      wu(fetchResult.configChanges.itemsByEvalOrder()).map(planItem => async () => {
        const [change] = planItem.changes()
        const newConfig = getChangeElement(change)
        const adapterName = newConfig.elemID.adapter
        if (!isInstanceElement(newConfig)) {
          log.error('Got non instance config from adapter %s - %o', adapterName, newConfig)
          return false
        }
        const shouldWriteToConfig = force || await shouldUpdateConfig(
          output,
          fetchResult.adapterNameToConfigMessage?.[adapterName] || '',
          planItem,
        )
        if (shouldWriteToConfig) {
          await workspace.updateServiceConfig(adapterName, newConfig)
        }
        return !shouldWriteToConfig
      })
    )

    if (_.some(abortRequests)) {
      return CliExitCode.UserInputError
    }
  }

  // Unpack changes to array so we can iterate on them more than once
  const changes = [...fetchResult.changes]
  cliTelemetry.changes(changes.length, workspaceTags)

  const updatingWsSucceeded = stateOnly
    ? await applyChangesToState(changes)
    : await applyChangesToWorkspace({
      workspace,
      cliTelemetry,
      workspaceTags,
      interactive,
      force,
      shouldCalcTotalSize,
      output,
      changes,
      mode,
      approveChangesCallback: getApprovedChanges,
      applyProgress: fetchProgress,
    })
  if (updatingWsSucceeded) {
    bindedOutputline(formatFetchFinish())
    cliTelemetry.success(workspaceTags)
    return CliExitCode.Success
  }
  cliTelemetry.failure(workspaceTags)
  return CliExitCode.AppError
}

const shouldRecommendAlignMode = async (
  workspace: Workspace,
  stateRecencies: StateRecency[],
  inputServices?: string[],
): Promise<boolean> => {
  const newlyAddedServices = stateRecencies
    .filter(recency => (
      inputServices === undefined
      || inputServices.includes(recency.serviceName)
    ))

  return (
    newlyAddedServices.every(recency => recency.status === 'Nonexistent')
    && workspace.hasElementsInServices(newlyAddedServices.map(recency => recency.serviceName))
  )
}

export const commandblah = (): CliCommand => (
  {
    async execute(): Promise<CliExitCode> {
      return CliExitCode.AppError
    }
  }
)

export const command = (
  workspaceDir: string,
  force: boolean,
  interactive: boolean,
  mode: nacl.RoutingMode,
  inputServices?: string[],
  inputEnvironment?: string,
  stateOnly = false,
): CliCommand => ({
  async execute(
    telemetry: Telemetry,
    config: CommandConfig,
    output: CliOutput,
    spinnerCreator: SpinnerCreator
  ): Promise<CliExitCode> {
    output.stdout.write(`GOT HERE`)
    console.log(`running fetch command on '${workspaceDir}' [force=${force}, interactive=${
      interactive}, mode=${mode}], environment=${inputEnvironment}, services=${inputServices}`)
    log.debug(`running fetch command on '${workspaceDir}' [force=${force}, interactive=${
      interactive}, mode=${mode}], environment=${inputEnvironment}, services=${inputServices}`)
    const { shouldCalcTotalSize } = config
    const cliTelemetry = getCliTelemetry(telemetry, 'fetch')
    const { workspace, errored, stateRecencies } = await loadWorkspace(workspaceDir, output,
      { force, printStateRecency: true, spinnerCreator, sessionEnv: inputEnvironment })
    if (errored) {
      cliTelemetry.failure()
      return CliExitCode.AppError
    }

    let useAlignMode = false
    if (!force && mode !== 'align' && await shouldRecommendAlignMode(workspace, stateRecencies, inputServices)) {
      const userChoice = await getChangeToAlignAction(mode, output)
      if (userChoice === 'cancel operation') {
        log.info('Canceling operation based on user input')
        return CliExitCode.UserInputError
      }
      if (userChoice === 'yes') {
        log.info(`Changing fetch mode from '${mode}' to 'align' based on user input`)
        useAlignMode = true
      }
      log.info('Not changing fetch mode based on user input')
    }

    return fetchCommand({
      workspace,
      force,
      interactive,
      cliTelemetry,
      output,
      fetch: apiFetch,
      getApprovedChanges: cliGetApprovedChanges,
      shouldUpdateConfig: cliShouldUpdateConfig,
      inputServices,
      mode: useAlignMode ? 'align' : mode,
      shouldCalcTotalSize,
      stateOnly,
    })
  },
})

type FetchArgs = {
  force: boolean
  interactive: boolean
  stateOnly: boolean
  services: string[]
  env: string
} & FetchModeArgs

const fetchDef = createCommandDef({
  properties: {
    name: 'fetch',
    description: 'Syncs this workspace with the services\' current state',
    options: [
      {
        name: 'force',
        alias: 'f',
        required: false,
        description: 'Accept all incoming changes, even if there\'s a conflict with local changes',
        type: OptionType.boolean,
      },
      {
        name: 'interactive',
        alias: 'i',
        required: false,
        description: 'Interactively approve every incoming change',
        type: OptionType.boolean,
      },
      {
        name: 'stateOnly',
        alias: 'st',
        required: false,
        description: 'Fetch remote changes to the state file without mofifying the NaCL files.',
        type: OptionType.boolean,
      },
      {
        name: 'services',
        alias: 's',
        required: false,
        description: 'Specific services to perform this action for (default=all)',
        type: OptionType.stringsList,
      },
      {
        name: 'env',
        alias: 'e',
        required: false,
        description: 'The name of the environment to use',
        type: OptionType.string,
      },
      ...fetchModeOptions,
    ],
    positionals: [
      {
        name: 'mode',
        required: false,
        list: true
      }
    ]
  },

  async build(input: CommanderArgs<FetchArgs>) {
    const mode = getUpdateMode(input.isolated, input.override, input.align)
    return command(
      '.',
      input.force,
      input.interactive,
      mode,
      input.services,
      input.env,
      input.stateOnly,
    )
  },
})

export default fetchDef
