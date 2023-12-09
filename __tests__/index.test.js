// __tests__/index.test.js
import fs from 'fs'
import path from 'path'
import core from '@actions/core'
import { fetchRssFeed } from '../src/index'
import { extract } from '@extractus/feed-extractor'

jest.mock('@extractus/feed-extractor', () => ({
  extract: jest.fn()
}))

// Mock the core module
jest.mock('@actions/core', () => ({
  setFailed: jest.fn()
}))

// Mock the fs module except for readFileSync
jest.mock('fs', () => ({
  promises: {
    access: jest.fn()
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn()
}))

beforeEach(() => {
  // Reset the mocks and environment variables
  jest.resetAllMocks()
  process.env.INPUT_FEED_URL = 'https://example.com/feed'
  process.env.INPUT_FILE_PATH = './feed.json'
  process.env.INPUT_PARSER_OPTIONS = JSON.stringify({ useISODateFormat: true })
  process.env.INPUT_FETCH_OPTIONS = '{}'
  process.env.INPUT_REMOVE_PUBLISHED = 'false'
})

describe('fetchRssFeed function', () => {
  describe('Validation tests', () => {
    // Mocks Needed:
    // 1. Environment variables for feedUrl and filePath
    it('should set failed if feed URL is not provided', async () => {
      // Clear the environment variable for feed URL
      delete process.env.INPUT_FEED_URL

      // Call the function
      await fetchRssFeed()

      // Expect that core.setFailed was called with the expected error message
      expect(core.setFailed).toHaveBeenCalledWith(
        'Feed URL is not provided or invalid'
      )
    })

    it('should set failed if file path is not provided', async () => {
      // Clear the environment variable for file path
      delete process.env.INPUT_FILE_PATH

      // Call the function
      await fetchRssFeed()

      // Expect that core.setFailed was called with the expected error message
      expect(core.setFailed).toHaveBeenCalledWith('File path is not provided')
    })

    it('should set failed if file extension is not .json', async () => {
      // Set the environment variable for file path with an invalid extension
      process.env.INPUT_FILE_PATH = './feed.txt'

      // Call the function
      await fetchRssFeed()

      // Expect that core.setFailed was called with the expected error message
      expect(core.setFailed).toHaveBeenCalledWith(
        'File path extension must be .json'
      )
    })
  })

  describe('Input Parsing', () => {
    it('should set failed if parserOptions is invalid JSON', async () => {
      // Set invalid JSON for parserOptions
      process.env.INPUT_PARSER_OPTIONS = 'invalid JSON'

      // Call the function
      await fetchRssFeed()

      // Expect that core.setFailed was called with the expected error message
      expect(core.setFailed).toHaveBeenCalledWith(
        'Failed to parse parserOptions input: Unexpected token \'i\', "invalid JSON" is not valid JSON'
      )
    })

    it('should set failed if fetchOptions is invalid JSON', async () => {
      // Set invalid JSON for fetchOptions
      process.env.INPUT_FETCH_OPTIONS = 'invalid JSON'

      // Call the function
      await fetchRssFeed()

      // Expect that core.setFailed was called with the expected error message
      expect(core.setFailed).toHaveBeenCalledWith(
        'Failed to parse fetchOptions input: Unexpected token \'i\', "invalid JSON" is not valid JSON'
      )
    })

    it('should evaluate function in parserOptions if provided as string', async () => {
      // Set a function as a string in parserOptions
      process.env.INPUT_PARSER_OPTIONS = JSON.stringify({
        getExtraEntryFields:
          "function(feedEntry) { return { 'content:encoded': feedEntry['content:encoded'] || '' }; }"
      })

      // Mock the extract function to return a specific object
      extract.mockResolvedValueOnce({ title: 'Test Feed' })

      // Call the function
      await fetchRssFeed()

      // Expect that extract was called with the evaluated function
      const expectedParserOptions = {
        getExtraEntryFields: expect.any(Function)
      }
      expect(extract).toHaveBeenCalledWith(
        'https://example.com/feed',
        expectedParserOptions,
        {}
      )
    })
  })

  describe('extract function interaction', () => {
    it('should call extract function with correct arguments', async () => {
      // Verify that extract function is mocked
      expect(jest.isMockFunction(extract)).toBe(true)

      // Call the function
      await fetchRssFeed()

      // Expect that extract was called with the correct arguments
      expect(jest.isMockFunction(extract)).toBe(true)
      expect(extract).toHaveBeenCalledWith(
        'https://example.com/feed',
        { useISODateFormat: true },
        {}
      )
    })

    it('should handle errors thrown by extract function', async () => {
      // Verify that extract function is mocked
      expect(jest.isMockFunction(extract)).toBe(true)

      // Make extract throw an error
      extract.mockImplementationOnce(() => {
        throw new Error('Some error')
      })

      // Call the function
      await fetchRssFeed()

      // Expect that core.setFailed was called with the expected error message
      expect(jest.isMockFunction(extract)).toBe(true)
      expect(core.setFailed).toHaveBeenCalledWith(
        'Failed to fetch or parse feed: Some error'
      )
    })
  })

  describe('removePublished behavior', () => {
    it('should not remove published field if removePublished is not set', async () => {
      // Setup
      delete process.env.INPUT_REMOVE_PUBLISHED
      extract.mockResolvedValueOnce({
        title: 'Test Feed',
        published: 'some date'
      })

      // Execute
      await fetchRssFeed()

      // Verify
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        process.env.INPUT_FILE_PATH,
        JSON.stringify({ title: 'Test Feed', published: 'some date' }, null, 2)
      )
    })

    it('should remove published field if removePublished is set to "true"', async () => {
      // Setup
      process.env.INPUT_REMOVE_PUBLISHED = 'true'
      extract.mockResolvedValueOnce({
        title: 'Test Feed',
        published: 'some date'
      })

      // Execute
      await fetchRssFeed()

      // Verify
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        process.env.INPUT_FILE_PATH,
        JSON.stringify({ title: 'Test Feed' }, null, 2)
      )
    })

    it('should set failed if removePublished is set to an invalid value', async () => {
      // Setup
      process.env.INPUT_REMOVE_PUBLISHED = 'invalid'

      // Execute
      await fetchRssFeed()

      // Verify
      expect(core.setFailed).toHaveBeenCalledWith(
        'removePublished must be either "true" or "false"'
      )
    })
  })

  describe('fetchRssFeed function', () => {
    describe('File operations', () => {
      it('should create directory if it does not exist', async () => {
        // Return javascript object from extract function
        extract.mockResolvedValueOnce({ title: 'Test Feed' })

        // Setup
        fs.existsSync.mockReturnValue(false)

        // Execute
        await fetchRssFeed()

        // Verify
        expect(fs.mkdirSync).toHaveBeenCalledWith(
          path.dirname(process.env.INPUT_FILE_PATH),
          { recursive: true }
        )
      })

      it('should write parsed data to the file', async () => {
        // Return javascript object from extract function
        extract.mockResolvedValueOnce({ title: 'Test Feed' })

        // Setup
        fs.existsSync.mockReturnValue(true)

        // Execute
        await fetchRssFeed()

        // Verify
        expect(fs.writeFileSync).toHaveBeenCalledWith(
          process.env.INPUT_FILE_PATH,
          JSON.stringify({ title: 'Test Feed' }, null, 2)
        )
      })
    })
  })

  describe('Success logging', () => {
    let logSpy

    beforeEach(() => {
      // Spy on console.log
      logSpy = jest.spyOn(console, 'log').mockImplementation()
    })

    afterEach(() => {
      // Cleanup the spy
      logSpy.mockRestore()
    })

    it('should log success message if everything goes well', async () => {
      // Verify that extract function is mocked
      expect(jest.isMockFunction(extract)).toBe(true)

      // Return javascript object from extract function
      extract.mockResolvedValueOnce({ title: 'Test Feed' })

      // Execute the function
      await fetchRssFeed()

      // Verify that console.log was called with the success message
      expect(logSpy).toHaveBeenCalledWith(
        `RSS feed saved to ${process.env.INPUT_FILE_PATH} successfully!`
      )
    })
  })

  // Ensure that functions are mocked as expected
  it('should have mocked functions', () => {
    // Verify that fs and path functions are mocked
    expect(jest.isMockFunction(fs.promises.access)).toBe(true)
    expect(jest.isMockFunction(fs.existsSync)).toBe(true)
    expect(jest.isMockFunction(fs.mkdirSync)).toBe(true)
    expect(jest.isMockFunction(fs.writeFileSync)).toBe(true)

    // Verify that readFileSync function is not mocked
    expect(jest.isMockFunction(fs.readFileSync)).toBe(false)
  })
})
