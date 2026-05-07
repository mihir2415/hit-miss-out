import fs from 'fs/promises';
import path from 'path';

const CACHE_DIR = path.join(process.cwd(), '.cache');

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const file = path.join(CACHE_DIR, `${key}.json`);
    const raw = await fs.readFile(file, 'utf8');
    const { ts, data } = JSON.parse(raw) as { ts: number; data: T };
    // 24-hour TTL
    if (Date.now() - ts > 86_400_000) return null;
    return data;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
  const file = path.join(CACHE_DIR, `${key}.json`);
  await fs.writeFile(file, JSON.stringify({ ts: Date.now(), data }));
}
