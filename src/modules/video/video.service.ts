import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface VideoRoom {
  name: string;
  url: string;
  expiresAt: Date;
}

/**
 * Создаёт видеокомнаты через Daily.co REST API.
 * Требует DAILY_API_KEY в .env.
 * Без ключа — возвращает заглушку-URL (для dev/demo).
 */
@Injectable()
export class VideoService {
  private readonly log = new Logger(VideoService.name);
  private readonly apiKey: string | null;
  private readonly baseUrl = 'https://api.daily.co/v1';

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('DAILY_API_KEY')?.trim() || null;
    if (!this.apiKey) {
      this.log.warn('DAILY_API_KEY not set — video rooms will use demo mode');
    }
  }

  /**
   * Создать одноразовую комнату для видеоинтервью.
   * Комната живёт 2 часа.
   */
  async createRoom(applicationId: string): Promise<VideoRoom> {
    const name = `sjs-${applicationId.slice(0, 8)}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const expiryEpoch = Math.floor(expiresAt.getTime() / 1000);

    if (!this.apiKey) {
      return {
        name,
        url: `https://your-domain.daily.co/${name}`,
        expiresAt,
      };
    }

    try {
      const { data } = await axios.post(
        `${this.baseUrl}/rooms`,
        {
          name,
          privacy: 'private',
          properties: {
            exp: expiryEpoch,
            enable_chat: true,
            enable_screenshare: false,
            start_video_off: false,
            start_audio_off: false,
            max_participants: 2,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
      return {
        name: data.name as string,
        url: data.url as string,
        expiresAt,
      };
    } catch (e) {
      this.log.error(
        `Daily.co room creation failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw new ServiceUnavailableException('Video service unavailable');
    }
  }
}
