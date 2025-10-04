/**
 * DataBento Reference API Client
 * Provides access to security master, corporate actions, and adjustment data
 */

import {
  SecurityRecord,
  SecuritySearchParams,
  SecuritySearchResponse,
  CorporateAction,
  CorporateActionsParams,
  CorporateActionsResponse,
  AdjustmentFactor,
  AdjustmentFactorsParams,
  AdjustmentFactorsResponse,
} from "../types/reference.js";
import { DataBentoHTTP, parseCSV } from "../http/databento-http.js";

/**
 * Reference API Client for DataBento
 */
export class ReferenceClient {
  private readonly http: DataBentoHTTP;

  constructor(apiKey: string) {
    this.http = new DataBentoHTTP(apiKey);
  }

  /**
   * Search security master database
   *
   * @param params Search parameters
   * @returns Security records matching the search criteria
   */
  async searchSecurities(params: SecuritySearchParams): Promise<SecuritySearchResponse> {
    const symbols = Array.isArray(params.symbols)
      ? params.symbols.join(",")
      : params.symbols;

    const requestParams = {
      dataset: params.dataset,
      symbols,
      stype_in: params.stype_in || "raw_symbol",
      start: params.start_date,
      end: params.end_date,
      limit: params.limit || 1000,
    };

    try {
      const response = await this.http.get("/v0/metadata.list_symbols", requestParams);
      const parsed = parseCSV(response);

      const securities: SecurityRecord[] = parsed.map((row) => ({
        instrument_id: parseInt(row.instrument_id || row.id) || 0,
        symbol: row.symbol || row.raw_symbol,
        dataset: params.dataset,
        stype: row.stype || "unknown",
        first_available: row.first_available || row.ts_start,
        last_available: row.last_available || row.ts_end,
        exchange: row.exchange || row.venue,
        asset_class: row.asset_class,
        description: row.description,
        isin: row.isin,
        currency: row.currency,
        contract_size: row.contract_size ? parseFloat(row.contract_size) : undefined,
        tick_size: row.tick_size ? parseFloat(row.tick_size) : undefined,
        expiration: row.expiration,
      }));

      return {
        securities,
        count: securities.length,
      };
    } catch (error) {
      throw new Error(`Failed to search securities: ${error}`);
    }
  }

  /**
   * Get corporate actions (dividends, splits, etc.)
   *
   * @param params Corporate actions query parameters
   * @returns Corporate action records
   */
  async getCorporateActions(
    params: CorporateActionsParams
  ): Promise<CorporateActionsResponse> {
    const symbols = Array.isArray(params.symbols)
      ? params.symbols.join(",")
      : params.symbols;

    const requestParams = {
      dataset: params.dataset,
      symbols,
      stype_in: params.stype_in || "raw_symbol",
      start: params.start_date,
      end: params.end_date,
      schema: "corporate_actions",
    };

    try {
      const response = await this.http.get("/v0/timeseries.get_range", requestParams);
      const parsed = parseCSV(response);

      const actions: CorporateAction[] = parsed.map((row) => ({
        instrument_id: parseInt(row.instrument_id) || 0,
        symbol: row.symbol || symbols.split(",")[0],
        dataset: params.dataset,
        action_type: row.action_type || row.type,
        effective_date: row.effective_date || row.ts_event,
        announcement_date: row.announcement_date,
        ex_date: row.ex_date,
        record_date: row.record_date,
        payment_date: row.payment_date,
        amount: row.amount ? parseFloat(row.amount) : undefined,
        currency: row.currency,
        split_ratio: row.split_ratio,
        split_factor: row.split_factor ? parseFloat(row.split_factor) : undefined,
        details: row.details,
      }));

      // Filter by action types if specified
      let filteredActions = actions;
      if (params.action_types && params.action_types.length > 0) {
        filteredActions = actions.filter((action) =>
          params.action_types!.includes(action.action_type)
        );
      }

      return {
        actions: filteredActions,
        count: filteredActions.length,
      };
    } catch (error) {
      throw new Error(`Failed to get corporate actions: ${error}`);
    }
  }

  /**
   * Get price adjustment factors
   *
   * @param params Adjustment factors query parameters
   * @returns Adjustment factor records
   */
  async getAdjustmentFactors(
    params: AdjustmentFactorsParams
  ): Promise<AdjustmentFactorsResponse> {
    const symbols = Array.isArray(params.symbols)
      ? params.symbols.join(",")
      : params.symbols;

    const requestParams = {
      dataset: params.dataset,
      symbols,
      stype_in: params.stype_in || "raw_symbol",
      start: params.start_date,
      end: params.end_date,
      schema: "adjustment",
    };

    try {
      const response = await this.http.get("/v0/timeseries.get_range", requestParams);
      const parsed = parseCSV(response);

      const adjustments: AdjustmentFactor[] = parsed.map((row) => ({
        instrument_id: parseInt(row.instrument_id) || 0,
        symbol: row.symbol || symbols.split(",")[0],
        dataset: params.dataset,
        effective_date: row.effective_date || row.ts_event,
        price_factor: parseFloat(row.price_factor || row.price_adj_factor || "1.0"),
        volume_factor: row.volume_factor ? parseFloat(row.volume_factor || row.volume_adj_factor) : undefined,
        reason: row.reason,
        action_type: row.action_type,
      }));

      return {
        adjustments,
        count: adjustments.length,
      };
    } catch (error) {
      throw new Error(`Failed to get adjustment factors: ${error}`);
    }
  }
}
