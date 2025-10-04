# DataBento MCP Server

Model Context Protocol (MCP) server for DataBento market data, providing AI assistants with direct access to professional market data across all asset classes.

## What's New

**Version 2.0 - Complete Databento API Coverage**

This MCP server now provides complete access to the Databento API framework with 18 tools across 6 categories:
- Expanded from 3 original tools to 18 comprehensive tools
- Full Historical API support (Timeseries, Metadata, Batch, Symbology)
- Complete Reference API support (Securities, Corporate Actions, Adjustments)
- Modular architecture with specialized API clients
- Type-safe TypeScript implementation throughout

See [ADR 001](/Users/jeremymiranda/Dev/databento-mcp-server/docs/adrs/001-databento-api-expansion.md) for implementation details.

## Features

- 🎯 **Real-time Futures Quotes** - Current prices for ES and NQ contracts
- 📊 **Historical Timeseries** - Stream any market data schema across date ranges
- 📈 **Batch Downloads** - Submit and manage large historical data jobs
- 🔍 **Symbol Resolution** - Resolve symbols to instrument IDs across datasets
- 📚 **Metadata Discovery** - Explore datasets, schemas, fields, and pricing
- 🏢 **Reference Data** - Access security master, corporate actions, and adjustments
- ⏰ **Session Detection** - Automatic Asian/London/NY session identification
- 🚀 **Rate Limiting** - Built-in request throttling and caching (30s TTL)
- 🔒 **Error Handling** - Graceful failures with clear error messages

## Installation

### Prerequisites

- Node.js v18+ or compatible runtime
- DataBento API key ([get one here](https://databento.com))
- Claude Desktop or compatible MCP client

### Setup

1. Clone or download this repository:
```bash
cd ~/Dev
git clone <your-repo-url> databento-mcp-server
cd databento-mcp-server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file with your DataBento API key:
```bash
cp .env.example .env
# Edit .env and add your API key
```

Your `.env` should contain:
```
DATABENTO_API_KEY=db-your-api-key-here
DATABENTO_DATASET=GLBX.MDP3
```

4. Build the project:
```bash
npm run build
```

## Configuration

### Claude Desktop

Add to your Claude Desktop MCP configuration (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "databento": {
      "command": "node",
      "args": ["/Users/yourusername/Dev/databento-mcp-server/dist/index.js"],
      "env": {
        "DATABENTO_API_KEY": "db-your-api-key-here"
      }
    }
  }
}
```

Or use `npx` directly (if published to npm):
```json
{
  "mcpServers": {
    "databento": {
      "command": "npx",
      "args": ["-y", "databento-mcp-server"],
      "env": {
        "DATABENTO_API_KEY": "db-your-api-key-here"
      }
    }
  }
}
```

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABENTO_API_KEY` | ✅ | - | Your DataBento API key (starts with `db-`) |
| `DATABENTO_DATASET` | ❌ | `GLBX.MDP3` | CME dataset for futures data |

## Available Tools

The MCP server provides 18 tools organized into 6 categories:

| Category | Tools | Description |
|----------|-------|-------------|
| **Original** | 3 tools | ES/NQ futures quotes, session info, historical bars |
| **Timeseries** | 1 tool | Historical market data streaming with flexible schemas |
| **Symbology** | 1 tool | Symbol resolution and conversion |
| **Metadata** | 6 tools | Dataset discovery, schema info, cost estimation |
| **Batch** | 3 tools | Large-scale data download job management |
| **Reference** | 3 tools | Security master, corporate actions, price adjustments |

### Original Tools (Futures & Session)

#### 1. `get_futures_quote`

Get current price quote for ES or NQ futures.

**Input:**
```json
{
  "symbol": "ES"
}
```

**Output:**
```json
{
  "symbol": "ES",
  "price": 5845.25,
  "bid": 5845.00,
  "ask": 5845.50,
  "spread": 0.50,
  "timestamp": "2024-10-02T14:30:00.000Z",
  "dataAge": "15s ago",
  "source": "DataBento"
}
```

#### 2. `get_session_info`

Get current trading session information.

**Input:**
```json
{
  "timestamp": "2024-10-02T14:30:00Z"
}
```
_Note: `timestamp` is optional, defaults to current time_

**Output:**
```json
{
  "currentSession": "NY",
  "sessionStart": "2024-10-02T14:00:00.000Z",
  "sessionEnd": "2024-10-02T22:00:00.000Z",
  "timestamp": "2024-10-02T14:30:00.000Z",
  "utcHour": 14
}
```

**Sessions:**
- **Asian**: 00:00 - 07:00 UTC
- **London**: 07:00 - 14:00 UTC
- **NY**: 14:00 - 22:00 UTC

#### 3. `get_historical_bars`

Get historical OHLCV bars for futures contracts.

**Input:**
```json
{
  "symbol": "NQ",
  "timeframe": "H4",
  "count": 10
}
```

**Output:**
```json
{
  "symbol": "NQ",
  "timeframe": "H4",
  "count": 10,
  "bars": [
    {
      "timestamp": "2024-10-02T00:00:00.000Z",
      "open": 20150.25,
      "high": 20175.50,
      "low": 20145.00,
      "close": 20160.75,
      "volume": 125000
    }
  ]
}
```

**Supported Timeframes:**
- `1h` - Hourly bars
- `H4` - 4-hour bars (aggregated from 1h)
- `1d` - Daily bars

---

### Timeseries Tools

#### 4. `timeseries_get_range`

Stream historical market data with flexible schemas and date ranges. Supports all Databento schemas.

**Input:**
```json
{
  "dataset": "GLBX.MDP3",
  "symbols": "ES.c.0,NQ.c.0",
  "schema": "trades",
  "start": "2024-10-01",
  "end": "2024-10-02",
  "stype_in": "raw_symbol",
  "stype_out": "instrument_id",
  "limit": 1000
}
```

**Supported Schemas:**
- `mbp-1`, `mbp-10` - Market by price (1 or 10 levels)
- `mbo` - Market by order
- `trades` - Trade data
- `ohlcv-1s`, `ohlcv-1m`, `ohlcv-1h`, `ohlcv-1d`, `ohlcv-eod` - OHLCV bars
- `statistics`, `definition`, `imbalance`, `status` - Market metadata

**Output:**
```json
{
  "dataset": "GLBX.MDP3",
  "schema": "trades",
  "symbols": ["ES.c.0"],
  "dateRange": {
    "start": "2024-10-01T00:00:00Z",
    "end": "2024-10-02T00:00:00Z"
  },
  "recordCount": 1000,
  "data": [
    {
      "ts_event": "2024-10-01T09:30:00.123456789Z",
      "price": 5845.25,
      "size": 10,
      "side": "B"
    }
  ]
}
```

---

### Symbology Tools

#### 5. `symbology_resolve`

Resolve symbols to instrument IDs or other symbol types across a date range.

**Input:**
```json
{
  "dataset": "GLBX.MDP3",
  "symbols": ["ES", "NQ"],
  "stype_in": "continuous",
  "stype_out": "instrument_id",
  "start_date": "2024-10-01",
  "end_date": "2024-10-02"
}
```

**Symbol Types:**
- `raw_symbol` - Native exchange symbol
- `instrument_id` - Databento instrument ID
- `continuous` - Continuous futures (c.0, c.1, etc.)
- `parent` - Parent symbol
- `nasdaq`, `cms`, `bats`, `smart` - Venue-specific symbology

**Output:**
```json
{
  "dataset": "GLBX.MDP3",
  "stype_in": "continuous",
  "stype_out": "instrument_id",
  "date_range": {
    "start": "2024-10-01",
    "end": "2024-10-02"
  },
  "symbol_count": 2,
  "result": "partial",
  "mappings": [
    {
      "input_symbol": "ES.c.0",
      "output_symbol": "123456",
      "start_date": "2024-10-01",
      "end_date": "2024-10-02"
    }
  ]
}
```

---

### Metadata Tools

#### 6. `metadata_list_datasets`

List all available Databento datasets with optional date range filtering.

**Input:**
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

**Output:**
```json
{
  "datasets": [
    {
      "dataset": "GLBX.MDP3",
      "description": "CME Globex MDP 3.0",
      "start_date": "2020-01-01",
      "end_date": null
    }
  ],
  "count": 1
}
```

#### 7. `metadata_list_schemas`

List available data schemas for a specific dataset.

**Input:**
```json
{
  "dataset": "GLBX.MDP3"
}
```

**Output:**
```json
{
  "dataset": "GLBX.MDP3",
  "schemas": ["trades", "mbp-1", "mbp-10", "ohlcv-1h", "ohlcv-1d"],
  "count": 5
}
```

#### 8. `metadata_list_publishers`

List publishers with their details, optionally filtered by dataset.

**Input:**
```json
{
  "dataset": "GLBX.MDP3"
}
```

**Output:**
```json
{
  "publishers": [
    {
      "publisher_id": 1,
      "dataset": "GLBX.MDP3",
      "venue": "CME",
      "description": "Chicago Mercantile Exchange"
    }
  ],
  "count": 1,
  "dataset_filter": "GLBX.MDP3"
}
```

#### 9. `metadata_list_fields`

List fields available for a specific schema with their types and descriptions.

**Input:**
```json
{
  "schema": "trades",
  "encoding": "json"
}
```

**Output:**
```json
{
  "schema": "trades",
  "encoding": "json",
  "fields": [
    {
      "name": "ts_event",
      "type": "uint64",
      "description": "Event timestamp in nanoseconds"
    },
    {
      "name": "price",
      "type": "int64",
      "description": "Price in fixed-point notation"
    }
  ],
  "count": 2
}
```

#### 10. `metadata_get_cost`

Calculate the cost in USD for a historical data query before downloading.

**Input:**
```json
{
  "dataset": "GLBX.MDP3",
  "symbols": "ES.c.0",
  "schema": "trades",
  "start": "2024-10-01",
  "end": "2024-10-02",
  "stype_in": "raw_symbol"
}
```

**Output:**
```json
{
  "dataset": "GLBX.MDP3",
  "symbols": ["ES.c.0"],
  "schema": "trades",
  "cost_usd": 15.50,
  "record_count_estimate": 1500000,
  "size_bytes_estimate": 45000000
}
```

#### 11. `metadata_get_dataset_range`

Get the available date range for a dataset.

**Input:**
```json
{
  "dataset": "GLBX.MDP3"
}
```

**Output:**
```json
{
  "dataset": "GLBX.MDP3",
  "start_date": "2020-01-01",
  "end_date": null,
  "description": "Data available from 2020-01-01 to present"
}
```

---

### Batch Tools

#### 12. `batch_submit_job`

Submit a batch data download job for large historical datasets. Returns job ID and status.

**Input:**
```json
{
  "dataset": "GLBX.MDP3",
  "symbols": ["ES.c.0", "NQ.c.0"],
  "schema": "trades",
  "start": "2024-10-01",
  "end": "2024-10-02",
  "encoding": "csv",
  "compression": "zstd",
  "stype_in": "raw_symbol",
  "split_duration": "day"
}
```

**Output:**
```json
{
  "status": "submitted",
  "job_id": "abc123def456",
  "state": "received",
  "dataset": "GLBX.MDP3",
  "schema": "trades",
  "symbols_count": 2,
  "cost_usd": 25.00,
  "date_range": {
    "start": "2024-10-01",
    "end": "2024-10-02"
  },
  "encoding": "csv",
  "compression": "zstd",
  "ts_received": "2024-10-03T10:00:00Z",
  "message": "Job submitted successfully. Use batch_list_jobs or batch_download to check status and download files when ready."
}
```

#### 13. `batch_list_jobs`

List all batch jobs with their current status. Optionally filter by job states or time range.

**Input:**
```json
{
  "states": ["done", "processing"],
  "since": "2024-10-01T00:00:00Z"
}
```

**Output:**
```json
{
  "total_jobs": 5,
  "jobs_by_state": {
    "done": 3,
    "processing": 2
  },
  "jobs": [
    {
      "id": "abc123def456",
      "state": "done",
      "dataset": "GLBX.MDP3",
      "schema": "trades",
      "symbols_count": 2,
      "cost_usd": 25.00,
      "date_range": {
        "start": "2024-10-01",
        "end": "2024-10-02"
      },
      "record_count": 1500000,
      "file_count": 2,
      "total_size_bytes": 45000000,
      "ts_received": "2024-10-03T10:00:00Z",
      "ts_process_done": "2024-10-03T10:15:00Z",
      "ts_expiration": "2024-10-10T10:00:00Z"
    }
  ]
}
```

#### 14. `batch_download`

Get download information for a completed batch job. Returns download URLs and metadata.

**Input:**
```json
{
  "job_id": "abc123def456"
}
```

**Output:**
```json
{
  "job_id": "abc123def456",
  "state": "done",
  "files": [
    {
      "filename": "20241001.csv.zst",
      "size_bytes": 22500000,
      "hash": "sha256:abc123...",
      "download_url": "https://download.databento.com/..."
    }
  ],
  "total_size_bytes": 45000000,
  "expiration": "2024-10-10T10:00:00Z"
}
```

---

### Reference Tools

#### 15. `reference_search_securities`

Search security master database for instrument metadata.

**Input:**
```json
{
  "dataset": "GLBX.MDP3",
  "symbols": "ES.c.0,NQ.c.0",
  "start_date": "2024-10-01",
  "end_date": "2024-10-02",
  "limit": 100
}
```

**Output:**
```json
{
  "dataset": "GLBX.MDP3",
  "symbols": "ES.c.0,NQ.c.0",
  "date_range": {
    "start": "2024-10-01",
    "end": "2024-10-02"
  },
  "record_count": 2,
  "securities": [
    {
      "instrument_id": "123456",
      "raw_symbol": "ESZ4",
      "description": "E-mini S&P 500 Dec 2024",
      "asset_class": "futures",
      "exchange": "CME",
      "currency": "USD",
      "first_date": "2023-09-18",
      "last_date": "2024-12-20",
      "min_price_increment": 0.25,
      "display_factor": 1.0
    }
  ]
}
```

#### 16. `reference_get_corporate_actions`

Get corporate actions (dividends, splits, etc.) for symbols.

**Input:**
```json
{
  "dataset": "XNAS.ITCH",
  "symbols": "AAPL,MSFT",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "action_types": ["dividend", "split"]
}
```

**Output:**
```json
{
  "dataset": "XNAS.ITCH",
  "symbols": "AAPL,MSFT",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "record_count": 5,
  "action_types_filter": ["dividend", "split"],
  "corporate_actions": [
    {
      "instrument_id": "789012",
      "raw_symbol": "AAPL",
      "action_type": "dividend",
      "ex_date": "2024-05-10",
      "record_date": "2024-05-13",
      "payment_date": "2024-05-16",
      "amount": 0.25,
      "currency": "USD"
    }
  ]
}
```

#### 17. `reference_get_adjustments`

Get price adjustment factors for backadjusted prices.

**Input:**
```json
{
  "dataset": "XNAS.ITCH",
  "symbols": "AAPL",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31"
}
```

**Output:**
```json
{
  "dataset": "XNAS.ITCH",
  "symbols": "AAPL",
  "date_range": {
    "start": "2024-01-01",
    "end": "2024-12-31"
  },
  "record_count": 2,
  "adjustments": [
    {
      "instrument_id": "789012",
      "raw_symbol": "AAPL",
      "adjustment_date": "2024-05-10",
      "adjustment_type": "dividend",
      "price_factor": 0.998654,
      "volume_factor": 1.0
    }
  ]
}
```

## Usage Examples

### With Claude Desktop

Once configured, you can ask Claude:

**Original Futures Tools:**

> "What's the current ES price?"

Claude will use the `get_futures_quote` tool to fetch real-time data.

> "Get the last 10 H4 bars for NQ"

Claude will use the `get_historical_bars` tool.

> "What session are we in right now?"

Claude will use the `get_session_info` tool.

**New Databento API Tools:**

> "List all available Databento datasets"

Claude will use `metadata_list_datasets` to show all available datasets.

> "Get trade data for ES on October 1st"

Claude will use `timeseries_get_range` to fetch historical trade data.

> "Resolve the symbol ES.c.0 to instrument ID"

Claude will use `symbology_resolve` to convert symbol types.

> "How much would it cost to download all trades for AAPL in September?"

Claude will use `metadata_get_cost` to calculate the query cost.

> "Submit a batch job for NQ trade data from last week"

Claude will use `batch_submit_job` to create a batch download job.

> "Get security details for ESZ4"

Claude will use `reference_search_securities` to fetch instrument metadata.

> "Get dividend history for AAPL in 2024"

Claude will use `reference_get_corporate_actions` to fetch corporate actions.

### Development Mode

Run the server in development mode with auto-reload:
```bash
npm run dev
```

### Production Mode

Build and run:
```bash
npm run build
npm start
```

## Technical Details

### Data Provider

- **Source**: DataBento CME futures data
- **Symbols**: ES.c.0 (S&P 500), NQ.c.0 (Nasdaq-100)
- **Dataset**: GLBX.MDP3 (CME Globex MDP 3.0)
- **Precision**: Nanosecond timestamps, 1e9 price units

### Caching Strategy

- **Quote Cache**: 30-second TTL (reduces API calls)
- **Weekend Handling**: 7-day lookback for off-hours data
- **Rate Limiting**: Built-in request throttling

### Error Handling

All tools return structured errors:
```json
{
  "error": "No quote data available for ES"
}
```

Common errors:
- Missing API key
- Invalid symbol (only ES/NQ supported)
- No data available (weekends, holidays)
- API rate limit exceeded

## Project Structure

```
databento-mcp-server/
├── src/
│   ├── index.ts              # MCP server entry point & tool registration
│   ├── databento-client.ts   # Legacy futures client (original 3 tools)
│   ├── http/
│   │   └── databento-http.ts # Base HTTP client with auth, retry, caching
│   ├── api/
│   │   ├── metadata-client.ts    # Metadata API client (datasets, schemas, etc.)
│   │   ├── timeseries-client.ts  # Timeseries API client (historical data)
│   │   ├── batch-client.ts       # Batch API client (job management)
│   │   ├── symbology-client.ts   # Symbology API client (symbol resolution)
│   │   └── reference-client.ts   # Reference API client (securities, corporate actions)
│   └── types/
│       ├── metadata.ts       # Metadata type definitions
│       ├── timeseries.ts     # Timeseries type definitions
│       ├── batch.ts          # Batch type definitions
│       ├── symbology.ts      # Symbology type definitions
│       └── reference.ts      # Reference type definitions
├── docs/
│   ├── adrs/                 # Architecture Decision Records
│   │   └── 001-databento-api-expansion.md
│   └── journals/             # Implementation journals
├── dist/                     # Compiled JavaScript (build output)
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Development

### Building

```bash
npm run build
```

### Adding New Tools

1. Add tool definition to `ListToolsRequestSchema` handler in `src/index.ts`
2. Implement handler in `CallToolRequestSchema` switch statement
3. Add client method to `DataBentoClient` if needed
4. Rebuild and test

### Testing Locally

```bash
# Set API key
export DATABENTO_API_KEY=db-your-key

# Run dev server
npm run dev
```

## Limitations

- **Original Tools**: `get_futures_quote` and `get_historical_bars` only support ES and NQ futures
- **New Tools**: Support all Databento datasets and symbols (GLBX.MDP3, XNAS.ITCH, DBEQ.BASIC, etc.)
- **Data Delay**: Historical API (not tick-by-tick real-time streaming)
- **Weekend Data**: May show stale data on weekends/holidays
- **Rate Limits**: Respects DataBento API limits (60 req/min)
- **Batch Downloads**: Download URLs are returned but file content is not streamed through MCP
- **API Key Permissions**: Access to datasets requires appropriate Databento subscriptions

## Troubleshooting

### "DATABENTO_API_KEY is required"

Ensure your `.env` file contains a valid API key starting with `db-`.

### "No quote data available"

- Check if markets are open (futures trade 23h/day on weekdays)
- Verify your DataBento account has CME futures access
- Check API key permissions

### "HTTP 401" errors

Your API key is invalid or expired. Get a new one from databento.com.

## License

MIT

## Contributing

Contributions welcome! Please open issues or PRs on GitHub.

## Related Projects

- [GladOSv2](https://github.com/yourusername/GladOSv2) - Trading bot using this MCP server
- [Model Context Protocol](https://modelcontextprotocol.io) - Official MCP documentation

---

Built with ❤️ for the Wolf Agents ecosystem
