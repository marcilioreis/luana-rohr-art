import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';
import path from 'path';

export interface StorageProvider {
  /** Salva o arquivo e retorna a URL pública (ou link para download) */
  save(fileName: string, content: Buffer | string, mimeType: string): Promise<string>;
  /** Gera uma URL pré‑assinada para download temporário */
  getSignedDownloadUrl(fileName: string, expiresIn?: number): Promise<string>;
  /** Remove o arquivo */
  delete(fileName: string): Promise<void>;
}

// ---------- Implementação local (desenvolvimento) ----------
class LocalProvider implements StorageProvider {
  private dir = path.join(process.cwd(), 'exports');

  async save(fileName: string, content: Buffer | string): Promise<string> {
    const filePath = path.join(this.dir, fileName);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
    // Retorna um caminho relativo que o controller de download usará para servir o arquivo
    return `/api/exports/${fileName}/download`;
  }

  async getSignedDownloadUrl(fileName: string): Promise<string> {
    // Localmente, retornamos a URL normal (o controller fará o stream)
    return `/api/exports/${fileName}/download/`;
  }

  async delete(fileName: string): Promise<void> {
    await fs.unlink(path.join(this.dir, fileName));
  }
}

// ---------- Implementação S3 (Cloudflare R2) ----------
class S3Provider implements StorageProvider {
  private client: S3Client;
  private bucket: string;

  constructor() {
    this.bucket = process.env.STORAGE_BUCKET!;
    this.client = new S3Client({
      region: process.env.STORAGE_REGION || 'auto',
      endpoint: `http${process.env.STORAGE_USE_SSL === 'true' ? 's' : ''}://${process.env.STORAGE_ENDPOINT}:${process.env.STORAGE_PORT}`,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY!,
        secretAccessKey: process.env.STORAGE_SECRET_KEY!,
      },
      forcePathStyle: true,
    });
  }

  async save(fileName: string, content: Buffer | string, mimeType: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileName,
        Body: content,
        ContentType: mimeType,
      })
    );
    return `${process.env.STORAGE_ENDPOINT?.replace('https://', 'https://')}/${this.bucket}/${fileName}`;
  }

  async getSignedDownloadUrl(fileName: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(this.client, new GetObjectCommand({ Bucket: this.bucket, Key: fileName }), {
      expiresIn,
    });
  }

  async delete(fileName: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: fileName }));
  }
}

// ---------- Factory ----------
let provider: StorageProvider;

const driver = process.env.STORAGE_DRIVER || 'local';

if (driver === 's3' || driver === 'minio') {
  provider = new S3Provider();
} else {
  provider = new LocalProvider();
}

export const storage = provider;
