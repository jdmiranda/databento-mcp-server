/**
 * Mock Databento API Responses for Testing
 * Contains sample JSON and CSV responses matching actual Databento API format
 */

/**
 * Metadata API Responses
 */

export const mockDatasets = ["GLBX.MDP3", "XNAS.ITCH", "DBEQ.BASIC", "OPRA.PILLAR"];

export const mockSchemas = ["mbp-1", "mbp-10", "trades", "ohlcv-1h", "ohlcv-1d"];

export const mockPublishers = [
  {
    publisher_id: 1,
    dataset: "GLBX.MDP3",
    venue: "CME",
    description: "CME Globex MDP 3.0 (futures)"
  },
  {
    publisher_id: 2,
    dataset: "XNAS.ITCH",
    venue: "NASDAQ",
    description: "NASDAQ TotalView-ITCH (equities)"
  }
];

export const mockFields = [
  {
    name: "ts_event",
    type: "uint64",
    description: "Event timestamp (nanoseconds)"
  },
  {
    name: "instrument_id",
    type: "uint32",
    description: "Instrument ID"
  },
  {
    name: "price",
    type: "int64",
    description: "Trade price (fixed precision)"
  },
  {
    name: "size",
    type: "uint32",
    description: "Trade size"
  }
];

export const mockUnitPrices = [
  {
    mode: "historical",
    schema: "mbp-1",
    unit_price: 0.01,
    currency: "USD"
  },
  {
    mode: "historical",
    schema: "trades",
    unit_price: 0.02,
    currency: "USD"
  },
  {
    mode: "historical",
    schema: "ohlcv-1h",
    unit_price: 0.005,
    currency: "USD"
  }
];

export const mockDatasetRange = {
  start_date: "2020-01-01",
  end_date: "2024-12-31",
  available_date: "2024-12-31"
};

export const mockDatasetCondition = [
  {
    date: "2024-01-01",
    condition: "available" as const,
    last_modified_date: "2024-01-02",
    details: "Full data available"
  },
  {
    date: "2024-01-02",
    condition: "available" as const,
    last_modified_date: "2024-01-03"
  },
  {
    date: "2024-01-03",
    condition: "pending" as const,
    details: "Data processing"
  }
];

export const mockCost = {
  dataset: "GLBX.MDP3",
  symbols: ["ES.c.0", "NQ.c.0"],
  schema: "ohlcv-1h",
  start: "2024-01-01",
  end: "2024-01-31",
  mode: "historical",
  total_cost: 2.50,
  total_records: 1488,
  currency: "USD",
  billed: false
};

/**
 * Timeseries API Responses (CSV format)
 */

export const mockOHLCV1HResponse = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1704067200000000000,32,1,12345,4500000000000,4520000000000,4495000000000,4510000000000,15000
1704070800000000000,32,1,12345,4510000000000,4525000000000,4500000000000,4520000000000,18000
1704074400000000000,32,1,12345,4520000000000,4540000000000,4515000000000,4535000000000,20000`;

export const mockMBP1Response = `ts_event,rtype,publisher_id,instrument_id,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00,bid_ct_00,ask_ct_00
1704067200000000000,160,1,12345,4500000000000,4500500000000,10,15,3,5
1704067200100000000,160,1,12345,4500250000000,4500750000000,12,13,4,4
1704067200200000000,160,1,12345,4500500000000,4501000000000,8,20,2,6`;

export const mockMBP10Response = `ts_event,rtype,publisher_id,instrument_id,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00,bid_ct_00,ask_ct_00,bid_px_01,ask_px_01,bid_sz_01,ask_sz_01
1704067200000000000,160,1,12345,4500000000000,4500500000000,10,15,3,5,4499500000000,4501000000000,5,8
1704067200100000000,160,1,12345,4500250000000,4500750000000,12,13,4,4,4499750000000,4501250000000,7,10`;

export const mockTradesResponse = `ts_event,rtype,publisher_id,instrument_id,price,size,action,side,flags,depth,sequence
1704067200000000000,20,1,12345,4500250000000,5,T,B,0,1,1001
1704067200100000000,20,1,12345,4500500000000,10,T,S,0,1,1002
1704067200200000000,20,1,12345,4500750000000,3,T,B,0,1,1003`;

export const mockMBOResponse = `ts_event,rtype,publisher_id,instrument_id,order_id,price,size,side,action,flags
1704067200000000000,96,1,12345,50001,4500000000000,10,B,A,0
1704067200100000000,96,1,12345,50002,4500500000000,15,S,A,0
1704067200200000000,96,1,12345,50001,4500000000000,5,B,M,0`;

export const mockOHLCV1SResponse = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1704067200000000000,32,1,12345,4500000000000,4500500000000,4499500000000,4500250000000,500
1704067201000000000,32,1,12345,4500250000000,4500750000000,4500000000000,4500500000000,650
1704067202000000000,32,1,12345,4500500000000,4501000000000,4500250000000,4500750000000,700`;

export const mockOHLCV1MResponse = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1704067200000000000,32,1,12345,4500000000000,4505000000000,4495000000000,4502000000000,5000
1704067260000000000,32,1,12345,4502000000000,4508000000000,4500000000000,4505000000000,6000`;

export const mockOHLCV1DResponse = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1704067200000000000,32,1,12345,4500000000000,4600000000000,4450000000000,4575000000000,150000`;

export const mockOHLCVEODResponse = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1704067200000000000,32,1,12345,4500000000000,4600000000000,4450000000000,4575000000000,150000`;

export const mockStatisticsResponse = `ts_event,rtype,publisher_id,instrument_id,stat_type,quantity,price,sequence
1704067200000000000,48,1,12345,1,1000,4500000000000,1
1704067200000000000,48,1,12345,2,2000,4550000000000,2`;

export const mockDefinitionResponse = `ts_event,rtype,publisher_id,instrument_id,raw_symbol,min_price_increment,display_factor,expiration,activation
1704067200000000000,18,1,12345,ESH4,25000000,100,1710460800000000000,1704067200000000000`;

export const mockImbalanceResponse = `ts_event,rtype,publisher_id,instrument_id,ref_price,auction_time,cont_book_clr_price,auct_interest_clr_price,ssr_filling_price,ind_match_price,upper_collar,lower_collar,paired_qty,imbalance_qty,imbalance_side
1704067200000000000,64,1,12345,4500000000000,1704067200000000000,4500000000000,4500000000000,4500000000000,4500000000000,4550000000000,4450000000000,1000,500,B`;

export const mockStatusResponse = `ts_event,rtype,publisher_id,instrument_id,action,reason,trading_event,is_trading,is_quoting,is_short_sell_restricted
1704067200000000000,17,1,12345,2,0,0,1,1,0
1704067300000000000,17,1,12345,1,0,0,1,1,0`;

/**
 * Error responses
 */

export const mockEmptyCSVResponse = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
`;

export const mockInvalidCSVResponse = `invalid,csv,data
this,is,malformed`;

/**
 * Helper function to create JSON response text
 */
export function toJSONResponse<T>(data: T): string {
  return JSON.stringify(data);
}

/**
 * Helper function to simulate HTTP error responses
 */
export const mockErrorResponses = {
  unauthorized: "HTTP 401: Unauthorized - Invalid API key",
  forbidden: "HTTP 403: Forbidden - Insufficient permissions",
  notFound: "HTTP 404: Not Found - Resource not found",
  rateLimited: "HTTP 429: Too Many Requests - Rate limit exceeded",
  serverError: "HTTP 500: Internal Server Error",
  badRequest: "HTTP 400: Bad Request - Invalid parameters",
};

/**
 * Sample multi-symbol response
 */
export const mockMultiSymbolOHLCVResponse = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1704067200000000000,32,1,12345,4500000000000,4520000000000,4495000000000,4510000000000,15000
1704067200000000000,32,1,12346,16000000000000,16100000000000,15950000000000,16050000000000,8000
1704070800000000000,32,1,12345,4510000000000,4525000000000,4500000000000,4520000000000,18000
1704070800000000000,32,1,12346,16050000000000,16150000000000,16000000000000,16100000000000,9000`;
