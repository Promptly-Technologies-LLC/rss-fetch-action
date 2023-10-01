const fs = require('fs')
const path = require('path')
const core = require('@actions/core')

async function fetchRssFeed() {
  try {
    const feedExtractor = await import('@extractus/feed-extractor')
    const extract = feedExtractor.extract
    const feedUrl = process.env.INPUT_FEED_URL
    const filePath = process.env.INPUT_FILE_PATH

    let parserOptions
    let fetchOptions

    try {
      parserOptions = JSON.parse(process.env.INPUT_PARSER_OPTIONS || '{}')
    } catch (jsonError) {
      throw new Error(
        `Failed to parse parserOptions input: ${jsonError.message}`
      )
    }

    try {
      fetchOptions = JSON.parse(process.env.INPUT_FETCH_OPTIONS || '{}')
    } catch (jsonError) {
      throw new Error(
        `Failed to parse fetchOptions input: ${jsonError.message}`
      )
    }

    // If parserOptions contains a function as a string, eval it (Be cautious with eval)
    if (
      parserOptions.getExtraEntryFields &&
      typeof parserOptions.getExtraEntryFields === 'string'
    ) {
      parserOptions.getExtraEntryFields = eval(
        `(${parserOptions.getExtraEntryFields})`
      )
    }

    // Validate feedUrl
    if (!feedUrl || typeof feedUrl !== 'string') {
      throw new Error('Feed URL is not provided or invalid')
    }

    // Validate filePath
    if (!filePath) {
      throw new Error('File path is not provided')
    } else if (!['.json'].includes(path.extname(filePath).toLowerCase())) {
      throw new Error('File path extension must be .json')
    }

    // Fetch and parse the feed
    let parsedData
    try {
      parsedData = await extract(feedUrl, parserOptions, fetchOptions)
    } catch (extractError) {
      throw new Error(`Failed to fetch or parse feed: ${extractError.message}`)
    }

    // Validate parsedData
    if (!parsedData || typeof parsedData !== 'object') {
      throw new Error('Parsed data is invalid')
    }

    // Check if directory exists, if not create it
    const dir = path.dirname(filePath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    // Write the parsed data to the file
    const jsonFeedData = JSON.stringify(parsedData, null, 2)
    fs.writeFileSync(filePath, jsonFeedData)

    console.log(`RSS feed saved to ${filePath} successfully!`)
  } catch (error) {
    console.error('Error fetching RSS feed:', error)
    core.setFailed(error.message)
  }
}

// Export the function for testing
module.exports = { fetchRssFeed }

// Run the function if this script is the main module
if (require.main === module) {
  fetchRssFeed()
}
