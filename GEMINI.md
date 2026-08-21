# Barbershop Template System — Persistent Agent Rules

This workspace is a **barbershop landing page template system**. The master template lives in `barbershop site experiment/` and variations are compiled into sibling directories.

---

## MANDATORY: Rebrand Pipeline

Whenever the user says anything matching:
- `"Reface master template for [Shop Name]"`
- `"Generate variation for [Shop Name]"`
- `"Build site for [Shop Name]"`
- `"Create a new barbershop site"`

**You must follow every phase in `REBRAND_WORKFLOW.md` without skipping steps.**
The workflow file is the authoritative spec. Read it before starting.

---

## RULE 1 — Zero Hardcoding

Every business-specific string (name, phone, address, cross street, monogram, Instagram handle, Booksy URL, barber names, services, prices, review text) must come exclusively from the shop's config JSON. Never type business details directly into HTML, JS, or CSS.

## RULE 2 — Monogram Replacement Pattern

The old master template monogram is `FT`. When rebranding, replace using the HTML-aware pattern `>FT<` — not just `FT` — to avoid false positives in CSS class names or other contexts. The new monogram must come from `cfg.shop.monogram` in the config.

## RULE 3 — Maps URL Construction

All Google Maps links and embed `src` URLs must be built from config fields:
```js
const addr = [cfg.location.address, cfg.location.city, cfg.location.state, cfg.location.zip]
  .join(' ').replace(/ /g, '+');
```
Never manually type URL-encoded address strings. This is how `3868+W+Sahara+Ave` leaked into Crowd Pleezers' map links.

## RULE 4 — Replacement Order (Longest First)

Run all text replacements in this order to prevent partial-match collisions:
1. Full URL-encoded address strings
2. Plain text multi-word address strings
3. Phone numbers (formatted + raw)
4. Shop name (longest form → shortest)
5. Instagram handle + hashtag forms
6. Monogram `>FT<` pattern
7. Individual location components (zip, state, plaza, cross streets)
8. Coordinates
9. Booksy URL
10. Prose description blocks and `data-caption` content
11. JSON-LD structured data fields
12. CSS comment header
13. JS fallback config block

## RULE 5 — Pre-Commit Automated Sweep (Blocking)

Before every git commit on a variation, run this and resolve all hits:
```powershell
Select-String -Path 'index.html','js/app.js','css/styles.css' `
  -Pattern 'Faded Times|fadedtimeslv|FadedTimesLV|Sahara Ave|Valley View Blvd|272-2457|7022722457|89102|Valley Oaks|Blvd Blvd|>FT<' `
  | Select-Object Filename, LineNumber, Line
```
Only exception: `<meta name="keywords">` may retain old terms for SEO discoverability.

## RULE 6 — app.js Must Be Config-Driven

All business strings in `js/app.js` — including the booking confirmation card location line, Google Calendar export title/details/location, ICS `PRODID`/`SUMMARY`/`LOCATION`, and lightbox fallback captions — must read from `window.SHOP_CONFIG`. Never hardcode these values.

## RULE 7 — Phone Verification

Always verify the shop's phone number from **at least two independent sources** before writing to config: Booksy listing, Instagram bio, Google Maps, or client-provided documentation. Never trust a single web search result.

## RULE 8 — Cross Streets are Explicit Config Fields

Never compute cross streets from the address string. Always store them as `cfg.location.crossStreet` (e.g., `"Charleston Blvd & Decatur Blvd"`). This prevents `Blvd Blvd` double-suffix bugs.

## RULE 9 — data-caption Attributes Are Rendered Content

Lookbook item `data-caption` attributes are displayed to users in the lightbox modal. They must be scanned and updated just like visible text. Replace `#FadedTimesLV` → `#${cfg.shop.instagram}LV` in all `data-caption` strings.

---

## Repository Structure

```
barbershop site experiment/    ← Master template (source of truth)
  shop-config.json             ← Central source of truth config (Apex Barber Lounge)
  template.config.json         ← Template schema mirror
  index.html                   ← Generic template HTML with compiler hooks
  js/app.js                    ← Config-driven JavaScript engine
  css/styles.css               ← Master styles
  scripts/generate-variation.js ← Compiler script
  configs/                     ← Per-client config JSONs
    crowd-pleezers.json
  REBRAND_WORKFLOW.md          ← Full pipeline specification
  README.md

barbershop-template-crowdpleezers/  ← Compiled Crowd Pleezers variation
barbershop-template-<next>/         ← Future variations go here
```

## Active Variations

| Shop | Repo / Branch | Config |
|---|---|---|
| Apex Barber Lounge (Master Template) | `template-barber-master` | `shop-config.json` |
| Crowd Pleezers Barbershop | `mandraxor/barbershop-template-crowdpleezers` | `configs/crowd-pleezers.json` |
