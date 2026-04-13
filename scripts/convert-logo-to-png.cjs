// One-time: convert assets/logo.jpg to assets/logo.png
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const dir = path.join(__dirname, '..');
const src = path.join(dir, 'assets', 'logo.jpg');
const dest = path.join(dir, 'assets', 'logo.png');

if (!fs.existsSync(src)) {
  console.error('Missing:', src);
  process.exit(1);
}

sharp(src)
  .png()
  .toFile(dest)
  .then(() => console.log('Created:', dest))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
