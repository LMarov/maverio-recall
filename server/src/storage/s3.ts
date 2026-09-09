import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../env';
import type { StorageAdapter } from './index';

export class S3Storage implements StorageAdapter {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: env.s3.region,
      endpoint: env.s3.endpoint,
      forcePathStyle: env.s3.forcePathStyle,
      credentials:
        env.s3.accessKeyId && env.s3.secretAccessKey
          ? { accessKeyId: env.s3.accessKeyId, secretAccessKey: env.s3.secretAccessKey }
          : undefined
    });
  }

  async put(key: string, body: Buffer, contentType: string): Promise<string> {
    await this.client.send(new PutObjectCommand({ Bucket: env.s3.bucket, Key: key, Body: body, ContentType: contentType }));
    return key;
  }

  async getReadUrl(key: string): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: env.s3.bucket, Key: key }), { expiresIn: 3600 });
  }

  async get(key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: env.s3.bucket, Key: key }));
    const bytes = await res.Body!.transformToByteArray();
    return Buffer.from(bytes);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: env.s3.bucket, Key: key }));
  }
}
