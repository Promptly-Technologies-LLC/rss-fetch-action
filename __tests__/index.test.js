// index.test.js
const core = require('@actions/core')
const fetch = require('isomorphic-fetch')
const fs = require('fs')
const { parseStringPromise } = require('xml2js')
const { fetchRssFeed } = require('../src/index')

jest.mock('isomorphic-fetch')
jest.mock('fs', () => ({
  accessSync: jest.fn(),
  writeFileSync: jest.fn(),
  constants: { W_OK: 'some_value' },
  promises: {
    access: jest.fn()
  }
}))

jest.mock('xml2js')
jest.mock('@actions/core')

describe('fetchRssFeed', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('should set failure if no feed URL is provided', async () => {
    process.env.INPUT_FEED_URL = ''
    await fetchRssFeed()
    expect(core.setFailed).toHaveBeenCalledWith('Feed URL is not provided')
  })

  it('should set failure if fetch fails', async () => {
    expect.assertions(1)
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    fetch.mockRejectedValue(new Error('Fetch failed'))

    await fetchRssFeed()

    expect(core.setFailed).toHaveBeenCalledWith('Fetch failed')
  })

  it('should save the feed to a file if file path is provided', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './feed.json'
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<rss></rss>')
    })
    parseStringPromise.mockResolvedValue({ rss: {} })
    fs.accessSync.mockReturnValue(true)

    await fetchRssFeed()

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './feed.json',
      JSON.stringify({ rss: {} }, null, 2)
    )
    expect(core.setOutput).toHaveBeenCalledWith(
      'feed',
      JSON.stringify({ rss: {} }, null, 2)
    )
  })

  it('should not save the feed to a file if no file path is provided', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = ''
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<rss></rss>')
    })
    parseStringPromise.mockResolvedValue({ rss: {} })

    await fetchRssFeed()

    expect(fs.writeFileSync).not.toHaveBeenCalled()
    expect(core.setOutput).toHaveBeenCalledWith(
      'feed',
      JSON.stringify({ rss: {} }, null, 2)
    )
  })
})

// Verify that mocks work correctly
describe('fetch mock', () => {
  it('should reject when mockRejectedValue is used', async () => {
    // Set up the mock to reject
    fetch.mockRejectedValue(new Error('Fetch failed'))

    // Expect that calling fetch will reject with the specified error
    await expect(fetch('some_url')).rejects.toThrow('Fetch failed')
  })
})

describe('fs mock', () => {
  it('should call accessSync without errors', () => {
    fs.accessSync.mockReturnValue(true)
    expect(() => fs.accessSync('some_path', fs.constants.W_OK)).not.toThrow()
  })

  it('should call writeFileSync without errors', () => {
    fs.writeFileSync.mockReturnValue(true)
    expect(() => fs.writeFileSync('some_path', 'some_data')).not.toThrow()
  })
})

describe('xml2js mock', () => {
  it('should resolve parseStringPromise', async () => {
    parseStringPromise.mockResolvedValue({ rss: {} })
    await expect(parseStringPromise('<rss></rss>')).resolves.toEqual({
      rss: {}
    })
  })
})

describe('@actions/core mock', () => {
  it('should call setOutput without errors', () => {
    core.setOutput.mockReturnValue(true)
    expect(() => core.setOutput('key', 'value')).not.toThrow()
  })

  it('should call setFailed without errors', () => {
    core.setFailed.mockReturnValue(true)
    expect(() => core.setFailed('Some error')).not.toThrow()
  })
})
