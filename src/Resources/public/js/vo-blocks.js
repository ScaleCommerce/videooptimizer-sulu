/* VideoOptimizer content blocks — lightbox + background HLS wiring. Vanilla, no framework. */
(function () {
    'use strict';

    var hlsPromise = null;

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
    function attachHls(video, baseUrl) {
        var src = video.getAttribute('data-hls');
        if (!src) {
            return;
        }
        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src; // Safari: native HLS
            return;
        }
        loadHls(baseUrl).then(function () {
            if (window.Hls && window.Hls.isSupported()) {
                var hls = new window.Hls();
                hls.loadSource(src);
                hls.attachMedia(video);
            }
        });
    }

    function initBackgroundVideos(baseUrl) {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Leave the <video> unwired so the browser shows its poster and never plays.
            return;
        }
        // `[data-vo-hls]` is the opt-in hook for consumers that render their own markup — the very
        // consumers `video_optimizer_sources()` exists for. Without it the HLS wiring only ever
        // found the bundle's own class, so a consumer's background video stayed silent: the poster
        // showed, nothing played, and nothing said why. Loading the assets and being wired are two
        // different questions.
        //
        // Four things this selector deliberately does NOT do:
        //   * it does not key on a class — a class is design-bound, a data attribute is markup-neutral;
        //   * it does not widen to `video[data-hls]` — initNativePlayers() excludes
        //     `.vo-native-holder` children and `[data-vo-native-autoload]` on purpose (facade and
        //     lazy paths). A blanket selector would lift those exclusions and change behaviour for
        //     existing consumers;
        //   * it does not live in a new function — staying here means foreign markup inherits the
        //     prefers-reduced-motion early exit above;
        //   * it does not carry a value: `data-hls` remains the URL, `data-vo-hls` is a bare marker.
        //
        // The markup that follows from this is what renderBackground() already emits:
        // `<video muted autoplay loop playsinline preload poster data-hls>` with no `<source>`
        // children — which is what makes the reduced-motion case work. The inherited price is that
        // there is no MP4 fallback.
        document.querySelectorAll('.vo-bg-hero__video[data-hls], video[data-vo-hls][data-hls]').forEach(function (video) {
            wireWhenRendered(video, baseUrl);
        });
    }

    // Is this element rendered at all? An element that is `display:none` — on itself or on any
    // ancestor — generates no boxes, so it has no client rects. That is exactly the question we
    // want answered: a background video a stylesheet has switched off should not stream.
    //
    // ⚠️ THIS IS NOT A VIEWPORT TEST, and the difference is the whole point. A background video
    // further down the page IS rendered; it simply is not on screen yet. Keying on the viewport
    // would quietly turn a bug fix into lazy loading for every consumer — a behaviour change
    // nobody asked for, shipped in a patch release. `getClientRects()` answers "would this be
    // painted if you scrolled there", `IntersectionObserver` answers "is it on screen now".
    function isRendered(video) {
        return video.getClientRects().length > 0;
    }

    // Wire now if the video is rendered; otherwise wait until it becomes rendered.
    //
    // ⚠️ THE SECOND HALF IS NOT OPTIONAL. A check that runs once at wiring time turns a byte
    // saving into a dead video the moment the element becomes visible later — a viewport dragged
    // from 640 to 1440, a `<details>` opened, a tab switched. The element would sit there,
    // present and silent, with nothing in the console to say why. A ResizeObserver reports a
    // zero-sized box for a `display:none` element and fires once it gets a real one, which is
    // precisely the transition we need; it does not fire on scrolling, so it cannot drift into
    // being a viewport test.
    //
    // Without ResizeObserver we wire immediately — the pre-1.6.2 behaviour. Losing a byte saving
    // on an old browser is the smaller harm; a video that never plays is the larger one.
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
        var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.querySelectorAll('.vo-native[data-hls]').forEach(function (video) {
            if (video.closest('.vo-native-holder') || video.hasAttribute('data-vo-native-autoload')) {
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

    // Direct + non-priority native <video>: deferred (preload="none", no autoplay) and visible
    // from the start, so — mirroring initAutoload() for the hosted/iframe player — wire its HLS
    // master and play() it once it scrolls into view. Respects prefers-reduced-motion exactly like
    // initBackgroundVideos(): when set, the <video> is left unwired, showing only its poster and
    // native controls, never auto-playing.
    function initNativeAutoload(baseUrl) {
        var videos = document.querySelectorAll('.vo-native[data-vo-native-autoload]');
        if (!videos.length) {
            return;
        }
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        var load = function (video) {
            video.removeAttribute('data-vo-native-autoload');
            attachHls(video, baseUrl);
            video.play().catch(function () {}); // autoplay-policy rejections are expected/harmless
        };

        if (!('IntersectionObserver' in window)) {
            videos.forEach(load);
            return;
        }

        // rootMargin preloads slightly before the video is visible so playback is ready in time.
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    io.unobserve(entry.target);
                    load(entry.target);
                }
            });
        }, { rootMargin: '200px 0px' });

        videos.forEach(function (video) { io.observe(video); });
    }

    // Reveals a hidden native <video> (facade/lightbox click), wiring HLS on first reveal only.
    function revealNative(holder, baseUrl) {
        holder.hidden = false;
        var video = holder.querySelector('video');
        if (!video) {
            return null;
        }
        attachHls(video, baseUrl);
        video.removeAttribute('data-hls'); // avoid re-wiring hls.js if revealed again
        video.play().catch(function () {}); // user-gesture play(); ignore autoplay-policy rejections
        return video;
    }

    function buildLightbox() {
        var box = document.createElement('div');
        box.className = 'vo-lightbox';
        box.setAttribute('role', 'dialog');
        box.setAttribute('aria-modal', 'true');
        box.innerHTML =
            '<div class="vo-lightbox__inner">' +
            '<button class="vo-lightbox__close" aria-label="Close">&times;</button>' +
            '<div class="vo-lightbox__slot"></div>' +
            '</div>';
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

        function open(trigger) {
            lastFocus = document.activeElement;
            nativeHolder = null;

            var frame = trigger.closest('.vo-frame');
            var holder = 'native' === trigger.getAttribute('data-vo-player') && frame
                ? frame.querySelector('.vo-native-holder')
                : null;
            var video = holder ? holder.querySelector('video') : null;

            if (video) {
                attachHls(video, baseUrl);
                video.removeAttribute('data-hls');
                slot.replaceChildren(video); // moves the <video> node into the lightbox slot
                nativeHolder = holder;
                video.play().catch(function () {});
            } else {
                slot.replaceChildren(embedIframe(trigger.getAttribute('data-vo-lightbox')));
            }

            box.setAttribute('data-open', 'true');
            box.querySelector('.vo-lightbox__close').focus();
        }

        function close() {
            box.removeAttribute('data-open');
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
            }
        }

        triggers.forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                open(trigger);
            });
        });

        box.addEventListener('click', function (event) {
            if (event.target === box || event.target.classList.contains('vo-lightbox__close')) {
                close();
            }
        });

        document.addEventListener('keydown', function (event) {
            if ('true' !== box.getAttribute('data-open')) {
                return;
            }
            if ('Escape' === event.key) {
                close();
                return;
            }
            // Focus trap: keep Tab within the dialog while it is open.
            if ('Tab' === event.key) {
                var focusable = box.querySelectorAll('button, iframe, video[controls], a[href], [tabindex]:not([tabindex="-1"])');
                if (!focusable.length) {
                    return;
                }
                var first = focusable[0];
                var last = focusable[focusable.length - 1];
                if (event.shiftKey && document.activeElement === first) {
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

        var load = function (frame) {
            var url = frame.getAttribute('data-vo-autoload');
            if (!url) {
                return;
            }
            frame.removeAttribute('data-vo-autoload');
            frame.replaceChildren(embedIframe(url));
        };

        if (!('IntersectionObserver' in window)) {
            frames.forEach(load);
            return;
        }

        // rootMargin preloads slightly before the frame is visible so the player is ready in time.
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    io.unobserve(entry.target);
                    load(entry.target);
                }
            });
        }, { rootMargin: '200px 0px' });

        frames.forEach(function (frame) { io.observe(frame); });
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

    function initReveal() {
        var els = document.querySelectorAll('.vo-reveal');
        var reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!els.length || !('IntersectionObserver' in window) || reducedMotion) {
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

    document.addEventListener('DOMContentLoaded', function () {
        document.querySelectorAll('.vo-blocks').forEach(function (el) { el.classList.add('vo-js'); });
        var root = document.querySelector('[data-vo-base]');
        var baseUrl = root ? root.getAttribute('data-vo-base') : '/bundles/scalevideooptimizer/';
        initBackgroundVideos(baseUrl);
        initNativePlayers(baseUrl);
        initNativeAutoload(baseUrl);
        initLightbox(baseUrl);
        initFacades(baseUrl);
        initAutoload();
        initReveal();
    });
})();
