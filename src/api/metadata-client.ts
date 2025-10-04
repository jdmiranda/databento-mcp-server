/**
 * Databento Metadata API Client
 * Provides access to dataset metadata, schemas, publishers, pricing, and cost calculation
 */

import { DataBentoHTTP, parseJSON } from "../http/databento-http.js";
import {
  Dataset,
  Schema,
  Publisher,
  Field,
  UnitPrice,
  DatasetRange,
  DatasetCondition,
  Cost,
  ListDatasetsParams,
  ListSchemasParams,
  ListFieldsParams,
  ListUnitPricesParams,
  GetDatasetRangeParams,
  GetDatasetConditionParams,
  GetCostParams,
} from "../types/metadata.js";

/**
 * Metadata API Client
 */
export class MetadataClient {
  private readonly http: DataBentoHTTP;

  constructor(http: DataBentoHTTP) {
    this.http = http;
  }

  /**
   * List all available datasets
   *
   * @param params - Optional date range filters
   * @returns Array of dataset codes
   */
  async listDatasets(params?: ListDatasetsParams): Promise<string[]> {
    const queryParams: Record<string, any> = {};

    if (params?.start_date) {
      queryParams.start_date = params.start_date;
    }
    if (params?.end_date) {
      queryParams.end_date = params.end_date;
    }

    const response = await this.http.get("/v0/metadata.list_datasets", queryParams);
    const data = parseJSON<string[]>(response);

    return data;
  }

  /**
   * List available schemas for a dataset
   *
   * @param params - Dataset parameters
   * @returns Array of schema names
   */
  async listSchemas(params: ListSchemasParams): Promise<string[]> {
    const response = await this.http.get("/v0/metadata.list_schemas", {
      dataset: params.dataset,
    });

    const data = parseJSON<string[]>(response);
    return data;
  }

  /**
   * List publishers for a dataset
   *
   * @param dataset - Optional dataset code to filter by
   * @returns Array of publisher information
   */
  async listPublishers(dataset?: string): Promise<Publisher[]> {
    const params = dataset ? { dataset } : {};
    const response = await this.http.get("/v0/metadata.list_publishers", params);

    const data = parseJSON<Publisher[]>(response);
    return data;
  }

  /**
   * List fields for a specific schema
   *
   * @param params - Schema and encoding parameters
   * @returns Array of field information
   */
  async listFields(params: ListFieldsParams): Promise<Field[]> {
    const queryParams: Record<string, any> = {
      schema: params.schema,
    };

    if (params.encoding) {
      queryParams.encoding = params.encoding;
    }

    const response = await this.http.get("/v0/metadata.list_fields", queryParams);
    const data = parseJSON<Field[]>(response);

    return data;
  }

  /**
   * Get unit prices for a dataset
   *
   * @param params - Dataset parameters
   * @returns Array of unit pricing information
   */
  async listUnitPrices(params: ListUnitPricesParams): Promise<UnitPrice[]> {
    const response = await this.http.get("/v0/metadata.list_unit_prices", {
      dataset: params.dataset,
    });

    const data = parseJSON<UnitPrice[]>(response);
    return data;
  }

  /**
   * Get the available date range for a dataset
   *
   * @param params - Dataset parameters
   * @returns Dataset date range information
   */
  async getDatasetRange(params: GetDatasetRangeParams): Promise<DatasetRange> {
    const response = await this.http.get("/v0/metadata.get_dataset_range", {
      dataset: params.dataset,
    });

    const data = parseJSON<DatasetRange>(response);
    return data;
  }

  /**
   * Check data availability/condition for a dataset
   *
   * @param params - Dataset and optional date range
   * @returns Array of dataset conditions per date
   */
  async getDatasetCondition(
    params: GetDatasetConditionParams
  ): Promise<DatasetCondition[]> {
    const queryParams: Record<string, any> = {
      dataset: params.dataset,
    };

    if (params.start_date) {
      queryParams.start_date = params.start_date;
    }
    if (params.end_date) {
      queryParams.end_date = params.end_date;
    }

    const response = await this.http.get("/v0/metadata.get_dataset_condition", queryParams);
    const data = parseJSON<DatasetCondition[]>(response);

    return data;
  }

  /**
   * Calculate the cost for a data query
   *
   * @param params - Query parameters for cost calculation
   * @returns Cost information in USD
   */
  async getCost(params: GetCostParams): Promise<Cost> {
    const queryParams: Record<string, any> = {
      dataset: params.dataset,
      start: params.start,
    };

    // Optional parameters
    if (params.end) {
      queryParams.end = params.end;
    }
    if (params.symbols) {
      // Handle both string and array of strings
      queryParams.symbols = Array.isArray(params.symbols)
        ? params.symbols.join(",")
        : params.symbols;
    }
    if (params.schema) {
      queryParams.schema = params.schema;
    }
    if (params.mode) {
      queryParams.mode = params.mode;
    }
    if (params.stype_in) {
      queryParams.stype_in = params.stype_in;
    }
    if (params.stype_out) {
      queryParams.stype_out = params.stype_out;
    }

    const response = await this.http.get("/v0/metadata.get_cost", queryParams);
    const data = parseJSON<Cost>(response);

    return data;
  }
}
