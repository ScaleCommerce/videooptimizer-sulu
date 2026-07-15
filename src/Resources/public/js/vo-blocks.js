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

    function initBackgroundVideos(baseUrl) {
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Leave the <video> unwired so the browser shows its poster and never plays.
            return;
        }
        var videos = document.querySelectorAll('.vo-bg-hero__video[data-hls]');
        videos.forEach(function (video) {
            var src = video.getAttribute('data-hls');
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
        });
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

    function initLightbox() {
        var triggers = document.querySelectorAll('[data-vo-lightbox]');
        if (!triggers.length) {
            return;
        }
        var box = buildLightbox();
        var slot = box.querySelector('.vo-lightbox__slot');
        var lastFocus = null;

        function open(url) {
            lastFocus = document.activeElement;
            slot.replaceChildren(embedIframe(url));
            box.setAttribute('data-open', 'true');
            box.querySelector('.vo-lightbox__close').focus();
        }

        function close() {
            box.removeAttribute('data-open');
            slot.replaceChildren(); // stops playback
            if (lastFocus) {
                lastFocus.focus();
            }
        }

        triggers.forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                open(trigger.getAttribute('data-vo-lightbox'));
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
                var focusable = box.querySelectorAll('button, iframe, a[href], [tabindex]:not([tabindex="-1"])');
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

    // Facade: replace a clicked poster with the player iframe in place, keeping the frame layout.
    function initFacades() {
        document.querySelectorAll('[data-vo-embed]').forEach(function (trigger) {
            trigger.addEventListener('click', function () {
                var frame = trigger.closest('.vo-frame');
                if (!frame) {
                    return;
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
        initLightbox();
        initFacades();
        initAutoload();
        initReveal();
    });
})();
