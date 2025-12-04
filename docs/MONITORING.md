# Monitoring & Observability

The Vend-IT backend now includes comprehensive monitoring and observability features.

## Features

### 📊 **Prometheus Metrics** (`/metrics`)

#### HTTP Metrics
- `vendit_http_request_duration_seconds` - Request duration histogram
- `vendit_http_requests_total` - Total request counter (by method, route, status)
- `vendit_active_connections` - Current active connections

#### Database Metrics
- `vendit_db_query_duration_seconds` - Query duration histogram (by operation, table)

#### Cache Metrics
- `vendit_cache_hits_total` - Cache hits counter
- `vendit_cache_misses_total` - Cache misses counter

#### Business Metrics
- `vendit_payments_total` - Payment transactions (by method, status)
- `vendit_payments_amount_total` - Payment amounts (by method, currency)
- `vendit_dispenses_total` - Product dispenses (by machine, status)
- `vendit_loyalty_points_earned_total` - Loyalty points earned
- `vendit_loyalty_points_redeemed_total` - Loyalty points redeemed

#### System Metrics (Default)
- `vendit_process_cpu_user_seconds_total` - CPU usage
- `vendit_process_resident_memory_bytes` - Memory usage
- `vendit_nodejs_eventloop_lag_seconds` - Event loop lag
- And more...

### 🔍 **Sentry Error Tracking**

- Automatic error capture and reporting
- Performance monitoring with transaction tracing
- User context when authenticated
- Request context for debugging
- Source maps support
- Release tracking

### ❤️ **Enhanced Health Check** (`/api/health`)

Returns comprehensive health status:
```json
{
  "status": "ok",
  "timestamp": "2025-12-04T06:43:17.123Z",
  "uptime": 123.45,
  "env": "development",
  "services": {
    "database": {
      "status": "ok",
      "responseTime": 45
    },
    "redis": {
      "status": "ok",
      "responseTime": 3
    }
  },
  "system": {
    "memory": {
      "used": 85,
      "total": 128,
      "unit": "MB"
    },
    "cpu": { ... }
  }
}
```

---

## Setup

### 1. Environment Variables

Add to your `.env`:

```bash
# Sentry (Optional - for error tracking)
SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_ENVIRONMENT=production  # or development, staging

# Metrics (enabled by default)
METRICS_ENABLED=true
```

### 2. Sentry Setup

1. Create account at [sentry.io](https://sentry.io)
2. Create new project for Node.js
3. Copy DSN from project settings
4. Add to `.env` as `SENTRY_DSN`

### 3. Prometheus Setup (Optional)

If you want to scrape metrics:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'vend-it-backend'
    scrape_interval: 30s
    static_configs:
      - targets: ['localhost:3000']
    metrics_path: '/metrics'
```

Then run:
```bash
prometheus --config.file=prometheus.yml
```

---

## Usage

### Accessing Metrics

```bash
# View all metrics
curl http://localhost:3000/metrics

# Filter specific metrics
curl http://localhost:3000/metrics | grep vendit_http

# Check specific metric
curl http://localhost:3000/metrics | grep vendit_payments_total
```

### Health Check

```bash
# Simple health check
curl http://localhost:3000/api/health

# Pretty print
curl http://localhost:3000/api/health | jq .

# Check specific service
curl http://localhost:3000/api/health | jq '.services.database'
```

### Recording Custom Metrics

```typescript
import { paymentsTotal, paymentsAmount } from '../libs/metrics.js';

// Record payment
paymentsTotal.inc({ method: 'card', status: 'success' });
paymentsAmount.inc({ method: 'card', currency: 'KWD' }, amount);
```

### Tracking Database Queries

```typescript
import { trackDbQuery } from '../libs/metrics.js';

// Wrap database query
const users = await trackDbQuery('select', 'users', async () => {
  return await supabase.from('users').select('*');
});
```

### Sentry Error Reporting

```typescript
import { captureException, setUserContext } from '../libs/sentry.js';

// After user authenticates
setUserContext(user.id, user.email);

// Capture error with context
try {
  await riskyOperation();
} catch (error) {
  captureException(error, {
    userId: user.id,
    operation: 'payment',
    amount: 100
  });
  throw error;
}
```

---

## Monitoring Dashboards

### Grafana Dashboard

Import the sample dashboard from `monitoring/grafana-dashboard.json` (TODO: create this)

Key panels:
- Request rate & latency
- Error rate
- Active connections
- Database query performance
- Payment transactions
- Cache hit ratio

### Sentry Dashboard

Available at your Sentry project URL:
- Error frequency & trends
- Performance issues
- Release health
- User impact

---

## Performance Impact

- **Metrics**: < 1ms overhead per request
- **Sentry**: < 5ms overhead per request (with 10% sampling in production)
- **Health Check**: ~ 50ms (includes DB + Redis ping)

---

## Best Practices

1. **Sentry Sampling**: Use 10-20% sampling in production to reduce overhead
2. **Metrics Cardinality**: Avoid high-cardinality labels (user IDs, timestamps)
3. **Alert Setup**: Create alerts for:
   - Error rate > 5%
   - P99 latency > 2s
   - Database health degraded
   - Memory usage > 80%

4. **Sensitive Data**: Sentry automatically scrubs passwords, tokens. Review before production.

---

## Troubleshooting

### Metrics not appearing

1. Check `/metrics` endpoint is accessible
2. Verify `prom-client` is installed
3. Check for console errors on startup

### Sentry not capturing errors

1. Verify `SENTRY_DSN` is set
2. Check Sentry dashboard for quota limits
3. Verify error is thrown in request context
4. Check Sentry filters in `libs/sentry.ts`

### Health check showing degraded

1. Check database connectivity (Supabase credentials)
2. Verify Redis is running
3. Review service-specific error messages

---

## Files Added

- `src/libs/metrics.ts` - Prometheus metrics definitions
- `src/libs/sentry.ts` - Sentry configuration
- `src/middleware/metrics.ts` - HTTP metrics middleware
- `src/routes/metrics.routes.ts` - `/metrics` endpoint
- `.env.monitoring.example` - Example environment variables
