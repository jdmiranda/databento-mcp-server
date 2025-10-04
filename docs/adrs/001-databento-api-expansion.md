# ADR 001: Databento API Expansion Architecture

**Date**: 2025-10-03
**Status**: Accepted
**Decision Makers**: Development Team

## Context

The current Databento MCP Server implementation provides only three basic tools:
- `get_futures_quote` - Current price quotes for ES/NQ
- `get_session_info` - Trading session information
- `get_historical_bars` - OHLCV historical bars

However, Databento's full API offers significantly more functionality across multiple domains:

### Historical API
- **Timeseries**: Stream historical market data with various schemas
- **Metadata**: List datasets, schemas, publishers, fields, pricing, date ranges
- **Batch**: Submit and download large historical data jobs
- **Symbology**: Resolve symbols to instrument IDs

### Reference API
- **Security**: Security master data
- **Corporate**: Corporate actions (dividends, splits, etc.)
- **Adjustment**: Price adjustment factors

## Decision

We will expand the MCP server to implement the complete Databento API framework using a modular architecture:

### Architecture Components

1. **API Clients** (`src/api/`)
   - `timeseries-client.ts` - Historical timeseries operations
   - `metadata-client.ts` - Dataset and schema metadata
   - `batch-client.ts` - Batch job management
   - `symbology-client.ts` - Symbol resolution
   - `reference-client.ts` - Reference data (security, corporate, adjustment)

2. **Base HTTP Client** (`src/http/`)
   - `databento-http.ts` - Shared HTTP client with retry logic, auth, caching
   - Consolidate common functionality from current `databento-client.ts`

3. **MCP Tools Registration** (`src/index.ts`)
   - Register all tools in ListToolsRequestSchema
   - Route tool calls in CallToolRequestSchema
   - Maintain backward compatibility with existing tools

4. **Type Definitions** (`src/types/`)
   - `timeseries.ts` - Timeseries request/response types
   - `metadata.ts` - Metadata types
   - `batch.ts` - Batch job types
   - `symbology.ts` - Symbol types
   - `reference.ts` - Reference data types

### Implementation Strategy

1. **Parallel Development**: Use subagents to implement different API domains concurrently
2. **Shared Base Client**: Extract common HTTP logic to avoid duplication
3. **Progressive Enhancement**: Maintain existing functionality while adding new tools
4. **Comprehensive Testing**: Each API client should be testable independently

### API Endpoints to Implement

#### Historical Timeseries
- `timeseries.get_range` - Stream historical data in any schema/format

#### Historical Metadata
- `metadata.list_datasets` - List available datasets
- `metadata.list_schemas` - List schemas for a dataset
- `metadata.list_publishers` - List publishers for a dataset
- `metadata.list_fields` - List fields for a schema
- `metadata.list_unit_prices` - Get pricing information
- `metadata.get_dataset_range` - Get date range for dataset
- `metadata.get_dataset_condition` - Check data availability
- `metadata.get_cost` - Calculate cost for a query

#### Historical Batch
- `batch.submit_job` - Submit batch download job
- `batch.list_jobs` - List batch jobs
- `batch.download` - Download completed batch files

#### Historical Symbology
- `symbology.resolve` - Resolve symbols to instrument IDs

#### Reference API
- `security.search` - Search security master
- `corporate.get_actions` - Get corporate actions
- `adjustment.get_factors` - Get adjustment factors

## Consequences

### Positive
- ✅ **Complete API Coverage**: Users get access to full Databento functionality
- ✅ **Modular Design**: Easy to maintain and extend
- ✅ **Parallel Development**: Faster implementation using subagents
- ✅ **Type Safety**: Strong typing with TypeScript
- ✅ **Backward Compatible**: Existing tools continue to work

### Negative
- ⚠️ **Increased Complexity**: More code to maintain
- ⚠️ **API Key Permissions**: Users need appropriate Databento subscriptions
- ⚠️ **Testing Burden**: More endpoints to test

### Risks & Mitigations
- **Risk**: Breaking changes to existing tools
  **Mitigation**: Comprehensive testing, version pinning

- **Risk**: API rate limits
  **Mitigation**: Implement caching, respect rate limits, clear error messages

## Implementation Plan

1. Create base HTTP client with shared functionality
2. Implement API clients in parallel (5 subagents)
3. Register new MCP tools
4. Add type definitions
5. Update documentation
6. Test all endpoints

## References

- [Databento Historical API](https://databento.com/docs/api-reference-historical)
- [Databento Python SDK](https://github.com/databento/databento-python)
- [Model Context Protocol Spec](https://modelcontextprotocol.io)
