# Integration Tests

Integration tests for Vend-IT backend API endpoints.

## Running Tests

```bash
# Run all integration tests
npm run test:integration

# Run all tests (unit + integration)
npm run test:all

# Run with watch mode
npm run test:watch

# Run only unit tests
npm run test:unit
```

## Test Structure

```
tests/integration/
├── setup.ts                      # Test helpers and cleanup
├── auth.integration.spec.ts      # Authentication flow tests
└── api.integration.spec.ts       # General API tests
```

## Test Coverage

### Authentication (`auth.integration.spec.ts`)
- ✅ User registration with OTP
- ✅ Login existing user
- ✅ OTP verification
- ✅ Token refresh
- ✅ Protected endpoint access
- ✅ Error cases (invalid OTP, missing auth, etc.)

### API Endpoints (`api.integration.spec.ts`)
- ✅ Health check
- ✅ Machine listing with coordinates
- ✅ Machine details by ID
- ✅ Product categories
- ✅ Product listing by machine

## Test Helpers (`setup.ts`)

### Functions
- `createTestUser(overrides?)` - Create a test user in database
- `verifyTestUser(userId)` - Mark user as OTP verified
- `cleanupUser(userId)` - Remove test user
- `wait(ms)` - Async delay helper

### Automatic Cleanup
Test data is automatically cleaned up after all tests complete:
- Test users
- Test payments
- Test machines

## Configuration

Tests use the same Supabase connection as the app (from `.env`).

For a dedicated test database, set:
```bash
TEST_SUPABASE_URL=https://test-project.supabase.co
TEST_SUPABASE_KEY=your-test-key
```

## Writing New Tests

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { createTestUser, verifyTestUser } from './setup.js';

describe('My Feature Tests', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup authenticated user
    const user = await createTestUser({ is_otp_verify: 1 });
    await verifyTestUser(user.id);
    
    // Get auth token
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        countryCode: user.country_code,
        phoneNumber: user.phone_number.replace(user.country_code, ''),
      });
    
    authToken = response.body.data.token;
  });

  it('should test something', async () => {
    const response = await request(app)
      .get('/api/my-endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
  });
});
```

## Best Practices

1. **Clean up after tests** - Use the `testData` object to track created resources
2. **Use beforeAll wisely** - Create shared test data once, not per test
3. **Test error cases** - Don't just test happy paths
4. **Use realistic data** - Phone numbers, emails should follow real patterns
5. **Isolate tests** - Each test should be independent

## CI/CD

Integration tests can be run in CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Run Integration Tests
  run: npm run test:integration
  env:
    SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
    SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.TEST_SUPABASE_KEY }}
```

## Troubleshooting

### Tests fail with database errors
- Ensure Supabase credentials are correct in `.env`
- Check database has required tables (run migrations first)

### Tests timeout
- Increase timeout in `vitest.config.ts`: `testTimeout: 20000`
- Check database connectivity

### Cleanup fails
- Run cleanup manually: Delete test users from database
- Check foreign key constraints
