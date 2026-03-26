#!/usr/bin/env node
// run: node gen-icons.js
// generates icon-192.png and icon-512.png in /public

const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function genIcon(size, outPath) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // background
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);

  // aura
  const grad = ctx.createRadialGradient(size*0.4, size*0.3, 0, size*0.5, size*0.5, size*0.6);
  grad.addColorStop(0, 'rgba(108,99,255,0.6)');
  grad.addColorStop(0.5, 'rgba(108,99,255,0.15)');
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  // text "ft"
  ctx.fillStyle = '#fff';
  ctx.font = `bold ${size*0.38}px -apple-system, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ft', size/2, size/2 + size*0.03);

  fs.writeFileSync(outPath, canvas.toBuffer('image/png'));
  console.log('Generated', outPath);
}

const publicDir = path.join(__dirname, 'public');
try {
  genIcon(192, path.join(publicDir, 'icon-192.png'));
  genIcon(512, path.join(publicDir, 'icon-512.png'));
} catch(e) {
  console.log('canvas not available, skipping icon gen — add your own icons to /public');
}
