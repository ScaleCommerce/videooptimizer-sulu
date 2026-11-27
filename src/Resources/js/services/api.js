// @flow
import {Requester} from 'sulu-admin-bundle/services';
import {translate} from 'sulu-admin-bundle/utils';

const BASE = '/admin/api/videooptimizer';

// Requester rejects with the raw Response object on non-2xx. Convert that into a
// proper Error carrying the server's { message } and HTTP status, so views can show a
// readable text and branch on "not configured" (428) vs "routes missing" (404).
function toError(message, status, code, upstream) {
    const error = new Error(message);
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
        return translate('scale_videooptimizer.error_token_rejected');
    }
    if ('token_forbidden' === code) {
        return upstream && serverMessage ? serverMessage : translate('scale_videooptimizer.error_token_forbidden');
    }
    if ('unreachable' === code) {
        return translate('scale_videooptimizer.error_unreachable');
    }

    return null;
}

function messageForStatus(status, serverMessage, code, upstream) {
    const byCode = messageForCode(code, serverMessage, upstream);
    if (byCode) {
        return byCode;
    }

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
                    throw toError(messageForStatus(status, data && data.message, data && data.code, data && data.upstream), status, data && data.code, data && data.upstream);
                },
                () => {
                    throw toError(messageForStatus(status, null), status);
                }
            );
        }
        throw (rejection instanceof Error ? rejection : new Error(String(rejection)));
    });
}

// Readable text for a failed request: known API error codes get a translated hint, everything
// else keeps the upstream message.
export function errorText(error: Object): string {
    if (error && error.code === 'source_url_video_platform') {
        return translate('scale_videooptimizer.ingest_platform_link');
    }

    return (error && error.message) || String(error);
}

// Message for a video that ended in status 'failed': the API's readable reason (e.g. a URL import
// download error) when present, otherwise the generic text.
export function failureMessage(video: Object): string {
    const reason = video && typeof video.error === 'string' ? video.error.trim() : '';

    return reason
        ? translate('scale_videooptimizer.processing_failed_reason', {reason})
        : translate('scale_videooptimizer.processing_failed');
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

// force: also re-encode renditions that are already finished (needed after changing encoding_quality).
export function reprocessLibrary(id: string, force: boolean = false) {
    return normalize(Requester.post(BASE + '/libraries/' + encodeURIComponent(id) + '/reprocess', force ? {force: true} : {}));
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

export function abortError() {
    const error = new Error('Upload aborted');
    error.name = 'AbortError';

    return error;
}

export function isAbortError(error: ?Object): boolean {
    return !!error && error.name === 'AbortError';
}

// PUTs each file part to its presigned URL and collects the ETags the complete step needs.
// Cross-origin, so no credentials; the bucket must expose ETag via CORS.
// An optional AbortSignal stops the chain (in-flight PUT and remaining parts) with an AbortError.
export function uploadParts(file: File, parts: Array<Object>, partSize: number, signal: ?AbortSignal) {
    if (signal && signal.aborted) {
        return Promise.reject(abortError());
    }

    return parts.reduce(
        (chain, part) => chain.then((etags) => {
            if (signal && signal.aborted) {
                throw abortError();
            }
            const start = (part.partNumber - 1) * partSize;
            const blob = file.slice(start, start + partSize);

            return fetch(part.url, signal ? {method: 'PUT', body: blob, signal} : {method: 'PUT', body: blob}).then((response) => {
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
const POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const POSTER_EXTENSIONS = {jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp'};

// Content type the poster API accepts for an image fetched from the Sulu media library: the blob's own type,
// else the media's mimeType, else the file extension (CDNs/proxies may answer application/octet-stream).
export function posterContentType(blobType: ?string, media: ?Object): ?string {
    const candidates = [blobType, media && media.mimeType];
    for (let i = 0; i < candidates.length; i++) {
        const type = typeof candidates[i] === 'string' ? candidates[i].split(';')[0].trim().toLowerCase() : '';
        if (POSTER_TYPES.indexOf(type) !== -1) {
            return type;
        }
    }

    const name = String((media && (media.url || media.name || media.title)) || '').split(/[?#]/)[0];
    const match = /\.([a-z0-9]+)$/i.exec(name);

    return (match && POSTER_EXTENSIONS[match[1].toLowerCase()]) || null;
}

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
    // Gives up instead of polling forever (default 30 min at the default interval).
    const maxAttempts = options.maxAttempts || 600;
    let attempts = 0;

    const signal = options.signal;

    return new Promise((resolve, reject) => {
        const tick = () => {
            // An aborted signal (overlay closed, view left) stops polling.
            if (signal && signal.aborted) {
                reject(abortError());

                return;
            }
            attempts += 1;
            getVideo(uuid).then((video) => {
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
                    reject(new Error(translate('scale_videooptimizer.poll_timeout')));
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
