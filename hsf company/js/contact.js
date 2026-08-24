/* ==========================================================================
   HSF Facilities Management — contact.js
   Page script for contact.html:
     • pre-selects the service from ?service=… (links from the Services page)
     • friendly inline validation
     • composes the enquiry and opens a pre-filled WhatsApp message,
       with a mailto: fallback link
     • success state + reset

   PLUGGING IN A REAL BACKEND
   --------------------------
   1. Add an endpoint to the form in contact.html, e.g.
        <form id="quoteForm" action="https://formspree.io/f/XXXXXXX" method="POST">
   2. Flip USE_BACKEND to true below.
      The script then validates, POSTs the fields as JSON, and shows the same
      success state — no other changes needed.
   ========================================================================== */
(function () {
  "use strict";

  var USE_BACKEND = false; // ← set to true once a real endpoint is in place

  var WHATSAPP_NUMBER = "971555968413";
  var EMAIL_TO = "Info@hsffacilitymanagement.com";

  var form = document.getElementById("quoteForm");
  if (!form) return;

  var successBox = document.getElementById("formSuccess");
  var successDetail = document.getElementById("successDetail");
  var successWhatsapp = document.getElementById("successWhatsapp");
  var successMailto = document.getElementById("successMailto");
  var resetBtn = document.getElementById("resetForm");
  var mailtoFallback = document.getElementById("mailtoFallback");

  /* ----------------------------------------------------------------------
     Pre-select the service from the URL, e.g. contact.html?service=Deep%20Cleaning
     ---------------------------------------------------------------------- */
  function preselectService() {
    var select = document.getElementById("service");
    if (!select) return;

    var params = new URLSearchParams(window.location.search);
    var wanted = params.get("service");
    if (!wanted) return;

    var match = Array.prototype.filter.call(select.options, function (opt) {
      return opt.value.toLowerCase() === wanted.trim().toLowerCase();
    })[0];

    if (match) {
      select.value = match.value;
      // Nudge the visitor straight to the form they came for.
      var card = document.querySelector(".form-card");
      if (card) {
        window.setTimeout(function () {
          card.scrollIntoView({
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "auto"
              : "smooth",
            block: "center"
          });
        }, 250);
      }
    }
  }

  /* ----------------------------------------------------------------------
     Validation
     ---------------------------------------------------------------------- */
  function fieldOf(el) {
    return el.closest(".field");
  }

  function setError(el, message, errorId) {
    var wrap = fieldOf(el);
    var box = document.getElementById(errorId);
    if (wrap) wrap.classList.toggle("has-error", !!message);
    if (box) box.textContent = message || "";
    if (el.setAttribute) {
      el.setAttribute("aria-invalid", message ? "true" : "false");
    }
    return !message;
  }

  function validName() {
    var el = document.getElementById("name");
    var v = el.value.trim();
    if (!v) return setError(el, "Please tell us your name.", "name-error");
    if (v.length < 2) return setError(el, "That name looks a little short.", "name-error");
    return setError(el, "", "name-error");
  }

  function validPhone() {
    var el = document.getElementById("phone");
    var v = el.value.trim();
    if (!v) return setError(el, "We need a phone number to call you back.", "phone-error");
    var digits = v.replace(/[^\d]/g, "");
    if (digits.length < 7) {
      return setError(el, "Please enter a complete phone number.", "phone-error");
    }
    return setError(el, "", "phone-error");
  }

  function validEmail() {
    var el = document.getElementById("email");
    var v = el.value.trim();
    if (!v) return setError(el, "", "email-error"); // optional
    var ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    return setError(el, ok ? "" : "That email address doesn't look right.", "email-error");
  }

  function validClientType() {
    var checked = form.querySelector('input[name="clientType"]:checked');
    var group = form.querySelector(".field--radio");
    var box = document.getElementById("clientType-error");
    if (group) group.classList.toggle("has-error", !checked);
    if (box) box.textContent = checked ? "" : "Please choose company or individual.";
    return !!checked;
  }

  function validService() {
    var el = document.getElementById("service");
    var ok = !!el.value;
    return setError(el, ok ? "" : "Please choose the service you need.", "service-error");
  }

  function validateAll() {
    // Run every check (no short-circuit) so all messages appear at once.
    var results = [
      validName(),
      validPhone(),
      validEmail(),
      validClientType(),
      validService()
    ];
    return results.indexOf(false) === -1;
  }

  // Re-validate as the visitor fixes things
  ["name", "phone", "email", "service"].forEach(function (id) {
    var el = document.getElementById(id);
    if (!el) return;
    var fn = { name: validName, phone: validPhone, email: validEmail, service: validService }[id];
    el.addEventListener("blur", fn);
    el.addEventListener("input", function () {
      if (fieldOf(el) && fieldOf(el).classList.contains("has-error")) fn();
    });
    el.addEventListener("change", fn);
  });

  Array.prototype.forEach.call(
    form.querySelectorAll('input[name="clientType"]'),
    function (radio) {
      radio.addEventListener("change", validClientType);
    }
  );

  /* ----------------------------------------------------------------------
     Message composition
     ---------------------------------------------------------------------- */
  function collect() {
    var checked = form.querySelector('input[name="clientType"]:checked');
    return {
      name: document.getElementById("name").value.trim(),
      phone: document.getElementById("phone").value.trim(),
      email: document.getElementById("email").value.trim(),
      clientType: checked ? checked.value : "",
      service: document.getElementById("service").value,
      message: document.getElementById("message").value.trim()
    };
  }

  function buildText(data) {
    var lines = [
      "New quote request — HSF Facilities Management",
      "",
      "Name: " + data.name,
      "Phone: " + data.phone
    ];
    if (data.email) lines.push("Email: " + data.email);
    lines.push("Client type: " + data.clientType);
    lines.push("Service: " + data.service);
    if (data.message) {
      lines.push("");
      lines.push("Details: " + data.message);
    }
    return lines.join("\n");
  }

  function whatsappUrl(text) {
    return "https://wa.me/" + WHATSAPP_NUMBER + "?text=" + encodeURIComponent(text);
  }

  function mailtoUrl(data, text) {
    return (
      "mailto:" +
      EMAIL_TO +
      "?subject=" +
      encodeURIComponent("Quote request: " + data.service + " — " + data.name) +
      "&body=" +
      encodeURIComponent(text)
    );
  }

  /* Keep the "prefer email?" link useful even before submitting. */
  function refreshMailtoFallback() {
    if (!mailtoFallback) return;
    var data = collect();
    if (!data.name && !data.phone) return; // leave the plain mailto: alone
    mailtoFallback.href = mailtoUrl(data, buildText(data));
  }
  form.addEventListener("input", refreshMailtoFallback);
  form.addEventListener("change", refreshMailtoFallback);

  /* ----------------------------------------------------------------------
     Submit
     ---------------------------------------------------------------------- */
  function showSuccess(data, opened) {
    var text = buildText(data);
    if (successWhatsapp) successWhatsapp.href = whatsappUrl(text);
    if (successMailto) successMailto.href = mailtoUrl(data, text);
    if (successDetail) {
      successDetail.textContent = opened
        ? "WhatsApp should have opened in a new tab with your details filled in. If it didn't, use one of the buttons below and we'll pick it up from there."
        : "Thanks " + data.name + " — we've received your request and will reply shortly. You can also reach us directly using the buttons below.";
    }
    form.hidden = true;
    if (successBox) {
      successBox.hidden = false;
      successBox.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "center"
      });
    }
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    // Honeypot: silently pretend it worked for bots.
    var hp = document.getElementById("company-website");
    if (hp && hp.value) return;

    if (!validateAll()) {
      var firstBad = form.querySelector(".has-error input, .has-error select");
      if (firstBad) firstBad.focus();
      return;
    }

    var data = collect();
    var text = buildText(data);

    if (USE_BACKEND && form.getAttribute("action")) {
      var btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = "Sending…";
      }
      fetch(form.getAttribute("action"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Request failed");
          showSuccess(data, false);
        })
        .catch(function () {
          // Fall back to WhatsApp so the enquiry is never lost.
          window.open(whatsappUrl(text), "_blank", "noopener");
          showSuccess(data, true);
        });
      return;
    }

    // No backend: hand the composed message straight to WhatsApp.
    var win = window.open(whatsappUrl(text), "_blank", "noopener");
    showSuccess(data, !!win);
  });

  /* ----------------------------------------------------------------------
     Reset
     ---------------------------------------------------------------------- */
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      form.reset();
      Array.prototype.forEach.call(form.querySelectorAll(".has-error"), function (el) {
        el.classList.remove("has-error");
      });
      Array.prototype.forEach.call(form.querySelectorAll(".error"), function (el) {
        el.textContent = "";
      });
      if (successBox) successBox.hidden = true;
      form.hidden = false;
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = false;
      document.getElementById("name").focus();
    });
  }

  preselectService();
})();
