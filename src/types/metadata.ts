/**
 * TypeScript type definitions for Databento Metadata API
 */

/**
 * Dataset information
 */
export interface Dataset {
  dataset: string;
  description?: string;
}

/**
 * Schema information
 */
export interface Schema {
  schema: string;
  description?: string;
}

/**
 * Publisher information
 */
export interface Publisher {
  publisher_id: number;
  dataset: string;
  venue: string;
  description: string;
}

/**
 * Field information for a schema
 */
export interface Field {
  name: string;
  type: string;
  description?: string;
}

/**
 * Unit pricing information for a dataset
 */
export interface UnitPrice {
  mode: string;
  schema: string;
  unit_price: number;
  currency: string;
}

/**
 * Dataset date range information
 */
export interface DatasetRange {
  start_date: string;
  end_date: string;
  available_date: string;
}

/**
 * Dataset condition for a specific date
 */
export interface DatasetCondition {
  date: string;
  condition: "available" | "pending" | "missing" | "degraded";
  last_modified_date?: string;
  details?: string;
}

/**
 * Cost calculation result
 */
export interface Cost {
  dataset: string;
  symbols?: string[];
  schema: string;
  start: string;
  end?: string;
  mode: string;
  total_cost: number;
  total_records?: number;
  currency: string;
  billed?: boolean;
}

/**
 * Parameters for list_datasets
 */
export interface ListDatasetsParams {
  start_date?: string;
  end_date?: string;
}

/**
 * Parameters for list_schemas
 */
export interface ListSchemasParams {
  dataset: string;
}

/**
 * Parameters for list_fields
 */
export interface ListFieldsParams {
  schema: string;
  encoding?: string;
}

/**
 * Parameters for list_unit_prices
 */
export interface ListUnitPricesParams {
  dataset: string;
}

/**
 * Parameters for get_dataset_range
 */
export interface GetDatasetRangeParams {
  dataset: string;
}

/**
 * Parameters for get_dataset_condition
 */
export interface GetDatasetConditionParams {
  dataset: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Parameters for get_cost
 */
export interface GetCostParams {
  dataset: string;
  symbols?: string | string[];
  schema?: string;
  start: string;
  end?: string;
  mode?: string;
  stype_in?: string;
  stype_out?: string;
}
