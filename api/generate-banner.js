const QRCode = require('qrcode');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const tmpDir = os.tmpdir();
    const url = req.body?.url || req.query?.url;

    if (!url) {
      return res.status(400).json({ error: 'URL requise' });
    }

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

    // Lire et retourner
    const imageBuffer = fs.readFileSync(qrBgPath);
    const base64Image = imageBuffer.toString('base64');

    // Nettoyer
    [qrPath, qrResizedPath, bgPath, qrBgPath].forEach(f => {
      try { fs.unlinkSync(f); } catch (e) {}
    });

    res.status(200).json({
      success: true,
      image: base64Image,
      size: '960×540px'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: `Erreur: ${error.message}` 
    });
  }
};
