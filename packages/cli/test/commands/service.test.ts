// /*
// *                      Copyright 2020 Salto Labs Ltd.
// *
// * Licensed under the Apache License, Version 2.0 (the "License");
// * you may not use this file except in compliance with
// * the License.  You may obtain a copy of the License at
// *
// *     http://www.apache.org/licenses/LICENSE-2.0
// *
// * Unless required by applicable law or agreed to in writing, software
// * distributed under the License is distributed on an "AS IS" BASIS,
// * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// * See the License for the specific language governing permissions and
// * limitations under the License.
// */
// import { AdapterAuthentication } from '@salto-io/adapter-api'
// import {
//   LoginStatus, updateCredentials, loadLocalWorkspace, addAdapter, installAdapter,
// } from '@salto-io/core'
// import { Workspace } from '@salto-io/workspace'
// import { command } from '../../src/commands/service'
// import { processOauthCredentials } from '../../src/cli_oauth_authenticator'
// import * as mocks from '../mocks'

// jest.mock('../../src/cli_oauth_authenticator', () => ({
//   processOauthCredentials: jest.fn().mockResolvedValue({
//     instanceUrl: 'someInstanceUrl',
//     accessToken: 'accessToken',
//   }),
// }))
// jest.mock('@salto-io/core', () => ({
//   ...jest.requireActual('@salto-io/core'),
//   getAdaptersCredentialsTypes: jest.fn().mockImplementation((serviceNames: string[]):
//    Record<string, AdapterAuthentication> => {
//     if (serviceNames[0] === 'noAdapter') {
//       throw new Error('no adapter')
//     }
//     return {
//       newAdapter: mocks.mockCredentialsType('newAdapter'),
//       hubspot: mocks.mockCredentialsType('hubspot'),
//       '': mocks.mockCredentialsType(''),
//       oauthAdapter: mocks.mockOauthCredentialsType('oauthAdapter', { url: '', accessTokenField: '' }),
//     }
//   }),
//   addAdapter: jest.fn().mockImplementation((
//     _workspace: Workspace,
//     adapterName: string
//   ): Promise<AdapterAuthentication> => {
//     if (adapterName === 'noAdapter') {
//       throw new Error('no adapter')
//     }
//     return Promise.resolve(mocks.mockAdapterAuthentication(mocks.mockConfigType(adapterName)))
//   }),
//   updateCredentials: jest.fn().mockResolvedValue(true),
//   getLoginStatuses: jest.fn().mockImplementation((
//     _workspace: Workspace,
//     serviceNames: string[],
//   ) => {
//     const loginStatuses: Record<string, LoginStatus> = {}
//     serviceNames.forEach(serviceName => {
//       if (serviceName === 'salesforce') {
//         loginStatuses[serviceName] = {
//           isLoggedIn: true,
//           configTypeOptions: mocks.mockAdapterAuthentication(mocks.mockConfigType(serviceName)),
//         }
//       } else if (serviceName === 'oauthAdapter') {
//         loginStatuses[serviceName] = {
//           isLoggedIn: true,
//           configTypeOptions: mocks.mockOauthCredentialsType(serviceName, { url: '', accessTokenField: '' }),
//         }
//       } else {
//         loginStatuses[serviceName] = {
//           isLoggedIn: false,
//           configTypeOptions: mocks.mockAdapterAuthentication(mocks.mockConfigType(serviceName)),
//         }
//       }
//     })
//     return loginStatuses
//   }),
//   loadLocalWorkspace: jest.fn(),
//   installAdapter: jest.fn(),
// }))

// describe('service command', () => {
//   let cliOutput: { stdout: mocks.MockWriteStream; stderr: mocks.MockWriteStream }
//   const mockGetCredentialsFromUser = mocks.createMockGetCredentialsFromUser({
//     username: 'test@test',
//     password: 'test',
//     token: 'test',
//     sandbox: false,
//   })
//   const mockGetOAuthCredentialsFromUser = mocks.createMockGetCredentialsFromUser({
//     port: 8888,
//     consumerKey: 'test',
//   })
//   const currentEnv = 'env'
//   const mockLoadWorkspace = loadLocalWorkspace as jest.Mock
//   mockLoadWorkspace.mockImplementation(() => {
//     let services = ['salesforce', 'oauthAdapter']
//     let env = currentEnv
//     return {
//       services: () => services,
//       hasErrors: () => false,
//       setCurrentEnv: (newEnv: string) => {
//         env = newEnv
//         services = ['netsuite']
//       },
//       currentEnv: () => env,
//     }
//   })

//   beforeEach(() => {
//     cliOutput = { stdout: new mocks.MockWriteStream(), stderr: new mocks.MockWriteStream() }
//   })

//   describe('Invalid service command', () => {
//     it('invalid command', async () => {
//       try {
//         await command('', 'errorCommand', cliOutput, mockGetCredentialsFromUser, 'basic', 'service')
//           .execute()
//       } catch (error) {
//         expect(error.message).toMatch('Unknown service management command')
//       }
//     })
//   })
//   describe('list command', () => {
//     describe('when the workspace loads successfully', () => {
//       describe('when called with no service name', () => {
//         beforeEach(async () => {
//           await command('', 'list', cliOutput, mockGetCredentialsFromUser, 'basic').execute()
//         })

//         it('should load the workspace', () => {
//           expect(mockLoadWorkspace).toHaveBeenCalled()
//         })

//         it('should print configured services', () => {
//           expect(cliOutput.stdout.content).toContain('The configured services are:')
//           expect(cliOutput.stdout.content).toContain('salesforce')
//         })
//       })

//       describe('when called with service that is configured', () => {
//         beforeEach(async () => {
//           await command('', 'list', cliOutput, mockGetCredentialsFromUser, 'basic', 'salesforce').execute()
//         })

//         it('should load the workspace', async () => {
//           expect(mockLoadWorkspace).toHaveBeenCalled()
//         })

//         it('should print configured services', async () => {
//           expect(cliOutput.stdout.content).toContain('salesforce is configured in this environment')
//         })
//       })

//       describe('when called with a service that is not configured', () => {
//         beforeEach(async () => {
//           await command('', 'list', cliOutput, mockGetCredentialsFromUser, 'basic', 'notConfigured').execute()
//         })

//         it('should print configured services', async () => {
//           expect(cliOutput.stdout.content).toContain('notConfigured is not configured in this environment')
//         })
//       })
//       describe('Environment flag', () => {
//         beforeEach(async () => {
//           mockLoadWorkspace.mockClear()
//         })
//         it('should use current env when env is not provided', async () => {
//           await command('', 'list', cliOutput, mockGetCredentialsFromUser, 'basic', 'salesforce').execute()
//           expect(mockLoadWorkspace).toHaveBeenCalledTimes(1)
//           expect(cliOutput.stdout.content).toContain('salesforce')
//         })
//         it('should use provided env', async () => {
//           const injectedEnv = 'injected'
//           await command(
//             '',
//             'list',
//             cliOutput,
//             mockGetCredentialsFromUser,
//             'basic',
//             undefined,
//             injectedEnv,
//           ).execute()
//           expect(cliOutput.stdout.content).toContain('netsuite')
//         })
//       })
//     })
//   })

//   describe('add command', () => {
//     describe('when the workspace loads successfully', () => {
//       describe('when called with already configured service', () => {
//         beforeEach(async () => {
//           await command('', 'add', cliOutput, mockGetCredentialsFromUser, 'basic', 'salesforce').execute()
//         })

//         it('should print already added', async () => {
//           expect(cliOutput.stderr.content).toContain('salesforce was already added to this environment')
//         })
//       })

//       describe('when called with a new service', () => {
//         const installAdapterMock = installAdapter as jest.Mock
//         beforeEach(async () => {
//           await command('', 'add', cliOutput, mockGetCredentialsFromUser, 'basic', 'newAdapter').execute()
//         })

//         it('should print please enter credentials', async () => {
//           expect(cliOutput.stdout.content).toContain('Please enter your Newadapter credentials:')
//         })

//         it('should invoke the adapter install method', async () => {
//           expect(installAdapterMock).toHaveBeenCalled()
//         })

//         it('should throw an error if the adapter failed to install', async () => {
//           (installAdapterMock).mockImplementationOnce(() => {
//             throw new Error('Failed to install Adapter!')
//           })
//           await expect(
//             command('', 'add', cliOutput, mockGetCredentialsFromUser, 'basic', 'newAdapter').execute()
//           ).rejects.toThrow()
//         })

//         describe('when called with valid credentials', () => {
//           beforeEach(async () => {
//             await command('', 'add', cliOutput, mockGetCredentialsFromUser, 'basic', 'newAdapter').execute()
//           })
//           it('should print login information updated', async () => {
//             expect(cliOutput.stdout.content).toContain('Login information successfully updated!')
//           })

//           it('should print added', async () => {
//             expect(cliOutput.stdout.content).toContain('added to the environment')
//           })
//         })

//         describe('when add called with unsupported auth type', () => {
//           beforeEach(async () => {
//             await command('', 'add', cliOutput, mockGetCredentialsFromUser, 'oauth', 'newAdapter').execute()
//           })

//           it('fails with no such auth type error', () => {
//             expect(cliOutput.stderr.content).toContain('Error: Could not login to newAdapter: Adapter does not support authentication of type oauth')
//           })
//         })

//         describe('when called with invalid credentials', () => {
//           beforeEach(async () => {
//             cliOutput = {
//               stdout: new mocks.MockWriteStream(),
//               stderr: new mocks.MockWriteStream(),
//             };
//             (updateCredentials as jest.Mock).mockRejectedValue('Rejected!')
//             await command('', 'add', cliOutput, mockGetCredentialsFromUser, 'basic', 'newAdapter').execute()
//           })
//           afterEach(() => {
//             (updateCredentials as jest.Mock).mockResolvedValue(true)
//           })

//           it('should print login error', async () => {
//             expect(cliOutput.stderr.content).toContain('Could not login to newAdapter')
//           })

//           it('should print try again text', async () => {
//             expect(cliOutput.stderr.content).toContain('To try again run: `salto service add newAdapter`')
//           })

//           it('should not print login information updated', async () => {
//             expect(cliOutput.stdout.content).not.toContain('Login information successfully updated!')
//           })

//           it('should not print added', async () => {
//             expect(cliOutput.stdout.content).not.toContain('added to the environment')
//           })
//         })

//         describe('nologin flag', () => {
//           beforeEach(async () => {
//             cliOutput = {
//               stdout: new mocks.MockWriteStream(),
//               stderr: new mocks.MockWriteStream(),
//             }
//             await command(
//               '',
//               'add',
//               cliOutput,
//               mockGetCredentialsFromUser,
//               'basic',
//               'newAdapter',
//               undefined,
//               true
//             ).execute()
//           })
//           it('should add without login', async () => {
//             expect(cliOutput.stdout.content).toContain('added to the environment')
//             expect(cliOutput.stdout.content).not.toContain(
//               'Please enter your Newadapter credentials:'
//             )
//           })
//           it('should invoke the adapter install method', async () => {
//             expect(installAdapterMock).toHaveBeenCalled()
//           })
//         })

//         describe('Environment flag', () => {
//           const mockAddAdapter = addAdapter as jest.Mock
//           beforeEach(async () => {
//             mockLoadWorkspace.mockClear()
//             mockAddAdapter.mockClear()
//           })
//           it('should use current env when env is not provided', async () => {
//             await command('', 'add', cliOutput, mockGetCredentialsFromUser, 'basic', 'hubspot').execute()
//             expect(mockLoadWorkspace).toHaveBeenCalledTimes(1)
//             expect(mockAddAdapter.mock.calls[0][0].currentEnv()).toEqual(currentEnv)
//           })
//           it('should use provided env', async () => {
//             await command(
//               '',
//               'add',
//               cliOutput,
//               mockGetCredentialsFromUser,
//               'basic',
//               undefined,
//               'injected'
//             ).execute()
//             expect(mockLoadWorkspace).toHaveBeenCalledTimes(1)
//             expect(mockAddAdapter.mock.calls[0][0].currentEnv()).toEqual('injected')
//           })
//         })
//       })

//       describe('when called with a new adapter that does not exist', () => {
//         describe('with login', () => {
//           it('should throw an error', async () => {
//             await expect(command('', 'add', cliOutput, mockGetCredentialsFromUser, 'basic', 'noAdapter').execute()).rejects.toThrow()
//           })
//         })
//         describe('without login', () => {
//           it('should throw an error', async () => {
//             await expect(command('', 'add', cliOutput, mockGetCredentialsFromUser, 'basic', 'noAdapter', undefined, true).execute()).rejects.toThrow()
//           })
//         })
//       })
//     })
//   })

//   describe('login command', () => {
//     describe('when the workspace loads successfully', () => {
//       describe('when called with already logged in service', () => {
//         beforeEach(async () => {
//           await command('', 'login', cliOutput, mockGetCredentialsFromUser, 'basic', 'salesforce').execute()
//         })
//         it('should print login override', () => {
//           expect(cliOutput.stdout.content).toContain('override')
//         })

//         it('should get config from user', () => {
//           expect(mockGetCredentialsFromUser).toHaveBeenCalled()
//         })

//         it('should call update config', () => {
//           expect(updateCredentials).toHaveBeenCalled()
//         })

//         it('should print logged in', () => {
//           expect(cliOutput.stdout.content).toContain('Login information successfully updated')
//         })
//       })

//       describe('when called with not configured service', () => {
//         beforeEach(async () => {
//           await command('', 'login', cliOutput, mockGetCredentialsFromUser, 'basic', 'notConfigured').execute()
//         })

//         it('should print not configured', () => {
//           expect(cliOutput.stderr.content).toContain('notConfigured is not configured in this environment')
//         })
//       })

//       describe('when login called with unsupported auth type', () => {
//         beforeEach(async () => {
//           await command('', 'login', cliOutput, mockGetCredentialsFromUser, 'oauth', 'salesforce').execute()
//         })

//         it('fails with no such auth type error', () => {
//           expect(cliOutput.stderr.content).toContain('Error: Could not login to salesforce: Adapter does not support authentication of type oauth')
//         })
//       })

//       describe('when called with oauth credentials', () => {
//         beforeEach(async () => {
//           await command('', 'login', cliOutput, mockGetOAuthCredentialsFromUser, 'oauth', 'oauthAdapter').execute()
//         })
//         it('should process oauth credentials', () => {
//           expect(processOauthCredentials).toHaveBeenCalled()
//         })
//         it('should get config from user', () => {
//           expect(mockGetOAuthCredentialsFromUser).toHaveBeenCalled()
//         })

//         it('should call update config', async () => {
//           expect(updateCredentials).toHaveBeenCalled()
//         })

//         it('should print it logged in', async () => {
//           expect(cliOutput.stdout.content).toContain('Login information successfully updated')
//         })
//       })
//       describe('when called with configured but not logged in service', () => {
//         beforeEach(async () => {
//           await command('', 'login', cliOutput, mockGetCredentialsFromUser, 'basic', 'salesforce').execute()
//         })
//         it('should get config from user', () => {
//           expect(mockGetCredentialsFromUser).toHaveBeenCalled()
//         })

//         it('should call update config', async () => {
//           expect(updateCredentials).toHaveBeenCalled()
//         })

//         it('should print it logged in', async () => {
//           expect(cliOutput.stdout.content).toContain('Login information successfully updated')
//         })
//       })
//       describe('Environment flag', () => {
//         const mockupdateCredentials = updateCredentials as jest.Mock
//         beforeEach(async () => {
//           mockLoadWorkspace.mockClear()
//           mockupdateCredentials.mockClear()
//         })
//         it('should use current env when env is not provided', async () => {
//           await command('', 'login', cliOutput, mockGetCredentialsFromUser, 'basic', 'salesforce').execute()
//           expect(mockLoadWorkspace).toHaveBeenCalledTimes(1)
//           expect((mockupdateCredentials.mock.calls[0][0] as Workspace).currentEnv())
//             .toEqual(currentEnv)
//         })
//         it('should use provided env', async () => {
//           await command(
//             '',
//             'login',
//             cliOutput,
//             mockGetCredentialsFromUser,
//             'basic',
//             'netsuite',
//             'injected'
//           ).execute()
//           expect(mockLoadWorkspace).toHaveBeenCalledTimes(1)
//           expect((mockupdateCredentials.mock.calls[0][0] as Workspace).currentEnv())
//             .toEqual('injected')
//         })
//       })
//     })
//   })
// })
