import { readFile, writeFile, rename, mkdir } from 'fs/promises';
import { dirname } from 'path';

export class JSONStore<T> {
  private filePath: string;
  private defaultData: T;

  constructor(filePath: string, defaultData: T) {
    this.filePath = filePath;
    this.defaultData = defaultData;
  }

  async read(): Promise<T> {
    try {
      const raw = await readFile(this.filePath, 'utf-8');
      return JSON.parse(raw) as T;
    } catch (err: unknown) {
      if (err instanceof SyntaxError) {
        console.error(`[JSONStore] Invalid JSON in ${this.filePath}:`, err.message);
      } else if (isNodeError(err) && err.code === 'ENOENT') {
        // File doesn't exist yet — not an error, just return defaults
      } else {
        console.error(`[JSONStore] Error reading ${this.filePath}:`, err);
      }
      return this.defaultData;
    }
  }

  async write(data: T): Promise<void> {
    const json = JSON.stringify(data, null, 2);
    await this.atomicWrite(this.filePath, json);
  }

  private async atomicWrite(filePath: string, data: string): Promise<void> {
    const tmpPath = `${filePath}.tmp`;
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(tmpPath, data, 'utf-8');
    await rename(tmpPath, filePath);
  }
}

function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
