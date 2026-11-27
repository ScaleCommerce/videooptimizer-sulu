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
