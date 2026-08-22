# REBRAND WORKFLOW SPECIFICATION
**Barbershop Landing Page Template System**
*Enforced pipeline for every future shop variation build.*

---

## 🎯 Overview & Trigger

Whenever the user or assistant initiates a shop rebrand matching:
- `"Reface master template for [Shop Name]"`
- `"Generate variation for [Shop Name]"`
- `"Build site for [Shop Name]"`
- `"Create a new barbershop site"`

**You must follow every phase in this document without skipping steps.**

---

## PHASE 0 — Shop Data Extraction Protocol

Before writing any configuration, extract and verify all shop details using the following checklist:

### 0.1 — Data Extraction Requirements
1. **Business Identity**: Full Legal Name, Short/Display Name, 2-letter Monogram (e.g. `AB`), Tagline, Description.
2. **Contact & Location**:
   - Street Address, Suite/Unit, City, State, Zip Code, Neighborhood/Plaza.
   - **Cross Streets**: Explicit intersection string (e.g. `"4th St & Gass Ave"` — never auto-append street suffixes).
   - **Phone Verification**: Verify phone number from **at least two independent sources** (Booksy listing, Instagram bio, Google Maps listing, official website).
3. **Digital Channels**:
   - **Booking URL**: Verified Booksy profile URL with referral parameters if applicable.
   - **Instagram Handle**: Raw handle (`@handle`) and full URL.
4. **Master Craftsmen / Barber Roster**:
   - Authentic names (e.g. `Marcus 'Vance' Cole`, not placeholder roles like "Lead Barber").
   - Roles, specializations, years of experience, authentic ratings (e.g. `5.0 ★`).
   - Clean portrait photo assignments with neutral, unbranded backgrounds.
5. **Services Menu**:
   - Full service title, realistic price in USD, duration in minutes, descriptive summary, FontAwesome icon.
6. **Operating Hours**:
   - Timezone string (e.g. `"America/Los_Angeles"`).
   - Daily schedule with opening/closing hours and walk-in policy.

---

## PHASE 1 — Dual-Axis Theme & Layout Selection Guide

Configure the visual identity using the `"design"` block in `src/config/shop-config.json`:

```json
"design": {
  "palette": "urban-midnight",
  "style": "urban-brutalist",
  "enableDemoToolbar": true
}
```

### 🎨 Available Color Palettes (5)
* **`clean-luxe-light`**: ☀️ **Full Light Mode**: Off-white background (`#f8f9fa`), crisp white cards (`#ffffff`), dark slate text (`#0f172a`), emerald green accents (`#059669`).
* **`speakeasy-heritage`**: 🥃 **Warm Espresso & Copper**: Deep mahogany background (`#1a120b`), rich amber cards (`#261c14`), copper/amber accents (`#d97706`), cream text (`#fef3c7`).
* **`urban-midnight`**: ⚡ **Stark Pitch Black**: Jet black background (`#000000`), slate cards (`#111115`), electric neon cyan accents (`#00f2fe`), cool white text.
* **`emerald-sanctuary`**: 🌲 **Deep Forest**: Matte forest background (`#0a120e`), muted moss cards (`#13221a`), leaf green accents (`#10b981`), warm ivory text.
* **`monochrome-editorial`**: 📰 **Slate & Platinum**: Dark slate background (`#0f172a`), slate cards (`#1e293b`), pure white accents (`#ffffff`).

### 📐 Available Vibe & Geometry Styles (4)
* **`urban-brutalist`**: Sharp `0px` radius on all surfaces, thick `2px` high-contrast solid borders with block drop shadows, `'Oswald'` display typography.
* **`classic-speakeasy`**: Refined `4px` radius, ornate top-and-bottom gold accent border lines, `'Cinzel'` roman serif typography.
* **`minimal-editorial`**: Clean `0px` borderless cards with tonal background separation, lightweight `'Plus Jakarta Sans'` typography with wide tracking (`0.2em`).
* **`modern-curved`**: Heavy `24px` pill cards, `9999px` capsule pill buttons, frosted glass blur (`backdrop-filter: blur(12px)`), `'Inter'` typography.

---

## PHASE 2 — Zero Hardcoding & Schema Mirroring

1. **Strict Centralization**:
   - Write all shop details into `/configs/<shop-slug>.json` and mirror to `src/config/shop-config.json`.
   - Never write business strings directly into HTML, JSX, CSS, or JS files.
2. **Dual-Path Property Tolerance**:
   - Support both `business` and `shop` keys at root.
   - Support both `barbers` and `team` structures.
3. **Programmatic Maps URLs**:
   ```js
   const mapsAddr = [cfg.location.address, cfg.location.city, cfg.location.state, cfg.location.zip]
     .join(' ').replace(/ /g, '+');
   ```
4. **HTML-Aware Monogram Replacement**:
   - Old monogram is replaced using `>FT<` or `.shop-monogram` hooks to avoid CSS false positives.

---

## PHASE 3 — Variation Compilation Pipeline

Run the compiler script from the project root:

```bash
# Compile variation into sibling repository
node scripts/generate-variation.js --config configs/<shop-slug>.json --out ../barbershop-template-<slug>
```

The compiler will:
1. Deep-merge client configuration into template hooks.
2. Generate valid, clean HTML with active `data-palette` and `data-style` attributes.
3. Replace all business strings in the exact longest-first order.
4. Copy photography assets and public directories.

---

## PHASE 4 — Automated Pre-Flight Leak Audit

Before committing or deploying any variation, execute the pre-flight audit:

```bash
# Run audit on master template
npm run audit

# Run audit on compiled variation directory
node scripts/preflight-audit.js --dir ../barbershop-template-<slug>
```

### Pre-Flight Audit Rules:
* **Competitor Leak Check**: Fails if it detects `"Faded Times"`, `"Crowd Pleezers"`, `"Sahara"`, `"Charleston"`, `"Valley View"`, `"Valley Oaks"`, `>FT<`, `>CP<`.
* **Placeholder Leak Check**: Fails if it detects `"(555)"`, `"555-0000"`, `"5550000000"`, `"Metropolis"`, `"Lead Barber"`, `"Fade Specialist"`, `"Barbershop Barbershop"`, `"Blvd Blvd"`.
* **Legacy Asset Check**: Fails if it detects old competitor photos (e.g. `crew-lasvegas`).
* **Phone Verification Check**: Fails if any hardcoded phone numbers don't match `shop-config.json`'s `business.phone`.

---

## PHASE 5 — Git Deployment Checklist

1. Pre-flight audit passes with `✅ Pre-flight audit passed: Zero competitor leaks or placeholder artifacts detected.`
2. Verify interactive preview on `localhost:3006`.
3. Commit and push:
```bash
git add -A
git commit -m "feat: [Shop Name] — compiled variation from master template"
git push origin main
```
