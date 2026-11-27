"use strict";

require("core-js/modules/es.object.define-property.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.MAX_TAGS = exports.MAX_METADATA = void 0;
exports.metadataPatch = metadataPatch;
exports.metadataRows = metadataRows;
exports.parseTags = parseTags;
exports.sameTags = sameTags;
exports.validateMetadata = validateMetadata;
exports.validateTags = validateTags;
require("core-js/modules/es.array.every.js");
require("core-js/modules/es.array.for-each.js");
require("core-js/modules/es.array.map.js");
require("core-js/modules/es.array.some.js");
require("core-js/modules/es.array.sort.js");
require("core-js/modules/es.object.keys.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.regexp.test.js");
require("core-js/modules/es.string.trim.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.every.js");
require("core-js/modules/esnext.iterator.for-each.js");
require("core-js/modules/esnext.iterator.map.js");
require("core-js/modules/esnext.iterator.some.js");
require("core-js/modules/web.dom-collections.for-each.js");
// Tags and metadata of a video: parsing, validation and the PATCH payload. The limits mirror the API
// (and the proxy, which validates again): 20 tags of 1-50 characters without commas; 10 metadata keys
// of 1-40 characters `a-z 0-9 _ . -` (starting with a letter or digit) with string values of 1-64 characters.
var MAX_TAGS = exports.MAX_TAGS = 20;
var MAX_METADATA = exports.MAX_METADATA = 10;
var KEY_PATTERN = /^[a-z0-9][a-z0-9_.-]{0,39}$/;

// "Promo, 2026,, promo" -> ["Promo", "2026"]: trimmed, no empties, unique ignoring case (first spelling wins).
function parseTags(text) {
  var seen = {};
  var tags = [];
  text.split(',').forEach(function (part) {
    var tag = part.trim();
    var folded = tag.toLowerCase();
    if (tag !== '' && !seen[folded]) {
      seen[folded] = true;
      tags.push(tag);
    }
  });
  return tags;
}

// Translation key of the first problem, or null.
function validateTags(tags) {
  if (tags.length > MAX_TAGS) {
    return 'scale_videooptimizer.tags_too_many';
  }
  if (tags.some(function (tag) {
    return tag.length > 50;
  })) {
    return 'scale_videooptimizer.tag_too_long';
  }
  return null;
}
function metadataRows(metadata) {
  return Object.keys(metadata || {}).sort().map(function (key) {
    return {
      key: key,
      value: String((metadata || {})[key])
    };
  });
}

// Translation key of the first problem in the edited rows, or null.
function validateMetadata(rows) {
  var keys = {};
  for (var i = 0; i < rows.length; i++) {
    var key = rows[i].key.trim();
    var value = rows[i].value.trim();
    if (key === '' && value === '') {
      continue;
    }
    if (!KEY_PATTERN.test(key)) {
      return 'scale_videooptimizer.metadata_key_invalid';
    }
    if (keys[key]) {
      return 'scale_videooptimizer.metadata_key_duplicate';
    }
    keys[key] = true;
    if (value === '' || value.length > 64) {
      return 'scale_videooptimizer.metadata_value_invalid';
    }
  }
  if (Object.keys(keys).length > MAX_METADATA) {
    return 'scale_videooptimizer.metadata_too_many';
  }
  return null;
}

// The API merges metadata: a key sent is set, a key with null is removed, keys left out stay.
// Returns only what changed, or null when nothing did.
function metadataPatch(original, rows) {
  var before = original || {};
  var after = {};
  rows.forEach(function (row) {
    var key = row.key.trim();
    if (key !== '') {
      after[key] = row.value.trim();
    }
  });
  var patch = {};
  Object.keys(after).forEach(function (key) {
    if (before[key] !== after[key]) {
      patch[key] = after[key];
    }
  });
  Object.keys(before).forEach(function (key) {
    if (!(key in after)) {
      patch[key] = null;
    }
  });
  return Object.keys(patch).length > 0 ? patch : null;
}
function sameTags(a, b) {
  return a.length === b.length && a.every(function (tag, index) {
    return tag === b[index];
  });
}