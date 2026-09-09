import fs from 'fs';
import path from 'path';
import { env } from '../env';
import type { StorageAdapter } from './index';

export class LocalDiskStorage implements StorageAdapter {
  private root: string;

  constructor() {
    this.root = path.resolve(env.localStorageDir);
    fs.mkdirSync(this.root, { recursive: true });
  }

  private resolve(key: string) {
    const p = path.join(this.root, key);
    if (!p.startsWith(this.root)) throw new Error('invalid storage key');
    return p;
  }

  async put(key: string, body: Buffer): Promise<string> {
    const dest = this.resolve(key);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, body);
    return key;
  }

  async getReadUrl(key: string): Promise<string> {
    // Dev-only: served by the /audio/:key static route in index.ts.
    return `/audio-files/${encodeURIComponent(key)}`;
  }

  async get(key: string): Promise<Buffer> {
    return fs.readFileSync(this.resolve(key));
  }
}
