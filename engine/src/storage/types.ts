/**
 * Storage adapter interface — all storage backends implement this.
 * Documents are saved as .md files in the user's chosen storage.
 */

export interface StorageDocument {
  /** Unique ID (filename or cloud file ID) */
  id: string;
  /** Display name */
  name: string;
  /** Last modified timestamp (ISO string) */
  modifiedTime: string;
}

export interface StorageAdapter {
  /** Connect to the storage backend (may prompt user for auth/folder) */
  connect(): Promise<boolean>;

  /** List all documents */
  list(): Promise<StorageDocument[]>;

  /** Read a document by ID */
  read(id: string): Promise<string>;

  /** Write a document. Returns the document ID. */
  write(name: string, content: string, existingId?: string | null): Promise<string>;

  /** Delete a document by ID */
  delete(id: string): Promise<void>;
}
