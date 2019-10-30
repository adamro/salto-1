import fs from 'fs'
import tmp from 'tmp'
import { pollPromise } from '../poll'
import { mockConsoleStream, MockWritableStream } from '../console'
import { LogLevel, LOG_LEVELS } from '../../src/internal/level'
import { Config, mergeConfigs } from '../../src/internal/config'
import { loggerRepo, Logger, LoggerRepo } from '../../src/internal/logger'
import { loggerRepo as winstonLoggerRepo } from '../../src/internal/winston'
import '../matchers'

const TIMESTAMP_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/

describe('winston based logger', () => {
  let consoleStream: MockWritableStream
  let initialConfig: Config
  const NAMESPACE = 'my-namespace'
  let repo: LoggerRepo

  const createRepo = (): LoggerRepo => loggerRepo(
    winstonLoggerRepo({ consoleStream }, initialConfig), initialConfig,
  )

  const createLogger = (): Logger => {
    repo = createRepo()
    return repo(NAMESPACE)
  }

  beforeEach(() => {
    initialConfig = mergeConfigs({ minLevel: 'warn' })
    consoleStream = mockConsoleStream(true)
  })

  let logger: Logger
  let line: string

  const logLine = (
    { level = 'error', logger: l = logger }: { level?: LogLevel; logger?: Logger } = {},
  ): void => {
    l[level]('hello %o', { world: true }, { extra: 'stuff' })
    repo.end();
    [line] = consoleStream.contents().split('\n')
  }

  describe('initial configuration', () => {
    describe('filename', () => {
      describe('when set', () => {
        jest.setTimeout(200)

        let filename: string

        const readFileContent = (): string => fs.readFileSync(filename, { encoding: 'utf8' })

        beforeEach(async () => {
          filename = tmp.tmpNameSync({ postfix: '.log' })
          initialConfig.filename = filename
          logger = createLogger()
          logLine()

          // Polling abomination is here since the feature in winston that waits for logging is
          // broken. Tried and failed:
          // - Passing a callback to winstonLogger.log() - not called
          // - logger.impl.on('finish', done), logger.impl.end(done) - done called too soon
          await pollPromise(
            // can't just poll for existence since it may be created and empty
            () => fs.existsSync(filename) && readFileContent() !== '',
          )
          const fileContents = readFileContent();
          [line] = fileContents.split('\n')
        })

        afterEach(() => {
          fs.unlinkSync(filename)
        })

        it('should write the message to the file', () => {
          expect(line).toMatch(TIMESTAMP_REGEX)
          expect(line).toContain(`error ${NAMESPACE} hello { world: true }`)
        })
      })

      describe('when not set', () => {
        beforeEach(() => {
          logger = createLogger()
          logLine()
        })

        it('should write the message to the console stream', () => {
          expect(line).toMatch(TIMESTAMP_REGEX)
          expect(line).toContain('error')
          expect(line).toContain(NAMESPACE)
          expect(line).toContain('hello { world: true }')
        })

        it('should colorize the line', () => {
          expect(line).toContainColors('\u001b[')
        })
      })
    })

    describe('minLevel', () => {
      describe('logging levels', () => {
        beforeEach(() => {
          initialConfig.minLevel = 'info'
          logger = createLogger()
        })

        describe('when logging at the configured level', () => {
          beforeEach(() => {
            logLine({ level: initialConfig.minLevel as LogLevel })
          })

          it('should write the message to the console stream', () => {
            expect(line).not.toHaveLength(0)
          })
        })

        describe('when logging above the configured level', () => {
          beforeEach(() => {
            logLine({ level: 'error' })
          })

          it('should write the message to the console stream', () => {
            expect(line).not.toHaveLength(0)
          })
        })

        describe('when logging below the configured level', () => {
          beforeEach(() => {
            logLine({ level: 'debug' })
          })

          it('should not write the message to the console stream', () => {
            expect(line).toHaveLength(0)
          })
        })
      })

      describe('"none"', () => {
        beforeEach(() => {
          initialConfig.minLevel = 'none'
          logger = createLogger()
        })

        LOG_LEVELS.forEach(level => {
          describe(`when logging at level ${level}`, () => {
            beforeEach(() => {
              logLine({ level })
            })

            it('should not write the message to the console stream', () => {
              expect(line).toHaveLength(0)
            })
          })
        })
      })
    })

    describe('namespaceFilter', () => {
      describe('as a function', () => {
        describe('when it returns true', () => {
          beforeEach(() => {
            initialConfig.namespaceFilter = () => true
            logger = createLogger()
            logLine()
          })

          it('should write the message to the console stream', () => {
            expect(line).not.toHaveLength(0)
          })
        })

        describe('when it returns false', () => {
          beforeEach(() => {
            initialConfig.namespaceFilter = () => false
            logger = createLogger()
            logLine()
          })

          it('should not write the message to the console stream', () => {
            expect(line).toHaveLength(0)
          })
        })
      })

      describe('as a string', () => {
        describe('when it is "*"', () => {
          beforeEach(() => {
            initialConfig.namespaceFilter = '*'
            logger = createLogger()
            logLine()
          })

          it('should write the message to the console stream', () => {
            expect(line).not.toHaveLength(0)
          })
        })

        describe('when it is another namespace', () => {
          beforeEach(() => {
            initialConfig.namespaceFilter = 'other-namespace'
            logger = createLogger()
            logLine()
          })

          it('should not write the message to the console stream', () => {
            expect(line).toHaveLength(0)
          })
        })

        describe('when it is a glob matching the namespace', () => {
          beforeEach(() => {
            initialConfig.namespaceFilter = `${NAMESPACE}**`
            logger = createLogger()
            logLine()
          })

          it('should write the message to the console stream', () => {
            expect(line).not.toHaveLength(0)
          })
        })
      })
    })

    describe('colorize', () => {
      describe('when it is set to true', () => {
        beforeEach(() => {
          initialConfig.colorize = true
        })

        describe('when the console supports color', () => {
          beforeEach(() => {
            logger = createLogger()
            logLine()
          })

          it('should colorize the line', () => {
            expect(line).toContainColors()
          })
        })

        describe('when the console does not support color', () => {
          beforeEach(() => {
            consoleStream.supportsColor = false
            logger = createLogger()
            logLine()
          })

          it('should still colorize the line', () => {
            expect(line).toContainColors()
          })
        })
      })

      describe('when it is set to false', () => {
        beforeEach(() => {
          initialConfig.colorize = false
        })

        describe('when the console supports color', () => {
          beforeEach(() => {
            logger = createLogger()
            logLine()
          })

          it('should not colorize the line', () => {
            expect(line).not.toContainColors()
          })
        })

        describe('when the console does not support color', () => {
          beforeEach(() => {
            consoleStream.supportsColor = false
            logger = createLogger()
            logLine()
          })

          it('should not colorize the line', () => {
            expect(line).not.toContainColors()
          })
        })
      })
    })
  })

  describe('log level methods', () => {
    beforeEach(() => {
      [initialConfig.minLevel] = LOG_LEVELS
      initialConfig.colorize = false
      logger = createLogger()
    })

    LOG_LEVELS.forEach(level => {
      describe(`when calling method ${level}`, () => {
        beforeEach(() => {
          logLine({ level })
        })

        it('should log the message correctly', () => {
          expect(line).toContain(`${level} ${NAMESPACE} hello { world: true }`)
        })
      })
    })
  })

  describe('logger creation', () => {
    beforeEach(() => {
      logger = createLogger()
    })

    describe('when created with a string namespace', () => {
      beforeEach(() => {
        logger = repo(NAMESPACE)
        logLine()
      })

      it('should write the message with the namespace', () => {
        expect(line).toContain(`${NAMESPACE}`)
      })

      describe('when getting the same logger again', () => {
        let logger2: Logger

        beforeEach(() => {
          logger2 = repo(NAMESPACE)
        })

        it('should return the same instance', () => {
          expect(logger).toBe(logger2)
        })
      })
    })

    describe('when created with a module namespace arg', () => {
      beforeEach(() => {
        logger = repo(module)
        logLine()
      })

      it('should write the message with the child namespace as string', () => {
        expect(line).toContain('logging/test/internal/winston_logger.test')
      })

      describe('when getting the same logger again', () => {
        let logger2: Logger

        beforeEach(() => {
          logger2 = repo(module)
        })

        it('should return the same instance', () => {
          expect(logger).toBe(logger2)
        })
      })
    })
  })

  describe('configure', () => {
    describe('when a partial config is specified', () => {
      beforeEach(() => {
        logger = createLogger()
        repo.configure({ minLevel: 'debug' })
        logLine({ level: 'debug' })
      })

      it('should update the existing logger', () => {
        expect(line).not.toHaveLength(0)
      })
    })
  })

  let jsonLine: { [key: string]: unknown }

  describe('logging Error instances', () => {
    let error: Error

    class MyError extends Error {}

    beforeEach(() => {
      error = new MyError('testing 123')
    })

    describe('when format is "text"', () => {
      let line1: string
      let line2: string

      beforeEach(() => {
        logger = createLogger()
        logger.log('warn', error);
        [line1, line2] = consoleStream.contents().split('\n')
      })

      it('should log the error message and stack in multiple lines', () => {
        expect(line1).toContain('Error: testing 123') // message
        expect(line2).toContain(' at ') // stack
      })
    })

    describe('when format is "json"', () => {
      beforeEach(() => {
        logger = createLogger()
        repo.configure({ format: 'json' })
        logger.log('warn', error)
        const [line1] = consoleStream.contents().split('\n')
        jsonLine = JSON.parse(line1)
      })

      it('should log the error message and stack as JSON on a single line', () => {
        expect(jsonLine.timestamp).toMatch(TIMESTAMP_REGEX)
        expect(jsonLine.level).toEqual('warn')
        expect(jsonLine.message).toEqual('Error: testing 123')
        expect(jsonLine.stack).toEqual(error.stack)
      })

      it('should log only the expected properties', () => {
        expect(Object.keys(jsonLine).sort()).toEqual([
          'level', 'message', 'namespace', 'stack', 'timestamp',
        ])
      })
    })
  })

  describe('JSON format', () => {
    beforeEach(() => {
      logger = createLogger()
      repo.configure({ format: 'json' })
      logLine({ level: 'warn' })
      jsonLine = JSON.parse(line)
    })

    it('should log the error message and stack as JSON on a single line', () => {
      expect(jsonLine.timestamp).toMatch(TIMESTAMP_REGEX)
      expect(jsonLine.level).toEqual('warn')
      expect(jsonLine.message).toEqual('hello { world: true }')
      expect(jsonLine.extra).toEqual('stuff')
    })

    it('should log only the expected properties', () => {
      expect(Object.keys(jsonLine).sort()).toEqual([
        'extra', 'level', 'message', 'namespace', 'timestamp',
      ])
    })

    it('should not colorize the line', () => {
      expect(line).not.toContainColors()
    })
  })

  describe('retrieving the logger config', () => {
    beforeEach(() => {
      logger = createLogger()
      repo.configure({ format: 'json' })
    })

    it('should return a Config instance', () => {
      const expectedProperties = 'minLevel filename format namespaceFilter colorize'
        .split(' ')
        .sort()

      expect(Object.keys(repo.config).sort()).toEqual(expectedProperties)
    })

    it('should return the configured values', () => {
      expect(repo.config.format).toEqual('json')
    })

    it('should return a frozen object', () => {
      expect(() => { (repo.config as Config).minLevel = 'info' }).toThrow()
    })
  })
})