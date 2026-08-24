/* ==========================================================================
   HSF Facilities Management — about.js
   Page script for about.html: a very subtle pointer-tilt on the value cards.
   Pure enhancement — skipped on touch devices and when the visitor prefers
   reduced motion. Scroll reveals and stat counters come from global.js.
   ========================================================================== */
(function () {
  "use strict";

  function initTilt() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduced || !fine) return;

    var cards = document.querySelectorAll(".value-card");
    var MAX = 5; // degrees

    Array.prototype.forEach.call(cards, function (card) {
      var frame = null;

      card.addEventListener("mousemove", function (e) {
        if (frame) return;
        frame = window.requestAnimationFrame(function () {
          frame = null;
          var r = card.getBoundingClientRect();
          var px = (e.clientX - r.left) / r.width - 0.5;
          var py = (e.clientY - r.top) / r.height - 0.5;
          card.style.transform =
            "perspective(800px) translateY(-8px) rotateX(" +
            (-py * MAX).toFixed(2) +
            "deg) rotateY(" +
            (px * MAX).toFixed(2) +
            "deg)";
        });
      });

      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initTilt);
  } else {
    initTilt();
  }
})();
