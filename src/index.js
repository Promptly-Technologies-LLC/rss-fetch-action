const fetch = require('isomorphic-fetch')
const fs = require('fs')
const path = require('path')
const { parseStringPromise } = require('xml2js')
const core = require('@actions/core')

async function fetchRssFeed() {
  try {
    const feedUrl = process.env.INPUT_FEED_URL
    const filePath = process.env.INPUT_FILE_PATH
    const removeLastBuildDate =
      process.env.INPUT_REMOVE_LAST_BUILD_DATE === 'true'

    if (!feedUrl) {
      throw new Error('Feed URL is not provided')
    }

    if (!filePath) {
      throw new Error('File path is not provided')
    } else if (
      !['.json', '.xml'].includes(path.extname(filePath).toLowerCase())
    ) {
      throw new Error('File extension must be .json or .xml')
    }

    let response
    try {
      response = await fetch(feedUrl)
    } catch (err) {
      throw new Error(
        'Failed to fetch RSS feed due to network error or invalid URL'
      )
    }

    if (!response.ok) {
      throw new Error(
        `Failed to fetch RSS feed (${response.status} ${response.statusText})`
      )
    }

    let feedData = await response.text()

    // Optionally remove the lastBuildDate tag from XML
    if (removeLastBuildDate) {
      feedData = feedData.replace(/<lastBuildDate>.*?<\/lastBuildDate>/g, '')
    }

    // Parse the modified XML to JSON
    let parsedData
    try {
      parsedData = await parseStringPromise(feedData, { explicitArray: false })
    } catch (err) {
      throw new Error(
        'Failed to parse RSS feed. The feed might not be valid XML.'
      )
    }

    const ext = path.extname(filePath).toLowerCase()
    const finalFilePath = filePath
    const dir = path.dirname(finalFilePath)

    try {
      // Check if directory exists, if not create it
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      if (ext === '.json') {
        const jsonFeedData = JSON.stringify(parsedData, null, 2)
        fs.writeFileSync(finalFilePath, jsonFeedData)
      } else if (ext === '.xml') {
        fs.writeFileSync(finalFilePath, feedData)
      }

      console.log(`RSS feed saved to ${finalFilePath} successfully!`)
    } catch (err) {
      throw new Error(
        `Failed to write the file due to permissions or other file system error: ${err.message}`
      )
    }
  } catch (error) {
    console.error('Error fetching RSS feed:', error)
    core.setFailed(error.message)
  }
}

module.exports = { fetchRssFeed }

// Run the function if this script is the main module
if (require.main === module) {
  fetchRssFeed()
}
