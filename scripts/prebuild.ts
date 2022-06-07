import db from '~/utils/db';
import { writeFile, rm, mkdir } from 'fs/promises';

(async () => {
  await rm('./public/assets', { recursive: true, force: true });
  await mkdir('./public/assets');

  const assets = db.prepare(`SELECT id, data FROM assets WHERE data_type = 'image/webp'`).all();

  for (const asset of assets) {
    const fileName = `./public/assets/${asset.id}.webp`;
    await writeFile(fileName, asset.data);
  }
})();
