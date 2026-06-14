import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface VideoRoom {
  /** Daily.co room name (last path segment). */
  name: string;
  /** Full join URL including ?t=meetingToken for private rooms. */
  url: string;
  /** Raw meeting token (also embedded in url). */
  token?: string;
  expiresAt: Date;
}

/**
 * Создаёт видеокомнаты через Daily.co REST API.
 * Требует DAILY_API_KEY в .env.
 * Без ключа — возвращает заглушку (demo mode).
 *
 * Приватные комнаты Daily требуют meeting token (?t=) для входа.
 * Работодатель получает is_owner=true (host), студент — is_owner=false.
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
   * Создать новую приватную комнату на Daily.co.
   * Вызывается один раз работодателем при открытии созвона.
   * Комната живёт 2 часа; max 2 участника.
   */
  async createRoom(applicationId: string, isOwner: boolean): Promise<VideoRoom & { roomUrl: string }> {
    const name = `sjs-${applicationId.slice(0, 8)}-${Date.now()}`;
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const expiryEpoch = Math.floor(expiresAt.getTime() / 1000);

    if (!this.apiKey) {
      const demoUrl = `https://your-domain.daily.co/${name}`;
      return { name, url: demoUrl, roomUrl: demoUrl, expiresAt };
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

      const roomName = data.name as string;
      const roomUrl = data.url as string; // e.g. https://sjs-dev.daily.co/room-name
      const token = await this.createMeetingToken(roomName, expiryEpoch, isOwner);

      return {
        name: roomName,
        roomUrl,                        // base URL stored in DB
        url: `${roomUrl}?t=${token}`,   // full join URL returned to client
        token,
        expiresAt,
      };
    } catch (e) {
      this.log.error(
        `Daily.co room creation failed: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw new ServiceUnavailableException('Video service unavailable');
    }
  }

  /**
   * Получить ссылку для входа в уже существующую комнату.
   * Каждый вызов создаёт свежий meeting token.
   * @param roomName — имя комнаты из ApplicationEntity.videoRoomName
   * @param roomBaseUrl — base URL из ApplicationEntity.videoRoomUrl (без ?t=)
   * @param isOwner — true для работодателя (host), false для студента
   */
  async getJoinUrl(
    roomName: string,
    roomBaseUrl: string,
    isOwner: boolean,
  ): Promise<VideoRoom> {
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const expiryEpoch = Math.floor(expiresAt.getTime() / 1000);

    if (!this.apiKey) {
      return { name: roomName, url: roomBaseUrl, expiresAt };
    }

    try {
      const token = await this.createMeetingToken(roomName, expiryEpoch, isOwner);
      return {
        name: roomName,
        url: `${roomBaseUrl}?t=${token}`,
        token,
        expiresAt,
      };
    } catch (e) {
      this.log.error(
        `Daily.co token creation failed for room ${roomName}: ${e instanceof Error ? e.message : String(e)}`,
      );
      throw new ServiceUnavailableException('Video service unavailable');
    }
  }

  /**
   * Создать meeting token для приватной комнаты Daily.
   * is_owner=true даёт права хоста (управление комнатой).
   */
  private async createMeetingToken(
    roomName: string,
    exp: number,
    isOwner: boolean,
  ): Promise<string> {
    const { data } = await axios.post<{ token: string }>(
      `${this.baseUrl}/meeting-tokens`,
      {
        properties: {
          room_name: roomName,
          exp,
          is_owner: isOwner,
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
    return data.token;
  }
}
