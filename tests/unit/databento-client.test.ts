/**
 * Comprehensive Unit Tests for DataBentoClient
 * Target: 85%+ code coverage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataBentoClient } from '../../src/databento-client.js';
import { DataBentoHTTP } from '../../src/http/databento-http.js';

// Mock DataBentoHTTP
vi.mock('../../src/http/databento-http.js', () => {
  return {
    DataBentoHTTP: vi.fn().mockImplementation(() => {
      return {
        get: vi.fn(),
      };
    }),
  };
});

describe('DataBentoClient', () => {
  let client: DataBentoClient;
  let mockHttpGet: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new DataBentoClient('db-test-api-key');
    mockHttpGet = (client as any).http.get;
  });

  describe('Constructor', () => {
    it('should create instance with API key', () => {
      expect(client).toBeInstanceOf(DataBentoClient);
      expect(DataBentoHTTP).toHaveBeenCalledWith('db-test-api-key');
    });
  });

  describe('getQuote', () => {
    // Mock response with prices in DataBento fixed-point format (value * 1e9)
    const mockQuoteResponse = `ts_recv,ts_event,rtype,publisher_id,instrument_id,action,side,depth,price,size,flags,ts_in_delta,sequence,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00
1234567890123456,1234567890000000,1,1,1234,A,B,0,0,0,0,0,0,4500000000,4502000000,10,15`;

    it('should get quote for ES symbol', async () => {
      mockHttpGet.mockResolvedValue(mockQuoteResponse);

      const quote = await client.getQuote('ES');

      expect(quote.symbol).toBe('ES');
      expect(quote.bid).toBe(4.5);
      expect(quote.ask).toBe(4.502);
      expect(quote.price).toBe((4.5 + 4.502) / 2);
      expect(quote.timestamp).toBeInstanceOf(Date);
      expect(quote.dataAge).toBeGreaterThanOrEqual(0);

      expect(mockHttpGet).toHaveBeenCalledWith('/v0/timeseries.get_range', {
        dataset: 'GLBX.MDP3',
        symbols: 'ES.c.0',
        stype_in: 'continuous',
        stype_out: 'instrument_id',
        start: expect.any(String),
        end: expect.any(String),
        schema: 'mbp-1',
        limit: 100,
      });
    });

    it('should get quote for NQ symbol', async () => {
      mockHttpGet.mockResolvedValue(mockQuoteResponse);

      const quote = await client.getQuote('NQ');

      expect(quote.symbol).toBe('NQ');
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/v0/timeseries.get_range',
        expect.objectContaining({
          symbols: 'NQ.c.0',
        })
      );
    });

    it('should cache quote data for 30 seconds', async () => {
      mockHttpGet.mockResolvedValue(mockQuoteResponse);

      // First call
      const quote1 = await client.getQuote('ES');
      expect(mockHttpGet).toHaveBeenCalledTimes(1);

      // Second call within cache TTL
      const quote2 = await client.getQuote('ES');
      expect(mockHttpGet).toHaveBeenCalledTimes(1); // Still just 1 call
      expect(quote2).toEqual(quote1);
    });

    it('should refresh cache after TTL expires', async () => {
      vi.useFakeTimers();
      mockHttpGet.mockResolvedValue(mockQuoteResponse);

      // First call
      await client.getQuote('ES');
      expect(mockHttpGet).toHaveBeenCalledTimes(1);

      // Advance time past cache TTL (30 seconds)
      vi.advanceTimersByTime(31000);

      // Second call should fetch fresh data
      await client.getQuote('ES');
      expect(mockHttpGet).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it('should throw error for invalid symbol', async () => {
      await expect(client.getQuote('INVALID' as any)).rejects.toThrow(
        'Invalid symbol: INVALID'
      );
    });

    it('should throw error when no data is available', async () => {
      mockHttpGet.mockResolvedValue('');

      await expect(client.getQuote('ES')).rejects.toThrow(
        'No quote data available for ES'
      );
    });

    it('should throw error when response has no data lines', async () => {
      mockHttpGet.mockResolvedValue(
        'ts_recv,ts_event,rtype,publisher_id,instrument_id\n'
      );

      await expect(client.getQuote('ES')).rejects.toThrow(
        'No recent data available for ES'
      );
    });

    it('should handle multiple data lines and return latest', async () => {
      const multiLineResponse = `ts_recv,ts_event,rtype,publisher_id,instrument_id,action,side,depth,price,size,flags,ts_in_delta,sequence,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00
1234567890123456,1234567890000000,1,1,1234,A,B,0,0,0,0,0,0,4500000000,4502000000,10,15
1234567890123456,1234567891000000,1,1,1234,A,B,0,0,0,0,0,0,4510000000,4512000000,10,15`;

      mockHttpGet.mockResolvedValue(multiLineResponse);

      const quote = await client.getQuote('ES');

      // Should use the latest line
      expect(quote.bid).toBe(4.51);
      expect(quote.ask).toBe(4.512);
    });

    it('should calculate correct timestamp from nanoseconds', async () => {
      const response = `ts_recv,ts_event,rtype,publisher_id,instrument_id,action,side,depth,price,size,flags,ts_in_delta,sequence,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00
1234567890123456,1609459200000000000,1,1,1234,A,B,0,0,0,0,0,0,4500000000,4502000000,10,15`;

      mockHttpGet.mockResolvedValue(response);

      const quote = await client.getQuote('ES');

      // 1609459200000000000 nanoseconds = 1609459200000 milliseconds = Jan 1, 2021 00:00:00 UTC
      expect(quote.timestamp.getTime()).toBe(1609459200000);
    });

    it('should calculate data age correctly', async () => {
      vi.useFakeTimers();
      const now = new Date('2021-01-01T12:00:00Z');
      vi.setSystemTime(now);

      // Set ts_event to 10 seconds ago
      const tenSecondsAgo = now.getTime() - 10000;
      const tsEventNanos = tenSecondsAgo * 1_000_000;

      const response = `ts_recv,ts_event,rtype,publisher_id,instrument_id,action,side,depth,price,size,flags,ts_in_delta,sequence,bid_px_00,ask_px_00,bid_sz_00,ask_sz_00
1234567890123456,${tsEventNanos},1,1,1234,A,B,0,0,0,0,0,0,4500000000,4502000000,10,15`;

      mockHttpGet.mockResolvedValue(response);

      const quote = await client.getQuote('ES');

      expect(quote.dataAge).toBeCloseTo(10000, -2); // Within 100ms

      vi.useRealTimers();
    });
  });

  describe('getHistoricalBars', () => {
    // Mock bars with prices in DataBento fixed-point format (value * 1e9)
    const mockBarsResponse = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1609459200000000000,1,1,1234,4500000000,4520000000,4490000000,4510000000,1000
1609462800000000000,1,1,1234,4510000000,4530000000,4500000000,4520000000,1500
1609466400000000000,1,1,1234,4520000000,4540000000,4510000000,4530000000,2000
1609470000000000000,1,1,1234,4530000000,4550000000,4520000000,4540000000,2500`;

    it('should get 1h bars for ES', async () => {
      mockHttpGet.mockResolvedValue(mockBarsResponse);

      const bars = await client.getHistoricalBars('ES', '1h', 3);

      expect(bars).toHaveLength(3);
      expect(bars[0].open).toBe(4.51);
      expect(bars[0].high).toBe(4.53);
      expect(bars[0].low).toBe(4.5);
      expect(bars[0].close).toBe(4.52);
      expect(bars[0].volume).toBe(1500);
      expect(bars[0].timestamp).toBeInstanceOf(Date);

      expect(mockHttpGet).toHaveBeenCalledWith(
        '/v0/timeseries.get_range',
        expect.objectContaining({
          schema: 'ohlcv-1h',
          symbols: 'ES.c.0',
        })
      );
    });

    it('should get 1d bars for NQ', async () => {
      mockHttpGet.mockResolvedValue(mockBarsResponse);

      const bars = await client.getHistoricalBars('NQ', '1d', 2);

      expect(bars).toHaveLength(2);
      expect(mockHttpGet).toHaveBeenCalledWith(
        '/v0/timeseries.get_range',
        expect.objectContaining({
          schema: 'ohlcv-1d',
          symbols: 'NQ.c.0',
        })
      );
    });

    it('should aggregate to H4 bars correctly', async () => {
      // Create 8 hours of data (should aggregate to 2 H4 bars)
      const eightHoursResponse = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1609459200000000000,1,1,1234,4500000000,4510000000,4490000000,4505000000,1000
1609462800000000000,1,1,1234,4505000000,4515000000,4495000000,4510000000,1100
1609466400000000000,1,1,1234,4510000000,4525000000,4500000000,4515000000,1200
1609470000000000000,1,1,1234,4515000000,4530000000,4505000000,4520000000,1300
1609473600000000000,1,1,1234,4520000000,4540000000,4510000000,4525000000,1400
1609477200000000000,1,1,1234,4525000000,4550000000,4515000000,4530000000,1500
1609480800000000000,1,1,1234,4530000000,4560000000,4520000000,4535000000,1600
1609484400000000000,1,1,1234,4535000000,4570000000,4525000000,4540000000,1700`;

      mockHttpGet.mockResolvedValue(eightHoursResponse);

      const bars = await client.getHistoricalBars('ES', 'H4', 2);

      expect(bars).toHaveLength(2);

      // First H4 bar (hours 0-3)
      expect(bars[0].open).toBe(4.5); // Open of first 1h bar
      expect(bars[0].high).toBe(4.53); // Max high of first 4 bars
      expect(bars[0].low).toBe(4.49); // Min low of first 4 bars
      expect(bars[0].close).toBe(4.52); // Close of 4th bar
      expect(bars[0].volume).toBe(1000 + 1100 + 1200 + 1300); // Sum of volumes

      // Second H4 bar (hours 4-7)
      expect(bars[1].open).toBe(4.52);
      expect(bars[1].high).toBe(4.57);
      expect(bars[1].low).toBe(4.51);
      expect(bars[1].close).toBe(4.54);
      expect(bars[1].volume).toBe(1400 + 1500 + 1600 + 1700);
    });

    it('should handle H4 aggregation with incomplete final chunk', async () => {
      // 5 hours of data (1 complete H4 + 1 partial)
      const fiveHoursResponse = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1609459200000000000,1,1,1234,4500000000,4510000000,4490000000,4505000000,1000
1609462800000000000,1,1,1234,4505000000,4515000000,4495000000,4510000000,1100
1609466400000000000,1,1,1234,4510000000,4525000000,4500000000,4515000000,1200
1609470000000000000,1,1,1234,4515000000,4530000000,4505000000,4520000000,1300
1609473600000000000,1,1,1234,4520000000,4540000000,4510000000,4525000000,1400`;

      mockHttpGet.mockResolvedValue(fiveHoursResponse);

      const bars = await client.getHistoricalBars('ES', 'H4', 10);

      expect(bars).toHaveLength(2); // 1 complete H4 + 1 partial H4
      expect(bars[1].volume).toBe(1400); // Only 1 hour in the partial chunk
    });

    it('should throw error for invalid symbol', async () => {
      await expect(
        client.getHistoricalBars('INVALID' as any, '1h', 10)
      ).rejects.toThrow('Invalid symbol: INVALID');
    });

    it('should throw error when no data is available', async () => {
      mockHttpGet.mockResolvedValue('');

      await expect(client.getHistoricalBars('ES', '1h', 10)).rejects.toThrow(
        'No bar data available for ES'
      );
    });

    it('should throw error when response has no data lines', async () => {
      mockHttpGet.mockResolvedValue(
        'ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume\n'
      );

      await expect(client.getHistoricalBars('ES', '1h', 10)).rejects.toThrow(
        'No bar data available for ES'
      );
    });

    it('should calculate correct date range for 1h timeframe', async () => {
      mockHttpGet.mockResolvedValue(mockBarsResponse);

      await client.getHistoricalBars('ES', '1h', 48); // 2 days worth

      const callArgs = mockHttpGet.mock.calls[0][1];
      const startDate = new Date(callArgs.start);
      const endDate = new Date(callArgs.end);
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Should request at least 2 days + 7 day buffer for weekends
      expect(daysDiff).toBeGreaterThanOrEqual(9);
    });

    it('should calculate correct date range for H4 timeframe', async () => {
      mockHttpGet.mockResolvedValue(mockBarsResponse);

      await client.getHistoricalBars('ES', 'H4', 12); // 2 days worth (12 * 4h)

      const callArgs = mockHttpGet.mock.calls[0][1];
      expect(callArgs.schema).toBe('ohlcv-1h'); // Fetches 1h to aggregate
    });

    it('should calculate correct date range for 1d timeframe', async () => {
      mockHttpGet.mockResolvedValue(mockBarsResponse);

      await client.getHistoricalBars('ES', '1d', 10);

      const callArgs = mockHttpGet.mock.calls[0][1];
      const startDate = new Date(callArgs.start);
      const endDate = new Date(callArgs.end);
      const daysDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Should request 10 days + 7 day buffer
      expect(daysDiff).toBeGreaterThanOrEqual(17);
    });

    it('should parse prices correctly from fixed-point notation', async () => {
      const response = `ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
1609459200000000000,1,1,1234,123456789000,234567890000,12345678000,98765432000,5000`;

      mockHttpGet.mockResolvedValue(response);

      const bars = await client.getHistoricalBars('ES', '1h', 1);

      expect(bars[0].open).toBeCloseTo(123.456789, 6);
      expect(bars[0].high).toBeCloseTo(234.56789, 5);
      expect(bars[0].low).toBeCloseTo(12.345678, 6);
      expect(bars[0].close).toBeCloseTo(98.765432, 6);
    });

    it('should return last N bars when more data is available', async () => {
      mockHttpGet.mockResolvedValue(mockBarsResponse);

      const bars = await client.getHistoricalBars('ES', '1h', 2);

      expect(bars).toHaveLength(2);
      // Should return the last 2 bars
      expect(bars[0].volume).toBe(2000);
      expect(bars[1].volume).toBe(2500);
    });
  });

  describe('getSessionInfo', () => {
    it('should return Asian session for UTC hours 0-6', () => {
      const timestamp = new Date('2021-01-01T03:00:00Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('Asian');
      expect(session.sessionStart.getUTCHours()).toBe(0);
      expect(session.sessionEnd.getUTCHours()).toBe(7);
      expect(session.timestamp).toEqual(timestamp);
    });

    it('should return London session for UTC hours 7-13', () => {
      const timestamp = new Date('2021-01-01T10:00:00Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('London');
      expect(session.sessionStart.getUTCHours()).toBe(7);
      expect(session.sessionEnd.getUTCHours()).toBe(14);
    });

    it('should return NY session for UTC hours 14-21', () => {
      const timestamp = new Date('2021-01-01T16:00:00Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('NY');
      expect(session.sessionStart.getUTCHours()).toBe(14);
      expect(session.sessionEnd.getUTCHours()).toBe(22);
    });

    it('should return Unknown session for UTC hours 22-23', () => {
      const timestamp = new Date('2021-01-01T23:00:00Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('Unknown');
    });

    it('should use current time if timestamp not provided', () => {
      const session = client.getSessionInfo();

      expect(session.currentSession).toMatch(/Asian|London|NY|Unknown/);
      expect(session.timestamp).toBeInstanceOf(Date);
    });

    it('should return Asian session at hour 0', () => {
      const timestamp = new Date('2021-01-01T00:00:00Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('Asian');
    });

    it('should return Asian session at hour 6', () => {
      const timestamp = new Date('2021-01-01T06:59:59Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('Asian');
    });

    it('should return London session at hour 7', () => {
      const timestamp = new Date('2021-01-01T07:00:00Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('London');
    });

    it('should return London session at hour 13', () => {
      const timestamp = new Date('2021-01-01T13:59:59Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('London');
    });

    it('should return NY session at hour 14', () => {
      const timestamp = new Date('2021-01-01T14:00:00Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('NY');
    });

    it('should return NY session at hour 21', () => {
      const timestamp = new Date('2021-01-01T21:59:59Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('NY');
    });

    it('should return Unknown session at hour 22', () => {
      const timestamp = new Date('2021-01-01T22:00:00Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('Unknown');
    });

    it('should set session start and end times to midnight for Unknown session', () => {
      const timestamp = new Date('2021-01-01T23:00:00Z');
      const session = client.getSessionInfo(timestamp);

      expect(session.currentSession).toBe('Unknown');
      expect(session.sessionStart).toEqual(timestamp);
      expect(session.sessionEnd).toEqual(timestamp);
    });
  });

  describe('aggregateToH4', () => {
    it('should aggregate empty array', () => {
      const result = (client as any).aggregateToH4([]);
      expect(result).toEqual([]);
    });

    it('should aggregate single bar', () => {
      const bars = [
        {
          timestamp: new Date('2021-01-01T00:00:00Z'),
          open: 4.5,
          high: 4.6,
          low: 4.4,
          close: 4.55,
          volume: 1000,
        },
      ];

      const result = (client as any).aggregateToH4(bars);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(bars[0]);
    });

    it('should aggregate 3 bars (incomplete chunk)', () => {
      const bars = [
        {
          timestamp: new Date('2021-01-01T00:00:00Z'),
          open: 4.5,
          high: 4.6,
          low: 4.4,
          close: 4.55,
          volume: 1000,
        },
        {
          timestamp: new Date('2021-01-01T01:00:00Z'),
          open: 4.55,
          high: 4.65,
          low: 4.45,
          close: 4.6,
          volume: 1100,
        },
        {
          timestamp: new Date('2021-01-01T02:00:00Z'),
          open: 4.6,
          high: 4.7,
          low: 4.5,
          close: 4.65,
          volume: 1200,
        },
      ];

      const result = (client as any).aggregateToH4(bars);

      expect(result).toHaveLength(1);
      expect(result[0].open).toBe(4.5);
      expect(result[0].high).toBe(4.7);
      expect(result[0].low).toBe(4.4);
      expect(result[0].close).toBe(4.65);
      expect(result[0].volume).toBe(3300);
    });
  });
});
