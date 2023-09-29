# RSS Feed Fetch Action

[![Github Super-Linter](https://github.com/Promptly-Technologies-LLC/rss-fetch-action/actions/workflows/linter.yml/badge.svg)](https://github.com/Promptly-Technologies-LLC/rss-fetch-action/actions/workflows/linter.yml)
![CI](https://github.com/actions/javascript-action/actions/workflows/ci.yml/badge.svg)

## Introduction

The RSS Feed Fetch Action is a GitHub Action that fetches an RSS feed from a given URL and saves it to a specified file. It is intended as a simple tool for automating the process of fetching and storing RSS feeds in your GitHub repository for deployment to a Github Pages website. In contrast to feed aggregators that force a bunch of different feeds into the same schema (often losing information along the way), RSS Feed Fetch fetches a single feed and handles and saves it in an unopinionated way.

The RSS Feed Fetch Action supports a variety of different feed types, including RSS 1.0, RSS 2.0, Atom, RDF, and JSON. It also supports saving the feed in either `.json` or `.xml` format. Since some RSS formats include a last build date, which changes frequently, the RSS Feed Fetch Action also supports removing the `lastBuildDate` tag from the fetched feed, which can be useful for preventing unnecessary commits to your repository.

## Features

- Fetches an RSS feed from a given URL
- Saves the fetched RSS feed to a specified file path (either `.json` or `.xml`)
- Option to remove the `lastBuildDate` tag for easier diffing

## Usage

To use this action, you'll need to set it up in your GitHub Actions workflow YAML file. Here's an example workflow:

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
      uses: Promptly-Technologies-LLC/rss-fetch-action@v1
      with:
        feed_url: 'https://example.com/rss-feed'
        file_path: 'path/to/save/rss-feed.xml'
        remove_last_build_date: true
    
    - name: Commit and push changes to repository
      uses: stefanzweifel/git-auto-commit-action@v4
      with:
        commit_message: 'Update RSS feed'
        file_pattern: '*.xml *.json'

```

## Inputs

### `feed_url`

**Required**  
The URL of the RSS feed you want to fetch.

### `file_path`

**Required**  
The relative file path where you want to save the fetched RSS feed.

### `remove_last_build_date`

**Optional**  
Set to `true` if you want to remove the `lastBuildDate` tag from the fetched RSS feed. This will prevent pushing a new file if `lastBuildDate` is the only field that has changed. (This field typically changes much more frequently than other fields, as many RSS feed providers rebuild feeds once per hour.)
Default: `false`

## Examples

### Basic Example

```yaml
- name: Fetch RSS Feed
  uses: Promptly-Technologies-LLC/rss-fetch-action@v1
  with:
    feed_url: 'https://example.com/rss-feed'
    file_path: 'path/to/save/rss-feed.xml'
```

### Remove `lastBuildDate` Tag

```yaml
- name: Fetch RSS Feed
  uses: Promptly-Technologies-LLC/rss-fetch-action@v1
  with:
    feed_url: 'https://example.com/rss-feed'
    file_path: 'path/to/save/rss-feed.xml'
    remove_last_build_date: true
```
