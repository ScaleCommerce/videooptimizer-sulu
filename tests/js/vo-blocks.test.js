import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

// Tests run from src/Resources/js (see vitest.config.mjs).
const script = readFileSync(resolve(process.cwd(), '../public/js/vo-blocks.js'), 'utf8');

// The shipped file is a classic script (IIFE): run it against the current jsdom document, like a browser would.
function load() {
    window.eval(script);
}

function mount(html) {
    document.body.innerHTML = '<div class="vo-blocks" data-vo-base="/bundles/scalevideooptimizer/">' + html + '</div>';
}

beforeEach(() => {
    document.head.innerHTML = '';
    delete window.Hls;
    window.matchMedia = () => ({matches: false});
    // jsdom has no layout: a video counts as rendered unless a test says otherwise.
    window.ResizeObserver = class {
        observe() {}
        disconnect() {}
    };
    HTMLElement.prototype.getClientRects = function () {
        return this.hasAttribute('data-hidden') ? [] : [{width: 10, height: 10}];
    };
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
    HTMLMediaElement.prototype.load = vi.fn();
    HTMLMediaElement.prototype.canPlayType = () => '';
});

function hlsScript() {
    return document.head.querySelector('script[src$="hls.light.min.js"]');
}

describe('vo-blocks.js', () => {
    it('marks the blocks as script-enhanced on load', () => {
        mount('<p>x</p>');

        load();

        expect(document.querySelector('.vo-blocks').classList.contains('vo-js')).toBe(true);
    });

    it('does not load hls.js when the page has no HLS video at all', () => {
        mount('<p>no video here</p>');

        load();

        expect(hlsScript()).toBeNull();
    });

    it('does not wire a background video that is not rendered', () => {
        mount('<video class="vo-bg-hero__video" data-hls="https://cdn/x.m3u8" data-hidden></video>');

        load();

        expect(hlsScript()).toBeNull();
    });

    it('wires a rendered background video and loads hls.js once', () => {
        mount(
            '<video class="vo-bg-hero__video" data-hls="https://cdn/a.m3u8"></video>'
            + '<video class="vo-bg-hero__video" data-hls="https://cdn/b.m3u8"></video>'
        );

        load();

        expect(document.head.querySelectorAll('script[src$="hls.light.min.js"]')).toHaveLength(1);
    });

    it('leaves background videos alone for visitors who prefer reduced motion', () => {
        window.matchMedia = () => ({matches: true});
        mount('<video class="vo-bg-hero__video" data-hls="https://cdn/x.m3u8"></video>');

        load();

        expect(hlsScript()).toBeNull();
    });

    it('falls back to the MP4 when hls.js reports it is not supported', async () => {
        mount('<video class="vo-bg-hero__video" data-hls="https://cdn/x.m3u8" data-mp4="https://cdn/x.mp4"></video>');
        load();

        window.Hls = {isSupported: () => false};
        hlsScript().onload();
        await new Promise((resolve) => setTimeout(resolve, 0));

        const video = document.querySelector('video');
        expect(video.getAttribute('src')).toBe('https://cdn/x.mp4');
        expect(video.hasAttribute('data-hls')).toBe(false);
    });

    it('uses native HLS where the browser supports it, without loading hls.js', () => {
        HTMLMediaElement.prototype.canPlayType = () => 'maybe';
        mount('<video class="vo-bg-hero__video" data-hls="https://cdn/x.m3u8"></video>');

        load();

        expect(document.querySelector('video').getAttribute('src')).toBe('https://cdn/x.m3u8');
        expect(hlsScript()).toBeNull();
    });

    it('replaces a clicked facade with the hosted player iframe', () => {
        mount(
            '<div class="vo-frame"><button type="button" data-vo-embed="https://player.videooptimizer.eu/embed/abc">play</button></div>'
        );

        load();
        document.querySelector('[data-vo-embed]').click();

        const iframe = document.querySelector('.vo-frame iframe');
        expect(iframe).not.toBeNull();
        expect(iframe.getAttribute('src')).toBe('https://player.videooptimizer.eu/embed/abc');
        expect(iframe.allowFullscreen).toBe(true);
        expect(iframe.allow).toContain('autoplay');
    });

    it('loads a direct-mode frame without a click once it is near the viewport', () => {
        mount('<div class="vo-frame" data-vo-autoload="https://player.videooptimizer.eu/embed/xyz"></div>');

        load();

        const frame = document.querySelector('.vo-frame');
        expect(frame.querySelector('iframe').getAttribute('src')).toBe('https://player.videooptimizer.eu/embed/xyz');
        expect(frame.hasAttribute('data-vo-autoload')).toBe(false);
    });

    describe('native players without autoplay', () => {
        it('attaches nothing before the first play, then wires HLS once', () => {
            mount('<video class="vo-native" controls preload="metadata" data-vo-native-onplay data-hls="https://cdn/x.m3u8"></video>');
            load();
            const video = document.querySelector('video');

            expect(hlsScript()).toBeNull();
            expect(video.hasAttribute('data-vo-wired')).toBe(false);

            video.dispatchEvent(new Event('play'));
            expect(hlsScript()).not.toBeNull();
            expect(video.hasAttribute('data-vo-native-onplay')).toBe(false);
        });

        it('does not start a non-autoplaying player when it scrolls into view', () => {
            mount('<video class="vo-native" controls data-vo-native-onplay data-hls="https://cdn/x.m3u8"></video>');
            window.IntersectionObserver = class {
                constructor(cb) { this.cb = cb; }
                observe(el) { this.cb([{isIntersecting: true, target: el}]); }
                unobserve() {}
            };
            load();
            delete window.IntersectionObserver;

            expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
            expect(hlsScript()).toBeNull();
        });
    });

    describe('background video pause/play button', () => {
        const hero = '<section class="vo-bg-hero"><video class="vo-bg-hero__video" muted autoplay loop data-hls="https://cdn/x.m3u8"></video></section>';

        it('adds a labelled pause button that pauses and resumes the video', () => {
            mount(hero);
            load();

            const button = document.querySelector('.vo-bg-toggle');
            const video = document.querySelector('video');
            expect(button.getAttribute('aria-label')).toBe('Pause background video');

            video.pause = vi.fn();
            video.setAttribute('data-vo-wired', '');
            button.click();
            expect(video.pause).toHaveBeenCalled();
            expect(button.getAttribute('aria-label')).toBe('Play background video');
            expect(button.hasAttribute('aria-pressed')).toBe(false);

            HTMLMediaElement.prototype.play.mockClear();
            button.click();
            expect(video.play).toHaveBeenCalled();
            expect(button.getAttribute('aria-label')).toBe('Pause background video');
        });

        it('follows the video events: blocked autoplay and an outside pause show play', () => {
            mount(hero);
            load();
            const button = document.querySelector('.vo-bg-toggle');
            const video = document.querySelector('video');

            video.dispatchEvent(new Event('vo-play-blocked'));
            expect(button.getAttribute('data-state')).toBe('paused');
            video.dispatchEvent(new Event('playing'));
            expect(button.getAttribute('data-state')).toBe('playing');
            video.dispatchEvent(new Event('pause'));
            expect(button.getAttribute('aria-label')).toBe('Play background video');
        });

        it('keeps a pause pressed before the stream was ready', async () => {
            mount(hero);
            load();
            const video = document.querySelector('video');
            document.querySelector('.vo-bg-toggle').click(); // pause while hls.js is not even loaded
            expect(video.hasAttribute('data-vo-user-paused')).toBe(true);

            let manifestParsed;
            window.Hls = function () { return {on: (event, cb) => { if (event === 'parsed') { manifestParsed = cb; } }, loadSource() {}, attachMedia() {}}; };
            window.Hls.isSupported = () => true;
            window.Hls.Events = {ERROR: 'error', MANIFEST_PARSED: 'parsed'};
            hlsScript().onload();
            await new Promise((resolve) => setTimeout(resolve, 0));
            manifestParsed();

            expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
        });

        it('adds no button to a hidden video until it is shown', () => {
            const callbacks = [];
            window.ResizeObserver = class {
                constructor(cb) { callbacks.push(cb); }
                observe() {}
                disconnect() {}
            };
            mount('<section class="vo-bg-hero"><video class="vo-bg-hero__video" data-hidden data-hls="https://cdn/x.m3u8"></video></section>');
            load();
            expect(document.querySelector('.vo-bg-toggle')).toBeNull();

            document.querySelector('video').removeAttribute('data-hidden');
            callbacks.forEach((cb) => cb());
            expect(document.querySelector('.vo-bg-toggle')).not.toBeNull();
        });

        it('takes the label from the page language or the data attributes', () => {
            document.documentElement.lang = 'de';
            mount(hero);
            load();
            expect(document.querySelector('.vo-bg-toggle').getAttribute('aria-label')).toBe('Hintergrundvideo anhalten');

            document.documentElement.lang = 'en';
            mount('<section><video class="vo-bg-hero__video" data-vo-label-pause="Stop" data-hls="https://cdn/x.m3u8"></video></section>');
            load();
            expect(document.querySelector('.vo-bg-toggle').getAttribute('aria-label')).toBe('Stop');
        });

        it('starts paused and unwired for prefers-reduced-motion, and plays on request', () => {
            window.matchMedia = () => ({matches: true});
            mount(hero);
            load();

            const button = document.querySelector('.vo-bg-toggle');
            expect(button.getAttribute('aria-label')).toBe('Play background video');
            expect(document.querySelector('video').autoplay).toBe(false);
            expect(hlsScript()).toBeNull();

            button.click();
            expect(hlsScript()).not.toBeNull();
        });

        it('leaves custom markup without the opt-in alone', () => {
            mount('<div><video data-vo-hls data-hls="https://cdn/x.m3u8"></video></div>');
            load();
            expect(document.querySelector('.vo-bg-toggle')).toBeNull();

            mount('<div><video data-vo-hls data-vo-toggle data-hls="https://cdn/x.m3u8"></video></div>');
            load();
            expect(document.querySelector('.vo-bg-toggle')).not.toBeNull();
        });
    });

    describe('lightbox', () => {
        beforeEach(() => {
            window.HTMLDialogElement.prototype.showModal = vi.fn(function () {
                this.setAttribute('open', '');
            });
            window.HTMLDialogElement.prototype.close = vi.fn(function () {
                this.removeAttribute('open');
                this.dispatchEvent(new Event('close'));
            });
        });

        const markup = '<div class="vo-frame"><button type="button" data-vo-lightbox="https://player.videooptimizer.eu/embed/abc">play</button></div>';

        it('opens the player in a native modal dialog and closes it again', () => {
            mount(markup);
            load();
            const trigger = document.querySelector('[data-vo-lightbox]');
            trigger.focus();

            trigger.click();

            const dialog = document.querySelector('dialog.vo-lightbox');
            expect(dialog).not.toBeNull();
            expect(dialog.showModal).toHaveBeenCalled();
            expect(dialog.open).toBe(true);
            expect(dialog.querySelector('iframe').getAttribute('src')).toBe('https://player.videooptimizer.eu/embed/abc');

            dialog.querySelector('.vo-lightbox__close').click();
            expect(dialog.open).toBe(false);
            expect(dialog.querySelector('iframe')).toBeNull();
            expect(document.activeElement).toBe(trigger);
        });

        it('cleans up when the browser closes the dialog itself (Escape) and closes on a backdrop click', () => {
            mount(markup);
            load();
            document.querySelector('[data-vo-lightbox]').click();
            const dialog = document.querySelector('dialog.vo-lightbox');

            dialog.removeAttribute('open');
            dialog.dispatchEvent(new Event('close'));
            expect(dialog.querySelector('iframe')).toBeNull();

            document.querySelector('[data-vo-lightbox]').click();
            dialog.click();
            expect(dialog.open).toBe(false);
        });

        it('makes the rest of the page inert without showModal()', () => {
            delete window.HTMLDialogElement.prototype.showModal;
            delete window.HTMLDialogElement.prototype.close;
            mount(markup);
            load();
            const dialog = document.querySelector('dialog.vo-lightbox');
            const root = document.querySelector('.vo-blocks');

            document.querySelector('[data-vo-lightbox]').click();
            expect(dialog.hasAttribute('open')).toBe(true);
            expect(root.hasAttribute('inert')).toBe(true);
            expect(dialog.hasAttribute('inert')).toBe(false);

            document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
            expect(dialog.hasAttribute('open')).toBe(false);
            expect(root.hasAttribute('inert')).toBe(false);
        });

        it('labels the dialog and the close button in the page language', () => {
            document.documentElement.lang = 'de';
            mount(markup);
            load();
            document.documentElement.lang = 'en';

            const dialog = document.querySelector('dialog.vo-lightbox');
            expect(dialog.getAttribute('aria-label')).toBe('Videoplayer');
            expect(dialog.querySelector('.vo-lightbox__close').getAttribute('aria-label')).toBe('Schließen');
        });

        it('traps Tab inside the dialog without showModal()', () => {
            delete window.HTMLDialogElement.prototype.showModal;
            delete window.HTMLDialogElement.prototype.close;
            mount(markup);
            load();
            document.querySelector('[data-vo-lightbox]').click();
            const dialog = document.querySelector('dialog.vo-lightbox');
            const close = dialog.querySelector('.vo-lightbox__close');
            const iframe = dialog.querySelector('iframe');
            iframe.focus();

            const tab = new KeyboardEvent('keydown', {key: 'Tab', cancelable: true});
            document.dispatchEvent(tab);
            expect(tab.defaultPrevented).toBe(true);
            expect(document.activeElement).toBe(close);

            const back = new KeyboardEvent('keydown', {key: 'Tab', shiftKey: true, cancelable: true});
            document.dispatchEvent(back);
            expect(back.defaultPrevented).toBe(true);
            expect(document.activeElement).toBe(iframe);
        });
    });
});

describe('chapters and scenes', () => {
    const scenes =
        '<button type="button" data-vo-start="10">a</button>'
        + '<button type="button" data-vo-start="30">b</button>';

    it('seeks an attached native player to the scene and plays it', () => {
        mount('<div data-vo-chapters><div class="vo-frame"><video class="vo-native" data-vo-wired></video></div>' + scenes + '</div>');
        const video = document.querySelector('video');
        Object.defineProperty(video, 'readyState', {value: 4});
        load();

        document.querySelectorAll('[data-vo-start]')[1].click();

        expect(video.currentTime).toBe(30);
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
        expect(document.querySelectorAll('[aria-current="true"]')).toHaveLength(1);
        expect(document.querySelectorAll('[data-vo-start]')[1].getAttribute('aria-current')).toBe('true');
    });

    it('attaches a deferred native player on the first scene click and applies the position once the metadata is known', () => {
        HTMLMediaElement.prototype.canPlayType = () => 'maybe'; // native HLS: attached synchronously
        mount(
            '<div data-vo-chapters><div class="vo-frame"><video class="vo-native" data-hls="https://cdn/x.m3u8" data-vo-native-onplay></video></div>'
            + scenes + '</div>'
        );
        load();
        const video = document.querySelector('video');

        document.querySelectorAll('[data-vo-start]')[0].click();

        expect(video.getAttribute('src')).toBe('https://cdn/x.m3u8');
        expect(video.hasAttribute('data-vo-native-onplay')).toBe(false);
        video.dispatchEvent(new Event('loadedmetadata'));
        expect(video.currentTime).toBe(10);
        // The `play` event that follows must not attach the source a second time.
        video.dispatchEvent(new Event('play'));
        expect(video.hasAttribute('data-vo-wired')).toBe(true);
    });

    it('does not load segments before a scene is clicked', () => {
        mount('<div data-vo-chapters><div class="vo-frame"><video class="vo-native" data-hls="https://cdn/x.m3u8" data-vo-native-onplay></video></div>' + scenes + '</div>');

        load();

        expect(hlsScript()).toBeNull();
        expect(document.querySelector('video').hasAttribute('data-vo-wired')).toBe(false);
    });

    it('follows the playback position of the native player', () => {
        mount('<div data-vo-chapters><div class="vo-frame"><video class="vo-native" data-vo-wired></video></div>' + scenes + '</div>');
        load();
        const video = document.querySelector('video');

        video.currentTime = 35;
        video.dispatchEvent(new Event('timeupdate'));

        expect(document.querySelectorAll('[data-vo-start]')[1].getAttribute('aria-current')).toBe('true');
        expect(document.querySelectorAll('[data-vo-start]')[0].hasAttribute('aria-current')).toBe(false);
    });

    it('restarts the hosted embed at the scene with t and autoplay', () => {
        mount(
            '<div data-vo-chapters data-vo-chapters-embed="https://videooptimizer.eu/embed/abc?controls=1"><div class="vo-frame"><iframe src="https://videooptimizer.eu/embed/abc?autoplay=0"></iframe></div>'
            + scenes + '</div>'
        );
        load();

        document.querySelectorAll('[data-vo-start]')[1].click();

        const src = new URL(document.querySelector('iframe').getAttribute('src'));
        expect(src.searchParams.get('t')).toBe('30');
        expect(src.searchParams.get('autoplay')).toBe('1');
        expect(src.searchParams.get('controls')).toBe('1');
        expect(document.querySelectorAll('[data-vo-start]')[1].getAttribute('aria-current')).toBe('true');
    });

    it('creates the hosted iframe when the lazy load has not happened yet and stops the autoload from overriding it', () => {
        mount(
            '<div data-vo-chapters data-vo-chapters-embed="https://videooptimizer.eu/embed/abc"><div class="vo-frame" data-vo-autoload="https://videooptimizer.eu/embed/abc"><img alt=""></div>'
            + scenes + '</div>'
        );
        load();

        document.querySelectorAll('[data-vo-start]')[0].click();

        expect(document.querySelector('.vo-frame iframe').getAttribute('src')).toContain('t=10');
        expect(document.querySelector('.vo-frame').hasAttribute('data-vo-autoload')).toBe(false);
        expect(document.querySelector('.vo-frame img')).toBeNull();
    });
});

describe('floating mini player', () => {
    let observers;

    beforeEach(() => {
        observers = [];
        window.IntersectionObserver = class {
            constructor(callback) {
                this.callback = callback;
                observers.push(this);
            }
            observe(target) {
                this.target = target;
            }
            unobserve() {}
            disconnect() {}
        };
        window.matchMedia = (query) => ({matches: query.includes('min-width'), addEventListener() {}});
    });

    function mountFloating(inner) {
        mount('<div class="vo-float" data-vo-float><div class="vo-frame">' + inner + '</div></div>');
        load();
        const wrap = document.querySelector('[data-vo-float]');
        const observer = observers.find((o) => o.target === wrap);
        const scroll = (ratio) => observer.callback([{intersectionRatio: ratio, isIntersecting: ratio > 0}]);

        return {wrap, frame: wrap.querySelector('.vo-frame'), scroll};
    }

    function setPlaying(video, on) {
        Object.defineProperty(video, 'paused', {value: !on, configurable: true});
    }

    // The visitor presses play (also on the native control bar, which sends nothing but the play event).
    function visitorPlays(frame, video) {
        setPlaying(video, true);
        video.dispatchEvent(new Event('play'));
    }

    it('pins a native player the visitor started when it scrolls out of view and unpins it when it comes back', () => {
        const {wrap, frame, scroll} = mountFloating('<video class="vo-native" data-vo-wired></video>');
        visitorPlays(frame, frame.querySelector('video'));

        scroll(0);
        expect(frame.classList.contains('vo-frame--pinned')).toBe(true);
        expect(wrap.classList.contains('vo-float--pinned')).toBe(true);
        expect(frame.querySelector('.vo-float__close').getAttribute('aria-label')).toBe('Close mini player');

        scroll(0.5);
        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
    });

    it('does not pin an autoplaying player the visitor never touched', () => {
        const {frame, scroll} = mountFloating('<video class="vo-native" autoplay></video>');
        const video = frame.querySelector('video');
        setPlaying(video, true);
        video.dispatchEvent(new Event('play')); // autoplay at load: expected, not the visitor

        scroll(0);

        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);

        // A later play (pause, then play again) is the visitor's.
        video.dispatchEvent(new Event('play'));
        scroll(1);
        scroll(0);
        expect(frame.classList.contains('vo-frame--pinned')).toBe(true);
    });

    it('does not count a loop restart as the visitor seeking', () => {
        const {frame, scroll} = mountFloating('<video class="vo-native" loop></video>');
        const video = frame.querySelector('video');
        setPlaying(video, true);

        video.dispatchEvent(new Event('seeking')); // currentTime is 0: the loop wrapped around
        scroll(0);

        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
    });

    it('does not let a blocked autoplay swallow the first play of the visitor', async () => {
        HTMLMediaElement.prototype.canPlayType = () => 'maybe';
        HTMLMediaElement.prototype.play = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
        mount('<div class="vo-float" data-vo-float><div class="vo-frame"><video class="vo-native" autoplay muted data-hls="https://cdn/x.m3u8"></video></div></div>');
        load();
        await new Promise((resolve) => setTimeout(resolve, 0));
        const video = document.querySelector('video');
        const wrap = document.querySelector('[data-vo-float]');
        const observer = observers.find((o) => o.target === wrap);

        Object.defineProperty(video, 'paused', {value: false, configurable: true});
        video.dispatchEvent(new Event('play')); // the visitor presses play after the autoplay was refused
        observer.callback([{intersectionRatio: 0, isIntersecting: false}]);

        expect(document.querySelector('.vo-frame').classList.contains('vo-frame--pinned')).toBe(true);
    });

    it('counts a scene click that starts a not yet attached player without controls as the visitor', () => {
        HTMLMediaElement.prototype.canPlayType = () => 'maybe';
        mount('<div data-vo-chapters><div class="vo-float" data-vo-float><div class="vo-frame"><video class="vo-native" data-vo-native-onplay data-hls="https://cdn/x.m3u8"></video></div></div><button type="button" data-vo-start="10">a</button></div>');
        HTMLMediaElement.prototype.play = vi.fn(function () {
            Object.defineProperty(this, 'paused', {value: false, configurable: true});
            this.dispatchEvent(new Event('play'));
            return Promise.resolve();
        });
        load();
        const wrap = document.querySelector('[data-vo-float]');
        const observer = observers.find((o) => o.target === wrap);

        document.querySelector('[data-vo-start]').click();
        observer.callback([{intersectionRatio: 0, isIntersecting: false}]);

        expect(document.querySelector('.vo-frame').classList.contains('vo-frame--pinned')).toBe(true);
    });

    it('counts the visitor pressing play on a player that attaches its source on play', () => {
        HTMLMediaElement.prototype.canPlayType = () => 'maybe';
        mount('<div class="vo-float" data-vo-float><div class="vo-frame"><video class="vo-native" data-vo-native-onplay data-hls="https://cdn/x.m3u8"></video></div></div>');
        load();
        const video = document.querySelector('video');
        const wrap = document.querySelector('[data-vo-float]');
        const observer = observers.find((o) => o.target === wrap);

        Object.defineProperty(video, 'paused', {value: false, configurable: true});
        video.dispatchEvent(new Event('play')); // the native control bar's play button
        observer.callback([{intersectionRatio: 0, isIntersecting: false}]);

        expect(video.hasAttribute('data-vo-wired')).toBe(true);
        expect(document.querySelector('.vo-frame').classList.contains('vo-frame--pinned')).toBe(true);
    });

    it('does not count what the script itself starts: source attach and play() on scroll', () => {
        HTMLMediaElement.prototype.canPlayType = () => 'maybe';
        mount('<div class="vo-float" data-vo-float><div class="vo-frame"><video class="vo-native" muted data-vo-native-autoload data-hls="https://cdn/x.m3u8"></video></div></div>');
        HTMLMediaElement.prototype.play = vi.fn(function () {
            Object.defineProperty(this, 'paused', {value: false, configurable: true});
            this.dispatchEvent(new Event('play'));
            return Promise.resolve();
        });
        load();
        const video = document.querySelector('video');
        const ratio = (r) => observers.filter((o) => o.target === video || o.target === document.querySelector('[data-vo-float]')).forEach((o) => o.callback([{intersectionRatio: r, isIntersecting: r > 0}]));

        ratio(0.8); // play-while-scrolling starts it
        video.dispatchEvent(new Event('seeking')); // hls.js start position
        ratio(0); // scrolled away

        expect(document.querySelector('.vo-frame').classList.contains('vo-frame--pinned')).toBe(false);
        expect(video.hasAttribute('data-vo-visitor-started')).toBe(false);
    });

    it('takes over after the visitor unmutes, seeks or resumes an autoplaying player', () => {
        for (const name of ['volumechange', 'seeking', 'play']) {
            observers.length = 0;
            const {frame, scroll} = mountFloating('<video class="vo-native"></video>');
            const video = frame.querySelector('video');
            setPlaying(video, true);
            video.dispatchEvent(new Event(name));

            scroll(0);

            expect(frame.classList.contains('vo-frame--pinned'), name).toBe(true);
            expect(video.hasAttribute('data-vo-visitor-started'), name).toBe(true);
        }
    });

    it('does not pin a player that is paused again', () => {
        const {frame, scroll} = mountFloating('<video class="vo-native"></video>');
        const video = frame.querySelector('video');
        visitorPlays(frame, video);
        setPlaying(video, false);

        scroll(0);

        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
    });

    it('never moves the video in the DOM', () => {
        const {frame, scroll} = mountFloating('<video class="vo-native"></video>');
        const video = frame.querySelector('video');
        visitorPlays(frame, video);

        scroll(0);

        expect(frame.querySelector('video')).toBe(video);
        expect(video.parentNode).toBe(frame);
    });

    it('closes with the button: unpins, pauses, focuses the player and stays closed until the player was in view again', () => {
        const {frame, scroll} = mountFloating('<video class="vo-native" tabindex="0"></video>');
        const video = frame.querySelector('video');
        video.pause = vi.fn();
        visitorPlays(frame, video);
        scroll(0);

        frame.querySelector('.vo-float__close').click();
        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
        expect(video.pause).toHaveBeenCalled();
        expect(document.activeElement).toBe(video);

        scroll(0); // still out of view, and the visitor has to start it again
        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
        scroll(1);
        visitorPlays(frame, video);
        scroll(0);
        expect(frame.classList.contains('vo-frame--pinned')).toBe(true);
    });

    it('moves the focus to the player box when there is no media element', () => {
        const {frame, scroll} = mountFloating('<img alt="">');
        frame.dispatchEvent(new Event('vo-visitor-started'));
        frame.appendChild(document.createElement('span'));
        // No video and no iframe: not started, nothing pins.
        scroll(0);
        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
    });

    it('unpins on Escape inside the mini player without pausing it and keeps the focus in the player', () => {
        const {frame, scroll} = mountFloating('<video class="vo-native" tabindex="0"></video>');
        const video = frame.querySelector('video');
        video.pause = vi.fn();
        visitorPlays(frame, video);
        scroll(0);

        frame.querySelector('.vo-float__close').dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape', bubbles: true}));

        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
        expect(video.pause).not.toHaveBeenCalled();
        expect(document.activeElement).toBe(video);
    });

    it('unpins a hosted mini player and reloads it without autoplay when a lightbox opens', () => {
        const {frame, scroll} = mountFloating('<iframe src="https://videooptimizer.eu/embed/abc?autoplay=1"></iframe>');
        frame.querySelector('iframe').focus();
        window.dispatchEvent(new Event('blur'));
        scroll(0);
        expect(frame.classList.contains('vo-frame--pinned')).toBe(true);

        document.dispatchEvent(new CustomEvent('vo-lightbox-open'));

        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
        expect(new URL(frame.querySelector('iframe').getAttribute('src')).searchParams.get('autoplay')).toBe('0');
    });

    it('unpins and pauses a native mini player when a lightbox opens', () => {
        const {frame, scroll} = mountFloating('<video class="vo-native"></video>');
        const video = frame.querySelector('video');
        video.pause = vi.fn();
        visitorPlays(frame, video);
        scroll(0);

        document.dispatchEvent(new CustomEvent('vo-lightbox-open'));

        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
        expect(video.pause).toHaveBeenCalled();
    });

    it('is not active below 600px or while the lightbox is open', () => {
        window.matchMedia = () => ({matches: false, addEventListener() {}});
        let ctx = mountFloating('<video class="vo-native"></video>');
        visitorPlays(ctx.frame, ctx.frame.querySelector('video'));
        ctx.scroll(0);
        expect(ctx.frame.classList.contains('vo-frame--pinned')).toBe(false);

        window.matchMedia = (query) => ({matches: query.includes('min-width'), addEventListener() {}});
        observers.length = 0;
        ctx = mountFloating('<video class="vo-native"></video>');
        visitorPlays(ctx.frame, ctx.frame.querySelector('video'));
        document.body.insertAdjacentHTML('beforeend', '<dialog class="vo-lightbox" open></dialog>');
        ctx.scroll(0);
        expect(ctx.frame.classList.contains('vo-frame--pinned')).toBe(false);
    });

    it('does not pin a hosted embed that autoplays by itself', () => {
        const {frame, scroll} = mountFloating('<iframe src="https://videooptimizer.eu/embed/abc?autoplay=1"></iframe>');

        scroll(0);

        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
    });

    it('pins a hosted embed after the visitor clicked into it and closing reloads it without autoplay', () => {
        const {frame, scroll} = mountFloating('<iframe src="https://videooptimizer.eu/embed/abc?autoplay=1&t=30"></iframe>');
        const iframe = frame.querySelector('iframe');
        iframe.focus();
        window.dispatchEvent(new Event('blur'));

        scroll(0);
        expect(frame.classList.contains('vo-frame--pinned')).toBe(true);

        frame.querySelector('.vo-float__close').click();
        const src = new URL(frame.querySelector('iframe').getAttribute('src'));
        expect(src.searchParams.get('autoplay')).toBe('0');
        expect(src.searchParams.has('t')).toBe(false);
        expect(frame.classList.contains('vo-frame--pinned')).toBe(false);
    });

    it('counts a scene click of the chapters block as the visitor starting a hosted embed', () => {
        mount(
            '<div data-vo-chapters data-vo-chapters-embed="https://videooptimizer.eu/embed/abc"><div class="vo-float" data-vo-float><div class="vo-frame"><iframe src="https://videooptimizer.eu/embed/abc?autoplay=0"></iframe></div></div>'
            + '<button type="button" data-vo-start="10">a</button></div>'
        );
        load();
        const wrap = document.querySelector('[data-vo-float]');
        const observer = observers.find((o) => o.target === wrap);

        document.querySelector('[data-vo-start]').click();
        observer.callback([{intersectionRatio: 0, isIntersecting: false}]);

        expect(wrap.querySelector('.vo-frame').classList.contains('vo-frame--pinned')).toBe(true);
    });

    it('keeps the margins of the player in the placeholder height', () => {
        const {frame, wrap, scroll} = mountFloating('<video class="vo-native"></video>');
        Object.defineProperty(frame, 'offsetHeight', {value: 200});
        frame.style.marginTop = '24px';
        visitorPlays(frame, frame.querySelector('video'));

        scroll(0);

        expect(wrap.style.height).toBe('224px');
    });
});

describe('play while scrolling (native, autoplay on)', () => {
    let observers;

    beforeEach(() => {
        observers = [];
        window.IntersectionObserver = class {
            constructor(callback, options) {
                this.callback = callback;
                this.options = options;
                observers.push(this);
            }
            observe(target) {
                this.target = target;
            }
            unobserve() {}
            disconnect() {}
        };
        window.matchMedia = () => ({matches: false});
        HTMLMediaElement.prototype.pause = vi.fn(function () {
            Object.defineProperty(this, 'paused', {value: true, configurable: true});
            this.dispatchEvent(new Event('pause'));
        });
    });

    afterEach(() => {
        delete navigator.connection;
    });

    function setup() {
        mount('<video class="vo-native" muted data-vo-native-autoload data-hls="https://cdn/x.m3u8"></video>');
        load();
        const video = document.querySelector('video');
        const observer = observers.find((o) => o.target === video);
        const see = (ratio) => observer.callback([{isIntersecting: ratio > 0, intersectionRatio: ratio, target: video}]);
        HTMLMediaElement.prototype.play = vi.fn(function () {
            Object.defineProperty(this, 'paused', {value: false, configurable: true});
            this.dispatchEvent(new Event('play'));
            return Promise.resolve();
        });

        return {video, observer, see};
    }

    it('starts at half visible and does nothing earlier', () => {
        const {observer, see, video} = setup();

        expect(observer.options.threshold).toEqual([0, 0.5]);
        see(0.3);
        expect(video.hasAttribute('data-vo-wired')).toBe(false);
        see(0.6);
        expect(video.hasAttribute('data-vo-wired')).toBe(true);
    });

    it('pauses when it leaves the viewport and resumes when it is back', () => {
        HTMLMediaElement.prototype.canPlayType = () => 'maybe';
        const {see, video} = setup();
        see(0.8);
        Object.defineProperty(video, 'paused', {value: false, configurable: true});

        see(0.1);
        expect(video.pause).toHaveBeenCalledTimes(1);

        HTMLMediaElement.prototype.play.mockClear();
        see(0.9);
        expect(HTMLMediaElement.prototype.play).toHaveBeenCalled();
    });

    it('keeps an explicit pause of the visitor', () => {
        HTMLMediaElement.prototype.canPlayType = () => 'maybe';
        const {see, video} = setup();
        see(0.8);
        Object.defineProperty(video, 'paused', {value: false, configurable: true});

        video.dispatchEvent(new Event('pause')); // the visitor paused
        HTMLMediaElement.prototype.play.mockClear();
        see(0.1);
        see(0.9);

        expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled();
        expect(video.hasAttribute('data-vo-user-paused')).toBe(true);

        video.dispatchEvent(new Event('play')); // the visitor pressed play again
        expect(video.hasAttribute('data-vo-user-paused')).toBe(false);
    });

    it('does not count its own pause as the visitor pausing', () => {
        HTMLMediaElement.prototype.canPlayType = () => 'maybe';
        const {see, video} = setup();
        see(0.8);
        Object.defineProperty(video, 'paused', {value: false, configurable: true});

        see(0);

        expect(video.hasAttribute('data-vo-user-paused')).toBe(false);
    });

    it('leaves a player the visitor took over playing when it scrolls away', () => {
        HTMLMediaElement.prototype.canPlayType = () => 'maybe';
        const {see, video} = setup();
        see(0.8);
        Object.defineProperty(video, 'paused', {value: false, configurable: true});
        video.setAttribute('data-vo-visitor-started', '');

        see(0);

        expect(video.pause).not.toHaveBeenCalled();
    });

    it('does not autoplay for prefers-reduced-motion or Save-Data', () => {
        window.matchMedia = () => ({matches: true});
        mount('<video class="vo-native" muted data-vo-native-autoload data-hls="https://cdn/x.m3u8"></video>');
        load();
        expect(observers.some((o) => o.target === document.querySelector('video'))).toBe(false);
        // Falls back to the "attach on play" wiring: hls.js on the first play, never the MP4 alone.
        const reduced = document.querySelector('video');
        expect(reduced.hasAttribute('data-vo-native-autoload')).toBe(false);
        expect(reduced.hasAttribute('data-vo-native-onplay')).toBe(true);
        reduced.dispatchEvent(new Event('play'));
        expect(hlsScript()).not.toBeNull();

        window.matchMedia = () => ({matches: false});
        Object.defineProperty(navigator, 'connection', {value: {saveData: true}, configurable: true});
        observers.length = 0;
        document.head.innerHTML = '';
        mount('<video class="vo-native" muted data-vo-native-autoload data-hls="https://cdn/x.m3u8"></video>');
        load();
        expect(observers.some((o) => o.target === document.querySelector('video'))).toBe(false);
        expect(hlsScript()).toBeNull();
    });
});
