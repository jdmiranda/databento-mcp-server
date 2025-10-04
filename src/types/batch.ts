/**
 * Databento Batch API Types
 * Types for batch job submission, status, and download operations
 */

/**
 * Batch job states
 */
export type BatchJobState =
  | "received"    // Job received, pending validation
  | "queued"      // Job queued for processing
  | "processing"  // Job currently processing
  | "done"        // Job completed successfully
  | "expired";    // Job expired (files no longer available)

/**
 * Data encoding formats
 */
export type DataEncoding = "dbn" | "csv" | "json";

/**
 * Compression formats
 */
export type CompressionType = "none" | "zstd" | "gzip";

/**
 * Symbology types for input/output
 */
export type SymbologyType =
  | "instrument_id"
  | "raw_symbol"
  | "continuous"
  | "parent"
  | "nasdaq"
  | "cms"
  | "isin";

/**
 * Data schemas
 */
export type DataSchema =
  | "trades"
  | "tbbo"
  | "mbp-1"
  | "mbp-10"
  | "ohlcv-1s"
  | "ohlcv-1m"
  | "ohlcv-1h"
  | "ohlcv-1d"
  | "definition"
  | "statistics"
  | "status"
  | "imbalance";

/**
 * Request parameters for submitting a batch job
 */
export interface BatchJobRequest {
  // Required parameters
  dataset: string;           // Dataset code (e.g., "GLBX.MDP3")
  symbols: string[];         // List of symbols (up to 2,000)
  schema: DataSchema;        // Data record schema
  start: string;             // Start date (YYYY-MM-DD or ISO 8601)
  end?: string;              // End date (YYYY-MM-DD or ISO 8601), optional

  // Optional parameters
  encoding?: DataEncoding;   // Output encoding (default: dbn)
  compression?: CompressionType; // Compression type (default: zstd)
  stype_in?: SymbologyType;  // Input symbology type (default: raw_symbol)
  stype_out?: SymbologyType; // Output symbology type (default: instrument_id)

  // Splitting options
  split_duration?: string;   // Split files by duration (e.g., "day", "week", "month")
  split_size?: number;       // Split files by size in bytes
  split_symbols?: boolean;   // Split files by symbol (default: false)

  // Advanced options
  limit?: number;            // Limit number of records
  ts_out?: boolean;          // Include additional timestamps (default: false)
}

/**
 * Batch job information response
 */
export interface BatchJobInfo {
  id: string;                // Unique job identifier
  user_id: string;           // User ID who submitted the job
  bill_id: string;           // Billing account ID
  cost_usd: string;          // Job cost in USD
  dataset: string;           // Dataset code
  symbols: string[];         // Symbol list
  stype_in: SymbologyType;   // Input symbology type
  stype_out: SymbologyType;  // Output symbology type
  schema: DataSchema;        // Data schema
  start: string;             // Start timestamp (ISO 8601)
  end: string;               // End timestamp (ISO 8601)
  limit?: number;            // Record limit if specified
  encoding: DataEncoding;    // Output encoding
  compression: CompressionType; // Compression type
  split_duration?: string;   // Split duration if specified
  split_size?: number;       // Split size if specified
  split_symbols: boolean;    // Whether split by symbols
  ts_out: boolean;           // Whether additional timestamps included
  state: BatchJobState;      // Current job state
  ts_received: string;       // When job was received (ISO 8601)
  ts_queued?: string;        // When job was queued (ISO 8601)
  ts_process_start?: string; // When processing started (ISO 8601)
  ts_process_done?: string;  // When processing completed (ISO 8601)
  ts_expiration?: string;    // When job expires (ISO 8601)
  record_count?: number;     // Total records in job
  file_count?: number;       // Number of output files
  total_size?: number;       // Total size in bytes
  package_hash?: string;     // Hash of the complete package
}

/**
 * Job list filter parameters
 */
export interface ListJobsParams {
  states?: BatchJobState[];  // Filter by job states
  since?: string;            // Filter jobs since timestamp (ISO 8601)
}

/**
 * Download information for a batch job
 */
export interface BatchDownloadInfo {
  id: string;                // Job ID
  state: BatchJobState;      // Job state
  download_url?: string;     // Download URL (if state is "done")
  filenames?: string[];      // List of available files
  total_size?: number;       // Total download size in bytes
  ts_expiration?: string;    // When download expires
  record_count?: number;     // Total records
  file_count?: number;       // Number of files
}

/**
 * Result from download operation
 */
export interface BatchDownloadResult {
  job_id: string;            // Job ID
  state: BatchJobState;      // Current job state
  message: string;           // Status message
  download_info?: BatchDownloadInfo; // Download details if available
  error?: string;            // Error message if failed
}
