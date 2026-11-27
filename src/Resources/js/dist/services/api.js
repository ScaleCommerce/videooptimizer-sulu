"use strict";

require("core-js/modules/es.object.define-property.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.abortError = abortError;
exports.bumpCacheBust = bumpCacheBust;
exports.bustCache = bustCache;
exports.clearToken = clearToken;
exports.completePosterUpload = completePosterUpload;
exports.completeUpload = completeUpload;
exports.createLibrary = createLibrary;
exports.deleteLibrary = deleteLibrary;
exports.deletePoster = deletePoster;
exports.deleteVideo = deleteVideo;
exports.errorText = errorText;
exports.failureMessage = failureMessage;
exports.getAllVideos = getAllVideos;
exports.getEncodings = getEncodings;
exports.getLibraries = getLibraries;
exports.getSettings = getSettings;
exports.getThumbnails = getThumbnails;
exports.getVideo = getVideo;
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
exports.testConnection = testConnection;
exports.updateLibrary = updateLibrary;
exports.updateVideo = updateVideo;
exports.uploadParts = uploadParts;
exports.uploadPoster = uploadPoster;
require("core-js/modules/es.array.index-of.js");
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
function toError(message, status, code) {
  var error = new Error(message);
  error.status = status || null;
  error.code = code || null;
  return error;
}
function messageForStatus(status, serverMessage) {
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
        throw toError(messageForStatus(status, data && data.message), status, data && data.code);
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

// PUTs each file part to its presigned URL and collects the ETags the complete step needs.
// Cross-origin, so no credentials; the bucket must expose ETag via CORS.
// An optional AbortSignal stops the chain (in-flight PUT and remaining parts) with an AbortError.
function uploadParts(file, parts, partSize, signal) {
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
      return fetch(part.url, signal ? {
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
          throw new Error('Missing ETag on uploaded part — check bucket CORS (expose ETag).');
        }
        etags.push({
          partNumber: part.partNumber,
          etag: etag
        });
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
  return new Promise(function (resolve, reject) {
    var _tick = function tick() {
      attempts += 1;
      getVideo(uuid).then(function (video) {
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