# Reference API Implementation Journal

**Date**: 2025-10-03
**Author**: Development Team
**Status**: Complete

## Overview

Implemented the Reference API client for the Databento MCP Server, providing access to security master data, corporate actions, and price adjustment factors.

## Implementation Details

### Files Created

1. **`src/types/reference.ts`**
   - TypeScript type definitions for reference data
   - Includes: `SecurityRecord`, `CorporateAction`, `AdjustmentFactor`
   - Request/Response interfaces for all reference APIs

2. **`src/api/reference-client.ts`**
   - Reference API client class
   - Uses shared `DataBentoHTTP` base client
   - Methods implemented:
     - `searchSecurities()` - Search security master database
     - `getCorporateActions()` - Get corporate actions (dividends, splits, etc.)
     - `getAdjustmentFactors()` - Get price adjustment factors

3. **MCP Tools in `src/index.ts`**
   - `reference_search_securities` - Search for securities by symbol
   - `reference_get_corporate_actions` - Query corporate actions
   - `reference_get_adjustments` - Get adjustment factors

## API Methods

### 1. Search Securities

**Endpoint**: `/v0/metadata.list_symbols`

**Purpose**: Search the security master database for instrument metadata

**Parameters**:
- `dataset` (required): Dataset code (e.g., 'GLBX.MDP3', 'XNAS.ITCH')
- `symbols` (required): Symbols to search (comma-separated)
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `limit` (optional): Maximum results (default: 1000)

**Returns**:
```typescript
{
  securities: SecurityRecord[];
  count: number;
}
```

**Example**:
```typescript
const result = await referenceClient.searchSecurities({
  dataset: 'XNAS.ITCH',
  symbols: 'AAPL,MSFT',
  start_date: '2024-01-01',
  end_date: '2024-12-31'
});
```

### 2. Get Corporate Actions

**Endpoint**: `/v0/timeseries.get_range` (schema: corporate_actions)

**Purpose**: Retrieve corporate actions like dividends, splits, mergers

**Parameters**:
- `dataset` (required): Dataset code
- `symbols` (required): Symbols to query
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)
- `action_types` (optional): Filter by action types (array)

**Returns**:
```typescript
{
  actions: CorporateAction[];
  count: number;
}
```

**Example**:
```typescript
const result = await referenceClient.getCorporateActions({
  dataset: 'XNAS.ITCH',
  symbols: 'AAPL',
  start_date: '2024-01-01',
  action_types: ['DIVIDEND', 'SPLIT']
});
```

### 3. Get Adjustment Factors

**Endpoint**: `/v0/timeseries.get_range` (schema: adjustment)

**Purpose**: Get price and volume adjustment factors for backadjusted prices

**Parameters**:
- `dataset` (required): Dataset code
- `symbols` (required): Symbols to query
- `start_date` (optional): Start date (YYYY-MM-DD)
- `end_date` (optional): End date (YYYY-MM-DD)

**Returns**:
```typescript
{
  adjustments: AdjustmentFactor[];
  count: number;
}
```

**Example**:
```typescript
const result = await referenceClient.getAdjustmentFactors({
  dataset: 'XNAS.ITCH',
  symbols: 'AAPL',
  start_date: '2024-01-01'
});
```

## Technical Decisions

### 1. Base HTTP Client Usage

Used the shared `DataBentoHTTP` client for:
- Consistent authentication
- Retry logic with exponential backoff
- Error handling
- Request/response standardization

### 2. CSV Parsing

Reference data comes as CSV from DataBento API:
- Used shared `parseCSV()` helper function
- Applied type conversions (string → number) where needed
- Handled optional fields gracefully

### 3. Type Safety

All methods are fully typed with TypeScript:
- Input parameters validated at compile-time
- Response types enforced
- Optional fields properly marked

### 4. Error Handling

Comprehensive error handling:
- API errors wrapped with descriptive messages
- Type conversion errors caught
- Empty results handled gracefully

## Data Model

### SecurityRecord
```typescript
interface SecurityRecord {
  instrument_id: number;       // DataBento instrument ID
  symbol: string;               // Trading symbol
  dataset: string;              // Dataset code
  stype: string;                // Security type
  first_available: string;      // First active date
  last_available: string;       // Last active date
  exchange: string;             // Exchange/venue
  asset_class?: string;         // Asset class
  description?: string;         // Description
  isin?: string;                // ISIN identifier
  currency?: string;            // Currency code
  contract_size?: number;       // Contract size/multiplier
  tick_size?: number;           // Minimum price increment
  expiration?: string;          // Expiration date (derivatives)
}
```

### CorporateAction
```typescript
interface CorporateAction {
  instrument_id: number;        // Instrument ID
  symbol: string;               // Trading symbol
  dataset: string;              // Dataset code
  action_type: string;          // DIVIDEND, SPLIT, MERGER, etc.
  effective_date: string;       // Effective date
  announcement_date?: string;   // Announcement date
  ex_date?: string;             // Ex-dividend date
  record_date?: string;         // Record date
  payment_date?: string;        // Payment date
  amount?: number;              // Dividend amount
  currency?: string;            // Currency
  split_ratio?: string;         // Split ratio (e.g., "2:1")
  split_factor?: number;        // Split factor (numeric)
  details?: string;             // Additional details
}
```

### AdjustmentFactor
```typescript
interface AdjustmentFactor {
  instrument_id: number;        // Instrument ID
  symbol: string;               // Trading symbol
  dataset: string;              // Dataset code
  effective_date: string;       // Effective date
  price_factor: number;         // Cumulative price adjustment
  volume_factor?: number;       // Cumulative volume adjustment
  reason?: string;              // Adjustment reason
  action_type?: string;         // Related action type
}
```

## Testing Considerations

To test the implementation:

1. **Security Search**:
   ```bash
   # Search for ES futures
   dataset: GLBX.MDP3
   symbols: ES.c.0
   ```

2. **Corporate Actions**:
   ```bash
   # Get AAPL dividends
   dataset: XNAS.ITCH
   symbols: AAPL
   action_types: DIVIDEND
   ```

3. **Adjustment Factors**:
   ```bash
   # Get price adjustments for AAPL
   dataset: XNAS.ITCH
   symbols: AAPL
   start_date: 2024-01-01
   ```

## Integration with MCP Server

The Reference client has been integrated into the MCP server at `src/index.ts`:
- Client instantiated: `const referenceClient = new ReferenceClient(DATABENTO_API_KEY)`
- Three tools registered in `ListToolsRequestSchema`
- Tool handlers added to `CallToolRequestSchema` switch statement

## Dependencies

- `DataBentoHTTP` - Base HTTP client
- `parseCSV` - CSV parsing utility
- Reference type definitions from `src/types/reference.ts`

## Known Limitations

1. **Schema Availability**: Corporate actions and adjustment schemas may not be available for all datasets
2. **Date Ranges**: Some datasets have limited historical data
3. **Rate Limits**: Subject to DataBento API rate limits
4. **Permissions**: Requires appropriate DataBento subscription for reference data access

## Future Enhancements

Potential improvements:
1. Caching for frequently requested reference data
2. Batch operations for multiple symbols
3. Real-time updates for corporate actions
4. Additional filtering options (by exchange, asset class, etc.)
5. Symbol validation before API calls

## References

- [DataBento Historical API](https://databento.com/docs/api-reference-historical)
- [ADR 001: Databento API Expansion](../adrs/001-databento-api-expansion.md)
- [DataBento Python SDK Reference API](https://github.com/databento/databento-python/tree/main/databento/reference)

## Completion Status

- [x] Type definitions created
- [x] Reference client implemented
- [x] MCP tools registered
- [x] Build passes without errors
- [x] Journal documented

**Status**: Implementation complete. The Reference API client is ready for use in the Databento MCP Server.
