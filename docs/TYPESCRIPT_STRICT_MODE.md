# TypeScript Strict Mode Roadmap

## Current Status

**Target**: Full TypeScript strict mode  
**Progress**: Phase 1 - Critical libs typed ✅  
**Remaining**: 634 errors across 66 files

---

## What's Been Fixed ✅

### Fully Typed Files (3)
- ✅ **[src/libs/cache.ts](file:///Users/java/MyFiles/Cinemagic/Vend-IT-backend/Vend-IT-backend/src/libs/cache.ts)**
  - Added `CacheOptions` interface
  - Typed all function parameters and return types
  - Generic type support for `cacheGet<T>` and `cacheWrap<T>`

- ✅ **[src/libs/queue.ts](file:///Users/java/MyFiles/Cinemagic/Vend-IT-backend/Vend-IT-backend/src/libs/queue.ts)**
  - Typed all queue helper functions
  - Fixed `maxRetriesPerRequest: null` typing

- ✅ **[src/libs/redis.ts](file:///Users/java/MyFiles/Cinemagic/Vend-IT-backend/Vend-IT-backend/src/libs/redis.ts)**
  - Fully typed in-memory Redis mock
  - Typed RedisAdapter class
  - Proper error handler types

---

## Remaining Work

### High Priority (38 files with most errors)
```
49 errors - src/modules/payments/payments.service.ts
38 errors - src/modules/payments/payments.repository.ts
39 errors - src/openapi.ts
30 errors - src/modules/payments/payments.controller.ts
28 errors - src/modules/admin/admin.controller.ts
27 errors - src/modules/auth/auth.service.ts
21 errors - src/modules/products/products.service.ts
```

### Medium Priority (28 files, 5-20 errors each)
- Modules: machines, users, referrals, cart, campaigns
- Middleware: auth, flash, request-logger
- Utils: async-wrapper, jwt, crypto

### Low Priority (20 files, 1-5 errors each)
- Remaining controllers and repositories
- Test files (5 files, 1-2 errors each)

---

## Incremental Strategy

### Phase 1: ✅ Core Libraries (COMPLETE)
- [x] cache.ts
- [x] queue.ts
- [x] redis.ts

### Phase 2: Utils & Middleware (Next)
- [ ] src/utils/jwt.ts (2 errors)
- [ ] src/utils/crypto.ts (3 errors)
- [ ] src/utils/async-wrapper.ts (5 errors)
- [ ] src/middleware/auth.ts (3 errors)
- [ ] src/middleware/flash.ts (5 errors)

### Phase 3: Critical Services
- [ ] src/modules/auth/auth.service.ts (27 errors)
- [ ] src/modules/payments/payments.service.ts (49 errors)
- [ ] src/modules/products/products.service.ts (21 errors)

### Phase 4: Repositories & Controllers
- [ ] Fix all repository files (10-40 errors each)
- [ ] Fix all controller files (5-15 errors each  

### Phase 5: Final Cleanup
- [ ] Fix openapi.ts (39 errors)
- [ ] Fix test files (5 files)
- [ ] Enable `noImplicitAny: true`
- [ ] Re-run build, fix any remaining errors

### Phase 6: Strictness Progression
- [ ] Enable `strictNullChecks: true`
- [ ] Fix null/undefined errors
- [ ] Enable `strict: true`
- [ ] Fix final issues

---

## Quick Wins

These files have 1-3 errors and can be fixed quickly:
- `src/config/env.ts` (8 errors - all similar)
- `src/utils/jwt.ts` (2 errors)
- `src/utils/crypto.ts` (3 errors)
- `src/middleware/auth.ts` (3 errors)
- `src/modules/content/content.service.ts` (3 errors)

---

## Testing Each Phase

```bash
# After fixing a batch of files
npm run build

# Count remaining errors
npm run build 2>&1 | grep "Found [0-9]+ errors"

# Run tests to ensure no regressions
npm test
```

---

## Best Practices Moving Forward

1. **New Code**: Always write with explicit types
2. **Refactoring**: Fix types when touching files
3. **PRs**: Require no new implicit any types
4. **Gradual**: Fix 5-10 files per sprint
5. **Monitor**: Track error count trend

---

## Estimated Timeline

Based on 634 errors across 66 files:

- **Phase 2** (Utils): 1-2 hours
- **Phase 3** (Services): 4-6 hours
- **Phase 4** (Repos/Controllers): 6-8 hours
- **Phase 5** (Cleanup): 2-3 hours
- **Phase 6** (Full Strict): 4-6 hours

**Total**: 17-25 hours of focused work

---

## Current Config

```typescript
// tsconfig.json
{
  "strict": false,
  "noImplicitAny": false,  // TODO: Re-enable after Phase 5
  "strictNullChecks": false,  // TODO: Enable in Phase 6
  "strictFunctionTypes": true,  // ✅ Already enabled
  "strictBindCallApply": true,  // ✅ Already enabled
  "noImplicitThis": true  // ✅ Already enabled
}
```

---

## Notes

- **Monitoring**: Set up `npm-check` or `typescript-strict` plugin
- **Automation**: Consider using `ts-migrate` for batch fixes
- **Documentation**: Update this file as progress is made
