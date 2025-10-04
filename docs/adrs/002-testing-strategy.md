# ADR 002: Comprehensive Testing Strategy

**Date**: 2025-10-03
**Status**: Accepted
**Decision Makers**: Development Team

## Context

The Databento MCP Server currently has **0% automated test coverage** despite implementing 18 comprehensive tools across the Databento API framework. While manual smoke tests confirm basic functionality, the lack of automated tests presents significant risks:

- **Regression Risk**: Changes could break existing functionality without detection
- **Edge Case Handling**: Untested error paths and boundary conditions
- **Refactoring Safety**: No confidence when restructuring code
- **Maintenance Burden**: Manual testing is time-consuming and error-prone
- **Production Confidence**: Limited assurance for high-reliability deployments

## Decision

We will implement **exhaustive test coverage** targeting **80%+ code coverage** across all components using a multi-layered testing strategy:

### Testing Framework

**Primary Tool**: Vitest
- Fast, modern test runner with native TypeScript support
- Compatible with existing tsx/TypeScript toolchain
- Built-in coverage reporting (c8/istanbul)
- Jest-compatible API for easy migration
- Watch mode for development

**Mocking Strategy**: Nock
- HTTP request interception and mocking
- Reliable for testing API clients
- Allows testing retry logic, timeouts, error scenarios

**Test Data**: @faker-js/faker
- Generate realistic test data
- Consistent, reproducible fixtures
- Reduce test maintenance overhead

### Test Architecture

```
tests/
├── unit/                           # Component unit tests
│   ├── http/
│   │   └── databento-http.test.ts  # HTTP client (retry, auth, timeout)
│   ├── api/
│   │   ├── metadata-client.test.ts
│   │   ├── timeseries-client.test.ts
│   │   ├── batch-client.test.ts
│   │   ├── symbology-client.test.ts
│   │   └── reference-client.test.ts
│   └── types/
│       └── type-validation.test.ts
├── integration/
│   ├── mcp-tools.test.ts          # All 18 MCP tool handlers
│   └── api-clients.test.ts        # Client integration with HTTP layer
├── e2e/
│   └── full-workflow.test.ts      # End-to-end scenarios
├── fixtures/
│   ├── csv-responses.ts           # Mock Databento CSV data
│   ├── json-responses.ts          # Mock JSON responses
│   └── mock-data.ts               # Test data generators
└── helpers/
    ├── nock-setup.ts              # HTTP mocking utilities
    └── test-utils.ts              # Shared test helpers
```

### Coverage Targets

| Component | Target | Priority |
|-----------|--------|----------|
| HTTP Client | 95% | Critical |
| API Clients | 90% | Critical |
| MCP Tool Handlers | 85% | High |
| Type Definitions | 80% | Medium |
| Utilities | 90% | High |
| **Overall** | **85%+** | - |

### Test Categories

#### 1. Unit Tests (Isolated Component Testing)

**HTTP Client** (`src/http/databento-http.ts`):
- ✅ Retry logic with exponential backoff (3 attempts, 1s/2s/3s delays)
- ✅ Authentication header construction (Basic Auth)
- ✅ Request timeout behavior (15s default)
- ✅ Error handling for HTTP status codes (400, 401, 403, 429, 500, 503)
- ✅ GET requests with query parameters
- ✅ POST requests with JSON body
- ✅ POST requests with form-encoded data
- ✅ CSV and JSON response parsing

**API Clients** (5 clients):
- ✅ Request parameter validation
- ✅ Response parsing (CSV → objects)
- ✅ Error propagation from HTTP layer
- ✅ Date formatting (ISO 8601 ↔ YYYY-MM-DD)
- ✅ Symbol limit enforcement (2000 max)
- ✅ Schema validation for enums
- ✅ Optional vs required parameter handling

#### 2. Integration Tests (Component Interaction)

**MCP Tool Handlers** (18 tools):
- ✅ Tool registration schema validation
- ✅ Request parameter extraction and casting
- ✅ Client method invocation
- ✅ Response formatting (JSON structure)
- ✅ Error handling and error responses
- ✅ MCP protocol compliance

**API Client + HTTP Integration**:
- ✅ End-to-end flow: request → HTTP → parse → return
- ✅ Mock Databento API responses
- ✅ Verify HTTP headers, auth, endpoints
- ✅ Test caching behavior (30s TTL for quotes)

#### 3. End-to-End Tests (Full Workflows)

**Complete User Scenarios**:
- ✅ List datasets → Get schemas → Query cost → Fetch data
- ✅ Resolve symbols → Fetch timeseries → Parse results
- ✅ Submit batch job → Poll status → Download URLs
- ✅ Search securities → Get corporate actions → Adjust prices

#### 4. Edge Case & Error Testing

**Boundary Conditions**:
- Empty responses
- Malformed CSV/JSON
- Missing required fields
- Invalid date formats
- Symbol count limits (0, 1, 2000, 2001)
- Network failures (timeout, DNS, connection refused)

**Error Scenarios**:
- 401 Unauthorized (invalid API key)
- 403 Forbidden (insufficient permissions)
- 429 Rate Limited
- 500 Internal Server Error
- Partial failures (some symbols resolve, others fail)

### Implementation Strategy

**Parallel Development** (6 subagents):

1. **Infrastructure Agent** (tester)
   - Set up Vitest, Nock, Faker
   - Create test configuration
   - Implement test fixtures and helpers
   - Set up coverage reporting

2. **HTTP Tests Agent** (tester)
   - Write comprehensive HTTP client tests
   - Mock all HTTP scenarios (success, failure, retry)
   - Test timeout, auth, error handling
   - Achieve 95%+ coverage

3. **API Clients Agent 1** (tester)
   - Test Metadata + Timeseries clients
   - Mock Databento API responses
   - Validate request/response flow
   - Test error propagation

4. **API Clients Agent 2** (tester)
   - Test Batch + Symbology + Reference clients
   - Mock form-encoded requests
   - Test symbol resolution logic
   - Validate CSV parsing

5. **Integration Tests Agent** (tester)
   - Test all 18 MCP tools
   - Validate MCP protocol compliance
   - Test request/response formatting
   - Mock complete workflows

6. **E2E Tests Agent** (tester)
   - Write end-to-end scenarios
   - Test caching behavior
   - Validate full user journeys
   - Performance benchmarks

### Dependencies

```json
{
  "devDependencies": {
    "vitest": "^1.0.4",
    "@vitest/coverage-v8": "^1.0.4",
    "nock": "^13.5.0",
    "@faker-js/faker": "^8.3.1",
    "@types/node": "^24.6.2"  // already installed
  }
}
```

### Configuration

**vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.d.ts',
        'src/types/**',  // Type definitions don't need coverage
        'dist/**',
        'node_modules/**',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
    },
    testTimeout: 10000,
  },
});
```

**package.json scripts**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:once": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest watch",
    "test:ui": "vitest --ui"
  }
}
```

## Consequences

### Positive

✅ **Regression Safety**: Automated tests catch breaking changes immediately
✅ **Refactoring Confidence**: Can restructure code with confidence
✅ **Documentation**: Tests serve as usage examples
✅ **Bug Prevention**: Edge cases and error paths tested
✅ **CI/CD Ready**: Can integrate into automated pipelines
✅ **Production Confidence**: High test coverage ensures reliability
✅ **Maintenance**: Easier to onboard new contributors
✅ **Code Quality**: Forces good design and modularity

### Negative

⚠️ **Development Time**: Initial test writing requires significant effort
⚠️ **Test Maintenance**: Tests need updates when APIs change
⚠️ **False Confidence**: High coverage doesn't guarantee bug-free code
⚠️ **Build Time**: Tests add to CI/CD pipeline duration

### Risks & Mitigations

**Risk**: Tests become flaky due to timing issues
**Mitigation**: Use deterministic mocks, avoid real HTTP calls in unit tests

**Risk**: Mocks diverge from real API behavior
**Mitigation**: Maintain E2E tests with real API, update fixtures regularly

**Risk**: Test coverage becomes a checkbox exercise
**Mitigation**: Focus on testing behavior, not just lines of code

## Implementation Plan

### Phase 1: Foundation (Day 1)
1. Install testing dependencies
2. Create test directory structure
3. Set up Vitest configuration
4. Create fixture generators
5. Write test utilities and helpers

### Phase 2: Core Coverage (Day 1-2)
6. HTTP client unit tests (95% coverage)
7. API client unit tests (90% coverage)
8. Type validation tests

### Phase 3: Integration (Day 2)
9. MCP tool handler tests (all 18 tools)
10. API client integration tests
11. Caching behavior tests

### Phase 4: E2E & Polish (Day 3)
12. End-to-end workflow tests
13. Error scenario tests
14. Performance benchmarks
15. Coverage report analysis
16. Documentation updates

### Phase 5: CI/CD (Day 3)
17. GitHub Actions workflow
18. Pre-commit hooks
19. Coverage badges
20. Test documentation

## Success Criteria

- [ ] 85%+ overall code coverage
- [ ] 95%+ coverage for HTTP client
- [ ] 90%+ coverage for API clients
- [ ] All 18 MCP tools tested
- [ ] Zero flaky tests
- [ ] All tests pass in CI/CD
- [ ] Coverage reports generated
- [ ] Test documentation complete

## References

- [Vitest Documentation](https://vitest.dev/)
- [Nock Documentation](https://github.com/nock/nock)
- [Testing Best Practices](https://testingjavascript.com/)
- [ADR 001: Databento API Expansion](./001-databento-api-expansion.md)
- [Test Coverage Report](../TEST_COVERAGE_REPORT.md)
