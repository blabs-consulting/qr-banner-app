const QRCode = require('qrcode');
const sharp = require('sharp');
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
    
    // Parser FormData
    let url = null;
    let transparentBuffer = null;

    await new Promise((resolve, reject) => {
      const bb = busboy({ headers: req.headers });
      
      bb.on('field', (fieldname, val) => {
        if (fieldname === 'url') url = val;
      });

      bb.on('file', (fieldname, file, info) => {
        if (fieldname === 'transparent') {
          const chunks = [];
          file.on('data', (data) => chunks.push(data));
          file.on('end', () => transparentBuffer = Buffer.concat(chunks));
        }
      });

      bb.on('close', resolve);
      bb.on('error', reject);
      req.pipe(bb);
    });

    if (!url) {
      return res.status(400).json({ error: 'URL requise' });
    }

    // 1️⃣ Générer QR code
    const qrBuffer = await QRCode.toBuffer(url, {
      width: 380,
      margin: 2,
      errorCorrectionLevel: 'H'
    });

    // 2️⃣ Fond blanc 960x540
    let imageBuffer = await sharp({
      create: {
        width: 960,
        height: 540,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    })
    .png()
    .toBuffer();

    // 3️⃣ Placer QR à +514+80
    imageBuffer = await sharp(imageBuffer)
      .composite([{
        input: qrBuffer,
        top: 80,
        left: 514
      }])
      .png()
      .toBuffer();

    // 4️⃣ Si overlay transparent
    if (transparentBuffer) {
      imageBuffer = await sharp(transparentBuffer)
        .resize(960, 540)
        .composite([{ input: imageBuffer, top: 0, left: 0 }])
        .png()
        .toBuffer();
    }

    const base64Image = imageBuffer.toString('base64');

    res.json({
      success: true,
      image: base64Image,
      size: '960×540px'
    });

  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};
