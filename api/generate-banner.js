const { execSync } = require('child_process');
const QRCode = require('qrcode');
const { Jimp } = require('jimp');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Dossier temporaire
const tmpDir = os.tmpdir();

export default async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, transparent } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL requise' });
  }

  let tempFiles = [];

  try {
    // 1️⃣ Générer QR code (380×380)
    const qrPath = path.join(tmpDir, `qr_${Date.now()}.png`);
    await QRCode.toFile(qrPath, url, {
      width: 2660,
      margin: 2,
      errorCorrectionLevel: 'H'
    });
    tempFiles.push(qrPath);

    // Redimensionner QR à 380×380 avec ImageMagick
    const qrResizedPath = path.join(tmpDir, `qr_resized_${Date.now()}.png`);
    execSync(`convert "${qrPath}" -resize 380x380 "${qrResizedPath}"`);
    tempFiles.push(qrResizedPath);

    // 2️⃣ Créer fond blanc (960×540)
    const bgPath = path.join(tmpDir, `bg_${Date.now()}.png`);
    execSync(`convert -size 960x540 xc:white "${bgPath}"`);
    tempFiles.push(bgPath);

    // 3️⃣ Placer QR sur fond blanc (+514+80)
    const qrBgPath = path.join(tmpDir, `qr_bg_${Date.now()}.png`);
    execSync(`convert "${bgPath}" "${qrResizedPath}" -geometry +514+80 -compose Over -composite "${qrBgPath}"`);
    tempFiles.push(qrBgPath);

    // 4️⃣ Si fichier transparent fourni, le redimensionner
    let finalPath = qrBgPath;

    if (transparent) {
      const transparentPath = path.join(tmpDir, `transparent_${Date.now()}.png`);
      fs.writeFileSync(transparentPath, transparent);
      tempFiles.push(transparentPath);

      const transparentResizedPath = path.join(tmpDir, `transparent_resized_${Date.now()}.png`);
      execSync(`convert "${transparentPath}" -resize 960x540 "${transparentResizedPath}"`);
      tempFiles.push(transparentResizedPath);

      // 5️⃣ Composite final avec gestion colorspace
      finalPath = path.join(tmpDir, `final_${Date.now()}.png`);
      execSync(`convert "${qrBgPath}" "${transparentResizedPath}" -colorspace sRGB -composite "${finalPath}"`);
      tempFiles.push(finalPath);
    }

    // Lire le fichier résultat et le convertir en base64
    const imageBuffer = fs.readFileSync(finalPath);
    const base64Image = imageBuffer.toString('base64');

    res.status(200).json({
      success: true,
      image: base64Image,
      size: '960×540px'
    });

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ 
      error: `Erreur lors de la génération: ${error.message}` 
    });
  } finally {
    // Nettoyer les fichiers temporaires
    tempFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (e) {}
    });
  }
};
