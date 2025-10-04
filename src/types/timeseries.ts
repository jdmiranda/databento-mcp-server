/**
 * Databento Timeseries API Type Definitions
 * Reference: https://databento.com/docs/api-reference-historical/timeseries
 */

/**
 * Databento data schemas
 * Reference: https://databento.com/docs/schemas-and-data-formats
 */
export enum Schema {
  // Market by Price (MBP) - Order book aggregated by price level
  MBP_1 = "mbp-1",       // Top of book (L1)
  MBP_10 = "mbp-10",     // 10 price levels (L2)

  // Market by Order (MBO) - Individual orders
  MBO = "mbo",

  // Trades
  TRADES = "trades",

  // OHLCV Bars
  OHLCV_1S = "ohlcv-1s",   // 1-second bars
  OHLCV_1M = "ohlcv-1m",   // 1-minute bars
  OHLCV_1H = "ohlcv-1h",   // 1-hour bars
  OHLCV_1D = "ohlcv-1d",   // Daily bars
  OHLCV_EOD = "ohlcv-eod", // End of day bars

  // Statistics
  STATISTICS = "statistics",

  // Definition
  DEFINITION = "definition",

  // Imbalance
  IMBALANCE = "imbalance",

  // Status
  STATUS = "status",
}

/**
 * Symbol type for input/output symbology
 * Reference: https://databento.com/docs/knowledge-base/symbology
 */
export enum SType {
  /** Raw symbol as provided by publisher */
  RAW_SYMBOL = "raw_symbol",

  /** Databento instrument ID (numeric) */
  INSTRUMENT_ID = "instrument_id",

  /** Continuous contract notation (e.g., ES.c.0) */
  CONTINUOUS = "continuous",

  /** Parent symbol for grouped instruments */
  PARENT = "parent",
}

/**
 * Encoding format for the response data
 */
export enum Encoding {
  /** Comma-separated values */
  CSV = "csv",

  /** JSON format */
  JSON = "json",

  /** Databento Binary Encoding (DBN) */
  DBN = "dbn",
}

/**
 * Request parameters for timeseries.get_range
 */
export interface TimeseriesGetRangeRequest {
  /** Dataset code (e.g., "GLBX.MDP3" for CME) */
  dataset: string;

  /** Instrument symbols (comma-separated or array) */
  symbols: string | string[];

  /** Data schema */
  schema: Schema | string;

  /** Start date (ISO 8601 or YYYY-MM-DD) */
  start: string;

  /** End date (ISO 8601 or YYYY-MM-DD), defaults to start date */
  end?: string;

  /** Input symbology type, defaults to "raw_symbol" */
  stype_in?: SType | string;

  /** Output symbology type, defaults to "instrument_id" */
  stype_out?: SType | string;

  /** Maximum number of records to return */
  limit?: number;

  /** Encoding format for response, defaults to "csv" */
  encoding?: Encoding | string;
}

/**
 * Response from timeseries.get_range
 */
export interface TimeseriesGetRangeResponse {
  /** Raw CSV or JSON data from API */
  data: string;

  /** Schema used for the data */
  schema: string;

  /** Number of records returned (parsed from CSV) */
  recordCount: number;

  /** Symbols requested */
  symbols: string[];

  /** Date range of the data */
  dateRange: {
    start: string;
    end: string;
  };
}

/**
 * Parsed CSV record (generic structure)
 * Actual fields depend on the schema
 */
export interface TimeseriesRecord {
  /** Event timestamp (nanoseconds) */
  ts_event: number;

  /** Record type */
  rtype: number;

  /** Publisher ID */
  publisher_id: number;

  /** Instrument ID */
  instrument_id: number;

  /** Additional fields vary by schema */
  [key: string]: any;
}

/**
 * MBP-1 (Market by Price Level 1) specific record
 */
export interface MBP1Record extends TimeseriesRecord {
  /** Best bid price (fixed precision, divide by 1e9) */
  bid_px_00: number;

  /** Best ask price (fixed precision, divide by 1e9) */
  ask_px_00: number;

  /** Best bid size */
  bid_sz_00: number;

  /** Best ask size */
  ask_sz_00: number;

  /** Best bid order count */
  bid_ct_00: number;

  /** Best ask order count */
  ask_ct_00: number;
}

/**
 * OHLCV record
 */
export interface OHLCVRecord extends TimeseriesRecord {
  /** Open price (fixed precision, divide by 1e9) */
  open: number;

  /** High price (fixed precision, divide by 1e9) */
  high: number;

  /** Low price (fixed precision, divide by 1e9) */
  low: number;

  /** Close price (fixed precision, divide by 1e9) */
  close: number;

  /** Volume */
  volume: number;
}

/**
 * Trade record
 */
export interface TradeRecord extends TimeseriesRecord {
  /** Trade price (fixed precision, divide by 1e9) */
  price: number;

  /** Trade size */
  size: number;

  /** Trade action */
  action: string;

  /** Trade side (buy/sell) */
  side: string;

  /** Trade flags */
  flags: number;

  /** Depth */
  depth: number;

  /** Sequence number */
  sequence: number;
}
