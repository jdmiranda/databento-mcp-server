# DataBento MCP Server

Model Context Protocol (MCP) server for DataBento market data, providing AI assistants with direct access to professional futures market data (ES, NQ).

## Features

- 🎯 **Real-time Futures Quotes** - Current prices for ES and NQ contracts
- 📊 **Historical Bars** - OHLCV data with 1h, H4, and daily timeframes
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

### 1. `get_futures_quote`

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

### 2. `get_session_info`

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

### 3. `get_historical_bars`

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

## Usage Examples

### With Claude Desktop

Once configured, you can ask Claude:

> "What's the current ES price?"

Claude will use the `get_futures_quote` tool to fetch real-time data.

> "Get the last 10 H4 bars for NQ"

Claude will use the `get_historical_bars` tool.

> "What session are we in right now?"

Claude will use the `get_session_info` tool.

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
│   ├── index.ts              # MCP server entry point
│   └── databento-client.ts   # DataBento API client
├── dist/                     # Compiled JavaScript
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

- **Symbols**: Only ES and NQ futures supported
- **Data Delay**: Historical API (not tick-by-tick streaming)
- **Weekend Data**: May show stale data on weekends/holidays
- **Rate Limits**: Respects DataBento API limits (60 req/min)

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
