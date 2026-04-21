import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

@Injectable()
export class UploadService {
  private readonly log = new Logger(UploadService.name);

  /** Серверные операции (GetObject и т.д.) — внутренний адрес (Docker: http://minio:9000). */
  private readonly client: S3Client;
  /** Только presigned PUT: адрес должен быть доступен из браузера (часто http://localhost:9000). */
  private readonly presignClient: S3Client;
  private readonly bucket: string;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const presignEndpoint =
      this.config.get<string>('S3_PRESIGN_ENDPOINT') || endpoint;
    this.bucket = this.config.getOrThrow<string>('S3_BUCKET');
    const credentials = {
      accessKeyId: this.config.getOrThrow<string>('S3_ACCESS_KEY'),
      secretAccessKey: this.config.getOrThrow<string>('S3_SECRET_KEY'),
    };
    const region = this.config.get<string>('S3_REGION', 'us-east-1');
    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials,
      forcePathStyle: !!endpoint,
    });
    this.presignClient = new S3Client({
      region,
      endpoint: presignEndpoint || undefined,
      credentials,
      forcePathStyle: !!presignEndpoint,
    });
  }

  async createPresignedPut(
    userId: string,
    filename: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; storageKey: string; expiresIn: number }> {
    const ext = path.extname(filename) || '';
    const safeBase =
      path.basename(filename, ext).replace(/[^a-z0-9_-]/gi, '') || 'file';
    const storageKey = `uploads/${userId}/${randomUUID()}-${safeBase}${ext}`;
    const cmd = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: contentType,
    });
    const expiresIn = 3600;
    try {
      const uploadUrl = await getSignedUrl(this.presignClient, cmd, { expiresIn });
      this.log.log(
        `Presigned PUT userId=${userId} storageKey=${storageKey} contentType=${contentType}`,
      );
      return { uploadUrl, storageKey, expiresIn };
    } catch {
      throw new InternalServerErrorException('Could not create upload URL');
    }
  }

  /** Download object bytes from S3 (e.g. schedule file for AI parsing). */
  async getObjectBuffer(storageKey: string): Promise<Buffer> {
    const cmd = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });
    const res = await this.client.send(cmd);
    if (!res.Body) {
      throw new InternalServerErrorException('Empty S3 object body');
    }
    const bytes = await res.Body.transformToByteArray();
    return Buffer.from(bytes);
  }
}
