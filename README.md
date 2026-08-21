# Master Barbershop Website & Booking Template Engine

A high-converting, mobile-first, luxury barbershop website template and interactive booking engine. This repository serves as the **Master Template** for quickly spinning up customized websites for barbershops across any city or style.

Current Master Reference Instance: **Faded Times Barbershop** (@fadedtimeslv), Las Vegas, NV.

![Faded Times Hero Preview](assets/images/hero-interior.jpg)

---

## 💈 Quick Variation Generator

You can instantly create a brand new custom website for any other barbershop:

### 1. Define the Shop Profile
Edit `template.config.json` (or create a new `my-shop.json`) with the new shop details:
- Shop name, handles, coordinates, and phone number
- Operating schedule and time zone
- Color palette & theme (Gold, Emerald, Crimson, Royal, Obsidian)
- Owners, Master Barbers, and active staff
- Services menu, durations, and pricing
- Client testimonials & Instagram feed photos

### 2. Run the Variation Generator
```bash
node scripts/generate-variation.js --config path/to/my-shop.json --out ../barbershop-myshop
```

---

## 🌟 Key Features

- **Real-Time Shop Status Indicator**: Dynamically calculates whether the shop is open or closed based on local shop time and displays live walk-in wait estimates.
- **Interactive Multi-Step Booking Modal**:
  - Step 1: Service selection (Signature Haircut, Haircut & Beard, Beard Trim, Kid's Cut, VIP Experience, etc.)
  - Step 2: Barber selection (Any Available, Owners, Master Barbers, Staff)
  - Step 3: Date & time slot picker
  - Step 4: Instant booking confirmation with **Add to Google Calendar** and **.ICS download**
- **Instagram Lookbook Feed**: Filterable gallery of skin fades, tapers, beard sculpts, and custom hair art designs with high-res Lightbox viewer.
- **Meet The Master Barbers & Owners**: Team spotlights with specialties, badges, experience levels, and direct booking links.
- **Client Testimonials & Reviews**: Filterable 5-star reviews (Locals, Tourists, Beard Care).
- **Location & Directions**: Embedded map with 1-click Google Maps / Apple Maps directions.
- **VIP Club**: Promo code generator unlocking first-visit discounts.
- **Mobile Persistent Action Bar**: Sticky quick-dial, appointment booking, directions, and Instagram link.

---

## 🚀 Local Development

```bash
# Clone master template
git clone https://github.com/mandraxor/barbershop-template-fadedtimeslv.git

# Navigate to directory
cd barbershop-template-fadedtimeslv

# Serve locally
npx serve .
```

Visit `http://localhost:3000` to view the website.

---

## 📁 Project Structure

```
barbershop-template-fadedtimeslv/
├── template.config.json       # Master shop data schema & configuration
├── scripts/
│   └── generate-variation.js # Rapid variation generator CLI
├── index.html                # Main single-page application
├── css/
│   └── styles.css            # Dark luxury barbershop styling & animations
├── js/
│   └── app.js                # Booking engine, live clock, gallery & lightbox
├── assets/
│   └── images/               # Photography & haircut assets
└── README.md                 # Documentation
```

---

## 📄 License

MIT License © 2026 Master Barbershop Template Engine
