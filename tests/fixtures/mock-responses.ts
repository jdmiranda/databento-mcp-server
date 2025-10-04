/**
 * Mock response fixtures for testing
 */

// Mock CSV response for quote data (mbp-1 schema)
export const mockQuoteCSV = `ts_recv,ts_event,rtype,publisher_id,instrument_id,action,side,depth,price,size,flags,ts_in_delta,sequence,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00,bid_ct_00,ask_ct_00
1704067200000000000,1704067200000000000,66,1,12345,67,65,0,4500000000000,100,0,0,1,4499000000000,4501000000000,100,150,1,1
1704067201000000000,1704067201000000000,66,1,12345,67,65,0,4502000000000,100,0,0,2,4500000000000,4502000000000,120,140,1,1`;

// Mock CSV response for OHLCV data
export const mockOHLCVCSV = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1704067200000000000,32,1,12345,4500000000000,4510000000000,4490000000000,4505000000000,1000
1704070800000000000,32,1,12345,4505000000000,4520000000000,4500000000000,4515000000000,1500
1704074400000000000,32,1,12345,4515000000000,4525000000000,4510000000000,4520000000000,2000`;

// Mock CSV response for timeseries
export const mockTimeseriesCSV = `ts_recv,ts_event,rtype,publisher_id,instrument_id,price,size
1704067200000000000,1704067200000000000,160,1,12345,4500000000000,100
1704067201000000000,1704067201000000000,160,1,12345,4501000000000,150
1704067202000000000,1704067202000000000,160,1,12345,4502000000000,200`;

// Mock JSON response for datasets
export const mockDatasetsJSON = JSON.stringify([
  "GLBX.MDP3",
  "XNAS.ITCH",
  "XCHI.PITCH",
  "DBEQ.BASIC"
]);

// Mock JSON response for schemas
export const mockSchemasJSON = JSON.stringify([
  "trades",
  "mbp-1",
  "mbp-10",
  "ohlcv-1h",
  "ohlcv-1d"
]);

// Mock JSON response for publishers
export const mockPublishersJSON = JSON.stringify([
  {
    publisher_id: 1,
    dataset: "GLBX.MDP3",
    venue: "CME",
    description: "CME Globex MDP 3.0"
  },
  {
    publisher_id: 2,
    dataset: "XNAS.ITCH",
    venue: "NASDAQ",
    description: "Nasdaq TotalView-ITCH"
  }
]);

// Mock JSON response for fields
export const mockFieldsJSON = JSON.stringify([
  {
    name: "ts_event",
    type: "uint64",
    description: "Event timestamp"
  },
  {
    name: "price",
    type: "int64",
    description: "Price in fixed-point decimal"
  },
  {
    name: "size",
    type: "uint32",
    description: "Order size"
  }
]);

// Mock JSON response for cost
export const mockCostJSON = JSON.stringify({
  dataset: "GLBX.MDP3",
  symbols: ["ES.c.0"],
  schema: "trades",
  start: "2024-01-01",
  end: "2024-01-31",
  size_bytes: 1048576000,
  cost_usd: 5.50,
  mode: "historical-streaming"
});

// Mock JSON response for dataset range
export const mockDatasetRangeJSON = JSON.stringify({
  dataset: "GLBX.MDP3",
  start_date: "2020-01-01",
  end_date: "2024-12-31",
  availability: "available"
});

// Mock JSON response for symbology resolution
export const mockSymbologyResolveJSON = JSON.stringify({
  result: [
    {
      s: "ES.c.0",
      d: "2024-01-01",
      o: "12345"
    }
  ],
  mappings: [
    {
      native: "ES.FUT.202403",
      intervals: [
        {
          start_date: "2024-01-01",
          end_date: "2024-03-15",
          symbol: "12345"
        }
      ]
    }
  ],
  partial: [],
  not_found: []
});

// Mock JSON response for batch job submission
export const mockBatchJobJSON = JSON.stringify({
  id: "job123456",
  state: "received",
  dataset: "GLBX.MDP3",
  symbols: ["ES.c.0", "NQ.c.0"],
  schema: "trades",
  start: "2024-01-01",
  end: "2024-01-31",
  encoding: "dbn",
  compression: "zstd",
  cost_usd: 10.50,
  ts_received: "2024-01-01T00:00:00Z"
});

// Mock JSON response for batch jobs list
export const mockBatchJobsListJSON = JSON.stringify([
  {
    id: "job123456",
    state: "done",
    dataset: "GLBX.MDP3",
    symbols: ["ES.c.0"],
    schema: "trades",
    start: "2024-01-01",
    end: "2024-01-31",
    encoding: "dbn",
    compression: "zstd",
    cost_usd: 10.50,
    ts_received: "2024-01-01T00:00:00Z",
    ts_queued: "2024-01-01T00:00:01Z",
    ts_process_start: "2024-01-01T00:00:02Z",
    ts_process_done: "2024-01-01T00:05:00Z",
    ts_expiration: "2024-01-08T00:00:00Z",
    record_count: 1000000,
    file_count: 5,
    total_size: 1048576000
  }
]);

// Mock JSON response for batch download
export const mockBatchDownloadJSON = JSON.stringify({
  job_id: "job123456",
  state: "done",
  download_urls: [
    "https://databento.s3.amazonaws.com/batch/job123456/file1.dbn.zst",
    "https://databento.s3.amazonaws.com/batch/job123456/file2.dbn.zst"
  ],
  expiration: "2024-01-08T00:00:00Z"
});

// Mock CSV response for reference data
export const mockSecuritiesCSV = `instrument_id,raw_symbol,exchange,security_type,currency,min_price_increment,multiplier
12345,ESH4,XCME,FUT,USD,0.25,50
23456,NQH4,XCME,FUT,USD,0.25,20`;

// Mock CSV response for corporate actions
export const mockCorporateActionsCSV = `symbol,action_type,ex_date,payment_date,value
AAPL,dividend,2024-02-09,2024-02-16,0.24
TSLA,split,2024-08-25,2024-08-25,3:1`;

// Mock CSV response for adjustment factors
export const mockAdjustmentsCSV = `symbol,date,split_factor,dividend_factor,total_factor
AAPL,2024-02-09,1.0,0.998,0.998
AAPL,2024-02-16,1.0,0.996,0.994`;
