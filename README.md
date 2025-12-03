# Vend-IT-backend

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.sample` to `.env` and fill in real values (Supabase keys, Tap credentials, etc.).
3. Start the API:
   ```bash
   npm run dev
   ```

## Ngrok Tunnel

The project ships with an `npm run tunnel` script that exposes your local server to the internet for mobile/webhook testing.

1. Install [ngrok](https://ngrok.com/download) v3 locally and log in (`ngrok config add-authtoken ...` or place the token in `.env` as `NGROK_AUTHTOKEN`).
2. Ensure `.env` contains `NGROK_AUTHTOKEN=<your-token>`.
3. Run:
   ```bash
   npm run tunnel
   ```
   This uses `ngrok.yml` to publish the `vendit` tunnel (HTTPS) against `localhost:3000`.

The ngrok dashboard will display the public URL; update any webhook integrations (Tap, Silkron, etc.) with that URL while testing.

## Docker

You can run the API stack (app + Redis) via Docker:

1. Ensure `.env` exists. Docker Compose overrides `HOST`, `PORT`, and `REDIS_URL`, but the remainder still come from `.env`.
2. Build and start the stack:
   ```bash
   docker compose up --build
   ```
3. The API will be available at `http://localhost:3000`, Redis at `localhost:6379`.
4. To stop containers:
   ```bash
   docker compose down
   ```

The provided `Dockerfile` performs a multi-stage build, copying the compiled `dist` output plus static assets (`src/views`, `src/public`) into a slim Node 20 Alpine runtime image.
# Vend-IT-backend