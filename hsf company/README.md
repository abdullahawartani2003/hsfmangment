# HSF Facilities Management — Website

Static marketing site (vanilla HTML / CSS / JS, no build step, no frameworks) for
**HSF Facilities Management** — cleaning and facilities management across the UAE.

**Slogan:** Built on Resilience. Driven by Excellence
**Phone / WhatsApp:** +971 55 596 8413 · **Email:** Info@hsffacilitymanagement.com · **Instagram:** [@hsfmanegment](https://instagram.com/hsfmanegment)

---

## 1. File structure

```
/
├── index.html            Home        → css/home.css      js/home.js
├── about.html            About Us    → css/about.css     js/about.js
├── services.html         Services    → css/services.css  js/services.js
├── contact.html          Contact     → css/contact.css   js/contact.js
│
├── css/
│   ├── global.css        Design tokens, reset, buttons, header, mobile menu,
│   │                     footer, WhatsApp button, cards, stats, reveal helper
│   ├── home.css          Hero + video, stats bar, service preview, steps, slider
│   ├── about.css         Story/team blocks, tick list, value cards, trust list
│   ├── services.css      Filter bar, 12 service cards, coverage chips
│   └── contact.css       Info column, quote form, validation, success state
│
├── js/
│   ├── global.js         Sticky header, mobile menu, IntersectionObserver scroll
│   │                     reveals, stat count-up, parallax, smooth anchors, year
│   ├── home.js           Testimonials slider (swipe/keyboard/autoplay), hero video
│   ├── about.js          Subtle pointer tilt on value cards
│   ├── services.js       Category filter + anchor highlight
│   └── contact.js        Validation, ?service= prefill, WhatsApp/mailto submit
│
├── assets/               Logo, icons, OG image (see §2)
├── robots.txt            Allows all crawlers, points to the sitemap
├── sitemap.xml           All four pages
└── site.webmanifest      PWA/app icons + theme colours
```

Every page loads `css/global.css` then its own stylesheet, and `js/global.js`
then its own script. No inline styles or scripts anywhere.

---

## 2. Media — what's already there and what to add

**Generated for you from your logo file** (already in `/assets`):

| File | Used for |
| --- | --- |
| `hsf-logo.png` | Full-colour logo, transparent background (header when scrolled, mobile menu) |
| `hsf-logo-white.png` | White knockout version (header over the hero, footer) |
| `hsf-mark.png` | Shield mark on its own |
| `favicon.ico`, `favicon.png`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` | Browser tab + app icons |
| `og-image.jpg` | 1200×630 social sharing card |

**Still to add — drop these into `/assets` using exactly these names:**

| File | Where it appears |
| --- | --- |
| `hero.mp4` | Home hero background video (slow-motion cleaning footage, ideally < 6 MB, muted, ~10–20 s loop) |
| `hero-poster.jpg` | Still frame shown before the video plays (1920×1080) |

Already in place: `team.jpg` (Home "What we do" + About "Our story"). The About
"Our team" block no longer uses a photo — it runs as a single centred column.

Anywhere a photo is missing you'll see a navy→teal gradient placeholder with the
filename printed on it — nothing breaks, and there are no broken-image icons.
Search the HTML for `MEDIA SWAP` to find every spot; each one has the ready-made
`<img>` tag commented out directly beneath it, with `alt`, `width`, `height`,
`loading="lazy"` and `decoding="async"` already filled in. Uncomment it and delete
the placeholder `<span>`.

**Tip:** keep photos ≤ 1600 px wide and export as JPEG (quality ~80) or WebP so
the pages stay fast.

---

## 3. Editable content

- **Stats** (`index.html` and `about.html`): each number is
  `<span class="stat__num" data-count="500" data-suffix="+">`. Change `data-count`
  and the visible text — the count-up animation follows automatically.
- **Testimonials** (`index.html`): three `<li class="slide">` blocks. Replace the
  quote text and the name/location; add or remove slides freely — the dots and
  autoplay adapt.
- **Services**: all 12 live in `services.html`. If you add one, also add a matching
  `<option>` to the `#service` dropdown in `contact.html` (the values must match
  exactly, since the "Request this service" links pass the name through the URL).
- **Hours**: `contact.html`, in the info list.

---

## 4. The contact form

Right now the form has **no server**. On submit `js/contact.js`:

1. validates the fields (friendly inline messages),
2. builds a formatted enquiry from the answers,
3. opens a **pre-filled WhatsApp chat** to +971 55 596 8413 in a new tab,
4. shows a success state with a **mailto: fallback** to Info@hsffacilitymanagement.com.

There's also a hidden honeypot field that silently blocks basic spam bots.

### Adding a real backend later

1. In `contact.html`, give the form an endpoint:
   ```html
   <form class="quote-form" id="quoteForm" action="https://formspree.io/f/XXXXXXX" method="POST" novalidate>
   ```
   (Formspree, Web3Forms, Netlify Forms, Getform or your own API all work.)
2. In `js/contact.js`, change the flag at the top:
   ```js
   var USE_BACKEND = true;
   ```

The script then POSTs the fields as JSON and shows the same success state. If the
request fails it automatically falls back to WhatsApp, so no enquiry is ever lost.

---

## 5. Running it locally

It's a static site — open `index.html` in a browser and it works. To test with
proper URLs (recommended, so the manifest and share tags resolve):

```bash
cd "hsf company"
python3 -m http.server 8000
# then visit http://localhost:8000
```

---

## 6. Deploying

Upload the whole folder to any static host — **Netlify**, **Vercel**, **Cloudflare
Pages**, **GitHub Pages**, or ordinary cPanel/FTP hosting. There is nothing to
build or compile.

**After pointing the domain, do these three things:**

1. The site assumes it lives at `https://hsffacilitymanagement.com/`. If the real
   domain differs, find-and-replace that string across `*.html`, `robots.txt` and
   `sitemap.xml` (it appears in the canonical tags, Open Graph tags, JSON-LD and
   the sitemap).
2. Serve over **HTTPS** and force `https://` + a single `www` / non-`www` version.
3. Submit `sitemap.xml` in [Google Search Console](https://search.google.com/search-console)
   and create/claim a **Google Business Profile** for the UAE service area — that's
   what drives local "cleaning services near me" results.

---

## 7. SEO & accessibility already built in

- Unique `<title>` + meta description per page, canonical tags, `lang="en"`.
- Open Graph + Twitter Card tags on every page (`assets/og-image.jpg`).
- JSON-LD: `CleaningService` / `LocalBusiness` with phone, email, `areaServed`,
  opening hours and `sameAs`; `BreadcrumbList` on inner pages; `ItemList` of all
  12 services; `FAQPage` on the home page.
- One `<h1>` per page with a logical `h2`/`h3` hierarchy; semantic `header`, `nav`,
  `main`, `section`, `article`, `footer` landmarks.
- Consistent NAP (name, service area, phone) in the footer of every page.
- Fonts preconnected and loaded with `font-display: swap`; images carry explicit
  `width`/`height` to avoid layout shift; below-fold media is lazy-loaded.
- Skip link, visible focus rings, ARIA labels on all icon-only buttons/links,
  keyboard-operable menu and slider, and full `prefers-reduced-motion` support.

---

© HSF Facilities Management. Built on Resilience. Driven by Excellence.
