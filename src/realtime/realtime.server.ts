import type { Server } from 'bun';
import { verify } from 'jsonwebtoken';
import Redis from 'ioredis';

type WSData = { userId: string; role: string };

const REDIS_CHANNEL = 'realtime:broadcast';

export class RealtimeServer {
  private server!: Server<WSData>;
  private redisPub: Redis | null = null;
  private redisSub: Redis | null = null;

  start(port: number) {
    const redisHost = process.env.REDIS_HOST || '127.0.0.1';
    const redisPort = parseInt(process.env.REDIS_PORT ?? '6379');

    try {
      this.redisPub = new Redis({
        host: redisHost,
        port: redisPort,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => 3000,
      });
      this.redisPub.connect().catch((err) => {
        console.warn('⚠️ RealtimeServer: Redis pub connection failed, falling back to local pub/sub:', err.message);
        this.redisPub = null;
      });

      this.redisSub = new Redis({
        host: redisHost,
        port: redisPort,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        retryStrategy: () => 3000,
      });
      this.redisSub
        .connect()
        .then(() => {
          if (this.redisSub) {
            this.redisSub.subscribe(REDIS_CHANNEL);
            this.redisSub.on('message', (_channel, payload) => {
              try {
                const { topic, data } = JSON.parse(payload);
                if (this.server) {
                  this.server.publish(topic, JSON.stringify(data));
                }
              } catch (e) {
                console.error('RealtimeServer Redis message error:', e);
              }
            });
          }
        })
        .catch((err) => {
          console.warn('⚠️ RealtimeServer: Redis sub connection failed:', err.message);
          this.redisSub = null;
        });
    } catch (e) {
      console.warn('⚠️ RealtimeServer: Redis initialization skipped, using local pub/sub only');
    }

    if (typeof Bun === 'undefined') {
      console.warn(
        '⚠️ RealtimeServer: Bun runtime not detected (running under Node.js). To enable Bun native WebSocket server, run with Bun: `bun run src/main.ts` or `bun run start:bun`.',
      );
      return;
    }

    this.server = Bun.serve<WSData>({
      port,
      fetch: (req, server) => {
        const url = new URL(req.url);
        if (url.pathname !== '/ws') return new Response('Not found', { status: 404 });

        const token = url.searchParams.get('token');
        if (!token) return new Response('Unauthorized', { status: 401 });

        try {
          const secret = process.env.NEXTAUTH_SECRET || 'secret';
          const payload = verify(token, secret) as any;
          const userId = payload.sub || payload.id;
          if (!userId) return new Response('Unauthorized', { status: 401 });

          const upgraded = server.upgrade(req, {
            data: { userId, role: payload.role || 'USER' },
          });
          return upgraded ? undefined : new Response('Upgrade failed', { status: 400 });
        } catch {
          return new Response('Unauthorized', { status: 401 });
        }
      },
      websocket: {
        open: (ws) => {
          ws.subscribe(`user:${ws.data.userId}`);
        },
        message: (ws, raw) => {
          try {
            const msg = JSON.parse(String(raw));
            switch (msg.type) {
              case 'join':
                if (msg.topic) ws.subscribe(msg.topic);
                break;
              case 'leave':
                if (msg.topic) ws.unsubscribe(msg.topic);
                break;
              case 'typing':
                if (msg.chatId) {
                  this.server.publish(
                    `chat:${msg.chatId}`,
                    JSON.stringify({
                      event: 'chat:typing',
                      userId: ws.data.userId,
                      isTyping: !!msg.isTyping,
                    }),
                  );
                }
                break;
            }
          } catch (e) {
            console.error('WS message error:', e);
          }
        },
        close: () => {},
      },
    });

    console.log(`📡 Realtime WebSocket server listening on ws://0.0.0.0:${port}/ws`);
  }

  publish(topic: string, data: unknown) {
    const payload = JSON.stringify({ topic, data });

    if (this.redisPub && this.redisPub.status === 'ready') {
      this.redisPub.publish(REDIS_CHANNEL, payload).catch((err) => {
        console.warn('Redis publish failed:', err.message);
        if (this.server) {
          this.server.publish(topic, JSON.stringify(data));
        }
      });
    } else {
      if (this.server) {
        this.server.publish(topic, JSON.stringify(data));
      }
    }
  }
}
