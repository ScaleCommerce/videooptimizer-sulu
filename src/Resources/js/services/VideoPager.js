// @flow
// Cursor paging of the video lists ("Load more"). Framework-free so it can be unit tested: the views
// hand in a fetchPage({libraryId, tags, cursor, limit}) function and an onChange(state) callback.
//
// - Pages are appended, never reloaded: edits, deletions and uploads patch the loaded list in place,
//   so the editor does not lose the pages they already scrolled through.
// - Every load() starts a new generation: a slow response of a superseded filter or library is dropped.

export const PAGE_SIZE = 60;

type State = {
    items: Array<Object>,
    hasMore: boolean,
    loading: boolean,
    loadingMore: boolean,
    error: ?Error,
};

export default class VideoPager {
    state: State = {items: [], hasMore: false, loading: false, loadingMore: false, error: null};

    fetchPage: (request: Object) => Promise<Object>;
    onChange: (state: State) => void;
    pageSize: number;
    filters: Object = {};
    cursor: ?string = null;
    generation: number = 0;

    constructor(fetchPage: (request: Object) => Promise<Object>, onChange: (state: State) => void, pageSize: number = PAGE_SIZE) {
        this.fetchPage = fetchPage;
        this.onChange = onChange;
        this.pageSize = pageSize;
    }

    set(patch: Object) {
        this.state = {...this.state, ...patch};
        this.onChange(this.state);
    }

    // Starts over with new filters (library, tags): resets the list and loads the first page.
    load(filters: Object = {}): Promise<void> {
        const generation = ++this.generation;
        this.filters = filters;
        this.cursor = null;
        this.set({items: [], hasMore: false, loading: true, loadingMore: false, error: null});

        return this.fetchPage({...filters, cursor: null, limit: this.pageSize}).then(
            (page) => {
                if (generation !== this.generation) {
                    return;
                }
                this.cursor = page.nextCursor || null;
                this.set({items: page.videos, hasMore: !!page.hasMore && !!this.cursor, loading: false});
            },
            (error) => {
                if (generation !== this.generation) {
                    return;
                }
                this.set({loading: false, error});
            }
        );
    }

    // Appends the next page. A failed page keeps everything loaded so far and can simply be retried.
    loadMore(): Promise<void> {
        const {hasMore, loading, loadingMore} = this.state;
        if (!hasMore || loading || loadingMore || !this.cursor) {
            return Promise.resolve();
        }
        const generation = this.generation;
        this.set({loadingMore: true, error: null});

        return this.fetchPage({...this.filters, cursor: this.cursor, limit: this.pageSize}).then(
            (page) => {
                if (generation !== this.generation) {
                    return;
                }
                const known = new Set(this.state.items.map((video) => video.uuid));
                this.cursor = page.nextCursor || null;
                this.set({
                    items: this.state.items.concat(page.videos.filter((video) => !known.has(video.uuid))),
                    hasMore: !!page.hasMore && !!this.cursor,
                    loadingMore: false,
                });
            },
            (error) => {
                if (generation !== this.generation) {
                    return;
                }
                this.set({loadingMore: false, error});
            }
        );
    }

    replace(video: Object) {
        this.set({items: this.state.items.map((item) => (item.uuid === video.uuid ? video : item))});
    }

    remove(uuid: string) {
        this.set({items: this.state.items.filter((item) => item.uuid !== uuid)});
    }

    // Puts a just-created video on top without reloading (it is the newest one).
    prepend(video: Object) {
        if (this.state.items.some((item) => item.uuid === video.uuid)) {
            return;
        }
        this.set({items: [video].concat(this.state.items)});
    }
}
