const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function main() {
  const projectRoot = path.join(__dirname, '..');
  const inputPath = path.join(projectRoot, 'presentation_brief_ar.txt');
  const outputPath = path.join(projectRoot, 'presentation_brief_ar.pdf');

  if (!fs.existsSync(inputPath)) {
    console.error('Missing input file:', inputPath);
    process.exit(1);
  }

  const text = fs.readFileSync(inputPath, 'utf8');

  const html = `<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <title>presentation_brief_ar</title>
    <style>
      @page { size: A4; margin: 18mm 16mm; }
      body {
        font-family: "Tahoma", "Arial", sans-serif;
        font-size: 12.5pt;
        line-height: 1.55;
        color: #111;
      }
      pre {
        white-space: pre-wrap;
        word-wrap: break-word;
        margin: 0;
      }
      .container { width: 100%; }
    </style>
  </head>
  <body>
    <div class="container">
      <pre>${escapeHtml(text)}</pre>
    </div>
  </body>
</html>`;

  const browser = await puppeteer.launch({ headless: 'new' });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({
      path: outputPath,
      printBackground: true,
      preferCSSPageSize: true,
    });
    console.log('Created:', outputPath);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

