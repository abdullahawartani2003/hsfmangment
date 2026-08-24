/* ==========================================================================
   HSF Facilities Management — services.js
   Page script for services.html:
     • category filter (All / Building Cleaning / Facility Support)
     • highlight the card a visitor lands on via an #anchor link
   Progressive enhancement: every card is in the HTML, so the page works
   fully without this file.
   ========================================================================== */
(function () {
  "use strict";

  /* ----------------------------------------------------------------------
     Category filter
     ---------------------------------------------------------------------- */
  function initFilters() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".filter"));
    var items = Array.prototype.slice.call(document.querySelectorAll(".svc-item"));
    var sections = Array.prototype.slice.call(document.querySelectorAll(".svc-section"));
    var status = document.getElementById("filterStatus");
    if (!buttons.length || !items.length) return;

    buttons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.classList.contains("is-active") ? "true" : "false");

      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-filter");

        buttons.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle("is-active", active);
          b.setAttribute("aria-pressed", active ? "true" : "false");
        });

        var shown = 0;
        items.forEach(function (item) {
          var match = filter === "all" || item.getAttribute("data-category") === filter;
          item.classList.toggle("is-filtered", !match);
          if (match) shown++;
        });

        // Hide a whole section when none of its cards match
        sections.forEach(function (section) {
          var group = section.getAttribute("data-group");
          section.hidden = filter !== "all" && group !== filter;
        });

        if (status) {
          status.textContent =
            shown + (shown === 1 ? " service shown" : " services shown");
        }
      });
    });
  }

  /* ----------------------------------------------------------------------
     Anchor highlight — e.g. arriving from the footer at #deep-cleaning
     ---------------------------------------------------------------------- */
  function highlight(hash) {
    if (!hash || hash.length < 2) return;
    var el = document.getElementById(hash.slice(1));
    if (!el || !el.classList.contains("svc-item")) return;

    Array.prototype.forEach.call(
      document.querySelectorAll(".svc-item.is-targeted"),
      function (n) {
        n.classList.remove("is-targeted");
      }
    );
    el.classList.add("is-targeted");
    window.setTimeout(function () {
      el.classList.remove("is-targeted");
    }, 2600);
  }

  function initAnchorHighlight() {
    highlight(window.location.hash);
    window.addEventListener("hashchange", function () {
      highlight(window.location.hash);
    });
  }

  function init() {
    initFilters();
    initAnchorHighlight();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
