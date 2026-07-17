"use strict";

require("core-js/modules/es.object.define-property.js");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.bumpCacheBust = bumpCacheBust;
exports.bustCache = bustCache;
exports.clearToken = clearToken;
exports.completePosterUpload = completePosterUpload;
exports.completeUpload = completeUpload;
exports.createLibrary = createLibrary;
exports.deleteLibrary = deleteLibrary;
exports.deletePoster = deletePoster;
exports.deleteVideo = deleteVideo;
exports.getAllVideos = getAllVideos;
exports.getEncodings = getEncodings;
exports.getLibraries = getLibraries;
exports.getSettings = getSettings;
exports.getThumbnails = getThumbnails;
exports.getVideo = getVideo;
exports.ingestVideoUrl = ingestVideoUrl;
exports.initiatePosterUpload = initiatePosterUpload;
exports.initiateUpload = initiateUpload;
exports.pollVideo = pollVideo;
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
require("core-js/modules/es.object.to-string.js");
require("core-js/modules/es.promise.js");
require("core-js/modules/esnext.iterator.constructor.js");
require("core-js/modules/esnext.iterator.reduce.js");
require("core-js/modules/web.timers.js");
var _services = require("sulu-admin-bundle/services");
var BASE = '/admin/api/videooptimizer';

// Requester rejects with the raw Response object on non-2xx. Convert that into a
// proper Error carrying the server's { message } and HTTP status, so views can show a
// readable text and branch on "not configured" (428) vs "routes missing" (404).
function toError(message, status) {
  var error = new Error(message);
  error.status = status || null;
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
        throw toError(messageForStatus(status, data && data.message), status);
      }, function () {
        throw toError(messageForStatus(status, null), status);
      });
    }
    throw rejection instanceof Error ? rejection : new Error(String(rejection));
  });
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
function reprocessLibrary(id) {
  return normalize(_services.Requester.post(BASE + '/libraries/' + encodeURIComponent(id) + '/reprocess', {}));
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

// PUTs each file part to its presigned URL and collects the ETags the complete step needs.
// Cross-origin, so no credentials; the bucket must expose ETag via CORS.
function uploadParts(file, parts, partSize) {
  return parts.reduce(function (chain, part) {
    return chain.then(function (etags) {
      var start = (part.partNumber - 1) * partSize;
      var blob = file.slice(start, start + partSize);
      return fetch(part.url, {
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
  return new Promise(function (resolve, reject) {
    var _tick = function tick() {
      getVideo(uuid).then(function (video) {
        if (options.onTick) {
          options.onTick(video);
        }
        if (predicate(video)) {
          resolve(video);
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