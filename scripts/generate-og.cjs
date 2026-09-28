const sharp = require('sharp');
const path = require('path');

async function makeOg() {
  const svgText = `
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#000000"/>
      <rect x="40" y="40" width="1120" height="550" fill="none" stroke="#222222" stroke-width="1"/>
      <text x="80" y="115" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="15" fill="#888888" letter-spacing="2">( ARYA RAJASA STUDIO )</text>
      <text x="80" y="340" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="bold" font-size="52" fill="#ffffff" letter-spacing="-1">unforgettable brand &amp;</text>
      <text x="80" y="405" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-weight="bold" font-size="52" fill="#ffffff" letter-spacing="-1">visual identities.</text>
      <text x="80" y="480" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="20" fill="#a3a3a3">brand designer based in canggu, bali</text>
      <text x="80" y="535" font-family="'Helvetica Neue', Helvetica, Arial, sans-serif" font-size="13" fill="#666666" letter-spacing="1.5">BRAND SYSTEMS · PACKAGING · EDITORIAL · ART DIRECTION</text>
    </svg>
  `;

  const svg = Buffer.from(svgText);

  const dove = await sharp(path.join(__dirname, '../public/dove_ascii_logo_transparent.png'))
    .resize(240, 264)
    .toBuffer();

  await sharp(svg)
    .composite([
      {
        input: dove,
        top: 80,
        left: 850,
      }
    ])
    .png()
    .toFile(path.join(__dirname, '../public/og-image.png'));

  console.log('public/og-image.png successfully generated');
}

makeOg().catch(console.error);
