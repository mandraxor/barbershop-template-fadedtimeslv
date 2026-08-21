# REBRAND WORKFLOW SPECIFICATION
**Barbershop Landing Page Template System**
*Enforced pipeline for every future shop variation build.*

---

## Overview

This document is the **authoritative specification** for generating any new barbershop variation from the master template. It was codified from the Crowd Pleezers build and encodes every error discovered and resolved during that process.

**Trigger phrase:** `"Reface master template for [New Shop Name]"` — executing this command initiates this full pipeline in order, with no steps skipped.

---

## PHASE 0 — Pre-Build: Config Authoring

### 0.1 — Create the Shop Config File

Every variation begins with a single source-of-truth JSON file at:

```
/configs/<shop-slug>.json
```

The config **must** contain every field in the schema below. No field may be omitted. Hardcoding any of these values directly into HTML, JS, or CSS is **forbidden**.

```json
{
  "shop": {
    "name":           "Full Legal Business Name",
    "shortName":      "Short Display Name",
    "monogram":       "XX",
    "badge":          "LV",
    "tagline":        "Headline Line 1. Headline Line 2.",
    "subTagline":     "One-line descriptor for nav/footer",
    "description":    "SEO meta description paragraph",
    "phone":          "(702) 000-0000",
    "phoneRaw":       "7020000000",
    "email":          "info@shopname.com",
    "website":        "https://shopname.com",
    "instagram":      "instagramhandle",
    "instagramUrl":   "https://www.instagram.com/instagramhandle/",
    "booksyUrl":      "https://booksy.com/en-us/...",
    "promoCode":      "PROMO10",
    "promoDiscount":  "10% OFF"
  },
  "location": {
    "address":        "1234 W Example Blvd",
    "city":           "Las Vegas",
    "state":          "NV",
    "zip":            "89101",
    "plaza":          "Shopping Center Name",
    "crossStreet":    "Example Blvd & Cross St",
    "coordinates": {
      "lat": 36.1234,
      "lng": -115.1234
    }
  },
  "hours": { "..." : "..." },
  "team": {
    "owners": [],
    "barbers": []
  },
  "services": [],
  "lookbook": [],
  "reviews": []
}
```

> **RULE 0.1.A — Zero Hardcoding:** Every business-specific string in `index.html`, `app.js`, CSS comments, `data-*` attributes, and calendar exports must resolve from this config. If a value does not exist in the config, add it to the config — do not hardcode it inline.

> **RULE 0.1.B — Phone Verification:** Always verify the phone number from at least **two independent sources** (Booksy listing, Instagram bio, Google Maps, or direct client confirmation) before writing it to the config. Never trust a single search result.

---

## PHASE 1 — Generation: Running the Compiler

### 1.1 — Execute the Generator

```bash
node scripts/generate-variation.js \
  --config configs/<shop-slug>.json \
  --out ../<output-dir-name>
```

### 1.2 — Generator Must Replace ALL of the Following (in Order)

Replacements **must** run in this exact order to avoid partial-match collisions where shorter strings clobber longer ones:

#### Step 1 — Full URL-encoded Address Strings (longest first)
- `3868+West+Sahara+Avenue+Las+Vegas+NV+89102` → encoded new address
- `3868+W+Sahara+Ave+Las+Vegas+NV+89102` → encoded new address
- Any partial match where zip changed but street did not (e.g. `3868+W+Sahara+Ave+..+<new-zip>`)
- Google Maps embed iframe `src` URL

#### Step 2 — Plain Text Multi-Word Address Strings
- `3868 West Sahara Avenue` → `cfg.location.address`
- `3868 W Sahara Ave` → `cfg.location.address`
- `Valley Oaks Plaza • 3868 W Sahara Ave • Las Vegas, NV` → composed new string
- `Las Vegas, NV 89102` → `city, state zip`

#### Step 3 — Phone Numbers
- `(702) 272-2457` → `cfg.shop.phone`
- `7022722457` → `cfg.shop.phoneRaw`

#### Step 4 — Shop Name (longest form first)
- `Faded Times Barbershop` → `cfg.shop.name`
- `Faded Times Vegas` → `cfg.shop.name`
- `Faded Times` → `cfg.shop.shortName`
- `FADED TIMES` → `cfg.shop.shortName.toUpperCase()`

#### Step 5 — Instagram Handle & Hashtag Forms
- `fadedtimeslv` (in text, `href`, `src`) → `cfg.shop.instagram`
- `@fadedtimeslv` → `@cfg.shop.instagram`
- `#FadedTimesLV` (inside `data-caption` attributes) → `#cfg.shop.instagram + 'LV'`

#### Step 6 — Monogram
- `>FT<` (HTML pattern — matches only tag content) → `>${cfg.shop.monogram}<`

#### Step 7 — Individual Location Components
- `Valley Oaks Plaza` → `cfg.location.plaza`
- `NV 89102` → `cfg.location.state + ' ' + cfg.location.zip`
- `89102` (bare zip) → `cfg.location.zip`
- `Sahara & Valley View` → `cfg.location.crossStreet`
- `Sahara Ave & Valley View Blvd` → `cfg.location.crossStreet`

#### Step 8 — Coordinates (JSON-LD Structured Data)
- `latitude": 36.1444` → `latitude": cfg.location.coordinates.lat`
- `longitude": -115.1912` → `longitude": cfg.location.coordinates.lng`
- `lat=36.1444&lng=-115.1912` → encoded coord params

#### Step 9 — Booksy URL
- All `booksy.com/en-us/[any-path]` URLs → `cfg.shop.booksyUrl`

#### Step 10 — Description Text Blocks & Captions
- Cross-street references in FAQ answers → `cfg.location.crossStreet`
- Lookbook caption neighborhood name → `cfg.location.address` street portion
- `data-caption` hashtags → `#${cfg.shop.instagram}LV`
- Location description prose blocks

#### Step 11 — JSON-LD Structured Data Fields
- `"streetAddress": "3868 W Sahara Ave"` → new address
- `"postalCode": "89102"` → `cfg.location.zip`
- `"addressLocality": "Las Vegas, NV"` → `city, state`

#### Step 12 — CSS File Header Comment
- `/* FADED TIMES BARBERSHOP (@fadedtimeslv) */` → new shop name and handle

#### Step 13 — JavaScript `app.js` Fallback Config Block
- `name: "Faded Times Barbershop"` → `cfg.shop.name`
- `instagram: "fadedtimeslv"` → `cfg.shop.instagram`

### 1.3 — JavaScript Business Logic Must Be Config-Driven

The following `app.js` functions **must** read exclusively from `window.SHOP_CONFIG` — never hardcoded:

| Function | Config Fields Used |
|---|---|
| Booking confirmation card | `location.address`, `location.city`, `location.state`, `location.zip` |
| `setupCalendarDownloads()` — Google Calendar | `shop.name`, `location.*`, `shop.phone` |
| `setupCalendarDownloads()` — ICS `PRODID` | `shop.name` |
| `setupCalendarDownloads()` — ICS `SUMMARY` | `shop.name` |
| `setupCalendarDownloads()` — ICS `LOCATION` | `location.*` |
| Lightbox fallback caption | `shop.name`, `shop.instagram` |
| Lightbox `@handle` attribution | `shop.instagram` |
| Shop status bar | `hours.*` |

---

## PHASE 2 — Pre-Flight Verification (Required Before Any Commit)

### 2.1 — Automated String Scan (Blocking)

Run this sweep. **Zero hits required** to proceed (exception: `<meta name="keywords">` SEO tag may retain old terms for search discoverability):

```powershell
Select-String `
  -Path 'index.html','js/app.js','css/styles.css' `
  -Pattern 'Faded Times|fadedtimeslv|FadedTimesLV|Sahara Ave|Valley View Blvd|272-2457|7022722457|89102|Valley Oaks|Blvd Blvd|>FT<' `
  | Select-Object Filename, LineNumber, Line
```

### 2.2 — Visual Checklist (Required Before Client Delivery)

Open the generated page at `http://localhost:<port>` and verify each:

| Location | Item to Verify |
|---|---|
| Top announcement bar | ✅ Correct phone number |
| Top announcement bar | ✅ Correct `@instagram` handle |
| Nav logo | ✅ Correct monogram (2-letter, not `FT`) |
| Nav logo | ✅ Correct shop name |
| Nav call button | ✅ Correct phone number |
| Mobile hamburger drawer | ✅ Correct monogram |
| Mobile drawer | ✅ Correct shop name and address |
| Mobile drawer directions link | ✅ Correct Maps URL (correct street, not Sahara) |
| Hero headline | ✅ New shop tagline, not master template copy |
| Hero phone link | ✅ Correct phone number |
| Services grid | ✅ New shop's menu, prices, durations |
| Lookbook section | ✅ `@newhandle` shown, not `@fadedtimeslv` |
| Lookbook captions (click photos) | ✅ `#NewHashtag`, no `#FadedTimesLV` |
| Barbers section | ✅ Correct names, roles, experience labels |
| Booking modal header | ✅ Correct monogram (not `FT`) |
| Booking modal subtitle | ✅ Correct address |
| Booking barber grid (step 1) | ✅ Correct barber names from config |
| Booking confirmation (complete a test booking) | ✅ Correct address in confirmation card |
| Google Calendar link | ✅ Correct shop name, correct address in event |
| ICS download | ✅ Open in calendar app — correct `SUMMARY` and `LOCATION` |
| Hours & Location card | ✅ Correct address, no `Blvd Blvd` typo |
| Hours & Location card | ✅ Correct cross streets |
| Google Maps embed | ✅ Centers on correct location |
| All "Get Directions" / "Open Navigation" links | ✅ Correct Maps URL |
| FAQ #3 answer | ✅ Correct address, correct cross streets, not Sahara Ave |
| Footer monogram | ✅ Correct 2-letter monogram (not `FT`) |
| Footer shop name | ✅ Correct |
| Footer phone | ✅ Correct |
| Footer address | ✅ Correct |
| Mobile bottom bar phone link | ✅ Correct phone number |
| Mobile bottom bar map link | ✅ Correct Maps URL |

---

## PHASE 3 — Commit & Publish

Only after Phase 2 passes with **zero automated blockers** and **all visual items checked**:

```powershell
# Commit to variation repo
git add -A
git commit -m "feat: [Shop Name] — initial variation build from master template"
git push origin main
```

For a new client repository:
```powershell
# Create repo first at github.com/mandraxor/barbershop-template-<slug>
git remote add origin https://github.com/mandraxor/barbershop-template-<slug>.git
git branch -M main
git push -u origin main
```

---

## PHASE 4 — Post-Build Standards

### Monogram Generation Rule

`monogram` must be **explicitly set** in the config. The generator derives it as a fallback:

```js
const monogram = cfg.shop.monogram ||
  (cfg.shop.shortName || cfg.shop.name)
    .split(' ')
    .filter(w => /^[A-Z]/.test(w))
    .map(w => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
```

### Maps URL Construction Rule

All Maps URLs must be built programmatically — never typed as encoded strings:

```js
const mapsAddr = [
  cfg.location.address,
  cfg.location.city,
  cfg.location.state,
  cfg.location.zip
].join(' ').replace(/ /g, '+');
// Result: "4960+W+Charleston+Blvd+Las+Vegas+NV+89146"
```

### Cross-Street Rule

**Never** compute cross streets from the address field — always store explicitly in `cfg.location.crossStreet`. This field is used in:
- FAQ location answer
- Location card subtitle
- Mobile drawer directions button label

---

## KNOWN FAILURE PATTERNS (Crowd Pleezers Build — Aug 2026)

| Bug Observed | Root Cause | Prevention |
|---|---|---|
| Nav/drawer/footer/modal monogram still `FT` | Generator matched `FT` too narrowly; missed footer and booking modal | Match `>FT<` HTML pattern across ALL occurrences |
| Maps links pointed to old street (zip changed, street didn't) | Replacement ran zip before full address+zip combo | Always replace full `street+city+state+zip` string first |
| Map embed iframe still showed old location | Separate URL format from `?q=` links not covered | Explicitly replace both Maps embed and link URL patterns |
| `Blvd Blvd` typo in location card | Generator appended "Blvd" to `crossStreet` field that already contained it | Store `crossStreet` as complete phrase; never append units |
| FAQ cross-streets not updated | FAQ answer text not covered by generator replacement patterns | Include FAQ-specific patterns in replacement list |
| `data-caption` hashtag `#FadedTimesLV` visible in lightbox | Replacements only covered rendered text, not `data-*` attributes | Explicitly scan and replace `data-caption` content |
| Booking confirmation showed old address and phone | `app.js` calendar/confirmation functions were never refactored | All business strings in `app.js` must read from `window.SHOP_CONFIG` |
| ICS/Google Calendar said "Faded Times Barbershop" | `setupCalendarDownloads()` was not config-driven | Refactor function to use `SHOP_CONFIG` before any client delivery |
| CSS comment header showed old shop name | CSS file not included in generator's replacement scope | Add CSS comment header to replacement list |
| Wrong phone number (previous listing, not verified) | Single source of truth; first search result used uncritically | Always cross-verify phone from Booksy + Instagram bio + Google Maps |

---

*This specification is version-controlled in the master template repository at `/REBRAND_WORKFLOW.md`. Update it whenever a new failure pattern is discovered or the pipeline is extended.*
