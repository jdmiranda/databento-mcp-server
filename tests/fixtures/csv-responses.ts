/**
 * Sample Databento CSV Response Fixtures
 *
 * These fixtures represent realistic responses from the Databento API
 * for use in unit and integration tests.
 */

/**
 * Sample MBP-1 (Market by Price - Level 1) response
 * Used for top-of-book market data (best bid/ask)
 */
export const SAMPLE_MBP1_RESPONSE = `ts_event,symbol,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00
2024-03-15T14:30:00.123456789Z,ESH5,5245.75,5246.00,25,30
2024-03-15T14:30:01.234567890Z,ESH5,5245.50,5246.00,35,30
2024-03-15T14:30:02.345678901Z,ESH5,5245.75,5246.25,20,25
2024-03-15T14:30:03.456789012Z,ESH5,5246.00,5246.25,40,25
2024-03-15T14:30:04.567890123Z,ESH5,5246.00,5246.50,40,35`;

/**
 * Sample OHLCV (Open, High, Low, Close, Volume) response
 * Used for historical bar data
 */
export const SAMPLE_OHLCV_RESPONSE = `ts_event,symbol,open,high,low,close,volume
2024-03-15T09:30:00.000000000Z,ESH5,5230.25,5235.50,5228.75,5234.00,125430
2024-03-15T10:30:00.000000000Z,ESH5,5234.00,5240.75,5232.50,5238.25,98765
2024-03-15T11:30:00.000000000Z,ESH5,5238.25,5245.00,5236.50,5243.75,112340
2024-03-15T12:30:00.000000000Z,ESH5,5243.75,5248.50,5241.25,5245.50,87654
2024-03-15T13:30:00.000000000Z,ESH5,5245.50,5250.25,5244.00,5246.75,95432`;

/**
 * Sample trades response
 * Used for individual trade execution data
 */
export const SAMPLE_TRADES_RESPONSE = `ts_event,symbol,price,size,side
2024-03-15T14:30:00.123456789Z,ESH5,5245.75,5,B
2024-03-15T14:30:00.234567890Z,ESH5,5245.75,10,B
2024-03-15T14:30:00.345678901Z,ESH5,5246.00,3,S
2024-03-15T14:30:00.456789012Z,ESH5,5245.50,8,S
2024-03-15T14:30:00.567890123Z,ESH5,5246.00,15,B
2024-03-15T14:30:00.678901234Z,ESH5,5246.25,7,B
2024-03-15T14:30:00.789012345Z,ESH5,5246.00,12,S
2024-03-15T14:30:00.890123456Z,ESH5,5245.75,20,S`;

/**
 * Sample NQ (Nasdaq) MBP-1 response
 */
export const SAMPLE_NQ_MBP1_RESPONSE = `ts_event,symbol,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00
2024-03-15T14:30:00.123456789Z,NQH5,18345.25,18345.50,15,20
2024-03-15T14:30:01.234567890Z,NQH5,18345.00,18345.50,25,20
2024-03-15T14:30:02.345678901Z,NQH5,18345.25,18345.75,18,22
2024-03-15T14:30:03.456789012Z,NQH5,18345.50,18345.75,30,22
2024-03-15T14:30:04.567890123Z,NQH5,18345.50,18346.00,30,28`;

/**
 * Sample multi-symbol response
 */
export const SAMPLE_MULTI_SYMBOL_RESPONSE = `ts_event,symbol,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00
2024-03-15T14:30:00.123456789Z,ESH5,5245.75,5246.00,25,30
2024-03-15T14:30:00.123456789Z,NQH5,18345.25,18345.50,15,20
2024-03-15T14:30:01.234567890Z,ESH5,5245.50,5246.00,35,30
2024-03-15T14:30:01.234567890Z,NQH5,18345.00,18345.50,25,20
2024-03-15T14:30:02.345678901Z,ESH5,5245.75,5246.25,20,25
2024-03-15T14:30:02.345678901Z,NQH5,18345.25,18345.75,18,22`;

/**
 * Empty response (no data available)
 */
export const EMPTY_CSV_RESPONSE = `ts_event,symbol,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00`;

/**
 * Sample dataset list response (JSON)
 */
export const SAMPLE_DATASETS_JSON = [
  {
    dataset: 'GLBX.MDP3',
    description: 'CME Globex MDP 3.0',
    start_date: '2020-01-01',
    end_date: '2024-03-15',
  },
  {
    dataset: 'XNAS.ITCH',
    description: 'Nasdaq TotalView-ITCH',
    start_date: '2019-01-01',
    end_date: '2024-03-15',
  },
  {
    dataset: 'DBEQ.BASIC',
    description: 'Databento Equities Basic',
    start_date: '2020-01-01',
    end_date: '2024-03-15',
  },
];

/**
 * Sample schema list response (JSON)
 */
export const SAMPLE_SCHEMAS_JSON = [
  {
    schema: 'mbp-1',
    description: 'Market by Price - Level 1 (top of book)',
    encoding: 'csv',
  },
  {
    schema: 'mbp-10',
    description: 'Market by Price - Level 10',
    encoding: 'csv',
  },
  {
    schema: 'ohlcv-1h',
    description: 'OHLCV 1-hour bars',
    encoding: 'csv',
  },
  {
    schema: 'ohlcv-1d',
    description: 'OHLCV daily bars',
    encoding: 'csv',
  },
  {
    schema: 'trades',
    description: 'Individual trade executions',
    encoding: 'csv',
  },
];

/**
 * Sample symbology resolution response (JSON)
 */
export const SAMPLE_SYMBOLOGY_JSON = {
  result: {
    'ESH5': {
      native: 'ESH5',
      continuous: 'ES.c.0',
      parent: 'ES',
    },
    'NQH5': {
      native: 'NQH5',
      continuous: 'NQ.c.0',
      parent: 'NQ',
    },
  },
  symbols: ['ESH5', 'NQH5'],
};

/**
 * Sample cost estimation response (JSON)
 */
export const SAMPLE_COST_JSON = {
  cost: 0.05,
  dataset: 'GLBX.MDP3',
  symbols: ['ESH5'],
  schema: 'mbp-1',
  start: '2024-03-01',
  end: '2024-03-15',
};

/**
 * Sample batch job submission response (JSON)
 */
export const SAMPLE_BATCH_SUBMIT_JSON = {
  job_id: 'batch_abc123xyz',
  status: 'pending',
  dataset: 'GLBX.MDP3',
  symbols: ['ESH5', 'NQH5'],
  schema: 'mbp-1',
  start: '2024-03-01',
  end: '2024-03-15',
  created_at: '2024-03-15T14:30:00Z',
};

/**
 * Sample batch job status response (JSON)
 */
export const SAMPLE_BATCH_STATUS_JSON = {
  job_id: 'batch_abc123xyz',
  status: 'done',
  download_urls: [
    'https://download.databento.com/batch/abc123xyz/part1.csv.gz',
    'https://download.databento.com/batch/abc123xyz/part2.csv.gz',
  ],
  created_at: '2024-03-15T14:30:00Z',
  completed_at: '2024-03-15T14:35:00Z',
};

/**
 * Sample corporate actions response (JSON)
 */
export const SAMPLE_CORPORATE_ACTIONS_JSON = [
  {
    symbol: 'AAPL',
    date: '2024-02-09',
    action: 'dividend',
    amount: 0.24,
    currency: 'USD',
  },
  {
    symbol: 'AAPL',
    date: '2020-08-31',
    action: 'split',
    ratio: '4:1',
  },
];

/**
 * Sample error response (JSON)
 */
export const SAMPLE_ERROR_JSON = {
  error: {
    message: 'Invalid API key',
    code: 'INVALID_API_KEY',
  },
};

/**
 * Sample rate limit error response (JSON)
 */
export const SAMPLE_RATE_LIMIT_ERROR_JSON = {
  error: {
    message: 'Rate limit exceeded. Please try again later.',
    code: 'RATE_LIMIT_EXCEEDED',
  },
};

/**
 * Malformed CSV response (missing columns)
 */
export const MALFORMED_CSV_RESPONSE = `ts_event,symbol
2024-03-15T14:30:00.123456789Z,ESH5`;

/**
 * Sample session info response
 */
export const SAMPLE_SESSION_INFO_JSON = {
  session: 'ASIAN',
  start: '2024-03-15T18:00:00Z',
  end: '2024-03-16T03:00:00Z',
  active: true,
};
