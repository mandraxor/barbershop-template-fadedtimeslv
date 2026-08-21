/**
 * Master Barbershop Variation Engine
 * ----------------------------------------------------
 * Quickly generates a customized, production-ready barbershop website
 * using a template.config.json profile.
 * 
 * Usage:
 *   node scripts/generate-variation.js --config path/to/shop.json --out ../new-shop-site
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

  console.log('Generating variation for: ' + cfg.shop.name + ' (' + cfg.location.city + ', ' + cfg.location.state + ')');

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
  let readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

  // Replace Shop Information
  html = html.replace(/<title>.*?<\/title>/, '<title>' + cfg.shop.name + ' | Premier ' + cfg.location.city + ' Barbershop & Cuts</title>');
  
  // Save customized output
  fs.writeFileSync(path.join(out, 'index.html'), html, 'utf8');
  fs.writeFileSync(path.join(out, 'template.config.json'), JSON.stringify(cfg, null, 2), 'utf8');
  fs.writeFileSync(path.join(out, 'README.md'), readme, 'utf8');

  console.log('Successfully created variation at: ' + out);
  console.log('To preview locally: cd ' + outputDir + ' && npx serve .');
}

const args = process.argv.slice(2);
let configFile = path.resolve(__dirname, '../template.config.json');
let outputDir = path.resolve(__dirname, '../dist/variation');

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--config' && args[i + 1]) configFile = path.resolve(args[i + 1]);
  if (args[i] === '--out' && args[i + 1]) outputDir = path.resolve(args[i + 1]);
}

generateVariation(configFile, outputDir);
