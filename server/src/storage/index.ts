import { env } from '../env';
import { LocalDiskStorage } from './local';
import { S3Storage } from './s3';

export interface StorageAdapter {
  /** Save a buffer under `key`, returning the storage key to persist on the meeting row. */
  put(key: string, body: Buffer, contentType: string): Promise<string>;
  /** Return a URL (or presigned URL) the client can use to fetch the file directly. */
  getReadUrl(key: string): Promise<string>;
  get(key: string): Promise<Buffer>;
}

export const storage: StorageAdapter = env.storageDriver === 's3' ? new S3Storage() : new LocalDiskStorage();
