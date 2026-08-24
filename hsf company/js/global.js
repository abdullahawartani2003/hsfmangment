/* ==========================================================================
   HSF Facilities Management — global.js
   Shared behaviour for every page:
     • sticky header transition on scroll
     • animated hamburger + slide-in mobile menu (focus + ESC handling)
     • IntersectionObserver scroll-reveal helper  (no dependencies)
     • animated stat count-up
     • subtle transform-based parallax (desktop only)
     • smooth scrolling for in-page anchors
     • footer year
   Exposes window.HSF for the page-specific scripts.
   ========================================================================== */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  /* ----------------------------------------------------------------------
     Small utilities
     ---------------------------------------------------------------------- */
  function $(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function $$(sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  }

  /* Run a callback at most once per animation frame while scrolling. */
  function rafThrottle(fn) {
    var ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        fn();
      });
    };
  }

  /* ----------------------------------------------------------------------
     1. Sticky header — turns solid after a small scroll distance
     ---------------------------------------------------------------------- */
  function initHeader() {
    var header = $(".site-header");
    if (!header) return;

    var onScroll = rafThrottle(function () {
      header.classList.toggle("is-scrolled", window.scrollY > 40);
    });

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ----------------------------------------------------------------------
     2. Mobile menu
     ---------------------------------------------------------------------- */
  function initMobileMenu() {
    var toggle = $(".nav-toggle");
    var menu = $(".mobile-menu");
    var backdrop = $(".nav-backdrop");
    var closeBtn = $(".mobile-menu__close");
    if (!toggle || !menu) return;

    function open() {
      menu.classList.add("is-open");
      if (backdrop) backdrop.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("no-scroll");
      var first = $("a, button", menu);
      if (first) first.focus();
    }

    function close(returnFocus) {
      menu.classList.remove("is-open");
      if (backdrop) backdrop.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
      if (returnFocus) toggle.focus();
    }

    toggle.addEventListener("click", function () {
      if (menu.classList.contains("is-open")) close(true);
      else open();
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", function () {
        close(true);
      });
    }

    if (backdrop) {
      backdrop.addEventListener("click", function () {
        close(false);
      });
    }

    // Close when a menu link is followed, and on ESC.
    $$("a", menu).forEach(function (link) {
      link.addEventListener("click", function () {
        close(false);
      });
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("is-open")) close(true);
    });

    // Keep things sane if the viewport grows back to desktop while open.
    window.addEventListener("resize", function () {
      if (window.innerWidth > 900 && menu.classList.contains("is-open")) {
        close(false);
      }
    });
  }

  /* ----------------------------------------------------------------------
     3. Scroll reveal — add .is-visible to [data-reveal] elements
     Supports data-reveal-delay="150" (ms) for staggered groups.
     ---------------------------------------------------------------------- */
  function initReveal() {
    var items = $$("[data-reveal]");
    if (!items.length) return;

    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      items.forEach(function (el) {
        el.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = el.getAttribute("data-reveal-delay");
          if (delay) el.style.setProperty("--reveal-delay", delay + "ms");
          el.classList.add("is-visible");
          observer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     4. Count-up stats — <span data-count="500" data-suffix="+">
     ---------------------------------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute("data-count")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var duration = parseInt(el.getAttribute("data-duration"), 10) || 1600;

    function render(value) {
      el.innerHTML =
        Math.round(value) + (suffix ? '<span class="suffix">' + suffix + "</span>" : "");
    }

    if (prefersReducedMotion) {
      render(target);
      return;
    }

    var start = null;
    function step(now) {
      if (start === null) start = now;
      var p = Math.min((now - start) / duration, 1);
      // easeOutExpo for a snappy finish
      var eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      render(target * eased);
      if (p < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function initCounters() {
    var counters = $$("[data-count]");
    if (!counters.length) return;

    if (!("IntersectionObserver" in window)) {
      counters.forEach(animateCount);
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     5. Parallax — transform only, desktop only, reduced-motion aware
     Usage: <div data-parallax="0.18"> (higher = more movement)
     ---------------------------------------------------------------------- */
  function initParallax() {
    var items = $$("[data-parallax]");
    if (!items.length || prefersReducedMotion) return;

    var enabled = false;

    function update() {
      if (!enabled) return;
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.15;
        var offset = (rect.top + rect.height / 2 - vh / 2) * speed;
        el.style.transform = "translate3d(0," + offset.toFixed(2) + "px,0)";
      });
    }

    var onScroll = rafThrottle(update);

    function sync() {
      var shouldEnable = window.innerWidth > 900;
      if (shouldEnable === enabled) return;
      enabled = shouldEnable;
      if (!enabled) {
        items.forEach(function (el) {
          el.style.transform = "";
        });
      } else {
        update();
      }
    }

    sync();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      sync();
      update();
    });
  }

  /* ----------------------------------------------------------------------
     6. Smooth scrolling for in-page anchors (respects reduced motion)
     ---------------------------------------------------------------------- */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var link = e.target.closest ? e.target.closest('a[href^="#"]') : null;
      if (!link) return;
      var id = link.getAttribute("href");
      if (!id || id === "#" || id.length < 2) return;
      var target = document.getElementById(id.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start"
      });
      // Keep keyboard focus in sync with the visual jump.
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    });
  }

  /* ----------------------------------------------------------------------
     7. Footer year
     ---------------------------------------------------------------------- */
  function initYear() {
    $$("[data-year]").forEach(function (el) {
      el.textContent = new Date().getFullYear();
    });
  }

  /* ----------------------------------------------------------------------
     Boot
     ---------------------------------------------------------------------- */
  function init() {
    initHeader();
    initMobileMenu();
    initReveal();
    initCounters();
    initParallax();
    initAnchors();
    initYear();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* Shared helpers for the page-level scripts. */
  window.HSF = {
    $: $,
    $$: $$,
    rafThrottle: rafThrottle,
    prefersReducedMotion: prefersReducedMotion,
    phone: "+971555968413",
    whatsapp: "https://wa.me/971555968413",
    email: "Info@hsffacilitymanagement.com"
  };
})();
