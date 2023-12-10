# RSS Feed Fetch Action

[![Github Super-Linter](https://github.com/Promptly-Technologies-LLC/rss-fetch-action/actions/workflows/linter.yml/badge.svg)](https://github.com/Promptly-Technologies-LLC/rss-fetch-action/actions/workflows/linter.yml)
![CI](https://github.com/actions/javascript-action/actions/workflows/ci.yml/badge.svg)

## Introduction

The RSS Feed Fetch Action is a GitHub Action designed to automate the fetching of RSS feeds. It fetches an RSS feed from a given URL and saves it to a specified file in your GitHub repository. This action is particularly useful for populating content on GitHub Pages websites or other static site generators.

This GitHub Action is a wrapper around the [feed-extractor](https://www.npmjs.com/package/@extractus/feed-extractor) library's `extract` function. Understanding the `extract` function's parameters will enable you to make the most of this GitHub Action. This tool offers powerful parsing and standardization across a wide range of different feed formats, while also enabling you to save feeds in an unopinionated and non-standardized way if you so choose.

## Features

- Fetches RSS, Atom, RDF, and JSON feeds
- Customizable parser and fetch options
- Saves the fetched RSS feed to a specified `.json` file
- Optionally removes the `published` field from the fetched feed to prevent unnecessary commits

## Usage

Here's a basic example to add to your GitHub Actions workflow YAML file:

```yaml
name: Fetch RSS Feed

on:
  push:
    branches:
      - main

jobs:
  fetch-rss:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Fetch RSS Feed
      uses: Promptly-Technologies-LLC/rss-fetch-action@v2
      with:
        feed_url: 'https://example.com/rss'
        file_path: './feed.json'
    
    - name: Commit and push changes to repository
      uses: stefanzweifel/git-auto-commit-action@v4
      with:
        commit_message: 'Update RSS feed'
        file_pattern: '*.json'

```

In this workflow, we fetch the RSS feed at `https://example.com/rss` and save it to the file `./feed.json`. We then commit and push the changes to the repository.

By default, the saved output will have the format:

```
{
  title: String,
  link: String,
  description: String,
  generator: String,
  language: String,
  published: ISO Date String,
  entries: Array[
    {
      id: String,
      title: String,
      link: String,
      description: String,
      published: ISO Datetime String
    },
    // ...
  ]
}
```

## Advanced Usage

To customize the fetch and parser options used in calling `feed-extractor`, you can use the `parser_options` and `fetch_options` inputs. For example, if you want to fetch the original, unaltered feed rather than impose a standardized format, you can set `parser_options` to `{"normalization": false}`. For more information on the available options, see the [feed-extractor README](https://www.npmjs.com/package/@extractus/feed-extractor#extract).

A `remove_published` option is also available. If set to `true`, this option will remove the `published` field from the fetched feed. This is useful if you want to prevent unnecessary commits to your repository. Many Atom feed providers update the `published` field once an hour, causing the feed to appear as if it has been updated (fail a `diff` check) even though none of the actual content has changed. You can prevent this from happening by removing the `published` field.

In the example below, we fetch a Substack Atom feed and save it to the file `./feed.json`. Because we want to get entire blog posts rather than just titles and descriptions, we request the 'content:encoded' field for each entry in the Atom feed. We also request a human-readable date format rather than an ISO timestamp. To achieve this, we pass a `parser_options` object with `useISODateFormat` and `getExtraEntryFields`. And finally, we opt to remove the published date from the blog feed, since many Atom feed providers update this field once an hour, causing unnecessary commits to the repository.

```yaml
name: Fetch RSS Feed

on:
  push:
    branches:
      - main

jobs:
  fetch-rss:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout code
      uses: actions/checkout@v4

    - name: Fetch RSS Feed
      uses: Promptly-Technologies-LLC/rss-fetch-action@v2
      with:
        feed_url: https://knowledgeworkersguide.substack.com/feed
        file_path: ./feed.json
        parser_options: "{\"useISODateFormat\": false, \"getExtraEntryFields\": \"(feedEntry) => { return { 'content:encoded': feedEntry['content:encoded'] || '' }; }\"}"
        fetch_options: "{}"
        remove_published: true
    
    - name: Commit and push changes to repository
      uses: stefanzweifel/git-auto-commit-action@v4
      with:
        commit_message: 'Update RSS feed'
        file_pattern: '*.json'

```

Because of the `parser_options` we specified in this example, the output of the sample code would include the `content:encoded` field for each entry, and the `published` fields would be human-readable date strings rather than ISO timestamps.

## Inputs

### `feed_url`

**Required**  
The URL(s) of the RSS feed(s) you want to fetch. Can be either a string or a JSON array (of same length as `file_path`).

### `file_path`

**Required**  
The relative file path(s) where you want to save the fetched RSS feed(s). Can be either a string or a JSON array (of same length as `feed_url`).

### `parser_options`

**Optional**
A JSON string representing parser options. This maps directly to the parserOptions parameter in the feed-extractor library's extract function. For example, to disable ISO date formatting, you can pass {"useISODateFormat": false}.

### `fetch_options`

**Optional**
A JSON string representing fetch options. This maps directly to the fetchOptions parameter in the feed-extractor library's extract function. Note that you will need to enclose JSON in quotes and to escape interior quote marks with backslashes (e.g, `\"`). For example, to set custom headers, you can pass `"{\"headers\": {\"user-agent\": \"Custom-Agent\"}}"`.

### `remove_published`

**Optional**
A boolean value indicating whether to remove the `published` field from the fetched feed.
