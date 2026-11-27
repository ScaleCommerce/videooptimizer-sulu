"use strict";

require("core-js/modules/es.object.define-property.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.SUBTITLE_MAX_BYTES = void 0;
exports.abortError = abortError;
exports.bumpCacheBust = bumpCacheBust;
exports.bustCache = bustCache;
exports.clearToken = clearToken;
exports.completePosterUpload = completePosterUpload;
exports.completeUpload = completeUpload;
exports.createLibrary = createLibrary;
exports.createSubtitleLanguage = createSubtitleLanguage;
exports.deleteLibrary = deleteLibrary;
exports.deletePoster = deletePoster;
exports.deleteSubtitle = deleteSubtitle;
exports.deleteSubtitleLanguage = deleteSubtitleLanguage;
exports.deleteVideo = deleteVideo;
exports.errorText = errorText;
exports.failureMessage = failureMessage;
exports.fileToBase64 = fileToBase64;
exports.getAllVideos = getAllVideos;
exports.getEncodings = getEncodings;
exports.getLibraries = getLibraries;
exports.getSettings = getSettings;
exports.getSubtitleLanguages = getSubtitleLanguages;
exports.getSubtitles = getSubtitles;
exports.getTags = getTags;
exports.getThumbnails = getThumbnails;
exports.getVideo = getVideo;
exports.getVideoPage = getVideoPage;
exports.ingestVideoUrl = ingestVideoUrl;
exports.initiatePosterUpload = initiatePosterUpload;
exports.initiateUpload = initiateUpload;
exports.isAbortError = isAbortError;
exports.pollVideo = pollVideo;
exports.posterContentType = posterContentType;
exports.posterFor = posterFor;
exports.reprocessLibrary = reprocessLibrary;
exports.saveSettings = saveSettings;
exports.selectPoster = selectPoster;
exports.selectThumbnail = selectThumbnail;
exports.subtitleDownloadUrl = subtitleDownloadUrl;
exports.testConnection = testConnection;
exports.updateLibrary = updateLibrary;
exports.updateVideo = updateVideo;
exports.uploadParts = uploadParts;
exports.uploadPoster = uploadPoster;
exports.uploadSubtitle = uploadSubtitle;
require("core-js/modules/es.array.index-of.js");
require("core-js/modules/es.array.join.js");
require("core-js/modules/es.array.reduce.js");
require("core-js/modules/es.array.slice.js");
require("core-js/modules/es.date.now.js");
require("core-js/modules/es.function.name.js");
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.promise.js");
require("core-js/modules/es.regexp.exec.js");
require("core-js/modules/es.string.split.js");
require("core-js/modules/es.string.trim.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.reduce.js");
require("core-js/modules/web.timers.js");
var _services = require("sulu-admin-bundle/services");
var _utils = require("sulu-admin-bundle/utils");
var BASE = '/admin/api/videooptimizer';

// Requester rejects with the raw Response object on non-2xx. Convert that into a
// proper Error carrying the server's { message } and HTTP status, so views can show a
// readable text and branch on "not configured" (428) vs "routes missing" (404).
function toError(message, status, code, upstream) {
  var error = new Error(message);
  error.status = status || null;
  error.code = code || null;
  error.upstream = !!upstream;
  return error;
}

// The proxy answers upstream auth problems and outages with a 502 and a code (never 401/403, which
// would log the editor out of Sulu). Show those in the editor's language; a 403 keeps the API's own
// text when it sent one (plan limit, trial restriction, suspended organization).
function messageForCode(code, serverMessage, upstream) {
  if ('token_rejected' === code) {
    return (0, _utils.translate)('scale_videooptimizer.error_token_rejected');
  }
  if ('token_forbidden' === code) {
    return upstream && serverMessage ? serverMessage : (0, _utils.translate)('scale_videooptimizer.error_token_forbidden');
  }
  if ('subtitle_language_in_use' === code) {
    return (0, _utils.translate)('scale_videooptimizer.error_subtitle_language_in_use');
  }
  if ('unreachable' === code) {
    return (0, _utils.translate)('scale_videooptimizer.error_unreachable');
  }
  return null;
}
function messageForStatus(status, serverMessage, code, upstream) {
  var byCode = messageForCode(code, serverMessage, upstream);
  if (byCode) {
    return byCode;
  }
  if (404 === status) {
    // The proxy routes are not registered — a missing installation step, not a runtime failure.
    return 'The VideoOptimizer admin API is not reachable (404). Import its routes in ' + 'config/routes/sulu_admin.yaml — see the installation guide.';
  }
  return serverMessage || 'Request failed (' + (status || '?') + ')';
}
function normalize(promise) {
  return promise["catch"](function (rejection) {
    if (rejection && typeof rejection.json === 'function') {
      var status = rejection.status || null;
      return rejection.json().then(function (data) {
        throw toError(messageForStatus(status, data && data.message, data && data.code, data && data.upstream), status, data && data.code, data && data.upstream);
      }, function () {
        throw toError(messageForStatus(status, null), status);
      });
    }
    throw rejection instanceof Error ? rejection : new Error(String(rejection));
  });
}

// Readable text for a failed request: known API error codes get a translated hint, everything
// else keeps the upstream message.
function errorText(error) {
  if (error && error.code === 'source_url_video_platform') {
    return (0, _utils.translate)('scale_videooptimizer.ingest_platform_link');
  }
  return error && error.message || String(error);
}

// Message for a video that ended in status 'failed': the API's readable reason (e.g. a URL import
// download error) when present, otherwise the generic text.
function failureMessage(video) {
  var reason = video && typeof video.error === 'string' ? video.error.trim() : '';
  return reason ? (0, _utils.translate)('scale_videooptimizer.processing_failed_reason', {
    reason: reason
  }) : (0, _utils.translate)('scale_videooptimizer.processing_failed');
}
function getSettings() {
  return normalize(_services.Requester.get(BASE + '/settings'));
}
function saveSettings(data) {
  return normalize(_services.Requester.put(BASE + '/settings', data));
}
function testConnection() {
  return normalize(_services.Requester.post(BASE + '/settings/test', {}));
}
function clearToken() {
  return normalize(_services.Requester["delete"](BASE + '/settings/token'));
}
function getLibraries() {
  return normalize(_services.Requester.get(BASE + '/libraries')).then(function (response) {
    return response._embedded.libraries || [];
  });
}
function createLibrary(data) {
  return normalize(_services.Requester.post(BASE + '/libraries', data));
}
function updateLibrary(id, data) {
  return normalize(_services.Requester.patch(BASE + '/libraries/' + encodeURIComponent(id), data));
}
function deleteLibrary(id) {
  return normalize(_services.Requester["delete"](BASE + '/libraries/' + encodeURIComponent(id)));
}

// force: also re-encode renditions that are already finished (needed after changing encoding_quality).
function reprocessLibrary(id) {
  var force = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  return normalize(_services.Requester.post(BASE + '/libraries/' + encodeURIComponent(id) + '/reprocess', force ? {
    force: true
  } : {}));
}

// Codecs and resolutions the organization may enable on a library. Each entry is
// {key, label, access: 'included'|'addon', available: boolean}. Used to render the
// encoding-ladder pickers with proper labels and add-on/upgrade hints.
function getEncodings() {
  return normalize(_services.Requester.get(BASE + '/encodings')).then(function (response) {
    return {
      codecs: response.codecs || [],
      resolutions: response.resolutions || []
    };
  });
}

// Loads every video across all libraries as a flat array (newest first). The server resolves the
// cursor pagination behind GET /videos; each item carries library_id so callers can group/filter.
function getAllVideos() {
  return normalize(_services.Requester.get(BASE + '/videos')).then(function (response) {
    return response._embedded.videos || [];
  });
}

// One page of the video list for "Load more": {videos, nextCursor, hasMore}. Optional filters: library, tags
// (comma-separated, videos must carry all of them).
function getVideoPage() {
  var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
    libraryId = _ref.libraryId,
    tags = _ref.tags,
    cursor = _ref.cursor,
    limit = _ref.limit;
  var query = ['limit=' + encodeURIComponent(String(limit || 60))];
  if (libraryId) {
    query.push('library_id=' + encodeURIComponent(libraryId));
  }
  if (cursor) {
    query.push('cursor=' + encodeURIComponent(cursor));
  }
  if (tags) {
    query.push('tags=' + encodeURIComponent(tags));
  }
  return normalize(_services.Requester.get(BASE + '/videos?' + query.join('&'))).then(function (response) {
    return {
      videos: response._embedded && response._embedded.videos || [],
      nextCursor: response.next_cursor || null,
      hasMore: !!response.has_more && !!response.next_cursor
    };
  });
}

// The organization's tags with their video counts, alphabetically: [{name, video_count}].
function getTags() {
  return normalize(_services.Requester.get(BASE + '/tags')).then(function (response) {
    return response._embedded && response._embedded.tags || [];
  });
}

// ---- Subtitles -------------------------------------------------------------------------------------

// The API refuses subtitle files above 2 MB.
var SUBTITLE_MAX_BYTES = exports.SUBTITLE_MAX_BYTES = 2 * 1024 * 1024;
function getSubtitles(uuid) {
  return normalize(_services.Requester.get(BASE + '/videos/' + encodeURIComponent(uuid) + '/subtitles')).then(function (response) {
    return response._embedded && response._embedded.subtitles || [];
  });
}

// Reads a File/Blob as base64 (no data: prefix) — the proxy takes JSON, not multipart.
function fileToBase64(file) {
  return new Promise(function (resolve, reject) {
    var reader = new FileReader();
    reader.onload = function () {
      var result = String(reader.result || '');
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = function () {
      return reject(reader.error || new Error('Could not read the file.'));
    };
    reader.readAsDataURL(file);
  });
}

// Uploads an .srt/.vtt file for one of the organization's subtitle languages; replaces an existing one.
function uploadSubtitle(uuid, _ref2) {
  var file = _ref2.file,
    language = _ref2.language,
    kind = _ref2.kind,
    isDefault = _ref2.isDefault;
  if (file.size > SUBTITLE_MAX_BYTES) {
    return Promise.reject(toError((0, _utils.translate)('scale_videooptimizer.subtitle_too_large'), 413, 'subtitle_too_large'));
  }
  return fileToBase64(file).then(function (contentBase64) {
    return normalize(_services.Requester.post(BASE + '/videos/' + encodeURIComponent(uuid) + '/subtitles', {
      language: language,
      kind: kind,
      isDefault: !!isDefault,
      filename: file.name,
      contentBase64: contentBase64
    }));
  });
}
function deleteSubtitle(uuid, language) {
  return normalize(_services.Requester["delete"](BASE + '/videos/' + encodeURIComponent(uuid) + '/subtitles/' + encodeURIComponent(language)));
}

// Same-origin download link of the stored WebVTT file (the admin session authorizes it).
function subtitleDownloadUrl(uuid, language) {
  return BASE + '/videos/' + encodeURIComponent(uuid) + '/subtitles/' + encodeURIComponent(language);
}
function getSubtitleLanguages() {
  return normalize(_services.Requester.get(BASE + '/subtitle-languages')).then(function (response) {
    return response._embedded && response._embedded.languages || [];
  });
}
function createSubtitleLanguage(code, label) {
  return normalize(_services.Requester.post(BASE + '/subtitle-languages', {
    code: code,
    label: label || undefined
  }));
}
function deleteSubtitleLanguage(code) {
  return normalize(_services.Requester["delete"](BASE + '/subtitle-languages/' + encodeURIComponent(code)));
}
function getVideo(uuid) {
  return normalize(_services.Requester.get(BASE + '/videos/' + encodeURIComponent(uuid)));
}

// Presigned multipart upload. The token stays server-side: initiate/complete go through the
// proxy, while the file parts are PUT straight to the presigned S3 URLs from the browser.
function initiateUpload(payload) {
  return normalize(_services.Requester.post(BASE + '/videos/upload/initiate', payload));
}
function completeUpload(payload) {
  return normalize(_services.Requester.post(BASE + '/videos/upload/complete', payload));
}
function abortError() {
  var error = new Error('Upload aborted');
  error.name = 'AbortError';
  return error;
}
function isAbortError(error) {
  return !!error && error.name === 'AbortError';
}
var PART_ATTEMPTS = 3;
function wait(ms) {
  return new Promise(function (resolve) {
    return setTimeout(resolve, ms);
  });
}

// PUTs one part, retrying network errors and non-2xx answers with backoff (1 s, 2 s). A missing ETag is
// a bucket CORS problem and an aborted upload was cancelled on purpose: neither is retried.
function putPart(url, blob, signal) {
  var attempt = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 1;
  return fetch(url, signal ? {
    method: 'PUT',
    body: blob,
    signal: signal
  } : {
    method: 'PUT',
    body: blob
  }).then(function (response) {
    if (!response.ok) {
      throw new Error('Part upload failed (' + response.status + ')');
    }
    var etag = response.headers.get('ETag');
    if (!etag) {
      var error = new Error('Missing ETag on uploaded part — check bucket CORS (expose ETag).');
      error.noRetry = true;
      throw error;
    }
    return etag;
  })["catch"](function (error) {
    if (signal && signal.aborted || error.noRetry || attempt >= PART_ATTEMPTS) {
      throw error;
    }
    return wait(1000 * Math.pow(2, attempt - 1)).then(function () {
      if (signal && signal.aborted) {
        throw abortError();
      }
      return putPart(url, blob, signal, attempt + 1);
    });
  });
}

// PUTs each file part to its presigned URL and collects the ETags the complete step needs.
// Cross-origin, so no credentials; the bucket must expose ETag via CORS. Every part is retried up to
// three times; onProgress(finishedParts, totalParts) follows each finished part. An optional AbortSignal
// stops the chain (in-flight PUT and remaining parts) with an AbortError. The API has no endpoint to
// abort a multipart upload: storage removes incomplete uploads through its lifecycle rule.
function uploadParts(file, parts, partSize, signal, onProgress) {
  if (signal && signal.aborted) {
    return Promise.reject(abortError());
  }
  return parts.reduce(function (chain, part) {
    return chain.then(function (etags) {
      if (signal && signal.aborted) {
        throw abortError();
      }
      var start = (part.partNumber - 1) * partSize;
      var blob = file.slice(start, start + partSize);
      return putPart(part.url, blob, signal).then(function (etag) {
        etags.push({
          partNumber: part.partNumber,
          etag: etag
        });
        if (onProgress) {
          onProgress(etags.length, parts.length);
        }
        return etags;
      });
    });
  }, Promise.resolve([]));
}

// Ingests a video from a remote URL — the server downloads it, no browser upload needed.
function ingestVideoUrl(payload) {
  return normalize(_services.Requester.post(BASE + '/videos/ingest', payload));
}
function updateVideo(uuid, payload) {
  return normalize(_services.Requester.patch(BASE + '/videos/' + encodeURIComponent(uuid), payload));
}
function deleteVideo(uuid) {
  return normalize(_services.Requester["delete"](BASE + '/videos/' + encodeURIComponent(uuid)));
}
function getThumbnails(uuid) {
  return normalize(_services.Requester.get(BASE + '/videos/' + encodeURIComponent(uuid) + '/thumbnails')).then(function (response) {
    return response.thumbnails || [];
  });
}
function selectThumbnail(uuid, index) {
  return normalize(_services.Requester.post(BASE + '/videos/' + encodeURIComponent(uuid) + '/thumbnail', {
    thumbnailIndex: index
  }));
}
function initiatePosterUpload(uuid, payload) {
  return normalize(_services.Requester.post(BASE + '/videos/' + encodeURIComponent(uuid) + '/poster/initiate', payload));
}

// Single presigned PUT straight to storage (poster is not multipart).
var POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
var POSTER_EXTENSIONS = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp'
};

// Content type the poster API accepts for an image fetched from the Sulu media library: the blob's own type,
// else the media's mimeType, else the file extension (CDNs/proxies may answer application/octet-stream).
function posterContentType(blobType, media) {
  var candidates = [blobType, media && media.mimeType];
  for (var i = 0; i < candidates.length; i++) {
    var type = typeof candidates[i] === 'string' ? candidates[i].split(';')[0].trim().toLowerCase() : '';
    if (POSTER_TYPES.indexOf(type) !== -1) {
      return type;
    }
  }
  var name = String(media && (media.url || media.name || media.title) || '').split(/[?#]/)[0];
  var match = /\.([a-z0-9]+)$/i.exec(name);
  return match && POSTER_EXTENSIONS[match[1].toLowerCase()] || null;
}
function uploadPoster(uploadUrl, file) {
  return fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type
    }
  }).then(function (response) {
    if (!response.ok) {
      throw new Error('Poster upload failed (' + response.status + ')');
    }
  });
}
function completePosterUpload(uuid, key) {
  return normalize(_services.Requester.post(BASE + '/videos/' + encodeURIComponent(uuid) + '/poster/complete', {
    key: key
  }));
}
function selectPoster(uuid, payload) {
  return normalize(_services.Requester.post(BASE + '/videos/' + encodeURIComponent(uuid) + '/poster/select', payload));
}
function deletePoster(uuid) {
  return normalize(_services.Requester["delete"](BASE + '/videos/' + encodeURIComponent(uuid) + '/poster'));
}

// Polls getVideo until predicate(video) is true (or it fails). Returns the final video.
function pollVideo(uuid, predicate) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  var interval = options.interval || 3000;
  // Gives up instead of polling forever (default 30 min at the default interval).
  var maxAttempts = options.maxAttempts || 600;
  var attempts = 0;
  var signal = options.signal;
  return new Promise(function (resolve, reject) {
    var _tick = function tick() {
      // An aborted signal (overlay closed, view left) stops polling.
      if (signal && signal.aborted) {
        reject(abortError());
        return;
      }
      attempts += 1;
      getVideo(uuid).then(function (video) {
        if (signal && signal.aborted) {
          reject(abortError());
          return;
        }
        if (options.onTick) {
          options.onTick(video);
        }
        if (predicate(video)) {
          resolve(video);
        } else if (attempts >= maxAttempts) {
          reject(new Error((0, _utils.translate)('scale_videooptimizer.poll_timeout')));
        } else {
          setTimeout(_tick, interval);
        }
      })["catch"](reject);
    };
    _tick();
  });
}

// Picks a usable poster/thumbnail URL from a VideoOptimizer video payload.
function posterFor(video) {
  return video.poster_url || video.posterUrl || video.thumbnail_url || video.thumbnail || null;
}

// Poster/thumbnail URLs are STABLE CDN paths cached ~30 days; their content changes in place when
// the poster/thumbnail is switched, so the admin would keep showing a stale image. bustCache() adds
// a token (bumped on every poster/thumbnail mutation) so admin PREVIEWS always show the current
// image. Never use it for the stored field value or the frontend embed — those keep the clean URL.
var cacheBustToken = Date.now();
function bumpCacheBust() {
  cacheBustToken = Date.now();
}
function bustCache(url) {
  if (!url) {
    return url;
  }
  return url + (url.indexOf('?') === -1 ? '?' : '&') + '_=' + cacheBustToken;
}