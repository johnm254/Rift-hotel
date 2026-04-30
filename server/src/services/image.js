const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { storage } = require('../config/firebase');

async function optimizeAndUpload(buffer, originalName, folder) {
  const baseName = `${folder}/${uuidv4()}`;
  const urls = {};

  // Thumbnail (400px, small, for grids)
  const thumb = await sharp(buffer)
    .resize(400, 300, { fit: 'cover' })
    .jpeg({ quality: 80 })
    .toBuffer();
  const thumbFile = storage.file(`${baseName}-thumb.jpg`);
  await thumbFile.save(thumb, { contentType: 'image/jpeg' });
  await thumbFile.makePublic();
  urls.thumb = `https://storage.googleapis.com/${storage.name}/${baseName}-thumb.jpg`;

  // Full (1200px, for gallery)
  const full = await sharp(buffer)
    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  const fullFile = storage.file(`${baseName}-full.jpg`);
  await fullFile.save(full, { contentType: 'image/jpeg' });
  await fullFile.makePublic();
  urls.full = `https://storage.googleapis.com/${storage.name}/${baseName}-full.jpg`;

  return urls;
}

module.exports = { optimizeAndUpload };
