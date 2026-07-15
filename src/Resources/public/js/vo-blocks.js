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
        document.querySelectorAll('.vo-bg-hero__video[data-hls]').forEach(function (video) {
            attachHls(video, baseUrl);
        });
    }

    // Native <video> players rendered eager (direct + priority, above the fold) are visible from
    // the start, so wire their HLS master right away. Natives pre-rendered (hidden) for
    // facade/lightbox reveal are wired lazily by revealNative() instead; natives marked
    // data-vo-native-autoload (direct + non-priority) are deferred and wired by
    // initNativeAutoload() once they scroll into view — to avoid fetching unseen videos.
    function initNativePlayers(baseUrl) {
        document.querySelectorAll('.vo-native[data-hls]').forEach(function (video) {
            if (video.closest('.vo-native-holder') || video.hasAttribute('data-vo-native-autoload')) {
                return;
            }
            attachHls(video, baseUrl);
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
