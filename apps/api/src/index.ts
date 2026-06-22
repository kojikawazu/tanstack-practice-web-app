import { env } from './env';
import { serve } from '@hono/node-server';
import { app } from './app';

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});
