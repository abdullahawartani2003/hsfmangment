/* ==========================================================================
   HSF Facilities Management — home.js
   Page script for index.html:
     • testimonials slider (custom, no library — swipe + keyboard + autoplay)
     • hero video fallback (hides the <video> if assets/hero.mp4 is missing)
   Depends on global.js for the shared helpers.
   ========================================================================== */
(function () {
  "use strict";

  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ----------------------------------------------------------------------
     Hero video: if the file has not been added yet (or fails to decode),
     drop the element so the CSS gradient fallback shows cleanly.
     ---------------------------------------------------------------------- */
  function initHeroVideo() {
    var video = document.querySelector(".hero__video");
    if (!video) return;

    var source = video.querySelector("source");
    if (source) {
      source.addEventListener("error", function () {
        video.style.display = "none";
      });
    }
    video.addEventListener("error", function () {
      video.style.display = "none";
    });

    // Autoplay can be blocked; that is fine — the poster/gradient remains.
    var playAttempt = video.play();
    if (playAttempt && typeof playAttempt.catch === "function") {
      playAttempt.catch(function () {
        /* silent: browser blocked autoplay */
      });
    }
  }

  /* ----------------------------------------------------------------------
     Testimonials slider
     ---------------------------------------------------------------------- */
  function initSlider() {
    var track = document.getElementById("testimonialTrack");
    var dotsWrap = document.getElementById("sliderDots");
    if (!track) return;

    var slides = Array.prototype.slice.call(track.children);
    if (slides.length < 2) return;

    var prevBtn = document.querySelector("[data-slider-prev]");
    var nextBtn = document.querySelector("[data-slider-next]");
    var index = 0;
    var timer = null;
    var AUTOPLAY_MS = 6500;

    // Build the dot controls
    var dots = slides.map(function (_, i) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.className = "slider__dot" + (i === 0 ? " is-active" : "");
      dot.setAttribute("aria-label", "Show testimonial " + (i + 1));
      dot.addEventListener("click", function () {
        goTo(i);
        restart();
      });
      if (dotsWrap) dotsWrap.appendChild(dot);
      return dot;
    });

    function goTo(i) {
      index = (i + slides.length) % slides.length;
      track.style.transform = "translateX(" + -index * 100 + "%)";
      dots.forEach(function (dot, d) {
        dot.classList.toggle("is-active", d === index);
        dot.setAttribute("aria-selected", d === index ? "true" : "false");
      });
      slides.forEach(function (slide, s) {
        // Keep off-screen slides out of the tab order / a11y tree
        slide.setAttribute("aria-hidden", s === index ? "false" : "true");
      });
    }

    function next() {
      goTo(index + 1);
    }

    function prev() {
      goTo(index - 1);
    }

    function start() {
      if (reduced || timer) return;
      timer = window.setInterval(next, AUTOPLAY_MS);
    }

    function stop() {
      window.clearInterval(timer);
      timer = null;
    }

    function restart() {
      stop();
      start();
    }

    if (nextBtn) nextBtn.addEventListener("click", function () { next(); restart(); });
    if (prevBtn) prevBtn.addEventListener("click", function () { prev(); restart(); });

    // Keyboard support when the slider has focus
    var slider = track.closest(".slider");
    if (slider) {
      slider.setAttribute("tabindex", "0");
      slider.setAttribute("role", "region");
      slider.setAttribute("aria-roledescription", "carousel");
      slider.setAttribute("aria-label", "Client testimonials");
      slider.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { next(); restart(); }
        if (e.key === "ArrowLeft") { prev(); restart(); }
      });
      slider.addEventListener("mouseenter", stop);
      slider.addEventListener("mouseleave", start);
      slider.addEventListener("focusin", stop);
      slider.addEventListener("focusout", start);
    }

    // Touch swipe
    var startX = 0;
    var deltaX = 0;
    track.addEventListener("touchstart", function (e) {
      startX = e.touches[0].clientX;
      deltaX = 0;
      stop();
    }, { passive: true });

    track.addEventListener("touchmove", function (e) {
      deltaX = e.touches[0].clientX - startX;
    }, { passive: true });

    track.addEventListener("touchend", function () {
      if (Math.abs(deltaX) > 45) {
        if (deltaX < 0) next();
        else prev();
      }
      start();
    });

    // Pause autoplay while the tab is hidden
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });

    goTo(0);
    start();
  }

  function init() {
    initHeroVideo();
    initSlider();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
