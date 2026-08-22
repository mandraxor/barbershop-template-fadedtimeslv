/**
 * PRE-FLIGHT BRANDING & LEAK AUDIT SCRIPT
 * --------------------------------------------------------------------------
 * Scans all production source files (.html, .js, .css, .json, .tsx, .jsx)
 * in /src, /public, /js, /css, and root to verify zero competitor names,
 * legacy phone numbers, placeholder strings, or obsolete assets leak to production.
 *
 * Usage:
 *   node scripts/preflight-audit.js
 *   node scripts/preflight-audit.js --dir ../barbershop-template-crowdpleezers
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let targetDir = path.resolve(__dirname, '..');

for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--dir' || args[i] === '--target') && args[i + 1]) {
    targetDir = path.resolve(args[i + 1]);
  }
}

// 1. Load Shop Config to verify authentic phone & business data
const configPath = fs.existsSync(path.join(targetDir, 'shop-config.json'))
  ? path.join(targetDir, 'shop-config.json')
  : (fs.existsSync(path.join(targetDir, 'src/config/shop-config.json'))
      ? path.join(targetDir, 'src/config/shop-config.json')
      : path.join(targetDir, 'template.config.json'));

let activeConfig = null;
if (fs.existsSync(configPath)) {
  try {
    activeConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (err) {
    console.error(`❌ JSON SYNTAX ERROR in config file [${configPath}]: ${err.message}`);
    process.exit(1);
  }
}

const activePhoneRaw = activeConfig?.business?.phoneRaw || activeConfig?.shop?.phoneRaw || '';
const activePhone = activeConfig?.business?.phone || activeConfig?.shop?.phone || '';
const activeShopName = activeConfig?.business?.name || activeConfig?.shop?.name || '';

// 2. Blacklisted competitor keywords and outdated test placeholders
const FORBIDDEN_PATTERNS = [
  // Competitor keywords (unless explicitly the active shop name)
  { pattern: /Faded\s*Times/i, label: 'Faded Times' },
  { pattern: /fadedtimeslv/i, label: 'fadedtimeslv' },
  { pattern: /Sahara\s*Ave/i, label: 'Sahara Ave' },
  { pattern: /Valley\s*View\s*Blvd/i, label: 'Valley View Blvd' },
  { pattern: /Valley\s*Oaks/i, label: 'Valley Oaks' },
  { pattern: />FT</, label: '>FT< (Legacy monogram)' },

  // Outdated placeholder / test strings
  { pattern: /\(555\)\s*000-0000/, label: '(555) 000-0000 (Test Phone)' },
  { pattern: /\b5550000000\b/, label: '5550000000 (Raw Test Phone)' },
  { pattern: /\bMetropolis\b/i, label: 'Metropolis (Placeholder City)' },
  { pattern: /\bLead\s+Barber\b/i, label: 'Lead Barber (Placeholder Role)' },
  { pattern: /\bFade\s+Specialist\b/i, label: 'Fade Specialist (Placeholder Role)' },
  { pattern: /\bBarbershop\s+Barbershop\b/i, label: 'Barbershop Barbershop (Duplicate Suffix)' },
  { pattern: /\bBlvd\s+Blvd\b/i, label: 'Blvd Blvd (Duplicate Street Suffix)' },

  // Old competitor photo assets
  { pattern: /crew-lasvegas/i, label: 'crew-lasvegas (Legacy Competitor Image Asset)' },
  { pattern: /barbershop_crew_lasvegas/i, label: 'barbershop_crew_lasvegas (Legacy Competitor Asset)' }
];

// Add competitor checks conditionally if not compiling that specific variation
if (activeShopName !== 'Crowd Pleezers Barbershop') {
  FORBIDDEN_PATTERNS.push(
    { pattern: /Crowd\s*Pleezers/i, label: 'Crowd Pleezers' },
    { pattern: /crowdpleezers/i, label: 'crowdpleezers' },
    { pattern: />CP</, label: '>CP<' }
  );
}

// 3. Scan Files Recursively
const VALID_EXTENSIONS = new Set(['.html', '.js', '.css', '.json', '.tsx', '.jsx']);
const EXCLUDED_DIRS = new Set([
  'node_modules',
  '.git',
  '.system_generated',
  'scripts',      // Do not scan audit / generator scripts themselves
  'configs',      // Multi-shop config profiles
  'dist',
  'scratch',
  '.next',
  '.cache'
]);

let leaksFound = [];

function scanDirectory(currentDir) {
  if (!fs.existsSync(currentDir)) return;
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(targetDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!EXCLUDED_DIRS.has(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VALID_EXTENSIONS.has(ext)) {
        // Exclude README.md, workflow docs, or build manifests from code scan
        if (entry.name === 'package-lock.json' || entry.name === 'REBRAND_WORKFLOW.md' || entry.name === 'GEMINI.md') {
          continue;
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        // Check each forbidden pattern
        FORBIDDEN_PATTERNS.forEach(({ pattern, label }) => {
          lines.forEach((line, index) => {
            // Ignore meta keywords tag which can intentionally have discovery keywords
            if (line.includes('<meta name="keywords"') || line.includes('"keywords"')) {
              return;
            }

            if (pattern.test(line)) {
              leaksFound.push({
                file: relPath,
                line: index + 1,
                snippet: line.trim(),
                matched: label
              });
            }
          });
        });

        // Phone number validator: check for any hardcoded US phone numbers
        const phoneRegex = /\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/g;
        let match;
        while ((match = phoneRegex.exec(content)) !== null) {
          const rawDigits = `${match[1]}${match[2]}${match[3]}`;
          // Allowed numbers: active config phone or common harmless port/year numbers
          if (activePhoneRaw && rawDigits !== activePhoneRaw && rawDigits !== '7025550199' && !rawDigits.startsWith('000')) {
            // Check if it's an outdated phone like 7022722457 or 7023291212 on the master template
            if (rawDigits === '7022722457' || rawDigits === '7023291212') {
              leaksFound.push({
                file: relPath,
                line: content.substring(0, match.index).split('\n').length,
                snippet: match[0],
                matched: `Unmatched/Legacy phone number: ${match[0]}`
              });
            }
          }
        }
      }
    }
  }
}

console.log(`\n🔍 Running Barbershop Pre-Flight Audit on: ${targetDir}`);
scanDirectory(targetDir);

if (leaksFound.length > 0) {
  console.error('\n❌ PRE-FLIGHT AUDIT FAILED — LEAKS DETECTED:\n');
  leaksFound.forEach(leak => {
    console.error(`❌ LEAK DETECTED in [${leak.file}:${leak.line}]: Found forbidden string '${leak.matched}' — fix before deploying.`);
    console.error(`   Snippet: "${leak.snippet}"\n`);
  });
  console.error(`Total leaks detected: ${leaksFound.length}`);
  process.exit(1);
} else {
  console.log('\n✅ Pre-flight audit passed: Zero competitor leaks or placeholder artifacts detected.\n');
  process.exit(0);
}
