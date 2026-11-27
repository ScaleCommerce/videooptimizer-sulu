import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Requester} from 'sulu-admin-bundle/services';
import {
    abortError,
    bustCache,
    bumpCacheBust,
    errorText,
    failureMessage,
    createSubtitleLanguage,
    deleteSubtitle,
    deleteSubtitleLanguage,
    fileToBase64,
    getAllVideos,
    getSavings,
    getSubtitleLanguages,
    getSubtitles,
    subtitleDownloadUrl,
    uploadSubtitle,
    isAbortError,
    pollVideo,
    posterContentType,
    posterFor,
    reprocessLibrary,
    updateVideo,
    uploadParts,
} from '../../src/Resources/js/services/api';

function rejection(status, body) {
    return {status, json: () => (body === undefined ? Promise.reject(new Error('no json')) : Promise.resolve(body))};
}

beforeEach(() => {
    vi.restoreAllMocks();
    Object.values(Requester).forEach((spy) => spy.mockReset());
});

describe('request normalisation', () => {
    it('turns a rejected Response into an Error with message, status and code', async () => {
        Requester.get.mockRejectedValue(rejection(400, {message: 'Nope', code: 'source_url_video_platform'}));

        const error = await getAllVideos().catch((e) => e);

        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Nope');
        expect(error.status).toBe(400);
        expect(error.code).toBe('source_url_video_platform');
    });

    it('explains a missing route on 404 instead of passing the server text', async () => {
        Requester.get.mockRejectedValue(rejection(404, {message: 'Not Found'}));

        const error = await getAllVideos().catch((e) => e);

        expect(error.message).toMatch(/sulu_admin\.yaml/);
    });

    it('falls back to a generic message when the body is not JSON', async () => {
        Requester.get.mockRejectedValue(rejection(500));

        expect((await getAllVideos().catch((e) => e)).message).toBe('Request failed (500)');
    });

    it('passes real errors through unchanged', async () => {
        const boom = new Error('network down');
        Requester.get.mockRejectedValue(boom);

        expect(await getAllVideos().catch((e) => e)).toBe(boom);
    });

    it('sends the force flag only when asked for', async () => {
        Requester.post.mockResolvedValue({});

        await reprocessLibrary('lib 1');
        await reprocessLibrary('lib 1', true);

        expect(Requester.post).toHaveBeenNthCalledWith(1, '/admin/api/videooptimizer/libraries/lib%201/reprocess', {});
        expect(Requester.post).toHaveBeenNthCalledWith(2, '/admin/api/videooptimizer/libraries/lib%201/reprocess', {force: true});
    });

    it('patches a video by its encoded uuid', async () => {
        Requester.patch.mockResolvedValue({});

        await updateVideo('a/b', {title: 'x'});

        expect(Requester.patch).toHaveBeenCalledWith('/admin/api/videooptimizer/videos/a%2Fb', {title: 'x'});
    });
});

describe('error codes from the proxy', () => {
    it('explains a rejected token in the editor language', async () => {
        Requester.get.mockRejectedValue(rejection(502, {message: 'English text', code: 'token_rejected'}));

        const error = await getAllVideos().catch((e) => e);

        expect(error.message).toBe('scale_videooptimizer.error_token_rejected');
        expect(error.status).toBe(502);
    });

    it('keeps the API text for a 403 that carries one (plan limit, trial, suspended organization)', async () => {
        Requester.get.mockRejectedValue(rejection(502, {message: 'Library limit reached.', code: 'token_forbidden', upstream: true}));

        expect((await getAllVideos().catch((e) => e)).message).toBe('Library limit reached.');
    });

    it('falls back to a hint for a 403 without an API text', async () => {
        Requester.get.mockRejectedValue(rejection(502, {message: 'generic', code: 'token_forbidden'}));

        expect((await getAllVideos().catch((e) => e)).message).toBe('scale_videooptimizer.error_token_forbidden');
    });

    it('shows a neutral text when VideoOptimizer is unreachable', async () => {
        Requester.get.mockRejectedValue(rejection(502, {message: 'x', code: 'unreachable'}));

        expect((await getAllVideos().catch((e) => e)).message).toBe('scale_videooptimizer.error_unreachable');
    });
});

describe('messages', () => {
    it('translates the video platform error code', () => {
        expect(errorText({code: 'source_url_video_platform', message: 'x'})).toBe('scale_videooptimizer.ingest_platform_link');
        expect(errorText(new Error('plain'))).toBe('plain');
    });

    it('shows the failure reason when the API reports one', () => {
        expect(failureMessage({error: ' source returned status 403 '})).toContain('source returned status 403');
        expect(failureMessage({})).toBe('scale_videooptimizer.processing_failed');
    });
});

describe('posters', () => {
    it('accepts the blob type, then the media mimeType, then the file extension', () => {
        expect(posterContentType('image/png; charset=x', null)).toBe('image/png');
        expect(posterContentType('application/octet-stream', {mimeType: 'image/webp'})).toBe('image/webp');
        expect(posterContentType('', {url: '/uploads/media/a.JPG?v=1'})).toBe('image/jpeg');
        expect(posterContentType('image/gif', {url: '/a.gif'})).toBeNull();
    });

    it('prefers the active poster url and busts the cache with a token', () => {
        expect(posterFor({poster_url: 'a', thumbnail_url: 'b'})).toBe('a');
        expect(posterFor({})).toBeNull();

        bumpCacheBust();
        expect(bustCache('https://cdn/x.jpg')).toMatch(/^https:\/\/cdn\/x\.jpg\?_=\d+$/);
        expect(bustCache('https://cdn/x.jpg?w=1')).toMatch(/\?w=1&_=\d+$/);
        expect(bustCache(null)).toBeNull();
    });
});

describe('savings', () => {
    it('sends the range only as a pair and the optional filters', async () => {
        Requester.get.mockResolvedValue({traffic_available: true});

        await getSavings({from: '2026-11-01', to: '2026-11-30', libraryId: 'lib 1'});
        await getSavings({from: '2026-11-01'});
        await getSavings();

        expect(Requester.get).toHaveBeenNthCalledWith(1, '/admin/api/videooptimizer/savings?from=2026-11-01&to=2026-11-30&library_id=lib%201');
        expect(Requester.get).toHaveBeenNthCalledWith(2, '/admin/api/videooptimizer/savings');
        expect(Requester.get).toHaveBeenNthCalledWith(3, '/admin/api/videooptimizer/savings');
    });
});

describe('subtitles', () => {
    it('lists the subtitles of a video and the organization languages', async () => {
        Requester.get
            .mockResolvedValueOnce({_embedded: {subtitles: [{language: 'de'}]}})
            .mockResolvedValueOnce({_embedded: {languages: [{code: 'de', label: 'Deutsch'}]}});

        expect(await getSubtitles('u')).toEqual([{language: 'de'}]);
        expect(await getSubtitleLanguages()).toEqual([{code: 'de', label: 'Deutsch'}]);
        expect(Requester.get).toHaveBeenNthCalledWith(1, '/admin/api/videooptimizer/videos/u/subtitles');
        expect(Requester.get).toHaveBeenNthCalledWith(2, '/admin/api/videooptimizer/subtitle-languages');
    });

    it('encodes a file as base64 without the data: prefix', async () => {
        expect(await fileToBase64(new Blob(['WEBVTT']))).toBe(btoa('WEBVTT'));
    });

    it('uploads the file as JSON for the proxy', async () => {
        Requester.post.mockResolvedValue({subtitle: {language: 'de'}, skipped_cues: 0});
        const file = new File(['1\n00:00:01,000 --> 00:00:02,000\nHi\n'], 'a.srt');

        await uploadSubtitle('u', {file, language: 'de', kind: 'captions', isDefault: true});

        const [url, body] = Requester.post.mock.calls[0];
        expect(url).toBe('/admin/api/videooptimizer/videos/u/subtitles');
        expect(body).toMatchObject({language: 'de', kind: 'captions', isDefault: true, filename: 'a.srt'});
        expect(atob(body.contentBase64)).toContain('Hi');
    });

    it('refuses a file above 2 MB without sending it', async () => {
        const file = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.srt');

        const error = await uploadSubtitle('u', {file, language: 'de'}).catch((e) => e);

        expect(error.message).toBe('scale_videooptimizer.subtitle_too_large');
        expect(Requester.post).not.toHaveBeenCalled();
    });

    it('deletes subtitles and languages by encoded code and builds the download link', async () => {
        Requester.delete.mockResolvedValue(null);
        Requester.post.mockResolvedValue({code: 'de-x-simple'});

        await deleteSubtitle('u', 'de-CH');
        await deleteSubtitleLanguage('de-x-simple');
        await createSubtitleLanguage('de-x-simple', '');

        expect(Requester.delete).toHaveBeenNthCalledWith(1, '/admin/api/videooptimizer/videos/u/subtitles/de-CH');
        expect(Requester.delete).toHaveBeenNthCalledWith(2, '/admin/api/videooptimizer/subtitle-languages/de-x-simple');
        expect(Requester.post).toHaveBeenCalledWith('/admin/api/videooptimizer/subtitle-languages', {code: 'de-x-simple', label: undefined});
        expect(subtitleDownloadUrl('u', 'de')).toBe('/admin/api/videooptimizer/videos/u/subtitles/de');
    });

    it('explains a language that is still in use', async () => {
        Requester.delete.mockRejectedValue(rejection(409, {message: 'in use', code: 'subtitle_language_in_use'}));

        expect((await deleteSubtitleLanguage('de').catch((e) => e)).message).toBe('scale_videooptimizer.error_subtitle_language_in_use');
    });
});

describe('uploadParts', () => {
    const file = new Blob(['abcdefghij']);
    const parts = [{partNumber: 1, url: 'https://s3/1'}, {partNumber: 2, url: 'https://s3/2'}];

    it('PUTs every part and collects the ETags', async () => {
        const bodies = [];
        vi.stubGlobal('fetch', vi.fn(async (url, init) => {
            bodies.push(init.body.size);

            return {ok: true, status: 200, headers: {get: () => '"etag-' + url.slice(-1) + '"'}};
        }));

        const etags = await uploadParts(file, parts, 6);

        expect(etags).toEqual([{partNumber: 1, etag: '"etag-1"'}, {partNumber: 2, etag: '"etag-2"'}]);
        expect(bodies).toEqual([6, 4]);
    });

    it('fails on a non-2xx part and on a missing ETag', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ({ok: false, status: 403, headers: {get: () => null}})));
        await expect(uploadParts(file, parts, 6)).rejects.toThrow('Part upload failed (403)');

        vi.stubGlobal('fetch', vi.fn(async () => ({ok: true, status: 200, headers: {get: () => null}})));
        await expect(uploadParts(file, parts, 6)).rejects.toThrow(/ETag/);
    });

    it('rejects with an AbortError when the signal is already aborted', async () => {
        const controller = new AbortController();
        controller.abort();

        const error = await uploadParts(file, parts, 6, controller.signal).catch((e) => e);

        expect(isAbortError(error)).toBe(true);
        expect(isAbortError(abortError())).toBe(true);
        expect(isAbortError(new Error('x'))).toBe(false);
    });
});

describe('uploadParts progress and retry', () => {
    const file = new Blob(['abcdefghij']);
    const parts = [{partNumber: 1, url: 'https://s3/1'}, {partNumber: 2, url: 'https://s3/2'}];
    const ok = (etag) => ({ok: true, status: 200, headers: {get: () => etag}});

    it('reports every finished part', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => ok('"e"')));
        const progress = [];

        await uploadParts(file, parts, 6, undefined, (done, total) => progress.push([done, total]));

        expect(progress).toEqual([[1, 2], [2, 2]]);
    });

    it('retries a failing part with backoff and then succeeds', async () => {
        vi.useFakeTimers();
        const fetchMock = vi
            .fn()
            .mockRejectedValueOnce(new TypeError('network'))
            .mockResolvedValueOnce({ok: false, status: 503, headers: {get: () => null}})
            .mockResolvedValue(ok('"e"'));
        vi.stubGlobal('fetch', fetchMock);

        const promise = uploadParts(file, [parts[0]], 6);
        await vi.advanceTimersByTimeAsync(1000);
        expect(fetchMock).toHaveBeenCalledTimes(2);
        await vi.advanceTimersByTimeAsync(2000);

        await expect(promise).resolves.toEqual([{partNumber: 1, etag: '"e"'}]);
        expect(fetchMock).toHaveBeenCalledTimes(3);
        vi.useRealTimers();
    });

    it('gives up after three attempts with the last error', async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn(async () => ({ok: false, status: 500, headers: {get: () => null}}));
        vi.stubGlobal('fetch', fetchMock);

        const promise = uploadParts(file, [parts[0]], 6);
        const assertion = expect(promise).rejects.toThrow('Part upload failed (500)');
        await vi.advanceTimersByTimeAsync(10000);

        await assertion;
        expect(fetchMock).toHaveBeenCalledTimes(3);
        vi.useRealTimers();
    });

    it('does not retry a missing ETag (bucket CORS problem)', async () => {
        const fetchMock = vi.fn(async () => ok(null));
        vi.stubGlobal('fetch', fetchMock);

        await expect(uploadParts(file, [parts[0]], 6)).rejects.toThrow(/ETag/);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not retry once the upload was cancelled', async () => {
        const controller = new AbortController();
        const fetchMock = vi.fn(async () => {
            controller.abort();
            throw new DOMException('aborted', 'AbortError');
        });
        vi.stubGlobal('fetch', fetchMock);

        await expect(uploadParts(file, parts, 6, controller.signal)).rejects.toBeTruthy();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});

describe('pollVideo', () => {
    it('polls until the predicate matches', async () => {
        vi.useFakeTimers();
        Requester.get
            .mockResolvedValueOnce({uuid: 'u', status: 'processing'})
            .mockResolvedValueOnce({uuid: 'u', status: 'ready'});

        const promise = pollVideo('u', (v) => v.status === 'ready', {interval: 1000});
        await vi.advanceTimersByTimeAsync(1000);

        await expect(promise).resolves.toMatchObject({status: 'ready'});
        expect(Requester.get).toHaveBeenCalledTimes(2);
        vi.useRealTimers();
    });

    it('gives up after maxAttempts', async () => {
        vi.useFakeTimers();
        Requester.get.mockResolvedValue({uuid: 'u', status: 'processing'});

        const promise = pollVideo('u', () => false, {interval: 10, maxAttempts: 2});
        const assertion = expect(promise).rejects.toThrow('scale_videooptimizer.poll_timeout');
        await vi.advanceTimersByTimeAsync(50);

        await assertion;
        vi.useRealTimers();
    });

    it('stops with an AbortError once the signal aborts', async () => {
        const controller = new AbortController();
        controller.abort();

        await expect(pollVideo('u', () => true, {signal: controller.signal})).rejects.toMatchObject({name: 'AbortError'});
        expect(Requester.get).not.toHaveBeenCalled();
    });
});
