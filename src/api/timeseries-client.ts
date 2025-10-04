/**
 * Databento Timeseries API Client
 * Provides access to historical market data streaming via timeseries.get_range
 */

import { DataBentoHTTP, parseCSV } from "../http/databento-http.js";
import {
  TimeseriesGetRangeRequest,
  TimeseriesGetRangeResponse,
  Schema,
  SType,
  Encoding,
} from "../types/timeseries.js";

/**
 * Timeseries API Client
 * Handles historical data retrieval with various schemas and date ranges
 */
export class TimeseriesClient {
  private readonly http: DataBentoHTTP;

  constructor(http: DataBentoHTTP) {
    this.http = http;
  }

  /**
   * Get historical market data for a date range
   *
   * @param request - Timeseries request parameters
   * @returns Response with CSV data and metadata
   *
   * @example
   * ```typescript
   * const response = await client.getRange({
   *   dataset: "GLBX.MDP3",
   *   symbols: ["ES.c.0", "NQ.c.0"],
   *   schema: Schema.OHLCV_1H,
   *   start: "2024-01-01",
   *   end: "2024-01-31",
   *   stype_in: SType.CONTINUOUS,
   *   stype_out: SType.INSTRUMENT_ID,
   *   limit: 1000
   * });
   * ```
   */
  async getRange(
    request: TimeseriesGetRangeRequest
  ): Promise<TimeseriesGetRangeResponse> {
    // Validate required parameters
    this.validateRequest(request);

    // Convert symbols array to comma-separated string if needed
    const symbols = Array.isArray(request.symbols)
      ? request.symbols.join(",")
      : request.symbols;

    // Format dates to YYYY-MM-DD
    const start = this.formatDate(request.start);
    const end = request.end ? this.formatDate(request.end) : start;

    // Build API parameters
    const params: Record<string, any> = {
      dataset: request.dataset,
      symbols,
      schema: request.schema,
      start,
      end,
      stype_in: request.stype_in || SType.RAW_SYMBOL,
      stype_out: request.stype_out || SType.INSTRUMENT_ID,
    };

    // Add optional parameters
    if (request.limit !== undefined) {
      params.limit = request.limit;
    }

    if (request.encoding !== undefined) {
      params.encoding = request.encoding;
    }

    // Make API request
    const response = await this.http.get("/v0/timeseries.get_range", params);

    if (!response || response.length === 0) {
      throw new Error(
        `No data available for symbols: ${symbols} in date range: ${start} to ${end}`
      );
    }

    // Parse CSV to count records
    const lines = response.trim().split("\n");
    const recordCount = Math.max(0, lines.length - 1); // Exclude header

    return {
      data: response,
      schema: String(request.schema),
      recordCount,
      symbols: Array.isArray(request.symbols)
        ? request.symbols
        : [request.symbols],
      dateRange: {
        start,
        end,
      },
    };
  }

  /**
   * Validate timeseries request parameters
   */
  private validateRequest(request: TimeseriesGetRangeRequest): void {
    if (!request.dataset) {
      throw new Error("dataset is required");
    }

    if (!request.symbols || (Array.isArray(request.symbols) && request.symbols.length === 0)) {
      throw new Error("symbols is required and cannot be empty");
    }

    if (!request.schema) {
      throw new Error("schema is required");
    }

    if (!request.start) {
      throw new Error("start date is required");
    }

    // Validate date format
    try {
      this.formatDate(request.start);
      if (request.end) {
        this.formatDate(request.end);
      }
    } catch (error) {
      throw new Error(`Invalid date format: ${error}`);
    }

    // Validate limit if provided
    if (request.limit !== undefined && request.limit < 1) {
      throw new Error("limit must be greater than 0");
    }

    // Validate symbols count (API limit is 2000)
    const symbolCount = Array.isArray(request.symbols)
      ? request.symbols.length
      : request.symbols.split(",").length;

    if (symbolCount > 2000) {
      throw new Error("Maximum 2000 symbols allowed per request");
    }
  }

  /**
   * Format date string to YYYY-MM-DD
   * Accepts ISO 8601 or YYYY-MM-DD format
   */
  private formatDate(dateStr: string): string {
    // If already in YYYY-MM-DD format, return as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Try to parse as ISO 8601 or other format
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    // Format to YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  /**
   * Parse CSV response to typed objects
   * Returns generic record objects - caller should cast to specific schema type
   */
  parseCSVResponse(csvText: string): Record<string, string>[] {
    return parseCSV(csvText);
  }

  /**
   * Helper: Get available schemas
   */
  static getAvailableSchemas(): Schema[] {
    return Object.values(Schema);
  }

  /**
   * Helper: Get available symbol types
   */
  static getAvailableSymbolTypes(): SType[] {
    return Object.values(SType);
  }

  /**
   * Helper: Get available encoding formats
   */
  static getAvailableEncodings(): Encoding[] {
    return Object.values(Encoding);
  }
}
