const fs = require('fs')
const path = require('path')
const core = require('@actions/core')

async function fetchRssFeed() {
  try {
    const feedExtractor = await import('@extractus/feed-extractor')
    const extract = feedExtractor.extract

    const removePublished = process.env.INPUT_REMOVE_PUBLISHED

    let filePaths
    try {
      // Try to parse the file path as JSON. This will work if it's an array or a "stringified" single path
      const jsonFilePath = JSON.parse(process.env.INPUT_FILE_PATH)
      filePaths = Array.isArray(jsonFilePath) ? jsonFilePath : [jsonFilePath]
    } catch (jsonError) {
      // If JSON.parse fails, assume file path is a regular string (single path) and wrap it in an array
      filePaths = [process.env.INPUT_FILE_PATH]
    }

    let feedUrls
    try {
      // Try to parse the feed URL as JSON. This will work if it's an array or a "stringified" single URL
      const jsonFeedUrl = JSON.parse(process.env.INPUT_FEED_URL)
      feedUrls = Array.isArray(jsonFeedUrl) ? jsonFeedUrl : [jsonFeedUrl]
    } catch (jsonError) {
      // If JSON.parse fails, assume feed is a regular string (single URL) and wrap it in an array
      feedUrls = [process.env.INPUT_FEED_URL]
    }

    let parserOptions
    try {
      parserOptions = JSON.parse(process.env.INPUT_PARSER_OPTIONS || '{}')
    } catch (jsonError) {
      throw new Error(
        `Failed to parse parserOptions input: ${jsonError.message}`
      )
    }

    let fetchOptions
    try {
      fetchOptions = JSON.parse(process.env.INPUT_FETCH_OPTIONS || '{}')
    } catch (jsonError) {
      throw new Error(
        `Failed to parse fetchOptions input: ${jsonError.message}`
      )
    }

    // If parserOptions contains a function as a string, eval it
    try {
      if (
        parserOptions.getExtraEntryFields &&
        typeof parserOptions.getExtraEntryFields === 'string'
      ) {
        parserOptions.getExtraEntryFields = eval(
          `(${parserOptions.getExtraEntryFields})`
        )
      }
    } catch (error) {
      throw new Error(
        `Failed to evaluate getExtraEntryFields function: ${error.message}`
      )
    }

    // Validate feedUrls
    if (
      !feedUrls.length ||
      feedUrls.length === 0 ||
      !feedUrls.every(url => typeof url === 'string' && url.length > 0)
    ) {
      throw new Error(
        'After parsing, feedURL is not an array of non-empty strings'
      )
    }

    if (feedUrls.length !== filePaths.length) {
      throw new Error(
        'After parsing, feedURL and filePath arrays do not have the same length'
      )
    }

    for (const url of feedUrls) {
      try {
        new URL(url) // This will throw an error if url is not a valid URL
      } catch {
        throw new Error(`Invalid URL provided: ${url}`)
      }
    }

    // Validate and convert removePublished to boolean, if provided
    let removePublishedBool = false // Default value
    if (typeof removePublished === 'string') {
      if (removePublished === 'true') {
        removePublishedBool = true
      } else if (removePublished !== 'false') {
        throw new Error('removePublished must be either "true" or "false"')
      }
    }

    // Validate filePath
    if (
      !filePaths.length ||
      filePaths.length === 0 ||
      !filePaths.every(file => typeof file === 'string' && file.length > 0)
    ) {
      throw new Error(
        'After parsing, filePath is not an array of non-empty strings'
      )
    }
    try {
      for (const filePath of filePaths) {
        if (!['.json'].includes(path.extname(filePath).toLowerCase())) {
          throw new Error('File path extension must be .json')
        }
      }
    } catch (error) {
      throw new Error(`File path is invalid: ${error.message}`)
    }

    for (let i = 0; i < feedUrls.length; i++) {
      const feedUrl = feedUrls[i]
      const filePath = filePaths[i]

      // Fetch and parse the feed
      let parsedData
      try {
        parsedData = await extract(feedUrl, parserOptions, fetchOptions)
      } catch (extractError) {
        throw new Error(
          `Failed to fetch or parse feed: ${extractError.message}`
        )
      }

      // Validate parsedData
      if (!parsedData || typeof parsedData !== 'object') {
        throw new Error(`Parsed data is invalid for feed ${feedUrl}`)
      }

      // Remove top-level published field if removePublished is set to true
      if (removePublishedBool) {
        delete parsedData?.published
      }

      try {
        // Check if directory exists; if not, create it
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true })
        }

        // Write the parsed data to the file
        const jsonFeedData = JSON.stringify(parsedData, null, 2)
        fs.writeFileSync(filePath, jsonFeedData)

        console.log(`RSS feed saved to ${filePath} successfully!`)
      } catch (error) {
        throw new Error(`Failed to write to file: ${error.message}`)
      }
    }
  } catch (error) {
    core.setFailed(error.message)
  }
}

// Export the function for testing
module.exports = { fetchRssFeed }

// Run the function if this script is the main module
if (require.main === module) {
  fetchRssFeed()
}
