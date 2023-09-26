// index.test.js
const core = require('@actions/core')
const fetch = require('isomorphic-fetch')
const fs = require('fs')
const { parseStringPromise } = require('xml2js')
const { fetchRssFeed } = require('../src/index')

jest.mock('isomorphic-fetch')
jest.mock('fs', () => ({
  accessSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
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

  it('should set failure if no file path is provided', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = '' // Setting file path to empty
    await fetchRssFeed()
    expect(core.setFailed).toHaveBeenCalledWith('File path is not provided')
  })

  // Test case for unsupported file extension
  it('should set failure if unsupported file extension is provided', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './feed.txt' // Unsupported extension

    await fetchRssFeed()

    expect(core.setFailed).toHaveBeenCalledWith(
      'File extension must be .json or .xml'
    )
  })

  it('should set failure if fetch returns a non-ok response', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './feed.json'
    fetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found'
    })

    await fetchRssFeed()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Failed to fetch RSS feed (404 Not Found)'
    )
  })

  it('should set failure if fetch fails due to other error', async () => {
    expect.assertions(1)
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './feed.json'
    fetch.mockRejectedValue(new Error('Network error'))

    await fetchRssFeed()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Failed to fetch RSS feed due to network error or invalid URL'
    )
  })

  it('should set failure if RSS parsing fails', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './feed.json'
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<rss></rss>')
    })
    parseStringPromise.mockRejectedValue(new Error('Invalid XML'))

    await fetchRssFeed()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Failed to parse RSS feed. The feed might not be valid XML.'
    )
  })

  it('should save the feed to a JSON file if .json file path is provided', async () => {
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
  })

  // Test case for .xml extension
  it('should save the feed to an XML file if .xml extension is provided', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './feed.xml'
    const mockXmlData = '<rss></rss>'
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(mockXmlData)
    })
    parseStringPromise.mockResolvedValue({ rss: {} })

    await fetchRssFeed()

    expect(fs.writeFileSync).toHaveBeenCalledWith('./feed.xml', mockXmlData)
  })

  it('should remove lastBuildDate if specified', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './feed.json'
    process.env.INPUT_REMOVE_LAST_BUILD_DATE = 'true'
    fetch.mockResolvedValue({
      ok: true,
      text: jest
        .fn()
        .mockResolvedValue(
          '<rss><lastBuildDate>some date</lastBuildDate></rss>'
        )
    })
    parseStringPromise.mockImplementation(async xmlString => {
      if (xmlString.includes('<lastBuildDate>')) {
        return { rss: { lastBuildDate: 'some date' } }
      } else {
        return { rss: {} }
      }
    })

    await fetchRssFeed()

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './feed.json',
      JSON.stringify({ rss: {} }, null, 2)
    )
  })

  it('should handle directory creation if directory does not exist', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './someDir/feed.json'
    fs.existsSync.mockReturnValue(false)

    // Mock fetch for this test
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<rss></rss>')
    })

    await fetchRssFeed()

    expect(fs.mkdirSync).toHaveBeenCalledWith('./someDir', { recursive: true })
  })

  it('should handle file write permission errors gracefully', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './feed.json'
    fs.writeFileSync.mockImplementation(() => {
      throw new Error('Permission denied')
    })

    // Mock fetch for this test
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<rss></rss>')
    })

    await fetchRssFeed()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Failed to write the file due to permissions or other file system error: Permission denied'
    )
  })
})
