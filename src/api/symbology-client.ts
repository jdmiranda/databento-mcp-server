/**
 * Symbology API Client
 * Handles symbol resolution and mapping operations
 *
 * @see https://databento.com/docs/api-reference-historical/symbology/resolve
 */

import { DataBentoHTTP, parseJSON } from "../http/databento-http.js";
import {
  SymbologyResolveRequest,
  SymbologyResolveResponse,
  SymbolType,
} from "../types/symbology.js";

/**
 * Client for Databento Historical Symbology API
 */
export class SymbologyClient {
  private readonly http: DataBentoHTTP;

  constructor(apiKey: string) {
    this.http = new DataBentoHTTP(apiKey);
  }

  /**
   * Resolve symbols to instrument IDs or other symbol types
   *
   * @param request - Symbology resolution parameters
   * @returns Map of input symbols to output symbols
   *
   * @example
   * ```ts
   * const client = new SymbologyClient(apiKey);
   * const result = await client.resolve({
   *   dataset: "GLBX.MDP3",
   *   symbols: ["ES.c.0", "NQ.c.0"],
   *   stype_in: SymbolType.Continuous,
   *   stype_out: SymbolType.InstrumentId,
   *   start_date: "2024-01-01",
   *   end_date: "2024-01-31",
   * });
   * ```
   */
  async resolve(
    request: SymbologyResolveRequest
  ): Promise<SymbologyResolveResponse> {
    this.validateRequest(request);

    // Databento recommends using POST for symbology.resolve
    // to avoid URL length limits with many symbols
    const endpoint = "/v0/symbology.resolve";

    // Build request body
    const requestBody: Record<string, any> = {
      dataset: request.dataset,
      symbols: Array.isArray(request.symbols)
        ? request.symbols.join(",")
        : request.symbols,
      stype_in: request.stype_in,
      stype_out: request.stype_out,
      start_date: request.start_date,
    };

    // Add optional end_date if provided
    if (request.end_date) {
      requestBody.end_date = request.end_date;
    }

    try {
      const response = await this.http.post(endpoint, requestBody);
      return this.parseResponse(response);
    } catch (error) {
      throw new Error(`Symbology resolution failed: ${error}`);
    }
  }

  /**
   * Validate symbology resolution request
   */
  private validateRequest(request: SymbologyResolveRequest): void {
    if (!request.dataset) {
      throw new Error("dataset is required");
    }

    if (!request.symbols || request.symbols.length === 0) {
      throw new Error("symbols array cannot be empty");
    }

    if (request.symbols.length > 2000) {
      throw new Error(
        `Too many symbols: ${request.symbols.length}. Maximum is 2000.`
      );
    }

    if (!request.stype_in) {
      throw new Error("stype_in is required");
    }

    if (!request.stype_out) {
      throw new Error("stype_out is required");
    }

    if (!request.start_date) {
      throw new Error("start_date is required");
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(request.start_date)) {
      throw new Error(
        `Invalid start_date format: ${request.start_date}. Expected YYYY-MM-DD`
      );
    }

    if (request.end_date && !dateRegex.test(request.end_date)) {
      throw new Error(
        `Invalid end_date format: ${request.end_date}. Expected YYYY-MM-DD`
      );
    }
  }

  /**
   * Parse symbology API response
   */
  private parseResponse(responseText: string): SymbologyResolveResponse {
    try {
      const data = parseJSON<any>(responseText);

      // Handle different response formats from Databento API
      // The API returns a map of input symbols to resolution results
      const mappings: Record<string, string | string[]> = {};

      // Process the response data
      if (data && typeof data === "object") {
        Object.entries(data).forEach(([inputSymbol, resolutions]) => {
          if (Array.isArray(resolutions)) {
            // Multiple resolutions (e.g., symbol changed over time)
            const outputSymbols = resolutions.map((r: any) => {
              if (typeof r === "string") {
                return r;
              } else if (r && typeof r === "object" && "s" in r) {
                return r.s;
              }
              return String(r);
            });
            mappings[inputSymbol] =
              outputSymbols.length === 1 ? outputSymbols[0] : outputSymbols;
          } else if (typeof resolutions === "string") {
            // Single resolution
            mappings[inputSymbol] = resolutions;
          } else if (resolutions && typeof resolutions === "object") {
            // Object with symbol field
            if ("s" in resolutions) {
              mappings[inputSymbol] = String(resolutions.s);
            } else {
              mappings[inputSymbol] = JSON.stringify(resolutions);
            }
          }
        });
      }

      return {
        result: "success",
        mappings,
      };
    } catch (error) {
      return {
        result: "error",
        mappings: {},
        error: `Failed to parse symbology response: ${error}`,
      };
    }
  }
}
