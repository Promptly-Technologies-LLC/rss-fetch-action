// index.js
const fetch = require('isomorphic-fetch')
const fs = require('fs')
const path = require('path')
const { parseStringPromise } = require('xml2js')
const core = require('@actions/core')

async function fetchRssFeed() {
  try {
    const feedUrl = process.env.INPUT_FEED_URL
    const filePath = process.env.INPUT_FILE_PATH

    if (!feedUrl) {
      throw new Error('Feed URL is not provided')
    }

    const response = await fetch(feedUrl)
    if (!response.ok) {
      throw new Error(
        `Failed to fetch RSS feed (${response.status} ${response.statusText})`
      )
    }

    const feedData = await response.text()
    const parsedData = await parseStringPromise(feedData, {
      explicitArray: false
    })
    const jsonFeedData = JSON.stringify(parsedData, null, 2)

    if (filePath) {
      const ext = path.extname(filePath)
      if (ext && ext !== '.json') {
        throw new Error('File extension must be .json')
      }
      const finalFilePath = ext ? filePath : `${filePath}.json`
      const dir = path.dirname(finalFilePath)
      fs.accessSync(dir, fs.constants.W_OK)
      fs.writeFileSync(finalFilePath, jsonFeedData)
      console.log(`RSS feed saved to ${finalFilePath} successfully!`)
    } else {
      console.log('No file path provided; RSS feed not saved to file.')
    }

    core.setOutput('feed', jsonFeedData)
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
