#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as dotenv from "dotenv";
import { DataBentoClient } from "./databento-client.js";
import { DataBentoHTTP } from "./http/databento-http.js";
import { MetadataClient } from "./api/metadata-client.js";
import { TimeseriesClient } from "./api/timeseries-client.js";
import { ReferenceClient } from "./api/reference-client.js";
import { SymbologyClient } from "./api/symbology-client.js";
import { BatchClient } from "./api/batch-client.js";
import { Schema, SType } from "./types/timeseries.js";
import { SymbolType } from "./types/symbology.js";
import type { BatchJobRequest, ListJobsParams } from "./types/batch.js";

// Load environment variables
dotenv.config();

// Validate API key
const DATABENTO_API_KEY = process.env.DATABENTO_API_KEY;
if (!DATABENTO_API_KEY) {
  console.error("Error: DATABENTO_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize DataBento clients
const databentoClient = new DataBentoClient(DATABENTO_API_KEY);
const http = new DataBentoHTTP(DATABENTO_API_KEY);
const metadataClient = new MetadataClient(http);
const referenceClient = new ReferenceClient(DATABENTO_API_KEY);
const timeseriesClient = new TimeseriesClient(http);
const symbologyClient = new SymbologyClient(DATABENTO_API_KEY);
const batchClient = new BatchClient(http);

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
      {
        name: "symbology_resolve",
        description: "Resolve symbols to instrument IDs or other symbol types across a date range",
        inputSchema: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              description: "Dataset code (e.g., GLBX.MDP3, XNAS.ITCH)",
            },
            symbols: {
              type: "array",
              items: { type: "string" },
              description: "Array of symbols to resolve (max 2000)",
              maxItems: 2000,
            },
            stype_in: {
              type: "string",
              enum: ["raw_symbol", "instrument_id", "continuous", "parent", "nasdaq", "cms", "bats", "smart"],
              description: "Input symbol type",
              default: "raw_symbol",
            },
            stype_out: {
              type: "string",
              enum: ["raw_symbol", "instrument_id", "continuous", "parent", "nasdaq", "cms", "bats", "smart"],
              description: "Output symbol type",
              default: "instrument_id",
            },
            start_date: {
              type: "string",
              description: "Inclusive start date (YYYY-MM-DD)",
              pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            },
            end_date: {
              type: "string",
              description: "Optional exclusive end date (YYYY-MM-DD)",
              pattern: "^\\d{4}-\\d{2}-\\d{2}$",
            },
          },
          required: ["dataset", "symbols", "stype_in", "stype_out", "start_date"],
        },
      },
      {
        name: "timeseries_get_range",
        description: "Get historical market data with flexible schemas and date ranges. Supports all Databento schemas (mbp-1, mbp-10, trades, ohlcv-1h, ohlcv-1d, etc.)",
        inputSchema: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              description: "Dataset code (e.g., 'GLBX.MDP3' for CME, 'XNAS.ITCH' for Nasdaq)",
            },
            symbols: {
              type: "string",
              description: "Comma-separated list of instrument symbols (up to 2000)",
            },
            schema: {
              type: "string",
              enum: [
                "mbp-1", "mbp-10", "mbo", "trades",
                "ohlcv-1s", "ohlcv-1m", "ohlcv-1h", "ohlcv-1d", "ohlcv-eod",
                "statistics", "definition", "imbalance", "status"
              ],
              description: "Data schema type",
            },
            start: {
              type: "string",
              description: "Start date (ISO 8601 or YYYY-MM-DD format)",
            },
            end: {
              type: "string",
              description: "End date (ISO 8601 or YYYY-MM-DD format), defaults to start date",
            },
            stype_in: {
              type: "string",
              enum: ["raw_symbol", "instrument_id", "continuous", "parent"],
              description: "Input symbology type, defaults to 'raw_symbol'",
            },
            stype_out: {
              type: "string",
              enum: ["raw_symbol", "instrument_id", "continuous", "parent"],
              description: "Output symbology type, defaults to 'instrument_id'",
            },
            limit: {
              type: "number",
              description: "Maximum number of records to return",
              minimum: 1,
            },
          },
          required: ["dataset", "symbols", "schema", "start"],
        },
      },
      {
        name: "metadata_list_datasets",
        description: "List all available Databento datasets with optional date range filtering",
        inputSchema: {
          type: "object",
          properties: {
            start_date: {
              type: "string",
              description: "Optional inclusive start date (YYYY-MM-DD)",
            },
            end_date: {
              type: "string",
              description: "Optional exclusive end date (YYYY-MM-DD)",
            },
          },
        },
      },
      {
        name: "metadata_list_schemas",
        description: "List available data schemas for a specific dataset",
        inputSchema: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              description: "Dataset code (e.g., GLBX.MDP3, XNAS.ITCH)",
            },
          },
          required: ["dataset"],
        },
      },
      {
        name: "metadata_list_publishers",
        description: "List publishers with their details, optionally filtered by dataset",
        inputSchema: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              description: "Optional dataset code to filter publishers",
            },
          },
        },
      },
      {
        name: "metadata_list_fields",
        description: "List fields available for a specific schema with their types and descriptions",
        inputSchema: {
          type: "object",
          properties: {
            schema: {
              type: "string",
              description: "Schema name (e.g., trades, mbp-1, ohlcv-1d)",
            },
            encoding: {
              type: "string",
              description: "Optional encoding type (e.g., json, csv, dbn)",
            },
          },
          required: ["schema"],
        },
      },
      {
        name: "metadata_get_cost",
        description: "Calculate the cost in USD for a historical data query before downloading",
        inputSchema: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              description: "Dataset code (e.g., GLBX.MDP3)",
            },
            symbols: {
              type: "string",
              description: "Comma-separated list of symbols or single symbol",
            },
            schema: {
              type: "string",
              description: "Schema name (default: trades)",
            },
            start: {
              type: "string",
              description: "Inclusive start date/time (YYYY-MM-DD or ISO 8601)",
            },
            end: {
              type: "string",
              description: "Optional exclusive end date/time (YYYY-MM-DD or ISO 8601)",
            },
            mode: {
              type: "string",
              description: "Query mode (default: historical-streaming)",
            },
            stype_in: {
              type: "string",
              description: "Input symbology type (e.g., raw_symbol, continuous)",
            },
            stype_out: {
              type: "string",
              description: "Output symbology type (e.g., instrument_id, raw_symbol)",
            },
          },
          required: ["dataset", "start"],
        },
      },
      {
        name: "metadata_get_dataset_range",
        description: "Get the available date range for a dataset",
        inputSchema: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              description: "Dataset code (e.g., GLBX.MDP3)",
            },
          },
          required: ["dataset"],
        },
      },
      {
        name: "batch_submit_job",
        description: "Submit a batch data download job for large historical datasets. Returns job ID and status. Job processing is asynchronous.",
        inputSchema: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              description: "Dataset code (e.g., GLBX.MDP3, XNAS.ITCH)",
            },
            symbols: {
              type: "array",
              items: { type: "string" },
              description: "Array of symbols (max 2000)",
              maxItems: 2000,
            },
            schema: {
              type: "string",
              enum: ["trades", "tbbo", "mbp-1", "mbp-10", "ohlcv-1s", "ohlcv-1m", "ohlcv-1h", "ohlcv-1d", "definition", "statistics", "status", "imbalance"],
              description: "Data record schema",
            },
            start: {
              type: "string",
              description: "Start date (YYYY-MM-DD or ISO 8601)",
            },
            end: {
              type: "string",
              description: "Optional end date (YYYY-MM-DD or ISO 8601)",
            },
            encoding: {
              type: "string",
              enum: ["dbn", "csv", "json"],
              description: "Output encoding (default: dbn)",
            },
            compression: {
              type: "string",
              enum: ["none", "zstd", "gzip"],
              description: "Compression type (default: zstd)",
            },
            stype_in: {
              type: "string",
              enum: ["instrument_id", "raw_symbol", "continuous", "parent", "nasdaq", "cms", "isin"],
              description: "Input symbology type (default: raw_symbol)",
            },
            stype_out: {
              type: "string",
              enum: ["instrument_id", "raw_symbol", "continuous", "parent", "nasdaq", "cms", "isin"],
              description: "Output symbology type (default: instrument_id)",
            },
            split_duration: {
              type: "string",
              description: "Split files by duration (e.g., day, week, month)",
            },
            split_size: {
              type: "number",
              description: "Split files by size in bytes",
            },
            split_symbols: {
              type: "boolean",
              description: "Split files by symbol (default: false)",
            },
            limit: {
              type: "number",
              description: "Limit number of records",
            },
          },
          required: ["dataset", "symbols", "schema", "start"],
        },
      },
      {
        name: "batch_list_jobs",
        description: "List all batch jobs with their current status. Optionally filter by job states or time range.",
        inputSchema: {
          type: "object",
          properties: {
            states: {
              type: "array",
              items: {
                type: "string",
                enum: ["received", "queued", "processing", "done", "expired"],
              },
              description: "Filter by job states",
            },
            since: {
              type: "string",
              description: "Filter jobs since timestamp (ISO 8601)",
            },
          },
        },
      },
      {
        name: "batch_download",
        description: "Get download information for a completed batch job. Returns download URLs and metadata. Does NOT stream file content through MCP.",
        inputSchema: {
          type: "object",
          properties: {
            job_id: {
              type: "string",
              description: "Batch job identifier",
            },
          },
          required: ["job_id"],
        },
      },
      {
        name: "reference_search_securities",
        description: "Search security master database for instrument metadata",
        inputSchema: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              description: "Dataset code (e.g., GLBX.MDP3, XNAS.ITCH)",
            },
            symbols: {
              type: "string",
              description: "Comma-separated list of symbols",
            },
            start_date: {
              type: "string",
              description: "Start date (YYYY-MM-DD)",
            },
            end_date: {
              type: "string",
              description: "Optional end date (YYYY-MM-DD)",
            },
            limit: {
              type: "number",
              description: "Maximum number of records to return",
            },
          },
          required: ["dataset", "symbols", "start_date"],
        },
      },
      {
        name: "reference_get_corporate_actions",
        description: "Get corporate actions (dividends, splits, etc.) for symbols",
        inputSchema: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              description: "Dataset code (e.g., XNAS.ITCH)",
            },
            symbols: {
              type: "string",
              description: "Comma-separated list of symbols",
            },
            start_date: {
              type: "string",
              description: "Start date (YYYY-MM-DD)",
            },
            end_date: {
              type: "string",
              description: "Optional end date (YYYY-MM-DD)",
            },
            action_types: {
              type: "array",
              items: { type: "string" },
              description: "Filter by action types (e.g., ['dividend', 'split'])",
            },
          },
          required: ["dataset", "symbols", "start_date"],
        },
      },
      {
        name: "reference_get_adjustments",
        description: "Get price adjustment factors for backadjusted prices",
        inputSchema: {
          type: "object",
          properties: {
            dataset: {
              type: "string",
              description: "Dataset code (e.g., XNAS.ITCH)",
            },
            symbols: {
              type: "string",
              description: "Comma-separated list of symbols",
            },
            start_date: {
              type: "string",
              description: "Start date (YYYY-MM-DD)",
            },
            end_date: {
              type: "string",
              description: "Optional end date (YYYY-MM-DD)",
            },
          },
          required: ["dataset", "symbols", "start_date"],
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

      case "symbology_resolve": {
        const { dataset, symbols, stype_in, stype_out, start_date, end_date } = args as {
          dataset: string;
          symbols: string[];
          stype_in: string;
          stype_out: string;
          start_date: string;
          end_date?: string;
        };

        const response = await symbologyClient.resolve({
          dataset,
          symbols,
          stype_in,
          stype_out,
          start_date,
          end_date,
        });

        const result = {
          dataset,
          stype_in,
          stype_out,
          date_range: {
            start: start_date,
            end: end_date || "open",
          },
          symbol_count: symbols.length,
          result: response.result,
          mappings: response.mappings,
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

      case "timeseries_get_range": {
        const { dataset, symbols, schema, start, end, stype_in, stype_out, limit } = args as {
          dataset: string;
          symbols: string;
          schema: string;
          start: string;
          end?: string;
          stype_in?: string;
          stype_out?: string;
          limit?: number;
        };

        const response = await timeseriesClient.getRange({
          dataset,
          symbols,
          schema,
          start,
          end,
          stype_in,
          stype_out,
          limit,
        });

        const result = {
          dataset,
          schema: response.schema,
          symbols: response.symbols,
          dateRange: response.dateRange,
          recordCount: response.recordCount,
          data: response.data,
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

      case "metadata_list_datasets": {
        const { start_date, end_date } = args as {
          start_date?: string;
          end_date?: string;
        };

        const datasets = await metadataClient.listDatasets({ start_date, end_date });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  datasets,
                  count: datasets.length,
                  filters: { start_date, end_date },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "metadata_list_schemas": {
        const { dataset } = args as { dataset: string };

        const schemas = await metadataClient.listSchemas({ dataset });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  dataset,
                  schemas,
                  count: schemas.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "metadata_list_publishers": {
        const { dataset } = args as { dataset?: string };

        const publishers = await metadataClient.listPublishers(dataset);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  publishers,
                  count: publishers.length,
                  dataset_filter: dataset || "none",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "metadata_list_fields": {
        const { schema, encoding } = args as {
          schema: string;
          encoding?: string;
        };

        const fields = await metadataClient.listFields({ schema, encoding });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  schema,
                  encoding: encoding || "default",
                  fields,
                  count: fields.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "metadata_get_cost": {
        const {
          dataset,
          symbols,
          schema,
          start,
          end,
          mode,
          stype_in,
          stype_out,
        } = args as {
          dataset: string;
          symbols?: string;
          schema?: string;
          start: string;
          end?: string;
          mode?: string;
          stype_in?: string;
          stype_out?: string;
        };

        const cost = await metadataClient.getCost({
          dataset,
          symbols,
          schema,
          start,
          end,
          mode,
          stype_in,
          stype_out,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(cost, null, 2),
            },
          ],
        };
      }

      case "metadata_get_dataset_range": {
        const { dataset } = args as { dataset: string };

        const range = await metadataClient.getDatasetRange({ dataset });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  dataset,
                  ...range,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "batch_submit_job": {
        const params = args as unknown as BatchJobRequest;
        const jobInfo = await batchClient.submitJob(params);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  status: "submitted",
                  job_id: jobInfo.id,
                  state: jobInfo.state,
                  dataset: jobInfo.dataset,
                  schema: jobInfo.schema,
                  symbols_count: jobInfo.symbols.length,
                  cost_usd: jobInfo.cost_usd,
                  date_range: {
                    start: jobInfo.start,
                    end: jobInfo.end,
                  },
                  encoding: jobInfo.encoding,
                  compression: jobInfo.compression,
                  ts_received: jobInfo.ts_received,
                  message: "Job submitted successfully. Use batch_list_jobs or batch_download to check status and download files when ready.",
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "batch_list_jobs": {
        const params = args as ListJobsParams;
        const jobs = await batchClient.listJobs(params);

        const summary = {
          total_jobs: jobs.length,
          jobs_by_state: jobs.reduce((acc, job) => {
            acc[job.state] = (acc[job.state] || 0) + 1;
            return acc;
          }, {} as Record<string, number>),
          jobs: jobs.map((job) => ({
            id: job.id,
            state: job.state,
            dataset: job.dataset,
            schema: job.schema,
            symbols_count: job.symbols.length,
            cost_usd: job.cost_usd,
            date_range: {
              start: job.start,
              end: job.end,
            },
            ts_received: job.ts_received,
            ts_queued: job.ts_queued,
            ts_process_start: job.ts_process_start,
            ts_process_done: job.ts_process_done,
            ts_expiration: job.ts_expiration,
            record_count: job.record_count,
            file_count: job.file_count,
            total_size_bytes: job.total_size,
          })),
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case "batch_download": {
        const { job_id } = args as { job_id: string };
        const downloadResult = await batchClient.getDownloadInfo(job_id);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(downloadResult, null, 2),
            },
          ],
        };
      }

      case "reference_search_securities": {
        const { dataset, symbols, start_date, end_date, limit } = args as {
          dataset: string;
          symbols: string;
          start_date: string;
          end_date?: string;
          limit?: number;
        };

        const response = await referenceClient.searchSecurities({
          dataset,
          symbols,
          start_date,
          end_date,
          limit,
        });

        const result = {
          dataset,
          symbols,
          date_range: {
            start: start_date,
            end: end_date || "open",
          },
          record_count: response.securities.length,
          securities: response.securities,
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

      case "reference_get_corporate_actions": {
        const { dataset, symbols, start_date, end_date, action_types } = args as {
          dataset: string;
          symbols: string;
          start_date: string;
          end_date?: string;
          action_types?: string[];
        };

        const response = await referenceClient.getCorporateActions({
          dataset,
          symbols,
          start_date,
          end_date,
          action_types,
        });

        const result = {
          dataset,
          symbols,
          date_range: {
            start: start_date,
            end: end_date || "open",
          },
          record_count: response.actions.length,
          action_types_filter: action_types || "all",
          corporate_actions: response.actions,
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

      case "reference_get_adjustments": {
        const { dataset, symbols, start_date, end_date } = args as {
          dataset: string;
          symbols: string;
          start_date: string;
          end_date?: string;
        };

        const response = await referenceClient.getAdjustmentFactors({
          dataset,
          symbols,
          start_date,
          end_date,
        });

        const result = {
          dataset,
          symbols,
          date_range: {
            start: start_date,
            end: end_date || "open",
          },
          record_count: response.adjustments.length,
          adjustments: response.adjustments,
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
