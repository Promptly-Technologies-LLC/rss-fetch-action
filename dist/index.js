/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 5105:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const fs = __nccwpck_require__(9896)
const path = __nccwpck_require__(6928)

async function fetchRssFeed() {
  const core = await __nccwpck_require__.e(/* import() */ 421).then(__nccwpck_require__.bind(__nccwpck_require__, 6421))

  try {
    const feedExtractor = await __nccwpck_require__.e(/* import() */ 875).then(__nccwpck_require__.bind(__nccwpck_require__, 2875))
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
        parsedData = await extract(feedUrl, parserOptions, url =>
          fetch(url, fetchOptions)
        )
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
if (require.main === require.cache[eval('__filename')]) {
  fetchRssFeed()
}


/***/ }),

/***/ 2613:
/***/ ((module) => {

"use strict";
module.exports = require("assert");

/***/ }),

/***/ 5317:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 6982:
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ 4434:
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ 9896:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 8611:
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ 5692:
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ 9278:
/***/ ((module) => {

"use strict";
module.exports = require("net");

/***/ }),

/***/ 4589:
/***/ ((module) => {

"use strict";
module.exports = require("node:assert");

/***/ }),

/***/ 6698:
/***/ ((module) => {

"use strict";
module.exports = require("node:async_hooks");

/***/ }),

/***/ 4573:
/***/ ((module) => {

"use strict";
module.exports = require("node:buffer");

/***/ }),

/***/ 7540:
/***/ ((module) => {

"use strict";
module.exports = require("node:console");

/***/ }),

/***/ 7598:
/***/ ((module) => {

"use strict";
module.exports = require("node:crypto");

/***/ }),

/***/ 3053:
/***/ ((module) => {

"use strict";
module.exports = require("node:diagnostics_channel");

/***/ }),

/***/ 610:
/***/ ((module) => {

"use strict";
module.exports = require("node:dns");

/***/ }),

/***/ 8474:
/***/ ((module) => {

"use strict";
module.exports = require("node:events");

/***/ }),

/***/ 7067:
/***/ ((module) => {

"use strict";
module.exports = require("node:http");

/***/ }),

/***/ 2467:
/***/ ((module) => {

"use strict";
module.exports = require("node:http2");

/***/ }),

/***/ 7030:
/***/ ((module) => {

"use strict";
module.exports = require("node:net");

/***/ }),

/***/ 643:
/***/ ((module) => {

"use strict";
module.exports = require("node:perf_hooks");

/***/ }),

/***/ 1792:
/***/ ((module) => {

"use strict";
module.exports = require("node:querystring");

/***/ }),

/***/ 7075:
/***/ ((module) => {

"use strict";
module.exports = require("node:stream");

/***/ }),

/***/ 1692:
/***/ ((module) => {

"use strict";
module.exports = require("node:tls");

/***/ }),

/***/ 3136:
/***/ ((module) => {

"use strict";
module.exports = require("node:url");

/***/ }),

/***/ 7975:
/***/ ((module) => {

"use strict";
module.exports = require("node:util");

/***/ }),

/***/ 3429:
/***/ ((module) => {

"use strict";
module.exports = require("node:util/types");

/***/ }),

/***/ 5919:
/***/ ((module) => {

"use strict";
module.exports = require("node:worker_threads");

/***/ }),

/***/ 8522:
/***/ ((module) => {

"use strict";
module.exports = require("node:zlib");

/***/ }),

/***/ 857:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 6928:
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ 3193:
/***/ ((module) => {

"use strict";
module.exports = require("string_decoder");

/***/ }),

/***/ 3557:
/***/ ((module) => {

"use strict";
module.exports = require("timers");

/***/ }),

/***/ 4756:
/***/ ((module) => {

"use strict";
module.exports = require("tls");

/***/ }),

/***/ 9023:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__nccwpck_require__.m = __webpack_modules__;
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/asset-relocator-loader */
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/******/ 	/* webpack/runtime/create fake namespace object */
/******/ 	(() => {
/******/ 		var getProto = Object.getPrototypeOf ? (obj) => (Object.getPrototypeOf(obj)) : (obj) => (obj.__proto__);
/******/ 		var leafPrototypes;
/******/ 		// create a fake namespace object
/******/ 		// mode & 1: value is a module id, require it
/******/ 		// mode & 2: merge all properties of value into the ns
/******/ 		// mode & 4: return value when already ns object
/******/ 		// mode & 16: return value when it's Promise-like
/******/ 		// mode & 8|1: behave like require
/******/ 		__nccwpck_require__.t = function(value, mode) {
/******/ 			if(mode & 1) value = this(value);
/******/ 			if(mode & 8) return value;
/******/ 			if(typeof value === 'object' && value) {
/******/ 				if((mode & 4) && value.__esModule) return value;
/******/ 				if((mode & 16) && typeof value.then === 'function') return value;
/******/ 			}
/******/ 			var ns = Object.create(null);
/******/ 			__nccwpck_require__.r(ns);
/******/ 			var def = {};
/******/ 			leafPrototypes = leafPrototypes || [null, getProto({}), getProto([]), getProto(getProto)];
/******/ 			for(var current = mode & 2 && value; typeof current == 'object' && !~leafPrototypes.indexOf(current); current = getProto(current)) {
/******/ 				Object.getOwnPropertyNames(current).forEach((key) => (def[key] = () => (value[key])));
/******/ 			}
/******/ 			def['default'] = () => (value);
/******/ 			__nccwpck_require__.d(ns, def);
/******/ 			return ns;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__nccwpck_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__nccwpck_require__.o(definition, key) && !__nccwpck_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/ensure chunk */
/******/ 	(() => {
/******/ 		__nccwpck_require__.f = {};
/******/ 		// This file contains only the entry chunk.
/******/ 		// The chunk loading function for additional chunks
/******/ 		__nccwpck_require__.e = (chunkId) => {
/******/ 			return Promise.all(Object.keys(__nccwpck_require__.f).reduce((promises, key) => {
/******/ 				__nccwpck_require__.f[key](chunkId, promises);
/******/ 				return promises;
/******/ 			}, []));
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/get javascript chunk filename */
/******/ 	(() => {
/******/ 		// This function allow to reference async chunks
/******/ 		__nccwpck_require__.u = (chunkId) => {
/******/ 			// return url for filenames based on template
/******/ 			return "" + chunkId + ".index.js";
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__nccwpck_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__nccwpck_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/require chunk loading */
/******/ 	(() => {
/******/ 		// no baseURI
/******/ 		
/******/ 		// object to store loaded chunks
/******/ 		// "1" means "loaded", otherwise not loaded yet
/******/ 		var installedChunks = {
/******/ 			792: 1
/******/ 		};
/******/ 		
/******/ 		// no on chunks loaded
/******/ 		
/******/ 		var installChunk = (chunk) => {
/******/ 			var moreModules = chunk.modules, chunkIds = chunk.ids, runtime = chunk.runtime;
/******/ 			for(var moduleId in moreModules) {
/******/ 				if(__nccwpck_require__.o(moreModules, moduleId)) {
/******/ 					__nccwpck_require__.m[moduleId] = moreModules[moduleId];
/******/ 				}
/******/ 			}
/******/ 			if(runtime) runtime(__nccwpck_require__);
/******/ 			for(var i = 0; i < chunkIds.length; i++)
/******/ 				installedChunks[chunkIds[i]] = 1;
/******/ 		
/******/ 		};
/******/ 		
/******/ 		// require() chunk loading for javascript
/******/ 		__nccwpck_require__.f.require = (chunkId, promises) => {
/******/ 			// "1" is the signal for "already loaded"
/******/ 			if(!installedChunks[chunkId]) {
/******/ 				if(true) { // all chunks have JS
/******/ 					installChunk(require("./" + __nccwpck_require__.u(chunkId)));
/******/ 				} else installedChunks[chunkId] = 1;
/******/ 			}
/******/ 		};
/******/ 		
/******/ 		// no external install chunk
/******/ 		
/******/ 		// no HMR
/******/ 		
/******/ 		// no HMR manifest
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __nccwpck_require__(5105);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;