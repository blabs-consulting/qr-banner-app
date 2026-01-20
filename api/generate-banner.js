const QRCode = require('qrcode');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const busboy = require('busboy');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tmpDir = os.tmpdir();
    
    // Parser FormData avec busboy
    let url = null;
    let transparentBuffer = null;

    await new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers });
      
      bb.on('field', (fieldname, val) => {
        if (fieldname === 'url') {
          url = val;
        }
      });

      bb.on('file', (fieldname, file, info) => {
        if (fieldname === 'transparent') {
          const chunks = [];
          file.on('data', (data) => chunks.push(data));
          file.on('end', () => {
            transparentBuffer = Buffer.concat(chunks);
          });
        }
      });

      bb.on('close', resolve);
      bb.on('error', reject);
      
      req.pipe(bb);
    });

    if (!url) {
      return res.status(400).json({ error: 'URL requise' });
    }

    console.log('URL reçue:', url);

    // Générer QR code
    const qrPath = path.join(tmpDir, `qr_${Date.now()}.png`);
    await QRCode.toFile(qrPath, url, {
      width: 2660,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    // Redimensionner
    const qrResizedPath = path.join(tmpDir, `qr_resized_${Date.now()}.png`);
    execSync(`convert "${qrPath}" -resize 380x380 "${qrResizedPath}"`);

    // Fond blanc
    const bgPath = path.join(tmpDir, `bg_${Date.now()}.png`);
    execSync(`convert -size 960x540 xc:white "${bgPath}"`);

    // Placer QR
    const qrBgPath = path.join(tmpDir, `qr_bg_${Date.now()}.png`);
    execSync(`convert "${bgPath}" "${qrResizedPath}" -geometry +514+80 -compose Over -composite "${qrBgPath}"`);

    let finalPath = qrBgPath;