import { faker } from '@faker-js/faker';

/**
 * Test Utilities for Databento MCP Server
 *
 * Provides helpers for mocking, assertions, and HTTP response building.
 */

/**
 * Generate a mock Databento API key
 */
export function mockApiKey(): string {
  return `db-${faker.string.alphanumeric(32)}`;
}

/**
 * Generate a mock environment with API key
 */
export function mockEnv(apiKey?: string): NodeJS.ProcessEnv {
  return {
    ...process.env,
    DATABENTO_API_KEY: apiKey || mockApiKey(),
  };
}

/**
 * Build a successful HTTP response for testing
 */
export function buildSuccessResponse<T>(data: T, statusCode = 200): {
  statusCode: number;
  data: T;
} {
  return {
    statusCode,
    data,
  };
}

/**
 * Build an error HTTP response for testing
 */
export function buildErrorResponse(
  message: string,
  statusCode: number = 500,
  code?: string
): {
  statusCode: number;
  error: {
    message: string;
    code?: string;
  };
} {
  return {
    statusCode,
    error: {
      message,
      ...(code && { code }),
    },
  };
}

/**
 * Build a CSV response from rows
 */
export function buildCSVResponse(headers: string[], rows: string[][]): string {
  const headerLine = headers.join(',');
  const dataLines = rows.map(row => row.join(',')).join('\n');
  return `${headerLine}\n${dataLines}`;
}

/**
 * Build a mock MBP-1 (Market by Price) CSV response
 */
export function buildMBP1Response(rows: {
  ts_event: string;
  symbol: string;
  bid_px: number;
  ask_px: number;
  bid_sz: number;
  ask_sz: number;
}[]): string {
  const headers = ['ts_event', 'symbol', 'bid_px_00', 'ask_px_00', 'bid_sz_00', 'ask_sz_00'];
  const dataRows = rows.map(row => [
    row.ts_event,
    row.symbol,
    row.bid_px.toString(),
    row.ask_px.toString(),
    row.bid_sz.toString(),
    row.ask_sz.toString(),
  ]);
  return buildCSVResponse(headers, dataRows);
}

/**
 * Build a mock OHLCV CSV response
 */
export function buildOHLCVResponse(rows: {
  ts_event: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}[]): string {
  const headers = ['ts_event', 'symbol', 'open', 'high', 'low', 'close', 'volume'];
  const dataRows = rows.map(row => [
    row.ts_event,
    row.symbol,
    row.open.toString(),
    row.high.toString(),
    row.low.toString(),
    row.close.toString(),
    row.volume.toString(),
  ]);
  return buildCSVResponse(headers, dataRows);
}

/**
 * Build a mock trades CSV response
 */
export function buildTradesResponse(rows: {
  ts_event: string;
  symbol: string;
  price: number;
  size: number;
  side: string;
}[]): string {
  const headers = ['ts_event', 'symbol', 'price', 'size', 'side'];
  const dataRows = rows.map(row => [
    row.ts_event,
    row.symbol,
    row.price.toString(),
    row.size.toString(),
    row.side,
  ]);
  return buildCSVResponse(headers, dataRows);
}

/**
 * Wait for a specified duration (for async testing)
 */
export async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert that a value is defined (not null or undefined)
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message || 'Expected value to be defined');
  }
}

/**
 * Assert that a value is a valid ISO 8601 date string
 */
export function assertValidISODate(date: string, message?: string): void {
  const iso8601Regex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?)?$/;
  if (!iso8601Regex.test(date)) {
    throw new Error(message || `Expected valid ISO 8601 date, got: ${date}`);
  }
}

/**
 * Assert that a value is within a numeric range
 */
export function assertInRange(
  value: number,
  min: number,
  max: number,
  message?: string
): void {
  if (value < min || value > max) {
    throw new Error(
      message || `Expected value to be between ${min} and ${max}, got: ${value}`
    );
  }
}

/**
 * Generate random market data for testing
 */
export function generateMarketData(count: number = 10): {
  ts_event: string;
  symbol: string;
  bid_px: number;
  ask_px: number;
  bid_sz: number;
  ask_sz: number;
}[] {
  return Array.from({ length: count }, () => {
    const basePrice = faker.number.float({ min: 4000, max: 5000, multipleOf: 0.25 });
    return {
      ts_event: faker.date.recent().toISOString(),
      symbol: faker.helpers.arrayElement(['ESH5', 'NQH5', 'YMH5', 'RTYM5']),
      bid_px: basePrice - 0.25,
      ask_px: basePrice + 0.25,
      bid_sz: faker.number.int({ min: 1, max: 100 }),
      ask_sz: faker.number.int({ min: 1, max: 100 }),
    };
  });
}

/**
 * Generate random OHLCV data for testing
 */
export function generateOHLCVData(count: number = 10): {
  ts_event: string;
  symbol: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}[] {
  return Array.from({ length: count }, () => {
    const open = faker.number.float({ min: 4000, max: 5000, multipleOf: 0.25 });
    const close = faker.number.float({ min: 4000, max: 5000, multipleOf: 0.25 });
    const high = Math.max(open, close) + faker.number.float({ min: 0, max: 50, multipleOf: 0.25 });
    const low = Math.min(open, close) - faker.number.float({ min: 0, max: 50, multipleOf: 0.25 });

    return {
      ts_event: faker.date.recent().toISOString(),
      symbol: faker.helpers.arrayElement(['ESH5', 'NQH5', 'YMH5', 'RTYM5']),
      open,
      high,
      low,
      close,
      volume: faker.number.int({ min: 1000, max: 1000000 }),
    };
  });
}
