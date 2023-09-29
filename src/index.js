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

    // Get the file path, extension, and directory
    const ext = path.extname(filePath).toLowerCase()
    const dir = path.dirname(filePath)

    // Get the feed
    let feedData = await response.text();

    let parsedData;
    try {
      // Remove the lastBuildDate property if removeLastBuildDate is true
      if (removeLastBuildDate) {
        feedData = feedData.replace(/<lastBuildDate>.*?<\/lastBuildDate>/g, '');
      }
      // Try to parse the feed data as XML
      parsedData = await parseStringPromise(feedData, { explicitArray: false });
    } catch (err) {
      // If the feed data is not in XML format, try to parse it as JSON
      try {
        parsedData = JSON.parse(feedData);
      } catch (err) {
        throw new Error('Unknown feed format. Only XML and JSON are supported.');
      }
      // Throw an error if the feed is JSON but the file extension is .xml
      if (ext === '.xml') {
        throw new Error('Converting JSON feed to XML output is not supported.');
      }
      // Remove the lastBuildDate property if removeLastBuildDate is true
      if (removeLastBuildDate && parsedData.rss && parsedData.rss.channel && parsedData.rss.channel.lastBuildDate) {
        delete parsedData.rss.channel.lastBuildDate;
      }
    }

    try {
      // Check if directory exists; if not, create it
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
      }

      // Write the feed data to the file
      if (ext === '.json') {
        const jsonFeedData = JSON.stringify(parsedData, null, 2);
        fs.writeFileSync(filePath, jsonFeedData);
      } else if (ext === '.xml') {
        // If extension is .xml, use the original XML feed data
        fs.writeFileSync(filePath, feedData);
      }      

      console.log(`RSS feed saved to ${filePath} successfully!`)
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
