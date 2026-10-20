/**
 * 极简 ZIP 写入器（store / deflate 两种方式，零依赖）。
 * 只服务于交付打包：文件数不多、单个文件不大，全部放内存里写完即可。
 */
import { writeFileSync } from 'node:fs';
import { deflateRawSync } from 'node:zlib';

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function dosDateTime(d) {
  return {
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
    date: ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
  };
}

/**
 * @param {string} outFile
 * @param {Array<{name: string, data?: Buffer, dir?: boolean}>} entries
 *        name 一律用正斜杠；目录条目以 / 结尾。
 */
export function writeZip(outFile, entries) {
  const chunks = [];
  const central = [];
  const { time, date } = dosDateTime(new Date());
  let offset = 0;

  for (const entry of entries) {
    const name = entry.name.replace(/\\/g, '/') + (entry.dir && !entry.name.endsWith('/') ? '/' : '');
    const nameBuf = Buffer.from(name, 'utf8');
    const isDir = Boolean(entry.dir);
    const raw = isDir ? Buffer.alloc(0) : entry.data;

    let method = 0;
    let packed = raw;
    if (!isDir && raw.length) {
      const deflated = deflateRawSync(raw, { level: 9 });
      if (deflated.length < raw.length) {
        method = 8;
        packed = deflated;
      }
    }
    const crc = isDir ? 0 : crc32(raw);
    const flags = 0x0800; // 文件名按 UTF-8 解释，中文路径才不会乱码

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(time, 10);
    local.writeUInt16LE(date, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);

    chunks.push(local, nameBuf, packed);
    central.push({
      nameBuf, flags, method, time, date, crc,
      csize: packed.length, usize: raw.length, offset, isDir,
    });
    offset += local.length + nameBuf.length + packed.length;
  }

  const cdStart = offset;
  let cdSize = 0;
  for (const c of central) {
    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0);
    head.writeUInt16LE(20, 4);
    head.writeUInt16LE(20, 6);
    head.writeUInt16LE(c.flags, 8);
    head.writeUInt16LE(c.method, 10);
    head.writeUInt16LE(c.time, 12);
    head.writeUInt16LE(c.date, 14);
    head.writeUInt32LE(c.crc, 16);
    head.writeUInt32LE(c.csize, 20);
    head.writeUInt32LE(c.usize, 24);
    head.writeUInt16LE(c.nameBuf.length, 28);
    head.writeUInt16LE(0, 30);
    head.writeUInt16LE(0, 32);
    head.writeUInt16LE(0, 34);
    head.writeUInt16LE(0, 36);
    head.writeUInt32LE(c.isDir ? 0x10 : 0, 38);
    head.writeUInt32LE(c.offset, 42);
    chunks.push(head, c.nameBuf);
    cdSize += head.length + c.nameBuf.length;
  }

  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(central.length, 8);
  eocd.writeUInt16LE(central.length, 10);
  eocd.writeUInt32LE(cdSize, 12);
  eocd.writeUInt32LE(cdStart, 16);
  eocd.writeUInt16LE(0, 20);
  chunks.push(eocd);

  writeFileSync(outFile, Buffer.concat(chunks));
  return { files: central.filter((c) => !c.isDir).length, bytes: offset + cdSize + eocd.length };
}
