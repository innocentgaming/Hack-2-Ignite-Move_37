import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';

export interface StorageUploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface IStorageService {
  uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    organizationId: string
  ): Promise<StorageUploadResult>;
  getFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  getUrl(key: string): Promise<string>;
}

export class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor(uploadDir = env.STORAGE_LOCAL_UPLOAD_DIR) {
    this.uploadDir = path.resolve(process.cwd(), uploadDir);
  }

  private async ensureDir(dirPath: string): Promise<void> {
    await fs.mkdir(dirPath, { recursive: true });
  }

  async uploadFile(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    organizationId: string
  ): Promise<StorageUploadResult> {
    const sanitizedOrg = organizationId.replace(/[^a-zA-Z0-9-_]/g, '');
    const orgFolder = path.join(this.uploadDir, sanitizedOrg);
    await this.ensureDir(orgFolder);

    const ext = path.extname(filename);
    const hash = crypto.randomBytes(16).toString('hex');
    const storageKey = `${sanitizedOrg}/${hash}${ext}`;
    const targetPath = path.join(this.uploadDir, storageKey);

    await fs.writeFile(targetPath, buffer);

    return {
      key: storageKey,
      url: `${env.API_URL}/api/v1/documents/files/${storageKey}`,
      size: buffer.length,
      mimeType,
    };
  }

  async getFile(key: string): Promise<Buffer> {
    const safeKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = path.join(this.uploadDir, safeKey);
    return await fs.readFile(filePath);
  }

  async deleteFile(key: string): Promise<void> {
    const safeKey = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    const filePath = path.join(this.uploadDir, safeKey);
    await fs.unlink(filePath);
  }

  async getUrl(key: string): Promise<string> {
    return `${env.API_URL}/api/v1/documents/files/${key}`;
  }
}

// Storage service singleton instance based on configuration
export const storageService: IStorageService = new LocalStorageService();
