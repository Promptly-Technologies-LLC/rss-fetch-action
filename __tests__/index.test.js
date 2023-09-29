// index.test.js
const core = require('@actions/core')
const fetch = require('isomorphic-fetch')
const path = require('path');
const { fetchRssFeed } = require('../src/index')

jest.mock('isomorphic-fetch')
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  accessSync: jest.fn(),
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
  constants: { W_OK: 'some_value' },
  promises: {
    ...jest.requireActual('fs').promises,
    access: jest.fn()
  }
}))
jest.mock('@actions/core')

const fs = require('fs')

beforeEach(() => {
  jest.resetAllMocks();
});

describe('fetchRssFeed', () => {
  
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
      text: jest.fn().mockResolvedValue('hello world')
    })

    await fetchRssFeed()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Unknown feed format. Only XML and JSON are supported.'
    )
  })

  it('should set failure if trying to convert JSON to XML', async () => {
    // Mock environment variables
    process.env.INPUT_FEED_URL = 'http://example.com/feed';
    process.env.INPUT_FILE_PATH = './feed.xml'; // XML extension

    // Mock fetch to return JSON data
    const mockJsonData = JSON.stringify({ rss: {} });
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(mockJsonData)
    });
  
    // Run the function and expect it to throw an error
    await fetchRssFeed()

    expect(core.setFailed).toHaveBeenCalledWith(
      'Converting JSON feed to XML output is not supported.'
    )
  });

  it('should save the feed to a JSON file if .json file path is provided', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './feed.json'
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<rss></rss>')
    })
    fs.accessSync.mockReturnValue(true)

    await fetchRssFeed()

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './feed.json',
      JSON.stringify({ rss: "" }, null, 2)
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

    await fetchRssFeed()

    expect(fs.writeFileSync).toHaveBeenCalledWith('./feed.xml', mockXmlData)
  })

  it('should remove lastBuildDate from XML feed if specified', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed'
    process.env.INPUT_FILE_PATH = './feed.json'
    process.env.INPUT_REMOVE_LAST_BUILD_DATE = 'true'
    const mockXmlData = '<rss><channel><lastBuildDate>some date</lastBuildDate></channel></rss>'
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(mockXmlData)
    })

    await fetchRssFeed()

    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './feed.json',
      JSON.stringify({ rss: { channel: "" } }, null, 2)
    )
  })

  it('should remove lastBuildDate from JSON feed if specified', async () => {
    process.env.INPUT_FEED_URL = 'http://example.com/feed';
    process.env.INPUT_FILE_PATH = './feed.json';
    process.env.INPUT_REMOVE_LAST_BUILD_DATE = 'true';
    
    const mockJsonData = JSON.stringify({
      rss: {
        channel: {
          lastBuildDate: 'some date'
        }
      }
    });
  
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(mockJsonData)
    });
  
    await fetchRssFeed();
  
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      './feed.json',
      JSON.stringify({ rss: { channel: {} } }, null, 2)
    );
  });

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

describe('Feed Type Handling', () => {
  let atomFeed, jsonFeed, mediumFeed, podcastFeed, rdfFeed, rssFeed;

  beforeAll(async () => {
    // Read the feed data from the files
    atomFeed = await fs.promises.readFile(path.join(__dirname, 'data', 'atom-feed-standard.xml'), 'utf8');
    jsonFeed = await fs.promises.readFile(path.join(__dirname, 'data', 'json-feed-standard.json'), 'utf8');
    mediumFeed = await fs.promises.readFile(path.join(__dirname, 'data', 'medium-feed.xml'), 'utf8');
    podcastFeed = await fs.promises.readFile(path.join(__dirname, 'data', 'podcast.rss'), 'utf8');
    rdfFeed = await fs.promises.readFile(path.join(__dirname, 'data', 'rdf-standard.xml'), 'utf8');
    rssFeed = await fs.promises.readFile(path.join(__dirname, 'data', 'rss-feed-standard.xml'), 'utf8');
  });

  const testFeedProcessing = async (feedData, ext = '.json') => {
    fetch.mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue(feedData)
    });
    process.env.INPUT_FEED_URL = 'http://example.com/feed';
    process.env.INPUT_FILE_PATH = `./feed${ext}`;
    await fetchRssFeed();
    expect(core.setFailed).not.toHaveBeenCalled();
    expect(fs.writeFileSync).toHaveBeenCalled();

    // Check if writeFileSync was called with a JSON string
    const [filePath, fileContent] = fs.writeFileSync.mock.calls[0];
    expect(filePath).toBe(`./feed${ext}`);
    if (ext === '.json') {
      expect(() => JSON.parse(fileContent)).not.toThrow();
    }
  };

  it('should handle Atom feeds correctly', async () => {
    await testFeedProcessing(atomFeed);
  });

  it('should handle JSON feeds correctly', async () => {
    await testFeedProcessing(jsonFeed, '.json');
  });

  it('should handle Medium feeds correctly', async () => {
    await testFeedProcessing(mediumFeed);
  });

  it('should handle Podcast feeds correctly', async () => {
    await testFeedProcessing(podcastFeed);
  });

  it('should handle RDF feeds correctly', async () => {
    await testFeedProcessing(rdfFeed);
  });

  it('should handle standard RSS feeds correctly', async () => {
    await testFeedProcessing(rssFeed);
  });
});
