import {beforeEach, describe, expect, it, vi} from 'vitest';
import {Requester} from 'sulu-admin-bundle/services';
import {getVideoPage} from '../../src/Resources/js/services/api';
import VideoPager from '../../src/Resources/js/services/VideoPager';

const video = (uuid, extra = {}) => ({uuid, title: uuid, ...extra});

function pager(pages) {
    const fetchPage = vi.fn((request) => {
        const next = pages.shift();
        if (next instanceof Error) {
            return Promise.reject(next);
        }

        return Promise.resolve(next);
    });
    const changes = [];
    const instance = new VideoPager(fetchPage, (state) => changes.push(state), 2);

    return {instance, fetchPage, changes};
}

describe('getVideoPage', () => {
    beforeEach(() => {
        Requester.get.mockReset();
    });

    it('requests one page with limit, cursor and filters and maps the paging fields', async () => {
        Requester.get.mockResolvedValue({_embedded: {videos: [video('a')]}, next_cursor: 'n1', has_more: true});

        const page = await getVideoPage({libraryId: 'lib 1', cursor: 'c0', limit: 60, tags: 'promo,2026'});

        expect(Requester.get).toHaveBeenCalledWith('/admin/api/videooptimizer/videos?limit=60&library_id=lib%201&cursor=c0&tags=promo%2C2026');
        expect(page).toEqual({videos: [video('a')], nextCursor: 'n1', hasMore: true});
    });

    it('treats a missing cursor as the last page', async () => {
        Requester.get.mockResolvedValue({_embedded: {videos: []}, next_cursor: null, has_more: false});

        expect(await getVideoPage({limit: 60})).toEqual({videos: [], nextCursor: null, hasMore: false});
        expect(Requester.get).toHaveBeenCalledWith('/admin/api/videooptimizer/videos?limit=60');
    });
});

describe('VideoPager', () => {
    it('loads the first page and then appends the next ones with the cursor', async () => {
        const {instance, fetchPage} = pager([
            {videos: [video('a'), video('b')], nextCursor: 'n1', hasMore: true},
            {videos: [video('c')], nextCursor: null, hasMore: false},
        ]);

        await instance.load({libraryId: 'lib'});
        expect(instance.state.items.map((v) => v.uuid)).toEqual(['a', 'b']);
        expect(instance.state.hasMore).toBe(true);
        expect(fetchPage).toHaveBeenLastCalledWith({libraryId: 'lib', cursor: null, limit: 2});

        await instance.loadMore();
        expect(instance.state.items.map((v) => v.uuid)).toEqual(['a', 'b', 'c']);
        expect(instance.state.hasMore).toBe(false);
        expect(fetchPage).toHaveBeenLastCalledWith({libraryId: 'lib', cursor: 'n1', limit: 2});

        await instance.loadMore();
        expect(fetchPage).toHaveBeenCalledTimes(2);
    });

    it('keeps the loaded pages when a video is edited, removed or added', async () => {
        const {instance, fetchPage} = pager([{videos: [video('a'), video('b')], nextCursor: 'n1', hasMore: true}]);
        await instance.load();

        instance.replace(video('b', {title: 'Renamed'}));
        instance.remove('a');
        instance.prepend(video('z'));
        instance.prepend(video('z'));

        expect(instance.state.items.map((v) => v.title)).toEqual(['z', 'Renamed']);
        expect(instance.state.hasMore).toBe(true);
        expect(fetchPage).toHaveBeenCalledTimes(1);
    });

    it('ignores a slow response of a superseded filter', async () => {
        let resolveFirst;
        const fetchPage = vi
            .fn()
            .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
            .mockImplementationOnce(() => Promise.resolve({videos: [video('new')], nextCursor: null, hasMore: false}));
        const instance = new VideoPager(fetchPage, () => {}, 2);

        const first = instance.load({libraryId: 'old'});
        await instance.load({libraryId: 'new'});
        resolveFirst({videos: [video('old')], nextCursor: 'x', hasMore: true});
        await first;

        expect(instance.state.items.map((v) => v.uuid)).toEqual(['new']);
        expect(instance.state.hasMore).toBe(false);
    });

    it('does not append a late "load more" page after the filter changed', async () => {
        let resolveMore;
        const fetchPage = vi
            .fn()
            .mockResolvedValueOnce({videos: [video('a')], nextCursor: 'n1', hasMore: true})
            .mockImplementationOnce(() => new Promise((resolve) => { resolveMore = resolve; }))
            .mockResolvedValueOnce({videos: [video('b')], nextCursor: null, hasMore: false});
        const instance = new VideoPager(fetchPage, () => {}, 2);
        await instance.load({libraryId: 'one'});

        const more = instance.loadMore();
        await instance.load({libraryId: 'two'});
        resolveMore({videos: [video('late')], nextCursor: null, hasMore: false});
        await more;

        expect(instance.state.items.map((v) => v.uuid)).toEqual(['b']);
    });

    it('does not request a second page while one is loading', async () => {
        let resolveMore;
        const fetchPage = vi
            .fn()
            .mockResolvedValueOnce({videos: [video('a')], nextCursor: 'n1', hasMore: true})
            .mockImplementationOnce(() => new Promise((resolve) => { resolveMore = resolve; }));
        const instance = new VideoPager(fetchPage, () => {}, 2);
        await instance.load();

        const first = instance.loadMore();
        instance.loadMore();
        resolveMore({videos: [video('b')], nextCursor: null, hasMore: false});
        await first;

        expect(fetchPage).toHaveBeenCalledTimes(2);
        expect(instance.state.items).toHaveLength(2);
    });

    it('keeps the loaded videos and exposes the error when a page fails, so it can be retried', async () => {
        const boom = new Error('offline');
        const {instance} = pager([
            {videos: [video('a')], nextCursor: 'n1', hasMore: true},
            boom,
            {videos: [video('b')], nextCursor: null, hasMore: false},
        ]);
        await instance.load();

        await instance.loadMore();
        expect(instance.state.error).toBe(boom);
        expect(instance.state.items).toHaveLength(1);
        expect(instance.state.hasMore).toBe(true);
        expect(instance.state.loadingMore).toBe(false);

        await instance.loadMore();
        expect(instance.state.error).toBeNull();
        expect(instance.state.items).toHaveLength(2);
    });
});
