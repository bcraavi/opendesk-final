/**
 * Browser storage adapter — uses localStorage.
 * Documents stay in this browser only. No sync.
 */

import type { StorageAdapter, StorageDocument } from "./types.js";

const STORAGE_PREFIX = "opendesk:doc:";
const INDEX_KEY = "opendesk:index";

interface DocMeta {
  id: string;
  name: string;
  modifiedTime: string;
}

export class BrowserStorageAdapter implements StorageAdapter {
  async connect(): Promise<boolean> {
    return true;
  }

  async list(): Promise<StorageDocument[]> {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    try {
      const index: DocMeta[] = JSON.parse(raw);
      return index.sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime));
    } catch {
      return [];
    }
  }

  async read(id: string): Promise<string> {
    const content = localStorage.getItem(STORAGE_PREFIX + id);
    if (content === null) throw new Error(`Document not found: ${id}`);
    return content;
  }

  async write(name: string, content: string, existingId?: string | null): Promise<string> {
    const id = existingId || `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    localStorage.setItem(STORAGE_PREFIX + id, content);

    const index = await this._getIndex();
    const existing = index.findIndex((d) => d.id === id);
    const meta: DocMeta = { id, name, modifiedTime: new Date().toISOString() };

    if (existing >= 0) {
      index[existing] = meta;
    } else {
      index.push(meta);
    }

    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    return id;
  }

  async delete(id: string): Promise<void> {
    localStorage.removeItem(STORAGE_PREFIX + id);
    const index = await this._getIndex();
    const filtered = index.filter((d) => d.id !== id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(filtered));
  }

  private async _getIndex(): Promise<DocMeta[]> {
    const raw = localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}
