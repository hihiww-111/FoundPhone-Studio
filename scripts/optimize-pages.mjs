import { readdir, readFile, writeFile, stat, rm } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

// Optimize deployment copies only. Keep source photos, paths and story IDs intact.
const root = path.resolve("dist");
let before = 0, after = 0, changed = 0;
const oversize = [];
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    // Temporary transfer files are not public website assets.
    if (entry.name === ".DS_Store" || /^\..+\.[A-Za-z0-9]{6}$/.test(entry.name)) {
      await rm(file, { recursive: true, force: true });
      continue;
    }
    if (entry.isDirectory()) { await walk(file); continue; }
    const originalSize = (await stat(file)).size;
    let deployedSize = originalSize;
    if (/\.(jpe?g|png|webp)$/i.test(file)) {
      const input = await readFile(file);
      const metadata = await sharp(input).metadata();
      // Preserve animated assets and full-height document screenshots.
      if ((metadata.pages ?? 1) === 1) {
        const maxWidth = /[\\/](safari)[\\/]/.test(file) ? 1600 : 1920;
        let image = sharp(input).rotate().resize({ width: maxWidth, withoutEnlargement: true });
        if (/\.jpe?g$/i.test(file)) image = image.jpeg({ quality: 82, mozjpeg: true });
        else if (/\.png$/i.test(file)) image = image.png({ compressionLevel: 9 });
        else image = image.webp({ quality: 82 });
        const output = await image.toBuffer();
        // Never replace an asset with a larger encoding.
        if (output.length < originalSize) {
          await writeFile(file, output);
          deployedSize = output.length;
          changed++;
        }
      }
      before += originalSize; after += deployedSize;
    }
    if (deployedSize > 25 * 1024 * 1024) oversize.push(path.relative(root, file));
  }
}
await walk(root);
console.log(`Pages images: ${changed} optimized; ${(before / 1048576).toFixed(2)} → ${(after / 1048576).toFixed(2)} MiB. Source media unchanged.`);
if (oversize.length) throw new Error(`Pages assets exceed 25 MiB:\n${oversize.join("\n")}`);
