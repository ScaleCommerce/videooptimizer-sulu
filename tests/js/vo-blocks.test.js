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
});
