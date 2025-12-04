# Vend-IT Backend

A robust TypeScript/Express.js backend for the Vend-IT vending machine platform.

## Features

- 🔐 **JWT Authentication** with OTP verification
- 💳 **Payment Integration** (Tap, Google Pay, Apple Pay, Wallet)
- 🎯 **Loyalty Program** with points and redemption
- 👥 **Referral System** with rewards
- 🔔 **Push Notifications** via Firebase
- 🏪 **Machine Management** with real-time sync
- 📊 **Admin Dashboard** with session-based auth
- 📝 **Audit Logging** for security events
- ⚡ **Rate Limiting** with granular controls
- 📖 **OpenAPI Documentation**

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Cache**: Redis / In-memory fallback
- **Queue**: BullMQ
- **Validation**: Zod
- **Testing**: Vitest

## Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Run tests:**
   ```bash
   npm test
   ```

5. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm start` | Run production server |
| `npm test` | Run test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run migrate` | Run database migrations |
| `npm run seed` | Seed database with initial data |
| `npm run tunnel` | Start ngrok tunnel for webhooks |

## Project Structure

```
src/
├── config/         # Environment and logger configuration
├── libs/           # External service clients (Redis, Supabase)
├── middleware/     # Express middleware (auth, rate-limit, CSRF)
├── modules/        # Feature modules (auth, payments, machines, etc.)
│   ├── auth/
│   ├── payments/
│   ├── machines/
│   └── ...
├── routes/         # API route definitions
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── views/          # Nunjucks templates (admin panel)
└── workers/        # Background job processors
```

## API Documentation

API documentation is available at `/api/docs` when running the server.

### Authentication Flow

1. **Register/Login**: POST `/api/auth/register` or `/api/auth/login` with phone number
2. **Receive OTP**: SMS sent to phone (logged in development)
3. **Verify OTP**: POST `/api/auth/verify` with OTP code
4. **Use Token**: Include `Authorization: Bearer <token>` in requests

### Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Default | 120 requests/minute |
| Auth | 5 requests/15 minutes |
| OTP Resend | 3 requests/5 minutes |
| Payments | 10 requests/minute |
| Wallet | 5 requests/minute |

## Ngrok Tunnel

For webhook testing with external services:

1. Install [ngrok](https://ngrok.com/download) v3
2. Configure token: `ngrok config add-authtoken YOUR_TOKEN`
3. Run: `npm run tunnel`

The public URL will be displayed in the ngrok dashboard.

## Docker

Run the complete stack with Docker Compose:

```bash
# Build and start
docker compose up --build

# Stop
docker compose down
```

Services:
- **API**: http://localhost:3000
- **Redis**: localhost:6379

## Environment Variables

See `.env.example` for all available configuration options.

### Required Variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `JWT_ACCESS_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `FIREBASE_PROJECT_ID` | Firebase project for notifications |
| `TAP_SECRET_KEY` | Tap payments secret key |

## Security Features

- ✅ Helmet.js security headers
- ✅ CORS with configurable origins
- ✅ CSRF protection for admin panel
- ✅ Rate limiting per endpoint
- ✅ Input validation with Zod
- ✅ Audit logging for sensitive operations
- ✅ Session regeneration on login

## Contributing

1. Create a feature branch
2. Make changes with tests
3. Run `npm run lint` and `npm test`
4. Submit a pull request

## License

Proprietary - All rights reserved