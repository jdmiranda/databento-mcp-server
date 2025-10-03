#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from "dotenv";
import { DataBentoClient } from "./databento-client.js";

// Load environment variables
dotenv.config();

// Validate API key
const DATABENTO_API_KEY = process.env.DATABENTO_API_KEY;
if (!DATABENTO_API_KEY) {
  console.error("Error: DATABENTO_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize DataBento client
const databentoClient = new DataBentoClient(DATABENTO_API_KEY);

// Create MCP server instance
const server = new Server(
  {
    name: "databento-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_futures_quote",
        description: "Get current price quote for ES or NQ futures contracts",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              enum: ["ES", "NQ"],
              description: "Futures symbol (ES = E-mini S&P 500, NQ = E-mini Nasdaq-100)",
            },
          },
          required: ["symbol"],
        },
      },
      {
        name: "get_session_info",
        description: "Get current trading session information (Asian/London/NY)",
        inputSchema: {
          type: "object",
          properties: {
            timestamp: {
              type: "string",
              description: "Optional ISO timestamp (defaults to now)",
            },
          },
        },
      },
      {
        name: "get_historical_bars",
        description: "Get historical OHLCV bars for futures contracts",
        inputSchema: {
          type: "object",
          properties: {
            symbol: {
              type: "string",
              enum: ["ES", "NQ"],
              description: "Futures symbol",
            },
            timeframe: {
              type: "string",
              enum: ["1h", "H4", "1d"],
              description: "Bar timeframe",
            },
            count: {
              type: "number",
              description: "Number of bars to retrieve",
              minimum: 1,
              maximum: 100,
            },
          },
          required: ["symbol", "timeframe", "count"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_futures_quote": {
        const { symbol } = args as { symbol: "ES" | "NQ" };
        const quote = await databentoClient.getQuote(symbol);

        const result = {
          symbol: quote.symbol,
          price: quote.price,
          bid: quote.bid,
          ask: quote.ask,
          spread: +(quote.ask - quote.bid).toFixed(2),
          timestamp: quote.timestamp.toISOString(),
          dataAge: `${Math.round(quote.dataAge / 1000)}s ago`,
          source: "DataBento",
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_session_info": {
        const { timestamp } = args as { timestamp?: string };
        const ts = timestamp ? new Date(timestamp) : undefined;
        const sessionInfo = databentoClient.getSessionInfo(ts);

        const result = {
          currentSession: sessionInfo.currentSession,
          sessionStart: sessionInfo.sessionStart.toISOString(),
          sessionEnd: sessionInfo.sessionEnd.toISOString(),
          timestamp: sessionInfo.timestamp.toISOString(),
          utcHour: sessionInfo.timestamp.getUTCHours(),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_historical_bars": {
        const { symbol, timeframe, count } = args as {
          symbol: "ES" | "NQ";
          timeframe: "1h" | "H4" | "1d";
          count: number;
        };

        const bars = await databentoClient.getHistoricalBars(symbol, timeframe, count);

        const result = {
          symbol,
          timeframe,
          count: bars.length,
          bars: bars.map((bar) => ({
            timestamp: bar.timestamp.toISOString(),
            open: bar.open,
            high: bar.high,
            low: bar.low,
            close: bar.close,
            volume: bar.volume,
          })),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ error: errorMessage }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("DataBento MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
