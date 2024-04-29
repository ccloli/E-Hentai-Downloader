/*
MIT License

Copyright (c) 2019 dnsev-h

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.xScripts = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var GalleryIdentifier =
/*#__PURE__*/
function () {
  function GalleryIdentifier(id, token) {
    _classCallCheck(this, GalleryIdentifier);

    this.id = id;
    this.token = token;
  }

  _createClass(GalleryIdentifier, null, [{
    key: "createFromUrl",
    value: function createFromUrl(url) {
      var match = /^.*?\/\/.+?\/(.*?)(\?.*?)?(#.*?)?$/.exec(url);

      if (match === null) {
        return null;
      }

      var path = match[1].replace(/^\/+|\/+$/g, "").replace(/\/{2,}/g, "/").split("/");

      if (path[0] !== "g" || path.length < 3) {
        return null;
      }

      var id = parseInt(path[1], 10);
      return Number.isNaN(id) ? null : new GalleryIdentifier(id, path[2]);
    }
  }]);

  return GalleryIdentifier;
}();

module.exports = {
  GalleryIdentifier: GalleryIdentifier
};

},{}],2:[function(require,module,exports){
"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

var GalleryIdentifier = require("../gallery-identifier").GalleryIdentifier;

function toStringOrDefault(value, defaultValue) {
  return typeof value === "string" ? value : defaultValue;
}

function toNumberOrDefault(value, defaultValue) {
  return Number.isNaN(value) ? defaultValue : value;
}

function galleryIdentifiertoCommonJson(identifier, defaultValue) {
  if (identifier === null || _typeof(identifier) !== "object") {
    return defaultValue;
  }

  return {
    gid: identifier.id,
    token: identifier.token
  };
}

function newerVersionsToCommonJson(newerVersions) {
  var result = [];

  if (Array.isArray(newerVersions)) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = newerVersions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var newerVersion = _step.value;
        result.push({
          gallery: galleryIdentifiertoCommonJson(newerVersion.identifier, null) || galleryIdentifiertoCommonJson(new GalleryIdentifier(0, ""), null),
          name: toStringOrDefault(newerVersion.name),
          date_uploaded: toNumberOrDefault(newerVersion.dateUploaded)
        });
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  return result;
}

function tagsToCommonJson(tags) {
  var result = {};

  if (tags !== null && _typeof(tags) === "object" && !Array.isArray(tags)) {
    for (var namespace in tags) {
      if (!Object.prototype.hasOwnProperty.call(tags, namespace)) {
        continue;
      }

      var tagList = tags[namespace];
      result[namespace] = _toConsumableArray(tagList);
    }
  }

  return result;
}

function toCommonFavoriteCategory(info) {
  if (info.favoriteCategory === null) {
    return null;
  }

  return {
    id: toNumberOrDefault(info.favoriteCategory.index, 0),
    title: toStringOrDefault(info.favoriteCategory.title, "")
  };
}

function toCommonFullGalleryInfoJson(info) {
  return {
    gallery: galleryIdentifiertoCommonJson(info.identifier, null) || galleryIdentifiertoCommonJson(new GalleryIdentifier(0, ""), null),
    title: toStringOrDefault(info.title, ""),
    title_original: toStringOrDefault(info.titleOriginal, ""),
    date_uploaded: toNumberOrDefault(info.dateUploaded, 0),
    category: toStringOrDefault(info.category, ""),
    uploader: toStringOrDefault(info.uploader, ""),
    rating: {
      average: toNumberOrDefault(info.ratingAverage, 0),
      count: toNumberOrDefault(info.ratingCount, 0)
    },
    favorites: {
      category: info.favoriteCategory !== null ? toNumberOrDefault(info.favoriteCategory.index, -1) : -1,
      category_title: info.favoriteCategory !== null ? toStringOrDefault(info.favoriteCategory.title, "") : "",
      count: toNumberOrDefault(info.favoriteCount, 0)
    },
    parent: galleryIdentifiertoCommonJson(info.parent, null),
    newer_versions: newerVersionsToCommonJson(info.newerVersions),
    thumbnail: toStringOrDefault(info.mainThumbnailUrl, ""),
    thumbnail_size: toStringOrDefault(info.thumbnailSize, ""),
    thumbnail_rows: toNumberOrDefault(info.thumbnailRows, 0),
    image_count: toNumberOrDefault(info.fileCount, 0),
    images_resized: false,
    total_file_size_approx: toNumberOrDefault(info.approximateTotalFileSize, 0),
    visible: info.visible === true,
    visible_reason: toStringOrDefault(info.visibleReason, ""),
    language: toStringOrDefault(info.language, ""),
    translated: info.translated === true,
    tags: tagsToCommonJson(info.tags),
    // New
    tags_have_namespace: info.tagsHaveNamespace === true,
    torrent_count: toNumberOrDefault(info.torrentCount, 0),
    archiver_key: toStringOrDefault(info.archiverKey, null),
    source: toStringOrDefault(info.source, null),
    source_site: toStringOrDefault(info.sourceSite, null),
    date_generated: toNumberOrDefault(info.dateGenerated, 0)
  };
}

function toCommonGalleryInfoJson(info) {
  var date = new Date(toNumberOrDefault(info.dateUploaded, 0));
  return {
    title: toStringOrDefault(info.title, ""),
    title_original: toStringOrDefault(info.titleOriginal, ""),
    category: toStringOrDefault(info.category, ""),
    tags: tagsToCommonJson(info.tags),
    language: toStringOrDefault(info.language, ""),
    translated: !!info.translated,
    favorite_category: toCommonFavoriteCategory(info),
    upload_date: [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()],
    source: {
      site: toStringOrDefault(info.sourceSite, ""),
      gid: info.identifier !== null ? toNumberOrDefault(info.identifier.id, 0) : 0,
      token: info.identifier !== null ? toStringOrDefault(info.identifier.token, 0) : 0,
      parent_gallery: galleryIdentifiertoCommonJson(info.parent, null),
      newer_versions: newerVersionsToCommonJson(info.newerVersions)
    }
  };
}

function toCommonJson(info) {
  return {
    gallery_info: toCommonGalleryInfoJson(info),
    gallery_info_full: toCommonFullGalleryInfoJson(info)
  };
}

module.exports = {
  toCommonJson: toCommonJson
};

},{"../gallery-identifier":1}],3:[function(require,module,exports){
"use strict";

var types = require("./types");

var utils = require("./utils");

function getCssUrl(urlString) {
  var pattern = /url\s*\(\s*(['"])?/;
  var match = pattern.exec(urlString);

  if (match === null) {
    return null;
  }

  var quote = match[1] || "";
  urlString = urlString.substr(match.index + match[0].length - quote.length);
  var pattern2 = new RegExp("(".concat(quote, ")\\s*\\)\\s*$"));
  var match2 = pattern2.exec(urlString);

  if (match2 === null) {
    return null;
  }

  var url = urlString.substr(0, match2.index + match2[1].length);
  var url2 = url;

  if (!quote) {
    url2 = url.replace(/"/g, "\\\"");
    url2 = "\"".concat(url2, "\"");
  } else if (quote === "'") {
    url2 = url.substr(1, url.length - 2);
    url2 = url2.replace(/\\'/g, "'");
    url2 = "\"".concat(url2, "\"");
  }

  try {
    return JSON.parse(url2);
  } catch (e) {
    return url;
  }
}

function getTimestamp(text) {
  var match = /([0-9]+)-([0-9]+)-([0-9]+)\s+([0-9]+):([0-9]+)/.exec(text);

  if (match === null) {
    return null;
  }

  return Date.UTC(parseInt(match[1], 10), // year
  parseInt(match[2], 10) - 1, // month
  parseInt(match[3], 10), // day
  parseInt(match[4], 10), // hours
  parseInt(match[5], 10), // minutes
  0, // seconds
  0); // milliseconds
}

function getTitle(html) {
  var node = html.querySelector("#gn");
  return node !== null ? node.textContent.trim() : null;
}

function getTitleOriginal(html) {
  var node = html.querySelector("#gj");
  return node !== null ? node.textContent.trim() : null;
}

function getMainThumbnailUrl(html) {
  var node = html.querySelector("#gd1>div");

  if (node === null) {
    return null;
  }

  var url = getCssUrl(node.style.backgroundImage);

  if (url !== null) {
    return url;
  }

  var img = node.querySelector("img[src]");
  return img !== null ? img.getAttribute("src") : null;
}

function getCategory(html) {
  var node = html.querySelector("#gdc>div[onclick]");

  if (node === null) {
    return null;
  }

  var pattern = /['"].*?\/\/.+?\/(.*?)(\?.*?)?(#.*?)?['"]/;
  var match = pattern.exec(node.getAttribute("onclick") || "");
  return match !== null ? match[1] : null;
}

function getUploader(html) {
  var node = html.querySelector("#gdn>a");

  if (node === null) {
    return null;
  }

  var pattern = /^.*?\/\/.+?\/(.*?)(\?.*?)?(#.*?)?$/;
  var match = pattern.exec(node.getAttribute("href") || "");
  return match !== null ? match[1].split("/")[1] || "" : null;
}

function getRatingCount(html) {
  var node = html.querySelector("#rating_count");

  if (node === null) {
    return null;
  }

  var value = parseInt(node.textContent.trim(), 10);
  return Number.isNaN(value) ? null : value;
}

function getRatingAverage(html) {
  var node = html.querySelector("#rating_label");

  if (node === null) {
    return null;
  }

  var pattern = /average:\s*([0-9\.]+)/i;
  var match = pattern.exec(node.textContent);

  if (match === null) {
    return null;
  }

  var value = parseFloat(match[1]);
  return Number.isNaN(value) ? null : value;
}

function getFavoriteCount(html) {
  var node = html.querySelector("#favcount");

  if (node === null) {
    return null;
  }

  var pattern = /\s*([0-9]+|once)/i;
  var match = pattern.exec(node.textContent);

  if (match === null) {
    return null;
  }

  var match1 = match[1];
  return match1.toLowerCase() === "once" ? 1 : parseInt(match1, 10);
}

function getFavoriteCategory(html) {
  var node = html.querySelector("#fav>div.i");

  if (node === null) {
    return null;
  }

  var title = node.getAttribute("title") || "";
  var pattern = /background-position\s*:\s*\d+(?:px)?\s+(-?\d+)(?:px)/;
  var match = pattern.exec(node.getAttribute("style") || "");
  var index = match !== null ? Math.floor((Math.abs(parseInt(match[1], 10)) - 2) / 19) : -1;
  return {
    index: index,
    title: title
  };
}

function getThumbnailSize(html) {
  var nodes = html.querySelectorAll("#gdo4>.nosel");

  if (nodes.length < 2) {
    return null;
  }

  return nodes[0].classList.contains("ths") ? "normal" : "large";
}

function getThumbnailRows(html) {
  var nodes = html.querySelectorAll("#gdo2>.nosel");

  if (nodes.length === 0) {
    return null;
  }

  var pattern = /\s*([0-9]+)/;
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = nodes[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var node = _step.value;

      if (node.classList.contains("ths")) {
        var match = pattern.exec(node.textContent);

        if (match !== null) {
          return parseInt(match[1], 10);
        }
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator["return"] != null) {
        _iterator["return"]();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return null;
}

function getTags(html) {
  var pattern = /(.+):/;
  var groups = html.querySelectorAll("#taglist tr");
  var tags = {};
  var _iteratorNormalCompletion2 = true;
  var _didIteratorError2 = false;
  var _iteratorError2 = undefined;

  try {
    for (var _iterator2 = groups[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
      var group = _step2.value;
      var tds = group.querySelectorAll("td");

      if (tds.length === 0) {
        continue;
      }

      var match = pattern.exec(tds[0].textContent);
      var namespace = match !== null ? match[1].trim() : "";
      var namespaceTags = void 0;

      if (tags.hasOwnProperty(namespace)) {
        namespaceTags = tags[namespace];
      } else {
        namespaceTags = [];
        tags[namespace] = namespaceTags;
      }

      var tagDivs = tds[tds.length - 1].querySelectorAll("div");
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = tagDivs[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var div = _step3.value;
          var link = div.querySelector("a");

          if (link === null) {
            continue;
          }

          var tag = link.textContent.trim();
          namespaceTags.push(tag);
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3["return"] != null) {
            _iterator3["return"]();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }
    }
  } catch (err) {
    _didIteratorError2 = true;
    _iteratorError2 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
        _iterator2["return"]();
      }
    } finally {
      if (_didIteratorError2) {
        throw _iteratorError2;
      }
    }
  }

  return tags;
}

function getDetailsNodes(html) {
  return html.querySelectorAll("#gdd tr");
}

function getDateUploaded(detailsNodes) {
  if (detailsNodes.length <= 0) {
    return null;
  }

  var node = detailsNodes[0].querySelector(".gdt2");
  return node !== null ? getTimestamp(node.textContent) : null;
}

function getVisibleInfo(detailsNodes) {
  var visible = true;
  var visibleReason = null;

  if (detailsNodes.length > 2) {
    var node = detailsNodes[2].querySelector(".gdt2");

    if (node !== null) {
      var pattern = /no\s+\((.+?)\)/i;
      var match = pattern.exec(node.textContent);

      if (match !== null) {
        visible = false;
        visibleReason = match[1].trim();
      }
    }
  }

  return {
    visible: visible,
    visibleReason: visibleReason
  };
}

function getLanguageInfo(detailsNodes) {
  var language = null;
  var translated = false;

  if (detailsNodes.length > 3) {
    var node = detailsNodes[3].querySelector(".gdt2");

    if (node !== null) {
      var textNode = node.firstChild;

      if (textNode !== null && textNode.nodeType === Node.TEXT_NODE) {
        language = textNode.nodeValue.trim();
      }

      var trNode = node.querySelector(".halp");
      translated = trNode !== null && trNode.textContent.trim().toLowerCase() === "tr";
    }
  }

  return {
    language: language,
    translated: translated
  };
}

function getApproximateTotalFileSize(detailsNodes) {
  if (detailsNodes.length <= 4) {
    return null;
  }

  var node = detailsNodes[4].querySelector(".gdt2");

  if (node === null) {
    return null;
  }

  var pattern = /([0-9\.]+)\s*(\w+)/i;
  var match = pattern.exec(node.textContent);
  return match !== null ? utils.getBytesSizeFromLabel(match[1], match[2]) : null;
}

function getFileCount(detailsNodes) {
  if (detailsNodes.length <= 5) {
    return null;
  }

  var node = detailsNodes[5].querySelector(".gdt2");

  if (node === null) {
    return null;
  }

  var pattern = /([0-9,]+)\s*pages/i;
  var match = pattern.exec(node.textContent);
  return match !== null ? parseInt(match[1].replace(/,/g, ""), 10) : null;
}

function getParent(detailsNodes) {
  if (detailsNodes.length <= 1) {
    return null;
  }

  var node = detailsNodes[1].querySelector(".gdt2>a");

  if (node === null) {
    return null;
  }

  var info = utils.getGalleryIdentifierAndPageFromUrl(node.getAttribute("href") || "");
  return info !== null ? info.identifier : null;
}

function getNewerVersions(html) {
  var results = [];
  var nodes = html.querySelectorAll("#gnd>a");
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = nodes[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var node = _step4.value;
      var info = utils.getGalleryIdentifierAndPageFromUrl(node.getAttribute("href") || "");

      if (info === null) {
        continue;
      }

      var galleryInfo = {
        identifier: info.identifier,
        name: node.textContent.trim(),
        dateUploaded: null
      };

      if (node.nextSibling !== null) {
        galleryInfo.dateUploaded = getTimestamp(node.nextSibling.textContent);
      }

      results.push(galleryInfo);
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4["return"] != null) {
        _iterator4["return"]();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return results;
}

function getTorrentCount(html) {
  var nodes = html.querySelectorAll("#gd5 .g2>a");
  var pattern = /\btorrent\s+download\s*\(\s*(\d+)\s*\)/i;
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = nodes[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var node = _step5.value;
      var match = pattern.exec(node.textContent);

      if (match !== null) {
        return parseInt(match[1], 10);
      }
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5["return"] != null) {
        _iterator5["return"]();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  return null;
}

function getArchiverKey(html) {
  var nodes = html.querySelectorAll("#gd5 .g2>a");
  var pattern = /\barchive\s+download\b/i;
  var _iteratorNormalCompletion6 = true;
  var _didIteratorError6 = false;
  var _iteratorError6 = undefined;

  try {
    for (var _iterator6 = nodes[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
      var node = _step6.value;
      var match = pattern.exec(node.textContent);

      if (match !== null) {
        var pattern2 = /&or=([^'"]*)['"]/;
        var match2 = pattern2.exec(node.getAttribute("onclick") || "");
        return match2 !== null ? match2[1] : null;
      }
    }
  } catch (err) {
    _didIteratorError6 = true;
    _iteratorError6 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion6 && _iterator6["return"] != null) {
        _iterator6["return"]();
      }
    } finally {
      if (_didIteratorError6) {
        throw _iteratorError6;
      }
    }
  }

  return null;
}

function populateGalleryInfoFromHtml(info, html) {
  // General
  info.title = getTitle(html);
  info.titleOriginal = getTitleOriginal(html);
  info.mainThumbnailUrl = getMainThumbnailUrl(html);
  info.category = getCategory(html);
  info.uploader = getUploader(html);
  info.ratingCount = getRatingCount(html);
  info.ratingAverage = getRatingAverage(html);
  info.favoriteCount = getFavoriteCount(html);
  info.favoriteCategory = getFavoriteCategory(html);
  info.thumbnailSize = getThumbnailSize(html);
  info.thumbnailRows = getThumbnailRows(html);
  info.newerVersions = getNewerVersions(html);
  info.torrentCount = getTorrentCount(html);
  info.archiverKey = getArchiverKey(html); // Details

  var detailsNodes = getDetailsNodes(html);
  info.dateUploaded = getDateUploaded(detailsNodes);
  info.parent = getParent(detailsNodes);
  var visibleInfo = getVisibleInfo(detailsNodes);
  info.visible = visibleInfo.visible;
  info.visibleReason = visibleInfo.visibleReason;
  var languageInfo = getLanguageInfo(detailsNodes);
  info.language = languageInfo.language;
  info.translated = languageInfo.translated;
  info.approximateTotalFileSize = getApproximateTotalFileSize(detailsNodes);
  info.fileCount = getFileCount(detailsNodes); // Tags

  info.tags = getTags(html);
  info.tagsHaveNamespace = true;
}

function getFromHtml(html, url) {
  var link = html.querySelector(".ptt td.ptds>a[href],.ptt td.ptdd>a[href]");

  if (link === null) {
    return null;
  }

  var idPage = utils.getGalleryIdentifierAndPageFromUrl(link.getAttribute("href") || "");

  if (idPage === null) {
    return null;
  }

  var info = new types.GalleryInfo();
  info.identifier = idPage.identifier;
  info.currentPage = idPage.page;
  info.source = "html";
  populateGalleryInfoFromHtml(info, html);
  info.sourceSite = utils.getSourceSiteFromUrl(url);
  info.dateGenerated = Date.now();
  return info;
}

module.exports = getFromHtml;

},{"./types":4,"./utils":5}],4:[function(require,module,exports){
"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var GalleryIdentifier = require("../gallery-identifier").GalleryIdentifier;

var GalleryInfo = function GalleryInfo() {
  _classCallCheck(this, GalleryInfo);

  this.identifier = null;
  this.title = null;
  this.titleOriginal = null;
  this.dateUploaded = null;
  this.category = null;
  this.uploader = null;
  this.ratingAverage = null;
  this.ratingCount = null;
  this.favoriteCategory = null;
  this.favoriteCount = null;
  this.mainThumbnailUrl = null;
  this.thumbnailSize = null;
  this.thumbnailRows = null;
  this.fileCount = null;
  this.approximateTotalFileSize = null;
  this.visible = true;
  this.visibleReason = null;
  this.language = null;
  this.translated = null;
  this.archiverKey = null;
  this.torrentCount = null;
  this.tags = null;
  this.tagsHaveNamespace = null;
  this.currentPage = null;
  this.parent = null;
  this.newerVersions = null;
  this.source = null;
  this.sourceSite = null;
  this.dateGenerated = null;
};

module.exports = {
  GalleryIdentifier: GalleryIdentifier,
  GalleryInfo: GalleryInfo
};

},{"../gallery-identifier":1}],5:[function(require,module,exports){
"use strict";

var types = require("./types");

var sizeLabelToBytesPrefixes = ["b", "kb", "mb", "gb"];

function getGalleryPageFromUrl(url) {
  var match = /\?(?:(|[\w\W]*?&)p=([\+\-]?\d+))?/.exec(url);

  if (match !== null && match[1]) {
    var page = parseInt(match[1], 10);

    if (!Number.isNaN(page)) {
      return page;
    }
  }

  return null;
}

function getGalleryIdentifierAndPageFromUrl(url) {
  var identifier = types.GalleryIdentifier.createFromUrl(url);

  if (identifier === null) {
    return null;
  }

  var page = getGalleryPageFromUrl(url);
  return {
    identifier: identifier,
    page: page
  };
}

function getBytesSizeFromLabel(number, label) {
  var i = sizeLabelToBytesPrefixes.indexOf(label.toLowerCase());

  if (i < 0) {
    i = 0;
  }

  return Math.floor(parseFloat(number) * Math.pow(1024, i));
}

function getSourceSiteFromUrl(url) {
  var pattern = /^(?:(?:[a-z][a-z0-9\+\-\.]*:\/*|\/{2,})([^\/]*))?(\/?[\w\W]*)$/i;
  var match = pattern.exec(url);

  if (match !== null && match[1]) {
    var host = match[1].toLowerCase();

    if (host.indexOf("exhentai") >= 0) {
      return "exhentai";
    }

    if (host.indexOf("e-hentai") >= 0) {
      return "e-hentai";
    }
  }

  return null;
}

module.exports = {
  getGalleryIdentifierAndPageFromUrl: getGalleryIdentifierAndPageFromUrl,
  getBytesSizeFromLabel: getBytesSizeFromLabel,
  getSourceSiteFromUrl: getSourceSiteFromUrl
};

},{"./types":4}],6:[function(require,module,exports){
"use strict";

module.exports.getFromHtml = require('./.x/src/api/gallery-info/get-from-html');
module.exports.toCommonJson = require('./.x/src/api/gallery-info/common-json').toCommonJson;

},{"./.x/src/api/gallery-info/common-json":2,"./.x/src/api/gallery-info/get-from-html":3}]},{},[6])(6)
});
