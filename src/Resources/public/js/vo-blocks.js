/* VideoOptimizer content blocks — lightbox + background HLS wiring. Vanilla, no framework. */
(function () {
    'use strict';

    var hlsPromise = null;
    var pageLoadPromise = null;

    // Upper bound for waiting on `load`, see afterPageLoad().
    var BACKGROUND_LOAD_TIMEOUT_MS = 6000;

    function prefersReducedMotion() {
        return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    }

    // Calls fn(element) once each element comes near the viewport (or right away without
    // IntersectionObserver). rootMargin starts slightly early so playback is ready in time.
    function whenNearViewport(elements, fn) {
        if (!('IntersectionObserver' in window)) {
            elements.forEach(fn);
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    io.unobserve(entry.target);
                    fn(entry.target);
                }
            });
        }, { rootMargin: '200px 0px' });
        elements.forEach(function (el) { io.observe(el); });
    }

    // Lazily loads the vendored hls.js only when needed (non-Safari background video).
    function loadHls(baseUrl) {
        if (hlsPromise) {
            return hlsPromise;
        }
        hlsPromise = new Promise(function (resolve, reject) {
            var script = document.createElement('script');
            script.src = baseUrl + 'js/hls.light.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
        return hlsPromise;
    }

    // Wires an HLS master (data-hls) to a <video>: native HLS in Safari, hls.js everywhere else
    // that supports MSE. Shared by the background-hero video and the native <video> player.
    // The MP4 fallback is the <source> children of a native player or a data-mp4 attribute: it is
    // used once when hls.js, native HLS or the missing support fails. With opts.play (or autoplay)
    // playback starts only after the source is attached, never before.
    function attachHls(video, baseUrl, opts) {
        var wantPlay = !!((opts && opts.play) || video.autoplay);
        var src = video.getAttribute('data-hls');
        var hls = null;
        var fellBack = false;
        video.setAttribute('data-vo-wired', '');

        function play() {
            // A pause pressed before the source was ready (data-vo-user-paused) must stay a pause.
            if (wantPlay && !video.hasAttribute('data-vo-user-paused')) {
                var result = video.play();
                if (result && result.catch) {
                    result.catch(function () {
                        // Autoplay-policy rejections are expected; tell the playback toggle it is paused.
                        video.dispatchEvent(new Event('vo-play-blocked'));
                    });
                }
            }
        }

        function useMp4() {
            if (fellBack) {
                return;
            }
            var mp4 = video.getAttribute('data-mp4');
            var hasSources = !!video.querySelector('source');
            if (!hasSources && !mp4) {
                return;
            }
            fellBack = true;
            if (hls) {
                hls.destroy();
                hls = null;
            }
            video.removeAttribute('data-hls');
            if (hasSources) {
                video.removeAttribute('src');
                video.load();
            } else {
                video.src = mp4;
            }
            play();
        }

        if (!src) {
            play();
            return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.addEventListener('error', useMp4, {once: true});
            video.src = src; // Safari: native HLS
            play();
            return;
        }
        loadHls(baseUrl).then(function () {
            if (!window.Hls || !window.Hls.isSupported()) {
                useMp4();
                return;
            }
            hls = new window.Hls();
            hls.on(window.Hls.Events.ERROR, function (event, data) {
                if (data && data.fatal) {
                    useMp4();
                }
            });
            hls.on(window.Hls.Events.MANIFEST_PARSED, play);
            hls.loadSource(src);
            hls.attachMedia(video);
        }, useMp4);
    }

    function initBackgroundVideos(baseUrl) {
        var reducedMotion = prefersReducedMotion();
        // `[data-vo-hls]` is the opt-in for custom markup (see video_optimizer_sources()). It is
        // deliberately not widened to every `video[data-hls]`: initNativePlayers() excludes facade
        // and lazy videos, and a blanket selector would wire those too.
        document.querySelectorAll('.vo-bg-hero__video[data-hls], video[data-vo-hls][data-hls]').forEach(function (video) {
            // The button only makes sense where the video is shown (not display:none).
            whenRendered(video, function () {
                addPlaybackToggle(video, baseUrl, reducedMotion);
            });
            if (reducedMotion) {
                // Leave the <video> unwired so the browser shows its poster and never plays, until
                // the visitor presses the play button.
                video.autoplay = false;
                return;
            }
            // Order: reduced motion (above) → deferral → rendered check. The rendered check must
            // run after the wait, since visibility may have changed by then.
            if (video.hasAttribute('data-vo-hls-eager')) {
                wireWhenRendered(video, baseUrl);
                return;
            }
            afterPageLoad(function () {
                wireWhenRendered(video, baseUrl);
            });
        });
    }

    var LABELS = {
        en: {pause: 'Pause background video', play: 'Play background video', close: 'Close', dialog: 'Video player', mini: 'Close mini player'},
        de: {pause: 'Hintergrundvideo anhalten', play: 'Hintergrundvideo abspielen', close: 'Schließen', dialog: 'Videoplayer', mini: 'Mini-Player schließen'}
    };

    // Label in the page language (html lang, default en); `el` may override with data-vo-label-<key>.
    function label(key, el) {
        var custom = el && el.getAttribute('data-vo-label-' + key);
        if (custom) {
            return custom;
        }
        var lang = String(document.documentElement.lang || 'en').slice(0, 2).toLowerCase();

        return (LABELS[lang] || LABELS.en)[key];
    }

    // Calls fn once the video is rendered (right away, or when it first becomes visible). Without
    // ResizeObserver a hidden video gets no callback.
    function whenRendered(video, fn) {
        if (isRendered(video)) {
            fn();
            return;
        }
        if (typeof ResizeObserver !== 'function') {
            return;
        }
        var observer = new ResizeObserver(function () {
            if (isRendered(video)) {
                observer.disconnect();
                fn();
            }
        });
        observer.observe(video);
    }

    // WCAG 2.2.2: moving content that plays for more than five seconds needs a way to pause it.
    // Adds a pause/play button to looping background videos (the hero, or custom markup that opts in
    // with data-vo-toggle). The state follows the video's own play/pause events, so a blocked autoplay
    // or reduced motion shows "play". Labels: page language, or data-vo-label-pause / -play.
    function addPlaybackToggle(video, baseUrl, startPaused) {
        if (!video.classList.contains('vo-bg-hero__video') && !video.hasAttribute('data-vo-toggle')) {
            return;
        }
        var parent = video.parentElement;
        if (!parent || parent.querySelector('.vo-bg-toggle')) {
            return;
        }
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'vo-bg-toggle';
        parent.appendChild(button);

        function sync(paused) {
            button.setAttribute('aria-label', label(paused ? 'play' : 'pause', video));
            button.setAttribute('data-state', paused ? 'paused' : 'playing');
        }

        // Until the source is attached the video is still paused although it is about to play.
        sync(!!startPaused);
        ['play', 'playing'].forEach(function (name) {
            video.addEventListener(name, function () { sync(false); });
        });
        ['pause', 'ended', 'vo-play-blocked'].forEach(function (name) {
            video.addEventListener(name, function () { sync(true); });
        });

        button.addEventListener('click', function () {
            if (button.getAttribute('data-state') === 'playing') {
                video.autoplay = false; // a source attached later must not start it again
                video.setAttribute('data-vo-user-paused', '');
                video.pause();
                sync(true);
                return;
            }
            video.removeAttribute('data-vo-user-paused');
            video.autoplay = true;
            sync(false);
            if (video.hasAttribute('data-vo-wired')) {
                var result = video.play();
                if (result && result.catch) {
                    result.catch(function () { sync(true); });
                }
            } else {
                attachHls(video, baseUrl, {play: true});
            }
        });
    }

    // Runs fn once the page has finished loading, right away if it already has. `load` never fires
    // when a single subresource hangs, so a timeout started here (not inside the load listener)
    // races it; the shared promise settles once, whichever comes first.
    function afterPageLoad(fn) {
        if (document.readyState === 'complete') {
            fn();
            return;
        }
        if (!pageLoadPromise) {
            pageLoadPromise = new Promise(function (resolve) {
                window.addEventListener('load', resolve, {once: true});
                window.setTimeout(resolve, BACKGROUND_LOAD_TIMEOUT_MS);
            });
        }
        pageLoadPromise.then(fn);
    }

    // Is this element rendered at all? `display:none` (on itself or an ancestor) leaves it without
    // client rects. This is NOT a viewport test: a video further down the page is rendered and
    // gets wired right away.
    function isRendered(video) {
        return video.getClientRects().length > 0;
    }

    // Wire now if the video is rendered, otherwise as soon as it becomes rendered (viewport resize,
    // <details> opened …). ResizeObserver fires on that transition but not on scroll. Without it,
    // wire immediately: a lost byte saving beats a video that never plays.
    function wireWhenRendered(video, baseUrl) {
        if (isRendered(video)) {
            attachHls(video, baseUrl);
            return;
        }
        if (typeof ResizeObserver !== 'function') {
            attachHls(video, baseUrl);
            return;
        }
        var observer = new ResizeObserver(function () {
            if (!isRendered(video)) {
                return;
            }
            observer.disconnect();
            attachHls(video, baseUrl);
        });
        observer.observe(video);
    }

    // Native <video> players rendered eager (direct + priority, above the fold) are visible from
    // the start, so wire their HLS master right away. Natives pre-rendered (hidden) for
    // facade/lightbox reveal are wired lazily by revealNative() instead; natives marked
    // data-vo-native-autoload (direct + non-priority) are deferred and wired by
    // initNativeAutoload() once they scroll into view — to avoid fetching unseen videos.
    // Respects prefers-reduced-motion exactly like initBackgroundVideos()/initNativeAutoload():
    // when set, autoplay is stripped and playback stopped, leaving only poster + controls.
    function initNativePlayers(baseUrl) {
        var reducedMotion = prefersReducedMotion();
        document.querySelectorAll('.vo-native[data-hls]').forEach(function (video) {
            if (video.closest('.vo-native-holder') || video.hasAttribute('data-vo-native-autoload') || video.hasAttribute('data-vo-native-onplay')) {
                return;
            }
            if (reducedMotion) {
                video.removeAttribute('autoplay');
            }
            attachHls(video, baseUrl);
            if (reducedMotion) {
                video.pause();
            }
        });
    }

    // Visitors who asked to save data do not get autoplaying video.
    function saveData() {
        var connection = navigator.connection;
        return !!(connection && connection.saveData);
    }

    // Direct + non-priority native <video> with autoplay on: deferred (preload="none") and visible from the
    // start. It plays once it is at least half visible and pauses when it leaves the viewport again; the source
    // is attached on the first play only. A pause by the visitor sticks (data-vo-user-paused) until they press
    // play again. With prefers-reduced-motion or Save-Data the <video> is left unwired, showing only its poster
    // and controls.
    function initNativeAutoload(baseUrl) {
        var videos = document.querySelectorAll('.vo-native[data-vo-native-autoload]');
        if (!videos.length || prefersReducedMotion() || saveData()) {
            return;
        }

        function start(video) {
            if (video.hasAttribute('data-vo-user-paused')) {
                return;
            }
            if (video.hasAttribute('data-vo-wired')) {
                var result = video.play();
                if (result && result.catch) {
                    result.catch(function () {});
                }
                return;
            }
            video.removeAttribute('data-vo-native-autoload');
            attachHls(video, baseUrl, {play: true});
        }

        videos.forEach(function (video) {
            var pausedByScroll = false;
            video.addEventListener('pause', function () {
                if (pausedByScroll) {
                    pausedByScroll = false;
                } else if (!video.ended) {
                    video.setAttribute('data-vo-user-paused', '');
                }
            });
            video.addEventListener('play', function () {
                video.removeAttribute('data-vo-user-paused');
            });

            if (!('IntersectionObserver' in window)) {
                start(video);
                return;
            }
            new IntersectionObserver(function (entries) {
                var entry = entries[entries.length - 1];
                if (entry.intersectionRatio >= 0.5) {
                    start(video);
                } else if (!video.paused && video.hasAttribute('data-vo-wired')) {
                    pausedByScroll = true;
                    video.pause();
                }
            }, {threshold: [0, 0.5]}).observe(video);
        });
    }

    // Visible native <video> that does not autoplay (autoplay off): nothing is attached, so no HLS
    // segments are fetched, until the visitor presses play. The source is attached on the first
    // `play` event and playback continues from there.
    function initNativeOnPlay(baseUrl) {
        document.querySelectorAll('.vo-native[data-vo-native-onplay]').forEach(function (video) {
            video.addEventListener('play', function () {
                video.removeAttribute('data-vo-native-onplay');
                if (video.hasAttribute('data-vo-wired')) {
                    return; // a chapter button already attached the source
                }
                attachHls(video, baseUrl, {play: true});
            }, {once: true});
        });
    }

    // Reveals a hidden native <video> (facade/lightbox click), wiring HLS on first reveal only.
    function revealNative(holder, baseUrl) {
        holder.hidden = false;
        var video = holder.querySelector('video');
        if (!video) {
            return null;
        }
        // Plays once the source is attached (inside the click for native HLS / MP4).
        attachHls(video, baseUrl, {play: true});
        video.removeAttribute('data-hls'); // avoid re-wiring hls.js if revealed again
        return video;
    }

    function buildLightbox() {
        // A native modal <dialog>: showModal() makes the rest of the page inert, keeps the focus
        // inside and closes on Escape, also while the player has the focus.
        var box = document.createElement('dialog');
        box.className = 'vo-lightbox';
        box.setAttribute('aria-label', label('dialog'));
        box.innerHTML =
            '<div class="vo-lightbox__inner">' +
            '<button type="button" class="vo-lightbox__close">&times;</button>' +
            '<div class="vo-lightbox__slot"></div>' +
            '</div>';
        box.querySelector('.vo-lightbox__close').setAttribute('aria-label', label('close'));
        document.body.appendChild(box);
        return box;
    }

    function initLightbox(baseUrl) {
        var triggers = document.querySelectorAll('[data-vo-lightbox]');
        if (!triggers.length) {
            return;
        }
        var box = buildLightbox();
        var slot = box.querySelector('.vo-lightbox__slot');
        var lastFocus = null;
        var nativeHolder = null; // holder the moved <video> must return to on close
        var inerted = []; // fallback only: siblings made inert without showModal()

        function setPageInert(on) {
            if (on) {
                Array.prototype.forEach.call(document.body.children, function (el) {
                    if (el !== box && !el.hasAttribute('inert')) {
                        el.setAttribute('inert', '');
                        inerted.push(el);
                    }
                });
                return;
            }
            inerted.forEach(function (el) { el.removeAttribute('inert'); });
            inerted = [];
        }

        function open(trigger) {
            lastFocus = document.activeElement;
            nativeHolder = null;

            var frame = trigger.closest('.vo-frame');
            var holder = 'native' === trigger.getAttribute('data-vo-player') && frame
                ? frame.querySelector('.vo-native-holder')
                : null;
            var video = holder ? holder.querySelector('video') : null;

            if (video) {
                slot.replaceChildren(video); // moves the <video> node into the lightbox slot
                nativeHolder = holder;
                attachHls(video, baseUrl, {play: true});
                video.removeAttribute('data-hls');
            } else {
                slot.replaceChildren(embedIframe(trigger.getAttribute('data-vo-lightbox')));
            }

            if ('function' === typeof box.showModal) {
                box.showModal();
            } else {
                box.setAttribute('open', '');
                setPageInert(true);
            }
            box.querySelector('.vo-lightbox__close').focus();
        }

        // Runs on every way of closing (button, backdrop, Escape): restores the page state once.
        function finish() {
            setPageInert(false);
            if (nativeHolder) {
                var video = slot.querySelector('video');
                if (video) {
                    video.pause();
                    nativeHolder.appendChild(video); // move it back, still wired, for next open
                }
                nativeHolder.hidden = true;
                nativeHolder = null;
            }
            slot.replaceChildren(); // stops iframe playback
            if (lastFocus) {
                lastFocus.focus();
                lastFocus = null;
            }
        }

        function close() {
            if ('function' === typeof box.close) {
                box.close(); // fires `close`, which runs finish()
                return;
            }
            box.removeAttribute('open');
            finish();
        }

        triggers.forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                open(trigger);
            });
        });

        box.addEventListener('close', finish);

        box.addEventListener('click', function (event) {
            if (event.target === box || event.target.classList.contains('vo-lightbox__close')) {
                close();
            }
        });

        // Without showModal() the browser gives neither Escape handling nor a focus trap.
        document.addEventListener('keydown', function (event) {
            if ('function' === typeof box.showModal || !box.hasAttribute('open')) {
                return;
            }
            if ('Escape' === event.key) {
                close();
                return;
            }
            if ('Tab' === event.key) {
                var focusable = box.querySelectorAll('button, iframe, video[controls], a[href], [tabindex]:not([tabindex="-1"])');
                if (!focusable.length) {
                    return;
                }
                var first = focusable[0];
                var last = focusable[focusable.length - 1];
                if (!box.contains(document.activeElement)) {
                    event.preventDefault();
                    first.focus();
                } else if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    }

    function embedIframe(url) {
        var iframe = document.createElement('iframe');
        iframe.src = url;
        iframe.allow = 'autoplay; fullscreen; picture-in-picture';
        iframe.allowFullscreen = true;
        return iframe;
    }

    // Direct mode: load the player only once the frame scrolls into view, so off-screen/footer
    // videos cause no traffic until seen. The frame is pre-sized, so this never shifts layout.
    function initAutoload() {
        var frames = document.querySelectorAll('.vo-frame[data-vo-autoload]');
        if (!frames.length) {
            return;
        }

        whenNearViewport(frames, function (frame) {
            var url = frame.getAttribute('data-vo-autoload');
            if (!url) {
                return;
            }
            frame.removeAttribute('data-vo-autoload');
            frame.replaceChildren(embedIframe(url));
        });
    }

    // Facade: replace a clicked poster with the player in place, keeping the frame layout. For the
    // 'native' player the <video> is already in the DOM (hidden next to the poster) — reveal and
    // play it instead of injecting an iframe.
    function initFacades(baseUrl) {
        document.querySelectorAll('[data-vo-embed]').forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                var frame = trigger.closest('.vo-frame');
                if (!frame) {
                    return;
                }
                if ('native' === trigger.getAttribute('data-vo-player')) {
                    var holder = frame.querySelector('.vo-native-holder');
                    if (holder && revealNative(holder, baseUrl)) {
                        trigger.hidden = true;
                        return;
                    }
                }
                frame.replaceChildren(embedIframe(trigger.getAttribute('data-vo-embed')));
            });
        });
    }

    // Seeks a native player to `time` and plays it. A source that is not attached yet (deferred player)
    // is attached first; the position is applied as soon as the metadata is known.
    function seekNative(video, time, baseUrl) {
        function seek() {
            video.currentTime = time;
        }
        if (video.readyState >= 1) {
            seek();
        } else {
            video.addEventListener('loadedmetadata', seek, {once: true});
        }
        if (video.hasAttribute('data-vo-wired') || !video.hasAttribute('data-hls')) {
            video.removeAttribute('data-vo-user-paused');
            var result = video.play();
            if (result && result.catch) {
                result.catch(function () {});
            }
            return;
        }
        video.removeAttribute('data-vo-native-autoload');
        video.removeAttribute('data-vo-native-onplay');
        attachHls(video, baseUrl, {play: true});
    }

    // Starts the hosted embed at `time`: the iframe is created when the autoload has not happened yet.
    function seekHosted(frame, embedUrl, time) {
        var url;
        try {
            url = new URL(embedUrl, window.location.href);
        } catch (e) {
            return;
        }
        url.searchParams.set('t', String(time));
        url.searchParams.set('autoplay', '1');
        var iframe = frame.querySelector('iframe');
        if (!iframe) {
            frame.removeAttribute('data-vo-autoload');
            iframe = embedIframe(url.toString());
            frame.replaceChildren(iframe);
            return;
        }
        iframe.src = url.toString();
    }

    // Chapters and scenes: a click on a scene preview starts the video there and marks the scene.
    function initChapters(baseUrl) {
        document.querySelectorAll('[data-vo-chapters]').forEach(function (root) {
            var frame = root.querySelector('.vo-frame');
            var buttons = Array.prototype.slice.call(root.querySelectorAll('[data-vo-start]'));
            if (!frame || !buttons.length) {
                return;
            }
            var embedUrl = root.getAttribute('data-vo-chapters-embed');

            function mark(active) {
                buttons.forEach(function (button) {
                    if (button === active) {
                        button.setAttribute('aria-current', 'true');
                    } else {
                        button.removeAttribute('aria-current');
                    }
                });
            }

            function startOf(button) {
                return Number(button.getAttribute('data-vo-start')) || 0;
            }

            buttons.forEach(function (button) {
                button.addEventListener('click', function () {
                    var video = frame.querySelector('video');
                    if (video) {
                        seekNative(video, startOf(button), baseUrl);
                    } else if (embedUrl) {
                        seekHosted(frame, embedUrl, startOf(button));
                    }
                    mark(button);
                });
            });

            // The native player reports its position, so the active scene follows playback; the hosted embed cannot.
            var native = frame.querySelector('video');
            if (native) {
                native.addEventListener('timeupdate', function () {
                    var active = null;
                    buttons.forEach(function (button) {
                        if (startOf(button) <= native.currentTime) {
                            active = button;
                        }
                    });
                    mark(active);
                });
            }
        });
    }

    // Floating mini player: a started player that scrolls out of view stays pinned bottom right. Only CSS
    // classes are toggled, the <video>/<iframe> never moves in the DOM (an iframe would reload). The wrapper
    // keeps the original height so the page does not jump.
    function initFloating() {
        var wraps = document.querySelectorAll('[data-vo-float]');
        if (!wraps.length || !('IntersectionObserver' in window)) {
            return;
        }
        var wide = window.matchMedia ? window.matchMedia('(min-width: 600px)') : {matches: true};

        wraps.forEach(function (wrap) {
            var frame = wrap.querySelector('.vo-frame');
            if (!frame) {
                return;
            }
            var pinned = false;
            var dismissed = false; // closed by the visitor: stays unpinned until the player was in view again
            var interacted = false; // the visitor clicked into the hosted iframe
            var close = document.createElement('button');
            close.type = 'button';
            close.className = 'vo-float__close';
            close.innerHTML = '&times;';
            close.setAttribute('aria-label', label('mini', wrap));

            // Native: it is playing. Hosted: the embed plays by itself (autoplay=1) or the visitor clicked into it.
            function started() {
                var video = frame.querySelector('video');
                if (video) {
                    return !video.paused && !video.ended;
                }
                var iframe = frame.querySelector('iframe');
                if (!iframe) {
                    return false;
                }

                return interacted || /[?&]autoplay=1(&|$)/.test(iframe.getAttribute('src') || '');
            }

            function pin() {
                var height = frame.offsetHeight;
                if (height > 0) {
                    wrap.style.height = height + 'px';
                }
                // The autoload replaces the frame's children, so the button is added once the player exists.
                if (close.parentNode !== frame) {
                    frame.appendChild(close);
                }
                wrap.classList.add('vo-float--pinned');
                frame.classList.add('vo-frame--pinned');
                pinned = true;
            }

            function unpin() {
                wrap.classList.remove('vo-float--pinned');
                frame.classList.remove('vo-frame--pinned');
                wrap.style.height = '';
                pinned = false;
            }

            function dismiss(stop) {
                dismissed = true;
                unpin();
                if (!stop) {
                    return;
                }
                var video = frame.querySelector('video');
                if (video) {
                    video.pause();
                    return;
                }
                var iframe = frame.querySelector('iframe');
                if (iframe) {
                    // Reloading without autoplay stops the hosted player; it stays unpinned.
                    interacted = false;
                    try {
                        var url = new URL(iframe.getAttribute('src') || '', window.location.href);
                        url.searchParams.set('autoplay', '0');
                        url.searchParams.delete('t');
                        iframe.src = url.toString();
                    } catch (e) {
                        iframe.removeAttribute('src');
                    }
                }
            }

            close.addEventListener('click', function () { dismiss(true); });
            frame.addEventListener('keydown', function (event) {
                if (pinned && 'Escape' === event.key) {
                    dismiss(false);
                }
            });
            // A click into a cross-origin iframe shows up as the window losing focus to it.
            window.addEventListener('blur', function () {
                if (document.activeElement && document.activeElement.tagName === 'IFRAME' && frame.contains(document.activeElement)) {
                    interacted = true;
                }
            });
            if (wide.addEventListener) {
                wide.addEventListener('change', function () {
                    if (!wide.matches && pinned) {
                        unpin();
                    }
                });
            }

            new IntersectionObserver(function (entries) {
                var entry = entries[entries.length - 1];
                if (entry.intersectionRatio >= 0.01) {
                    dismissed = false;
                    if (pinned) {
                        unpin();
                    }
                    return;
                }
                if (!pinned && !dismissed && wide.matches && !document.querySelector('dialog.vo-lightbox[open]') && started()) {
                    pin();
                }
            }, {threshold: [0, 0.01]}).observe(wrap);
        });
    }

    function initReveal() {
        var els = document.querySelectorAll('.vo-reveal');
        if (!els.length || !('IntersectionObserver' in window) || prefersReducedMotion()) {
            els.forEach(function (el) { el.classList.add('vo-in'); });
            return;
        }
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('vo-in');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });
        els.forEach(function (el) { io.observe(el); });
    }

    function init() {
        document.querySelectorAll('.vo-blocks').forEach(function (el) { el.classList.add('vo-js'); });
        var root = document.querySelector('[data-vo-base]');
        var baseUrl = root ? root.getAttribute('data-vo-base') : '/bundles/scalevideooptimizer/';
        initBackgroundVideos(baseUrl);
        initNativePlayers(baseUrl);
        initNativeAutoload(baseUrl);
        initNativeOnPlay(baseUrl);
        initLightbox(baseUrl);
        initFacades(baseUrl);
        initAutoload();
        initChapters(baseUrl);
        initFloating();
        initReveal();
    }

    // The script is normally loaded with `defer`, but may also be added async or after the DOM is
    // ready, when DOMContentLoaded has already fired.
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
