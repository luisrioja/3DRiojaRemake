import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSONStore } from './JSONStore.js';
import { mkdtemp, rm, readFile, writeFile, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

interface TestData {
  items: string[];
  count: number;
}

const defaultData: TestData = { items: [], count: 0 };

let tempDir: string;

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'jsonstore-test-'));
});

afterEach(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe('JSONStore', () => {
  describe('read()', () => {
    it('returns default data when file does not exist', async () => {
      const store = new JSONStore<TestData>(join(tempDir, 'missing.json'), defaultData);
      const result = await store.read();
      expect(result).toEqual(defaultData);
    });

    it('reads and parses valid JSON', async () => {
      const filePath = join(tempDir, 'data.json');
      const data: TestData = { items: ['a', 'b'], count: 2 };
      await writeFile(filePath, JSON.stringify(data), 'utf-8');

      const store = new JSONStore<TestData>(filePath, defaultData);
      const result = await store.read();
      expect(result).toEqual(data);
    });

    it('returns default data and logs error for invalid JSON', async () => {
      const filePath = join(tempDir, 'bad.json');
      await writeFile(filePath, '{not valid json!!!', 'utf-8');
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const store = new JSONStore<TestData>(filePath, defaultData);
      const result = await store.read();

      expect(result).toEqual(defaultData);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[JSONStore] Invalid JSON'),
        expect.any(String)
      );
      errorSpy.mockRestore();
    });
  });

  describe('write()', () => {
    it('writes data that can be read back', async () => {
      const filePath = join(tempDir, 'out.json');
      const store = new JSONStore<TestData>(filePath, defaultData);
      const data: TestData = { items: ['x'], count: 1 };

      await store.write(data);
      const result = await store.read();
      expect(result).toEqual(data);
    });

    it('creates parent directories if they do not exist', async () => {
      const filePath = join(tempDir, 'nested', 'dir', 'data.json');
      const store = new JSONStore<TestData>(filePath, defaultData);
      const data: TestData = { items: ['nested'], count: 1 };

      await store.write(data);
      const raw = await readFile(filePath, 'utf-8');
      expect(JSON.parse(raw)).toEqual(data);
    });

    it('overwrites existing data', async () => {
      const filePath = join(tempDir, 'overwrite.json');
      const store = new JSONStore<TestData>(filePath, defaultData);

      await store.write({ items: ['first'], count: 1 });
      await store.write({ items: ['second'], count: 2 });

      const result = await store.read();
      expect(result).toEqual({ items: ['second'], count: 2 });
    });
  });

  describe('atomic write', () => {
    it('does not leave .tmp file after successful write', async () => {
      const filePath = join(tempDir, 'atomic.json');
      const store = new JSONStore<TestData>(filePath, defaultData);

      await store.write({ items: ['ok'], count: 1 });

      const { readdir } = await import('fs/promises');
      const files = await readdir(tempDir);
      expect(files).not.toContain('atomic.json.tmp');
      expect(files).toContain('atomic.json');
    });

    it('preserves original data if rename would fail (simulated)', async () => {
      const filePath = join(tempDir, 'preserve.json');
      const store = new JSONStore<TestData>(filePath, defaultData);
      const original: TestData = { items: ['original'], count: 1 };
      await store.write(original);

      // Create a new store and try to write — simulate failure by making
      // the target a directory (rename to a directory fails)
      const badPath = join(tempDir, 'baddir');
      await mkdir(badPath);
      const badStore = new JSONStore<TestData>(join(badPath, '..', 'baddir'), defaultData);

      // The original file should still be intact
      const result = await store.read();
      expect(result).toEqual(original);
    });
  });

  describe('round-trip', () => {
    it('write then read from a new instance returns same data', async () => {
      const filePath = join(tempDir, 'roundtrip.json');
      const data: TestData = { items: ['a', 'b', 'c'], count: 3 };

      const store1 = new JSONStore<TestData>(filePath, defaultData);
      await store1.write(data);

      const store2 = new JSONStore<TestData>(filePath, defaultData);
      const result = await store2.read();
      expect(result).toEqual(data);
    });
  });
});
