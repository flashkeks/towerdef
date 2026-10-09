// Vorschau der gemalten Karte als PNG (ohne Browser): npx tsx scripts/map-preview.ts OUT.png [SCALE] [frame]
import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';
import { Buf } from '../src/pixel/map/buf';
import { composeMeadow } from '../src/pixel/map/compose';

function crc32(buf: Uint8Array): number {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Uint8Array): Buffer {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), Buffer.from(data)]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
export function png(rgba: Uint8ClampedArray, w: number, h: number, scale = 1): Buffer {
  const W = w * scale, H = h * scale;
  const raw = Buffer.alloc((W * 4 + 1) * H);
  for (let y = 0; y < H; y++) {
    raw[y * (W * 4 + 1)] = 0;
    for (let x = 0; x < W; x++) {
      const si = ((Math.floor(y / scale)) * w + Math.floor(x / scale)) * 4;
      const di = y * (W * 4 + 1) + 1 + x * 4;
      raw[di] = rgba[si]; raw[di + 1] = rgba[si + 1]; raw[di + 2] = rgba[si + 2]; raw[di + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', new Uint8Array())]);
}
const [out = '/tmp/map.png', sc = '2', fr = '0'] = process.argv.slice(2);
const t0 = Date.now();
const img: Buf = composeMeadow(Number(fr));
console.log('gemalt in', Date.now() - t0, 'ms');
writeFileSync(out, png(img.rgba(), img.w, img.h, Number(sc)));
