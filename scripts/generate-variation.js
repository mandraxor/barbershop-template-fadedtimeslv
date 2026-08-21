/**
 * Master Barbershop Variation Engine
 * ----------------------------------------------------
 * Quickly compiles a customized, production-ready barbershop website
 * using a shop config JSON profile.
 * 
 * Usage:
 *   node scripts/generate-variation.js --config configs/crowd-pleezers.json --out ../barbershop-template-crowdpleezers
 */

const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function generateVariation(configPath, outputDir) {
  const root = path.resolve(__dirname, '..');
  const out = path.resolve(outputDir);

  if (!fs.existsSync(configPath)) {
    console.error('Error: Config file not found at', configPath);
    process.exit(1);
  }

  const raw = fs.readFileSync(configPath, 'utf8');
  const cfg = JSON.parse(raw);

  console.log(`\nCompiling variation: ${cfg.shop.name} (${cfg.location.city}, ${cfg.location.state})`);

  // Ensure output directory exists
  if (!fs.existsSync(out)) {
    fs.mkdirSync(out, { recursive: true });
  }

  // 1. Copy Assets, CSS, JS
  copyDirRecursive(path.join(root, 'assets'), path.join(out, 'assets'));
  copyDirRecursive(path.join(root, 'css'), path.join(out, 'css'));
  copyDirRecursive(path.join(root, 'js'), path.join(out, 'js'));

  // 2. Read template index.html & README.md
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  let readme = fs.existsSync(path.join(root, 'README.md')) ? fs.readFileSync(path.join(root, 'README.md'), 'utf8') : '';

  // Clean title & meta description
  html = html.replace(/<title>.*?<\/title>/, `<title>${cfg.shop.name} | ${cfg.location.city}, ${cfg.location.state} (@${cfg.shop.instagram})</title>`);
  html = html.replace(/<meta name="description" content=".*?">/, `<meta name="description" content="${cfg.shop.name} (@${cfg.shop.instagram}) is ${cfg.location.city}'s premier barbershop located at ${cfg.location.address}. ${cfg.shop.description}">`);
  html = html.replace(/<meta name="author" content=".*?">/, `<meta name="author" content="${cfg.shop.name}">`);
  html = html.replace(/<meta property="og:title" content=".*?">/, `<meta property="og:title" content="${cfg.shop.name} | ${cfg.location.city}, ${cfg.location.state} (@${cfg.shop.instagram})">`);
  html = html.replace(/<meta property="og:description" content=".*?">/, `<meta property="og:description" content="${cfg.shop.tagline} ${cfg.shop.description}">`);
  html = html.replace(/<meta property="og:url" content=".*?">/, `<meta property="og:url" content="${cfg.shop.instagramUrl || `https://www.instagram.com/${cfg.shop.instagram}/`}">`);

  // Text & Brand replacements in order (longest first)
  html = html.replace(/Faded Times Barbershop/g, cfg.shop.name);
  html = html.replace(/Faded Times Vegas/g, cfg.shop.name);
  html = html.replace(/Faded Times/g, cfg.shop.shortName || cfg.shop.name.replace(' Barbershop', ''));
  html = html.replace(/FADED TIMES/g, (cfg.shop.shortName || cfg.shop.name.replace(' Barbershop', '')).toUpperCase());
  html = html.replace(/fadedtimeslv/g, cfg.shop.instagram);
  html = html.replace(/@fadedtimeslv/g, '@' + cfg.shop.instagram);
  html = html.replace(/\(702\) 272-2457/g, cfg.shop.phone);
  html = html.replace(/7022722457/g, cfg.shop.phoneRaw);

  // Booksy URLs
  if (cfg.shop.booksyUrl) {
    html = html.replace(/https:\/\/booksy\.com\/en-us\/[^"'\s]*/g, cfg.shop.booksyUrl);
    html = html.replace(/https:\/\/booksy\.com/g, cfg.shop.booksyUrl);
  }

  // 1. Full URL-encoded Map addresses
  const newMapAddr = [cfg.location.address, cfg.location.city, cfg.location.state, cfg.location.zip].join(' ').replace(/ /g, '+');
  const oldMapShort = '3868+W+Sahara+Ave+Las+Vegas+NV+89102';
  const oldMapLong = '3868+West+Sahara+Avenue+Las+Vegas+NV+89102';
  html = html.replace(new RegExp(oldMapShort.replace(/\+/g, '\\+'), 'g'), newMapAddr);
  html = html.replace(new RegExp(oldMapLong.replace(/\+/g, '\\+'), 'g'), newMapAddr);

  // 2. Full Multi-Word Location & Phrase Blocks (Longest first)
  html = html.replace(/Valley Oaks Plaza • 3868 W Sahara Ave • Las Vegas, NV/g, `${cfg.location.plaza} • ${cfg.location.address} • ${cfg.location.city}, ${cfg.location.state}`);
  html = html.replace(/Charleston Decatur Center • 4960 W Charleston Blvd • Las Vegas, NV/g, `${cfg.location.plaza} • ${cfg.location.address} • ${cfg.location.city}, ${cfg.location.state}`);
  html = html.replace(/Conveniently located in Valley Oaks Plaza on W Sahara Ave near Valley View Blvd\./g, `Conveniently located in ${cfg.location.plaza} on ${cfg.location.address.split(' ').slice(1).join(' ')} near ${cfg.location.crossStreet}.`);
  html = html.replace(/Valley Oaks Plaza on W Sahara Ave near Valley View Blvd/g, `${cfg.location.plaza} on ${cfg.location.address.split(' ').slice(1).join(' ')} near ${cfg.location.crossStreet}`);
  html = html.replace(/Valley Oaks Plaza \(Sahara &amp; Valley View Blvd\)/g, `${cfg.location.plaza} (${cfg.location.crossStreet})`);
  html = html.replace(/Valley Oaks Plaza \(Sahara & Valley View Blvd\)/g, `${cfg.location.plaza} (${cfg.location.crossStreet})`);
  html = html.replace(/near the intersection of Sahara Ave &amp; Valley View Blvd/g, `near the intersection of ${cfg.location.crossStreet}`);
  html = html.replace(/near the intersection of Sahara Ave & Valley View Blvd/g, `near the intersection of ${cfg.location.crossStreet}`);
  html = html.replace(/inside Valley Oaks Plaza \(near the intersection of [^)]*\)/g, `inside ${cfg.location.plaza} (near the intersection of ${cfg.location.crossStreet})`);
  html = html.replace(/The Faded Times squad holding down Sahara Ave 🏆/g, `The ${cfg.shop.shortName || cfg.shop.name} squad holding down ${cfg.location.address.split(' ').slice(1, 4).join(' ')} 🏆`);
  html = html.replace(/holding down Sahara Ave/g, `holding down ${cfg.location.address.split(' ').slice(1, 4).join(' ')}`);

  // 3. Multi-word Plain Text Addresses
  html = html.replace(/3868 West Sahara Avenue/g, cfg.location.address);
  html = html.replace(/3868 W Sahara Ave/g, cfg.location.address);
  html = html.replace(/Valley Oaks Plaza/g, cfg.location.plaza);
  html = html.replace(/Las Vegas, NV 89102/g, `${cfg.location.city}, ${cfg.location.state} ${cfg.location.zip}`);
  html = html.replace(/NV 89102/g, `${cfg.location.state} ${cfg.location.zip}`);
  html = html.replace(/89102/g, cfg.location.zip);
  html = html.replace(/Sahara &amp; Valley View/g, cfg.location.crossStreet);
  html = html.replace(/Sahara & Valley View/g, cfg.location.crossStreet);
  html = html.replace(/Sahara Ave &amp; Valley View Blvd/g, cfg.location.crossStreet);
  html = html.replace(/Sahara Ave & Valley View Blvd/g, cfg.location.crossStreet);

  // 4. Phone Numbers
  html = html.replace(/\(702\) 272-2457/g, cfg.shop.phone);
  html = html.replace(/7022722457/g, cfg.shop.phoneRaw);

  // 5. Monogram (HTML tag-bound pattern)
  html = html.replace(/>FT</g, `>${cfg.shop.monogram}<`);

  // 6. Lookbook Hashtags
  html = html.replace(/#FadedTimesLV/g, `#${cfg.shop.instagram}LV`);

  // Compile Barbers Grid if cfg.team is provided
  if (cfg.team) {
    let barbersHtml = '\n';
    const allBarbers = [...(cfg.team.owners || []), ...(cfg.team.barbers || [])];
    allBarbers.forEach(b => {
      const role = b.role || b.title || 'Master Barber';
      const bio = b.bio || b.highlight || b.specialty || 'Master barber providing precision haircuts and grooming.';
      const badge = b.badge || `👑 ${role.toUpperCase()}`;
      const specialties = b.specialties || (b.specialty ? b.specialty.split(', ') : []);

      barbersHtml += `      <!-- Barber: ${b.name} -->
      <div class="card-luxury overflow-hidden flex flex-col justify-between group">
        <div class="relative h-64 overflow-hidden bg-dark-950">
          <img src="${b.image}" alt="${b.name} - ${role}" class="w-full h-full object-cover object-top transform group-hover:scale-105 transition-transform duration-500">
          <div class="absolute inset-0 bg-gradient-to-t from-dark-900 via-transparent to-transparent"></div>
          <div class="absolute top-3 left-3">
            <span class="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-dark-950 font-black text-[9px] uppercase tracking-wider shadow-md">
              ${badge}
            </span>
          </div>
          <div class="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span class="text-xs text-amber-300 font-semibold bg-dark-900/80 px-2 py-0.5 rounded backdrop-blur-sm">
              ${b.experience || 'Master Craftsman'}
            </span>
            <span class="text-xs text-amber-400 font-bold bg-dark-900/80 px-2 py-0.5 rounded backdrop-blur-sm">
              ${b.rating || '5.0'} ★
            </span>
          </div>
        </div>
        <div class="p-6 flex-1 flex flex-col justify-between space-y-4">
          <div>
            <h3 class="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">${b.name}</h3>
            <p class="text-xs text-amber-400 font-semibold mt-0.5">${role}</p>
            <p class="text-xs text-gray-400 mt-2 leading-relaxed">${bio}</p>
            <div class="mt-3 flex flex-wrap gap-1.5">
              ${specialties.map(s => `<span class="px-2 py-0.5 rounded bg-dark-800 border border-gray-800 text-[10px] text-gray-300">${s}</span>`).join('\n              ')}
            </div>
          </div>
          <div class="pt-4 border-t border-gray-800 flex items-center justify-between">
            <a href="${cfg.shop.booksyUrl}" target="_blank" rel="noopener noreferrer" class="open-booking-trigger w-full py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-dark-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-md text-center flex items-center justify-center" data-barber-name="${b.name}">
              <span>Book With ${b.name.split(' ')[0]}</span>
              <i class="fa-solid fa-arrow-up-right-from-square ml-1.5 text-[10px]"></i>
            </a>
          </div>
        </div>
      </div>\n`;
    });

    html = html.replace(/<!-- BEGIN BARBERS_LIST -->[\s\S]*?<!-- END BARBERS_LIST -->/, `<!-- BEGIN BARBERS_LIST -->${barbersHtml}      <!-- END BARBERS_LIST -->`);

    // Dynamic JSON-LD Schema Founders & Employees
    const schemaFounders = (cfg.team.owners || []).map(b => ({
      "@type": "Person",
      "name": b.name,
      "jobTitle": b.role || b.title || "Owner & Master Barber"
    }));
    const schemaEmployees = (cfg.team.barbers || []).map(b => ({
      "@type": "Person",
      "name": b.name,
      "jobTitle": b.role || b.title || "Staff Barber"
    }));
    html = html.replace(/"founder":\s*\[[\s\S]*?\],\s*"employee":\s*\[[\s\S]*?\]/, `"founder": ${JSON.stringify(schemaFounders, null, 6)},\n    "employee": ${JSON.stringify(schemaEmployees, null, 6)}`);

    // Replace staff names across Lookbook items, comments & reviews
    const owner0 = (cfg.team.owners && cfg.team.owners[0]) ? cfg.team.owners[0].name : 'Mir The Barber';
    const barber0 = (cfg.team.barbers && cfg.team.barbers[0]) ? cfg.team.barbers[0].name : 'Major Fadez';
    const barber1 = (cfg.team.barbers && cfg.team.barbers[1]) ? cfg.team.barbers[1].name : 'Hairanesa';
    const barber2 = (cfg.team.barbers && cfg.team.barbers[2]) ? cfg.team.barbers[2].name : 'Donscreationz';

    html = html.replace(/Daniel \(Co-Owner & Master Barber\)/g, `${owner0}`);
    html = html.replace(/Fidel \(Co-Owner & Master Barber\)/g, `${barber0}`);
    html = html.replace(/Daniel \(Co-Owner\)/g, `${owner0}`);
    html = html.replace(/Fidel \(Co-Owner\)/g, `${barber0}`);
    html = html.replace(/Marco Juarez/g, `${barber1}`);
    html = html.replace(/Polo Juarez/g, `${barber2}`);
    html = html.replace(/\bDaniel\b/g, `${owner0.split(' ')[0]}`);
    html = html.replace(/\bFidel\b/g, `${barber0.split(' ')[0]}`);
    html = html.replace(/\bMarco\b/g, `${barber1.split(' ')[0]}`);
    html = html.replace(/\bPolo\b/g, `${barber2.split(' ')[0]}`);

    // Compile Booking Modal Step 2 Barber Options
    let bookingBarbersHtml = `\n            <div class="barber-select-option p-3 sm:p-4 rounded-xl border border-amber-400 bg-amber-500/15 cursor-pointer text-center transition-all active:scale-95 col-span-2 sm:col-span-1" data-barber="Any Available">
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-amber-400 text-black font-bold flex items-center justify-center mx-auto mb-2 text-xs sm:text-sm">
                <i class="fa-solid fa-users"></i>
              </div>
              <span class="text-xs font-bold text-white block">Any Available</span>
              <span class="text-[10px] text-emerald-400">Fastest Availability</span>
            </div>\n`;

    allBarbers.forEach(b => {
      bookingBarbersHtml += `\n            <div class="barber-select-option p-3 sm:p-4 rounded-xl border border-gray-800 bg-dark-850 hover:border-gray-700 cursor-pointer text-center transition-all active:scale-95" data-barber="${b.name}">
              <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-dark-950 font-black flex items-center justify-center mx-auto mb-2 text-xs sm:text-sm">
                ${b.initials || b.name[0]}
              </div>
              <span class="text-xs font-bold text-white block">${b.name}</span>
              <span class="text-[10px] text-amber-300 truncate block">${b.role}</span>
            </div>\n`;
    });

    html = html.replace(/<div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">[\s\S]*?<\/div>\s*<\/div>\s*<div class="flex space-x-3 pt-2 sticky bottom-0/,
      `<div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">${bookingBarbersHtml}          </div>\n        </div>\n\n        <div class="flex space-x-3 pt-2 sticky bottom-0`);
  }

  // Compile Services Menu if cfg.services is provided
  if (cfg.services && Array.isArray(cfg.services)) {
    let servicesHtml = '\n';
    cfg.services.forEach(s => {
      const isPopular = s.popular ? ` border-amber-400/50 bg-gradient-to-b from-dark-800 to-dark-850 shadow-xl` : '';
      const badge = s.popular ? `\n        <div class="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 text-dark-950 font-black text-[10px] uppercase tracking-widest shadow-md">\n          ⭐ MOST POPULAR\n        </div>` : '';
      servicesHtml += `      <!-- Service: ${s.name} -->
      <div class="card-luxury p-7 flex flex-col justify-between relative group ${isPopular}">
        ${badge}
        <div class="absolute top-4 right-4 text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-800 text-gray-300 border border-gray-700">
          <i class="fa-regular fa-clock text-amber-400 mr-1"></i> ${s.duration} min
        </div>
        <div>
          <div class="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center mb-5 text-amber-400 text-xl group-hover:scale-110 transition-transform">
            <i class="fa-solid ${s.icon || 'fa-scissors'}"></i>
          </div>
          <h3 class="text-xl font-bold text-white mb-2">${s.name}</h3>
          <p class="text-gray-400 text-xs leading-relaxed mb-4">
            ${s.description || s.subtitle || ''}
          </p>
        </div>
        <div class="pt-4 border-t border-gray-800/80 flex items-center justify-between">
          <div>
            <span class="text-2xl font-serif font-black text-amber-400">$${s.price}</span>
          </div>
          <a href="${cfg.shop.booksyUrl}" target="_blank" rel="noopener noreferrer" class="open-booking-trigger px-4 py-2 rounded-lg bg-dark-800 hover:bg-amber-400 hover:text-black border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider transition-all flex items-center" data-service-key="${s.key}">
            <span>Book Now</span>
            <i class="fa-solid fa-arrow-up-right-from-square ml-1.5 text-[10px]"></i>
          </a>
        </div>
      </div>\n`;
    });

    html = html.replace(/<!-- BEGIN SERVICES_LIST -->[\s\S]*?<!-- END SERVICES_LIST -->/, `<!-- BEGIN SERVICES_LIST -->${servicesHtml}      <!-- END SERVICES_LIST -->`);

    // Compile Booking Modal Step 1 Services List
    let bookingServicesHtml = '\n';
    cfg.services.forEach((s, idx) => {
      const checked = idx === 0 ? ' checked' : '';
      bookingServicesHtml += `            <label class="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-gray-800 bg-dark-850 hover:border-gray-700 active:bg-dark-800 cursor-pointer transition-all">
              <div class="flex items-center space-x-3">
                <input type="checkbox" value="${s.key}" class="service-checkbox w-4 h-4 rounded text-amber-400 focus:ring-0 bg-dark-900 border-gray-700"${checked}>
                <div>
                  <span class="text-xs sm:text-sm font-bold text-white block">${s.name}</span>
                  <span class="text-[10px] sm:text-[11px] text-gray-400">${s.description} (${s.duration} min)</span>
                </div>
              </div>
              <span class="font-serif font-bold text-amber-400 text-sm sm:text-base">$${s.price}</span>
            </label>\n`;
    });

    html = html.replace(/<div class="space-y-2 sm:space-y-2.5">[\s\S]*?<\/div>\s*<div id="booking-total-summary">/,
      `<div class="space-y-2 sm:space-y-2.5">${bookingServicesHtml}          </div>\n\n          <div id="booking-total-summary">`);
  }

  // Inject Static window.SHOP_CONFIG right before js/app.js
  const configScript = `<script>window.SHOP_CONFIG = ${JSON.stringify(cfg, null, 2)};</script>\n  <script src="js/app.js"></script>`;
  html = html.replace(/<script src="js\/app\.js"><\/script>/, configScript);

  // Update styles.css header comment in output
  let css = fs.readFileSync(path.join(root, 'css/styles.css'), 'utf8');
  css = css.replace(/\/\* ==========================================================================\s*FADED TIMES BARBERSHOP[\s\S]*?========================================================================== \*\//,
    `/* ==========================================================================\n   ${cfg.shop.name.toUpperCase()} (@${cfg.shop.instagram}) - CUSTOM STYLES\n   ${cfg.location.city}, ${cfg.location.state} • ${cfg.location.address}\n   ========================================================================== */`);
  fs.writeFileSync(path.join(out, 'css/styles.css'), css, 'utf8');

  // Update js/app.js fallback header & config in output
  let js = fs.readFileSync(path.join(root, 'js/app.js'), 'utf8');
  js = js.replace(/@fadedtimeslv/g, `@${cfg.shop.instagram}`);
  fs.writeFileSync(path.join(out, 'js/app.js'), js, 'utf8');

  // Save customized output
  fs.writeFileSync(path.join(out, 'index.html'), html, 'utf8');
  fs.writeFileSync(path.join(out, 'template.config.json'), JSON.stringify(cfg, null, 2), 'utf8');
  if (readme) fs.writeFileSync(path.join(out, 'README.md'), readme, 'utf8');

  console.log(`Successfully generated website variation in: ${out}`);
}

const args = process.argv.slice(2);
let configFile = path.resolve(__dirname, '../template.config.json');
let outputDir = path.resolve(__dirname, '../dist/variation');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--config' && args[i + 1]) configFile = path.resolve(args[i + 1]);
  if (args[i] === '--out' && args[i + 1]) outputDir = path.resolve(args[i + 1]);
}

generateVariation(configFile, outputDir);
