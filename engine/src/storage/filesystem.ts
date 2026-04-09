/**
 * Local File System adapter — uses the File System Access API.
 * Works in Chrome/Edge. Documents are saved as .md files in a user-chosen folder.
 */

import type { StorageAdapter, StorageDocument } from "./types.js";

export class FileSystemAdapter implements StorageAdapter {
  private _dirHandle: FileSystemDirectoryHandle | null = null;

  async connect(): Promise<boolean> {
    try {
      this._dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
      return true;
    } catch {
      return false;
    }
  }

  async list(): Promise<StorageDocument[]> {
    if (!this._dirHandle) return [];

    const files: StorageDocument[] = [];
    for await (const [name, handle] of this._dirHandle as any) {
      if (handle.kind === "file" && name.endsWith(".md")) {
        const file: File = await handle.getFile();
        files.push({
          id: name,
          name,
          modifiedTime: new Date(file.lastModified).toISOString(),
        });
      }
    }

    return files.sort((a, b) => b.modifiedTime.localeCompare(a.modifiedTime));
  }

  async read(id: string): Promise<string> {
    if (!this._dirHandle) throw new Error("Not connected");
    const handle = await this._dirHandle.getFileHandle(id);
    const file = await handle.getFile();
    return file.text();
  }

  async write(name: string, content: string, _existingId?: string | null): Promise<string> {
    if (!this._dirHandle) throw new Error("Not connected");
    const fileName = name.endsWith(".md") ? name : `${name}.md`;
    const handle = await this._dirHandle.getFileHandle(fileName, { create: true });
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
    return fileName;
  }

  async delete(id: string): Promise<void> {
    if (!this._dirHandle) throw new Error("Not connected");
    await this._dirHandle.removeEntry(id);
  }
}
