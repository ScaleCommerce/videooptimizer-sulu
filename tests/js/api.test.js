import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Requester} from 'sulu-admin-bundle/services';
import {
    abortError,
    bustCache,
    bumpCacheBust,
    errorText,
    failureMessage,
    getAllVideos,
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
