const { v4: uuidv4 } = require('uuid');

async function optimizeAndUpload(buffer, originalName, folder) {
  // Try Firebase Storage upload with sharp optimization
  try {
    const sharp = require('sharp');
    const { storage } = require('../config/firebase');

    if (!storage) {
      console.warn('⚠️  Firebase Storage not configured — skipping photo upload');
      return null;
    }

    const baseName = `${folder}/${uuidv4()}`;
    const urls = {};

    // Thumbnail (400px)
    const thumb = await sharp(buffer)
      .resize(400, 300, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer();
    const thumbFile = storage.file(`${baseName}-thumb.jpg`);
    await thumbFile.save(thumb, { contentType: 'image/jpeg' });
    await thumbFile.makePublic();
    urls.thumb = `https://storage.googleapis.com/${storage.name}/${baseName}-thumb.jpg`;

    // Full (1200px)
    const full = await sharp(buffer)
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();
    const fullFile = storage.file(`${baseName}-full.jpg`);
    await fullFile.save(full, { contentType: 'image/jpeg' });
    await fullFile.makePublic();
    urls.full = `https://storage.googleapis.com/${storage.name}/${baseName}-full.jpg`;

    return urls;
  } catch (err) {
    console.warn('⚠️  Image upload failed:', err.message, '— room will be saved without photos');
    return null;
  }
}

module.exports = { optimizeAndUpload };
