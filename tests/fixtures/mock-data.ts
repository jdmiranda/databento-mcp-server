/**
 * Mock data generators for testing
 * Uses faker for realistic test data generation
 */

import { faker } from "@faker-js/faker";
import type {
  BatchJobInfo,
  BatchJobRequest,
  BatchJobState,
} from "../../src/types/batch.js";
import type {
  SymbologyResolveRequest,
  SymbologyResolveResponse,
  SymbolType,
} from "../../src/types/symbology.js";
import type {
  SecurityRecord,
  CorporateAction,
  AdjustmentFactor,
} from "../../src/types/reference.js";

/**
 * Generate a mock batch job request
 */
export function generateBatchJobRequest(
  overrides?: Partial<BatchJobRequest>
): BatchJobRequest {
  return {
    dataset: overrides?.dataset || "GLBX.MDP3",
    symbols: overrides?.symbols || ["ES.FUT", "NQ.FUT"],
    schema: overrides?.schema || "ohlcv-1m",
    start: overrides?.start || "2024-01-01",
    end: overrides?.end,
    encoding: overrides?.encoding,
    compression: overrides?.compression,
    stype_in: overrides?.stype_in,
    stype_out: overrides?.stype_out,
    split_duration: overrides?.split_duration,
    split_size: overrides?.split_size,
    split_symbols: overrides?.split_symbols,
    limit: overrides?.limit,
    ts_out: overrides?.ts_out,
  };
}

/**
 * Generate a mock batch job info
 */
export function generateBatchJobInfo(
  overrides?: Partial<BatchJobInfo>
): BatchJobInfo {
  const jobId = overrides?.id || faker.string.uuid();
  const state: BatchJobState = overrides?.state || "done";

  return {
    id: jobId,
    user_id: overrides?.user_id || faker.string.uuid(),
    bill_id: overrides?.bill_id || faker.string.uuid(),
    cost_usd: overrides?.cost_usd || faker.finance.amount({ min: 0, max: 100, dec: 2 }),
    dataset: overrides?.dataset || "GLBX.MDP3",
    symbols: overrides?.symbols || ["ES.FUT", "NQ.FUT"],
    stype_in: overrides?.stype_in || "raw_symbol",
    stype_out: overrides?.stype_out || "instrument_id",
    schema: overrides?.schema || "ohlcv-1m",
    start: overrides?.start || "2024-01-01T00:00:00Z",
    end: overrides?.end || "2024-01-31T23:59:59Z",
    limit: overrides?.limit,
    encoding: overrides?.encoding || "dbn",
    compression: overrides?.compression || "zstd",
    split_duration: overrides?.split_duration,
    split_size: overrides?.split_size,
    split_symbols: overrides?.split_symbols || false,
    ts_out: overrides?.ts_out || false,
    state,
    ts_received: overrides?.ts_received || "2024-01-01T00:00:00Z",
    ts_queued: overrides?.ts_queued || (state !== "received" ? "2024-01-01T00:01:00Z" : undefined),
    ts_process_start:
      overrides?.ts_process_start || (state === "processing" || state === "done" ? "2024-01-01T00:02:00Z" : undefined),
    ts_process_done:
      overrides?.ts_process_done || (state === "done" ? "2024-01-01T00:10:00Z" : undefined),
    ts_expiration:
      overrides?.ts_expiration || (state === "done" ? "2024-02-01T00:00:00Z" : undefined),
    record_count: overrides?.record_count || (state === "done" ? 10000 : undefined),
    file_count: overrides?.file_count || (state === "done" ? 1 : undefined),
    total_size: overrides?.total_size || (state === "done" ? 1024000 : undefined),
    package_hash: overrides?.package_hash,
  };
}

/**
 * Generate a mock symbology resolve request
 */
export function generateSymbologyRequest(
  overrides?: Partial<SymbologyResolveRequest>
): SymbologyResolveRequest {
  return {
    dataset: overrides?.dataset || "GLBX.MDP3",
    symbols: overrides?.symbols || ["ES.c.0", "NQ.c.0"],
    stype_in: overrides?.stype_in || "continuous",
    stype_out: overrides?.stype_out || "instrument_id",
    start_date: overrides?.start_date || "2024-01-01",
    end_date: overrides?.end_date,
  };
}

/**
 * Generate a mock symbology resolve response
 */
export function generateSymbologyResponse(
  symbols: string[],
  overrides?: Partial<SymbologyResolveResponse>
): SymbologyResolveResponse {
  const mappings: Record<string, string | string[]> = {};
  symbols.forEach((symbol) => {
    mappings[symbol] = `${faker.number.int({ min: 1000, max: 9999 })}`;
  });

  return {
    result: overrides?.result || "success",
    mappings: overrides?.mappings || mappings,
    error: overrides?.error,
  };
}

/**
 * Generate a mock security record
 */
export function generateSecurityRecord(
  overrides?: Partial<SecurityRecord>
): SecurityRecord {
  return {
    instrument_id: overrides?.instrument_id || faker.number.int({ min: 1000, max: 999999 }),
    symbol: overrides?.symbol || faker.string.alpha({ length: 4 }).toUpperCase(),
    dataset: overrides?.dataset || "GLBX.MDP3",
    stype: overrides?.stype || "FUTURE",
    first_available: overrides?.first_available || "2024-01-01T00:00:00Z",
    last_available: overrides?.last_available || "2024-12-31T23:59:59Z",
    exchange: overrides?.exchange || "CME",
    asset_class: overrides?.asset_class || "Index",
    description: overrides?.description || faker.company.name(),
    isin: overrides?.isin,
    currency: overrides?.currency || "USD",
    contract_size: overrides?.contract_size,
    tick_size: overrides?.tick_size,
    expiration: overrides?.expiration,
  };
}

/**
 * Generate a mock corporate action
 */
export function generateCorporateAction(
  overrides?: Partial<CorporateAction>
): CorporateAction {
  const actionType = overrides?.action_type || "DIVIDEND";

  return {
    instrument_id: overrides?.instrument_id || faker.number.int({ min: 1000, max: 999999 }),
    symbol: overrides?.symbol || faker.string.alpha({ length: 4 }).toUpperCase(),
    dataset: overrides?.dataset || "GLBX.MDP3",
    action_type: actionType,
    effective_date: overrides?.effective_date || "2024-06-15T00:00:00Z",
    announcement_date: overrides?.announcement_date,
    ex_date: overrides?.ex_date,
    record_date: overrides?.record_date,
    payment_date: overrides?.payment_date,
    amount: overrides?.amount || (actionType === "DIVIDEND" ? parseFloat(faker.finance.amount({ min: 0.1, max: 5, dec: 2 })) : undefined),
    currency: overrides?.currency || "USD",
    split_ratio: overrides?.split_ratio || (actionType === "SPLIT" ? "2:1" : undefined),
    split_factor: overrides?.split_factor || (actionType === "SPLIT" ? 2.0 : undefined),
    details: overrides?.details,
  };
}

/**
 * Generate a mock adjustment factor
 */
export function generateAdjustmentFactor(
  overrides?: Partial<AdjustmentFactor>
): AdjustmentFactor {
  return {
    instrument_id: overrides?.instrument_id || faker.number.int({ min: 1000, max: 999999 }),
    symbol: overrides?.symbol || faker.string.alpha({ length: 4 }).toUpperCase(),
    dataset: overrides?.dataset || "GLBX.MDP3",
    effective_date: overrides?.effective_date || "2024-06-15T00:00:00Z",
    price_factor: overrides?.price_factor || 1.0,
    volume_factor: overrides?.volume_factor,
    reason: overrides?.reason || "DIVIDEND",
    action_type: overrides?.action_type || "DIVIDEND",
  };
}

/**
 * Generate CSV response from array of objects
 */
export function generateCSVResponse(data: Record<string, any>[]): string {
  if (data.length === 0) {
    return "";
  }

  const headers = Object.keys(data[0]);
  const headerRow = headers.join(",");
  const dataRows = data.map((row) =>
    headers.map((header) => row[header] || "").join(",")
  );

  return [headerRow, ...dataRows].join("\n");
}

/**
 * Generate JSON response
 */
export function generateJSONResponse(data: any): string {
  return JSON.stringify(data);
}
