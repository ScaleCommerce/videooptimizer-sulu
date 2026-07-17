// @flow
import {Requester} from 'sulu-admin-bundle/services';

const BASE = '/admin/api/videooptimizer';

// Requester rejects with the raw Response object on non-2xx. Convert that into a
// proper Error carrying the server's { message } and HTTP status, so views can show a
// readable text and branch on "not configured" (428) vs "routes missing" (404).
function toError(message, status) {
    const error = new Error(message);
    error.status = status || null;

    return error;
}

function messageForStatus(status, serverMessage) {
    if (404 === status) {
        // The proxy routes are not registered — a missing installation step, not a runtime failure.
        return 'The VideoOptimizer admin API is not reachable (404). Import its routes in '
            + 'config/routes/sulu_admin.yaml — see the installation guide.';
    }

    return serverMessage || ('Request failed (' + (status || '?') + ')');
}

function normalize(promise) {
    return promise.catch((rejection) => {
        if (rejection && typeof rejection.json === 'function') {
            const status = rejection.status || null;

            return rejection.json().then(
                (data) => {
                    throw toError(messageForStatus(status, data && data.message), status);
                },
                () => {
                    throw toError(messageForStatus(status, null), status);
                }
            );
        }
        throw (rejection instanceof Error ? rejection : new Error(String(rejection)));
    });
}

export function getSettings() {
    return normalize(Requester.get(BASE + '/settings'));
}

export function saveSettings(data: Object) {
    return normalize(Requester.put(BASE + '/settings', data));
}

export function testConnection() {
    return normalize(Requester.post(BASE + '/settings/test', {}));
}

export function clearToken() {
    return normalize(Requester.delete(BASE + '/settings/token'));
}

export function getLibraries() {
    return normalize(Requester.get(BASE + '/libraries')).then((response) => response._embedded.libraries || []);
}

export function createLibrary(data: Object) {
    return normalize(Requester.post(BASE + '/libraries', data));
}

export function updateLibrary(id: string, data: Object) {
    return normalize(Requester.patch(BASE + '/libraries/' + encodeURIComponent(id), data));
}

export function deleteLibrary(id: string) {
    return normalize(Requester.delete(BASE + '/libraries/' + encodeURIComponent(id)));
}

export function reprocessLibrary(id: string) {
    return normalize(Requester.post(BASE + '/libraries/' + encodeURIComponent(id) + '/reprocess', {}));
}

// Codecs and resolutions the organization may enable on a library. Each entry is
// {key, label, access: 'included'|'addon', available: boolean}. Used to render the
// encoding-ladder pickers with proper labels and add-on/upgrade hints.
export function getEncodings() {
    return normalize(Requester.get(BASE + '/encodings')).then((response) => ({
        codecs: response.codecs || [],
        resolutions: response.resolutions || [],
    }));
}

// Loads every video across all libraries as a flat array (newest first). The server resolves the
// cursor pagination behind GET /videos; each item carries library_id so callers can group/filter.
export function getAllVideos() {
    return normalize(Requester.get(BASE + '/videos'))
        .then((response) => response._embedded.videos || []);
}

export function getVideo(uuid: string) {
    return normalize(Requester.get(BASE + '/videos/' + encodeURIComponent(uuid)));
}

// Presigned multipart upload. The token stays server-side: initiate/complete go through the
// proxy, while the file parts are PUT straight to the presigned S3 URLs from the browser.
export function initiateUpload(payload: Object) {
    return normalize(Requester.post(BASE + '/videos/upload/initiate', payload));
}

export function completeUpload(payload: Object) {
    return normalize(Requester.post(BASE + '/videos/upload/complete', payload));
}

// PUTs each file part to its presigned URL and collects the ETags the complete step needs.
// Cross-origin, so no credentials; the bucket must expose ETag via CORS.
export function uploadParts(file: File, parts: Array<Object>, partSize: number) {
    return parts.reduce(
        (chain, part) => chain.then((etags) => {
            const start = (part.partNumber - 1) * partSize;
            const blob = file.slice(start, start + partSize);

            return fetch(part.url, {method: 'PUT', body: blob}).then((response) => {
                if (!response.ok) {
                    throw new Error('Part upload failed (' + response.status + ')');
                }
                const etag = response.headers.get('ETag');
                if (!etag) {
                    throw new Error('Missing ETag on uploaded part — check bucket CORS (expose ETag).');
                }
                etags.push({partNumber: part.partNumber, etag});

                return etags;
            });
        }),
        Promise.resolve([])
    );
}

// Ingests a video from a remote URL — the server downloads it, no browser upload needed.
export function ingestVideoUrl(payload: Object) {
    return normalize(Requester.post(BASE + '/videos/ingest', payload));
}

export function updateVideo(uuid: string, payload: Object) {
    return normalize(Requester.patch(BASE + '/videos/' + encodeURIComponent(uuid), payload));
}

export function deleteVideo(uuid: string) {
    return normalize(Requester.delete(BASE + '/videos/' + encodeURIComponent(uuid)));
}

export function getThumbnails(uuid: string) {
    return normalize(Requester.get(BASE + '/videos/' + encodeURIComponent(uuid) + '/thumbnails'))
        .then((response) => response.thumbnails || []);
}

export function selectThumbnail(uuid: string, index: number) {
    return normalize(Requester.post(BASE + '/videos/' + encodeURIComponent(uuid) + '/thumbnail', {thumbnailIndex: index}));
}

export function initiatePosterUpload(uuid: string, payload: Object) {
    return normalize(Requester.post(BASE + '/videos/' + encodeURIComponent(uuid) + '/poster/initiate', payload));
}

// Single presigned PUT straight to storage (poster is not multipart).
export function uploadPoster(uploadUrl: string, file: File) {
    return fetch(uploadUrl, {method: 'PUT', body: file, headers: {'Content-Type': file.type}}).then((response) => {
        if (!response.ok) {
            throw new Error('Poster upload failed (' + response.status + ')');
        }
    });
}

export function completePosterUpload(uuid: string, key: string) {
    return normalize(Requester.post(BASE + '/videos/' + encodeURIComponent(uuid) + '/poster/complete', {key}));
}

export function selectPoster(uuid: string, payload: Object) {
    return normalize(Requester.post(BASE + '/videos/' + encodeURIComponent(uuid) + '/poster/select', payload));
}

export function deletePoster(uuid: string) {
    return normalize(Requester.delete(BASE + '/videos/' + encodeURIComponent(uuid) + '/poster'));
}

// Polls getVideo until predicate(video) is true (or it fails). Returns the final video.
export function pollVideo(uuid: string, predicate: (video: Object) => boolean, options: Object = {}) {
    const interval = options.interval || 3000;

    return new Promise((resolve, reject) => {
        const tick = () => {
            getVideo(uuid).then((video) => {
                if (options.onTick) {
                    options.onTick(video);
                }
                if (predicate(video)) {
                    resolve(video);
                } else {
                    setTimeout(tick, interval);
                }
            }).catch(reject);
        };
        tick();
    });
}

// Picks a usable poster/thumbnail URL from a VideoOptimizer video payload.
export function posterFor(video: Object): ?string {
    return video.poster_url || video.posterUrl || video.thumbnail_url || video.thumbnail || null;
}

// Poster/thumbnail URLs are STABLE CDN paths cached ~30 days; their content changes in place when
// the poster/thumbnail is switched, so the admin would keep showing a stale image. bustCache() adds
// a token (bumped on every poster/thumbnail mutation) so admin PREVIEWS always show the current
// image. Never use it for the stored field value or the frontend embed — those keep the clean URL.
let cacheBustToken = Date.now();
export function bumpCacheBust() {
    cacheBustToken = Date.now();
}
export function bustCache(url: ?string): ?string {
    if (!url) {
        return url;
    }
    return url + (url.indexOf('?') === -1 ? '?' : '&') + '_=' + cacheBustToken;
}
