import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly config: ConfigService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const host = this.config.get<string>('REDIS_HOST') ?? 'localhost';
    const port = parseInt(this.config.get<string>('REDIS_PORT') ?? '6379', 10);

    const client = createClient({ socket: { host, port, connectTimeout: 3000 } });
    try {
      await client.connect();
      await client.ping();
      await client.quit();
      return this.getStatus(key, true);
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      throw new HealthCheckError('Redis check failed', this.getStatus(key, false, { error: err }));
    }
  }
}
