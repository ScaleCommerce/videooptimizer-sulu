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
    if ('subtitle_language_in_use' === code) {
        return translate('scale_videooptimizer.error_subtitle_language_in_use');
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

// One page of the video list for "Load more": {videos, nextCursor, hasMore}. Optional filters: library, tags
// (comma-separated, videos must carry all of them).
export function getVideoPage({libraryId, tags, cursor, limit}: Object = {}) {
    const query = ['limit=' + encodeURIComponent(String(limit || 60))];
    if (libraryId) {
        query.push('library_id=' + encodeURIComponent(libraryId));
    }
    if (cursor) {
        query.push('cursor=' + encodeURIComponent(cursor));
    }
    if (tags) {
        query.push('tags=' + encodeURIComponent(tags));
    }

    return normalize(Requester.get(BASE + '/videos?' + query.join('&'))).then((response) => ({
        videos: (response._embedded && response._embedded.videos) || [],
        nextCursor: response.next_cursor || null,
        hasMore: !!response.has_more && !!response.next_cursor,
    }));
}

// ---- Subtitles -------------------------------------------------------------------------------------

// The API refuses subtitle files above 2 MB.
export const SUBTITLE_MAX_BYTES = 2 * 1024 * 1024;

export function getSubtitles(uuid: string) {
    return normalize(Requester.get(BASE + '/videos/' + encodeURIComponent(uuid) + '/subtitles'))
        .then((response) => (response._embedded && response._embedded.subtitles) || []);
}

// Reads a File/Blob as base64 (no data: prefix) — the proxy takes JSON, not multipart.
export function fileToBase64(file: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = String(reader.result || '');
            resolve(result.slice(result.indexOf(',') + 1));
        };
        reader.onerror = () => reject(reader.error || new Error('Could not read the file.'));
        reader.readAsDataURL(file);
    });
}

// Uploads an .srt/.vtt file for one of the organization's subtitle languages; replaces an existing one.
export function uploadSubtitle(uuid: string, {file, language, kind, isDefault}: Object) {
    if (file.size > SUBTITLE_MAX_BYTES) {
        return Promise.reject(toError(translate('scale_videooptimizer.subtitle_too_large'), 413, 'subtitle_too_large'));
    }

    return fileToBase64(file).then((contentBase64) => normalize(Requester.post(
        BASE + '/videos/' + encodeURIComponent(uuid) + '/subtitles',
        {language, kind, isDefault: !!isDefault, filename: file.name, contentBase64}
    )));
}

export function deleteSubtitle(uuid: string, language: string) {
    return normalize(Requester.delete(BASE + '/videos/' + encodeURIComponent(uuid) + '/subtitles/' + encodeURIComponent(language)));
}

// Same-origin download link of the stored WebVTT file (the admin session authorizes it).
export function subtitleDownloadUrl(uuid: string, language: string): string {
    return BASE + '/videos/' + encodeURIComponent(uuid) + '/subtitles/' + encodeURIComponent(language);
}

export function getSubtitleLanguages() {
    return normalize(Requester.get(BASE + '/subtitle-languages'))
        .then((response) => (response._embedded && response._embedded.languages) || []);
}

export function createSubtitleLanguage(code: string, label: ?string) {
    return normalize(Requester.post(BASE + '/subtitle-languages', {code, label: label || undefined}));
}

export function deleteSubtitleLanguage(code: string) {
    return normalize(Requester.delete(BASE + '/subtitle-languages/' + encodeURIComponent(code)));
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

const PART_ATTEMPTS = 3;

function wait(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// PUTs one part, retrying network errors and non-2xx answers with backoff (1 s, 2 s). A missing ETag is
// a bucket CORS problem and an aborted upload was cancelled on purpose: neither is retried.
function putPart(url: string, blob: Blob, signal: ?AbortSignal, attempt: number = 1) {
    return fetch(url, signal ? {method: 'PUT', body: blob, signal} : {method: 'PUT', body: blob})
        .then((response) => {
            if (!response.ok) {
                throw new Error('Part upload failed (' + response.status + ')');
            }
            const etag = response.headers.get('ETag');
            if (!etag) {
                const error = new Error('Missing ETag on uploaded part — check bucket CORS (expose ETag).');
                error.noRetry = true;
                throw error;
            }

            return etag;
        })
        .catch((error) => {
            if ((signal && signal.aborted) || error.noRetry || attempt >= PART_ATTEMPTS) {
                throw error;
            }

            return wait(1000 * Math.pow(2, attempt - 1)).then(() => {
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
export function uploadParts(file: File, parts: Array<Object>, partSize: number, signal: ?AbortSignal, onProgress: ?(done: number, total: number) => void) {
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

            return putPart(part.url, blob, signal).then((etag) => {
                etags.push({partNumber: part.partNumber, etag});
                if (onProgress) {
                    onProgress(etags.length, parts.length);
                }

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
