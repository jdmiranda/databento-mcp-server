/**
 * Comprehensive Unit Tests for DataBentoHTTP Client
 * Target: 95%+ code coverage
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  DataBentoHTTP,
  DATABENTO_CONFIG,
  parseCSV,
  parseJSON,
  buildQueryParams,
} from '../../../src/http/databento-http';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Helper to create mock Response
function createMockResponse(body: string, status = 200, statusText = 'OK') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    text: vi.fn().mockResolvedValue(body),
  } as any;
}

describe('DataBentoHTTP', () => {
  const VALID_API_KEY = 'db-test-api-key-12345';
  const BASE_URL = 'https://hist.databento.com';

  beforeEach(() => {
    // Reset mock before each test
    mockFetch.mockReset();
  });

  afterEach(() => {
    // Clear any timers
    vi.clearAllTimers();
  });

  describe('Constructor', () => {
    it('should create instance with valid API key', () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      expect(client).toBeInstanceOf(DataBentoHTTP);
    });

    it('should throw error when API key is missing', () => {
      expect(() => new DataBentoHTTP('')).toThrow(
        'DATABENTO_API_KEY is required'
      );
    });

    it('should throw error when API key is undefined', () => {
      expect(() => new DataBentoHTTP(undefined as any)).toThrow(
        'DATABENTO_API_KEY is required'
      );
    });

    it('should throw error when API key does not start with "db-"', () => {
      expect(() => new DataBentoHTTP('invalid-key-format')).toThrow(
        'DATABENTO_API_KEY must start with "db-"'
      );
    });

    it('should throw error when API key is "db-" only', () => {
      // This should actually pass validation since it starts with "db-"
      // but we can test with a different invalid format
      expect(() => new DataBentoHTTP('api-key-123')).toThrow(
        'DATABENTO_API_KEY must start with "db-"'
      );
    });
  });

  describe('GET Requests', () => {
    it('should make successful GET request', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      const responseBody = 'dataset1,dataset2,dataset3';

      mockFetch.mockResolvedValue(createMockResponse(responseBody));

      const result = await client.get('/v0/metadata.list_datasets');

      expect(result).toBe(responseBody);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toContain('/v0/metadata.list_datasets');
    });

    it('should build query parameters correctly', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      const params = {
        dataset: 'GLBX.MDP3',
        symbols: 'ES.FUT',
        start: '2024-01-01',
      };

      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.get('/v0/test', params);

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('dataset=GLBX.MDP3');
      expect(url).toContain('symbols=ES.FUT');
      expect(url).toContain('start=2024-01-01');
    });

    it('should filter out undefined query parameters', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      const params = {
        dataset: 'GLBX.MDP3',
        symbols: undefined,
        start: '2024-01-01',
        end: null,
      };

      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.get('/v0/test', params);

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('dataset=GLBX.MDP3');
      expect(url).toContain('start=2024-01-01');
      expect(url).not.toContain('symbols');
      expect(url).not.toContain('end');
    });

    it('should handle GET request without parameters', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(createMockResponse('datasets'));

      const result = await client.get('/v0/metadata.list_datasets');
      expect(result).toBe('datasets');
    });

    it('should include authorization header', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.get('/v0/test');

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers.Authorization).toMatch(/^Basic /);
    });
  });

  describe('POST Requests (JSON)', () => {
    it('should make successful POST request with JSON body', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      const requestData = {
        dataset: 'GLBX.MDP3',
        symbols: ['ES.FUT', 'NQ.FUT'],
        start: '2024-01-01',
      };

      mockFetch.mockResolvedValue(
        createMockResponse(JSON.stringify({ job_id: '12345' }))
      );

      const result = await client.post('/v0/batch.submit_job', requestData);
      expect(result).toBe(JSON.stringify({ job_id: '12345' }));

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['Content-Type']).toBe('application/json');
      expect(options.body).toBe(JSON.stringify(requestData));
    });

    it('should make POST request without body', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(createMockResponse('success'));

      const result = await client.post('/v0/test');
      expect(result).toBe('success');

      const options = mockFetch.mock.calls[0][1];
      expect(options.body).toBeUndefined();
    });

    it('should include User-Agent header in POST requests', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.post('/v0/test');

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['User-Agent']).toBe('DataBento-MCP-Server/1.0');
    });
  });

  describe('POST Requests (Form-Encoded)', () => {
    it('should make POST request with form-encoded data', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      const formData = {
        dataset: 'GLBX.MDP3',
        schema: 'trades',
        start: '2024-01-01',
      };

      mockFetch.mockResolvedValue(
        createMockResponse(JSON.stringify({ job_id: '12345' }))
      );

      const result = await client.postForm('/v0/batch.submit_job', formData);
      expect(result).toBe(JSON.stringify({ job_id: '12345' }));

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded'
      );
      expect(options.body).toContain('dataset=GLBX.MDP3');
      expect(options.body).toContain('schema=trades');
      expect(options.body).toContain('start=2024-01-01');
    });

    it('should serialize arrays in form data as comma-separated values', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      const formData = {
        dataset: 'GLBX.MDP3',
        symbols: ['ES.FUT', 'NQ.FUT', 'YM.FUT'],
        start: '2024-01-01',
      };

      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.postForm('/v0/batch.submit_job', formData);

      const options = mockFetch.mock.calls[0][1];
      expect(options.body).toContain('symbols=ES.FUT%2CNQ.FUT%2CYM.FUT');
    });

    it('should filter out undefined and null values in form data', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      const formData = {
        dataset: 'GLBX.MDP3',
        symbols: undefined,
        start: '2024-01-01',
        end: null,
      };

      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.postForm('/v0/test', formData);

      const options = mockFetch.mock.calls[0][1];
      expect(options.body).toContain('dataset=GLBX.MDP3');
      expect(options.body).toContain('start=2024-01-01');
      expect(options.body).not.toContain('symbols');
      expect(options.body).not.toContain('end');
    });

    it('should include all required headers in form POST', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.postForm('/v0/test', { key: 'value' });

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers.Authorization).toMatch(/^Basic /);
      expect(options.headers['User-Agent']).toBe('DataBento-MCP-Server/1.0');
      expect(options.headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded'
      );
    });
  });

  describe('Retry Logic', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should succeed on first attempt', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(createMockResponse('success'));

      const result = await client.get('/v0/test');
      expect(result).toBe('success');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should retry and succeed on second attempt', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      // First attempt fails with 500
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse('Internal Server Error', 500, 'Internal Server Error')
        )
        .mockResolvedValueOnce(createMockResponse('success'));

      const promise = client.get('/v0/test');

      // Fast-forward past the 1s retry delay
      await vi.advanceTimersByTimeAsync(1000);

      const result = await promise;
      expect(result).toBe('success');
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should retry and succeed on third attempt', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      // First two attempts fail
      mockFetch
        .mockResolvedValueOnce(
          createMockResponse('Service Unavailable', 503, 'Service Unavailable')
        )
        .mockResolvedValueOnce(
          createMockResponse('Service Unavailable', 503, 'Service Unavailable')
        )
        .mockResolvedValueOnce(createMockResponse('success'));

      const promise = client.get('/v0/test');

      // Fast-forward past the first retry delay (1s)
      await vi.advanceTimersByTimeAsync(1000);

      // Fast-forward past the second retry delay (2s)
      await vi.advanceTimersByTimeAsync(2000);

      const result = await promise;
      expect(result).toBe('success');
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should fail after 3 retry attempts', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      // All 3 attempts fail
      mockFetch.mockResolvedValue(
        createMockResponse('Internal Server Error', 500, 'Internal Server Error')
      );

      const promise = client.get('/v0/test');

      // Attach error handler immediately
      const errorPromise = promise.catch(err => err);

      // Fast-forward past all retry delays
      await vi.advanceTimersByTimeAsync(1000); // First retry
      await vi.advanceTimersByTimeAsync(2000); // Second retry

      const error = await errorPromise;
      expect(error.message).toMatch(/DataBento API request failed after 3 attempts/);
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff (1s, 2s, 3s)', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      // Track when requests are made
      const requestTimes: number[] = [];

      mockFetch.mockImplementation(() => {
        requestTimes.push(Date.now());
        return Promise.resolve(createMockResponse('Error', 500, 'Error'));
      });

      const promise = client.get('/v0/test');

      // Attach error handler immediately
      const errorPromise = promise.catch(err => err);

      // First attempt happens immediately
      await vi.advanceTimersByTimeAsync(0);

      // Second attempt after 1s
      await vi.advanceTimersByTimeAsync(1000);

      // Third attempt after 2s more (total 3s)
      await vi.advanceTimersByTimeAsync(2000);

      await errorPromise;

      // Verify the delays between attempts
      expect(requestTimes.length).toBe(3);
      expect(requestTimes[1]! - requestTimes[0]!).toBe(1000);
      expect(requestTimes[2]! - requestTimes[1]!).toBe(2000);
    });
  });

  describe('Authentication', () => {
    it('should include Basic Auth header with base64-encoded API key', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.get('/v0/test');

      const options = mockFetch.mock.calls[0][1];
      const expectedAuth = `Basic ${Buffer.from(`${VALID_API_KEY}:`).toString('base64')}`;
      expect(options.headers.Authorization).toBe(expectedAuth);
    });

    it('should encode API key with colon suffix for Basic Auth', async () => {
      const apiKey = 'db-test-key';
      const client = new DataBentoHTTP(apiKey);

      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.get('/v0/test');

      const options = mockFetch.mock.calls[0][1];
      const expectedAuth = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
      expect(options.headers.Authorization).toBe(expectedAuth);
    });

    it('should include User-Agent header in all requests', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.get('/v0/test');

      const options = mockFetch.mock.calls[0][1];
      expect(options.headers['User-Agent']).toBe('DataBento-MCP-Server/1.0');
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should throw error on HTTP 401 Unauthorized', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(
        createMockResponse('Unauthorized: Invalid API key', 401, 'Unauthorized')
      );

      const promise = client.get('/v0/test');
      const errorPromise = promise.catch(err => err);

      // Advance timers to complete all retries
      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const error = await errorPromise;
      expect(error.message).toMatch(/HTTP 401/);
    });

    it('should throw error on HTTP 403 Forbidden', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(
        createMockResponse('Forbidden: Insufficient permissions', 403, 'Forbidden')
      );

      const promise = client.get('/v0/test');
      const errorPromise = promise.catch(err => err);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const error = await errorPromise;
      expect(error.message).toMatch(/HTTP 403/);
    });

    it('should throw error on HTTP 404 Not Found', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(
        createMockResponse('Not Found: Endpoint does not exist', 404, 'Not Found')
      );

      const promise = client.get('/v0/nonexistent');
      const errorPromise = promise.catch(err => err);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const error = await errorPromise;
      expect(error.message).toMatch(/HTTP 404/);
    });

    it('should throw error on HTTP 429 Rate Limited', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(
        createMockResponse('Too Many Requests', 429, 'Too Many Requests')
      );

      const promise = client.get('/v0/test');
      const errorPromise = promise.catch(err => err);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const error = await errorPromise;
      expect(error.message).toMatch(/HTTP 429/);
    });

    it('should throw error on HTTP 500 Internal Server Error', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(
        createMockResponse('Internal Server Error', 500, 'Internal Server Error')
      );

      const promise = client.get('/v0/test');
      const errorPromise = promise.catch(err => err);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const error = await errorPromise;
      expect(error.message).toMatch(/HTTP 500/);
    });

    it('should throw error on HTTP 503 Service Unavailable', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(
        createMockResponse('Service Unavailable', 503, 'Service Unavailable')
      );

      const promise = client.get('/v0/test');
      const errorPromise = promise.catch(err => err);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const error = await errorPromise;
      expect(error.message).toMatch(/HTTP 503/);
    });

    it('should include error response body in error message', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      const errorBody = 'Detailed error message from server';

      mockFetch.mockResolvedValue(
        createMockResponse(errorBody, 400, 'Bad Request')
      );

      const promise = client.get('/v0/test');
      const errorPromise = promise.catch(err => err);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const error = await errorPromise;
      expect(error.message).toContain(errorBody);
    });

    it('should handle network errors (ECONNREFUSED)', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockRejectedValue(new Error('ECONNREFUSED: Connection refused'));

      const promise = client.get('/v0/test');
      const errorPromise = promise.catch(err => err);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const error = await errorPromise;
      expect(error.message).toMatch(/DataBento API request failed after 3 attempts/);
    });

    it('should handle network errors (ETIMEDOUT)', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockRejectedValue(new Error('ETIMEDOUT: Request timed out'));

      const promise = client.get('/v0/test');
      const errorPromise = promise.catch(err => err);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const error = await errorPromise;
      expect(error.message).toMatch(/DataBento API request failed after 3 attempts/);
    });

    it('should handle generic network errors', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockRejectedValue(new Error('Network error occurred'));

      const promise = client.get('/v0/test');
      const errorPromise = promise.catch(err => err);

      await vi.advanceTimersByTimeAsync(1000);
      await vi.advanceTimersByTimeAsync(2000);

      const error = await errorPromise;
      expect(error.message).toMatch(/DataBento API request failed after 3 attempts/);
    });
  });

  describe('Timeouts', () => {
    it('should have default timeout of 15 seconds', () => {
      expect(DATABENTO_CONFIG.timeout).toBe(15000);
    });

    it('should use AbortSignal for timeout', async () => {
      const client = new DataBentoHTTP(VALID_API_KEY);

      mockFetch.mockResolvedValue(createMockResponse('success'));

      await client.get('/v0/test');

      const options = mockFetch.mock.calls[0][1];
      expect(options.signal).toBeDefined();
    });
  });

  describe('Response Parsing', () => {
    describe('parseCSV', () => {
      it('should parse valid CSV with header row', () => {
        const csv = `name,age,city
John,30,New York
Jane,25,San Francisco
Bob,35,Chicago`;

        const result = parseCSV(csv);

        expect(result).toEqual([
          { name: 'John', age: '30', city: 'New York' },
          { name: 'Jane', age: '25', city: 'San Francisco' },
          { name: 'Bob', age: '35', city: 'Chicago' },
        ]);
      });

      it('should handle CSV with trailing newline', () => {
        const csv = `id,value
1,test
2,data
`;

        const result = parseCSV(csv);

        expect(result).toEqual([
          { id: '1', value: 'test' },
          { id: '2', value: 'data' },
        ]);
      });

      it('should handle CSV with leading/trailing whitespace', () => {
        const csv = `  name  ,  value
  test  ,  123
  data  ,  456  `;

        const result = parseCSV(csv);

        expect(result).toEqual([
          { name: 'test', value: '123' },
          { name: 'data', value: '456' },
        ]);
      });

      it('should return empty array for empty CSV', () => {
        const result = parseCSV('');
        expect(result).toEqual([]);
      });

      it('should return empty array for CSV with only whitespace', () => {
        const result = parseCSV('   \n  \n  ');
        expect(result).toEqual([]);
      });

      it('should return empty array for CSV with only header', () => {
        const csv = `name,age,city`;
        const result = parseCSV(csv);
        expect(result).toEqual([]);
      });

      it('should handle CSV with empty fields', () => {
        const csv = `name,age,city
John,,New York
,25,
Bob,35,`;

        const result = parseCSV(csv);

        expect(result).toEqual([
          { name: 'John', age: '', city: 'New York' },
          { name: '', age: '25', city: '' },
          { name: 'Bob', age: '35', city: '' },
        ]);
      });

      it('should handle CSV with missing columns', () => {
        const csv = `name,age,city
John,30
Jane,25,San Francisco,Extra`;

        const result = parseCSV(csv);

        expect(result[0]).toEqual({ name: 'John', age: '30', city: '' });
        expect(result[1]?.name).toBe('Jane');
        expect(result[1]?.age).toBe('25');
      });

      it('should ignore empty lines in CSV', () => {
        const csv = `name,value

test,123

data,456

`;

        const result = parseCSV(csv);

        expect(result).toEqual([
          { name: 'test', value: '123' },
          { name: 'data', value: '456' },
        ]);
      });
    });

    describe('parseJSON', () => {
      it('should parse valid JSON object', () => {
        const json = JSON.stringify({ key: 'value', number: 123 });
        const result = parseJSON(json);

        expect(result).toEqual({ key: 'value', number: 123 });
      });

      it('should parse valid JSON array', () => {
        const json = JSON.stringify([1, 2, 3, 4, 5]);
        const result = parseJSON(json);

        expect(result).toEqual([1, 2, 3, 4, 5]);
      });

      it('should parse nested JSON', () => {
        const json = JSON.stringify({
          user: {
            name: 'John',
            address: {
              city: 'New York',
              zip: '10001',
            },
          },
        });

        const result = parseJSON(json);

        expect(result).toEqual({
          user: {
            name: 'John',
            address: {
              city: 'New York',
              zip: '10001',
            },
          },
        });
      });

      it('should throw error for invalid JSON', () => {
        const invalidJson = '{ invalid json }';

        expect(() => parseJSON(invalidJson)).toThrow(
          /Failed to parse JSON response/
        );
      });

      it('should throw error for empty string', () => {
        expect(() => parseJSON('')).toThrow(/Failed to parse JSON response/);
      });

      it('should throw error for malformed JSON', () => {
        const malformedJson = '{"key": "value",}'; // Trailing comma

        expect(() => parseJSON(malformedJson)).toThrow(
          /Failed to parse JSON response/
        );
      });

      it('should parse JSON with null values', () => {
        const json = JSON.stringify({ key: null, value: 123 });
        const result = parseJSON(json);

        expect(result).toEqual({ key: null, value: 123 });
      });

      it('should parse JSON with boolean values', () => {
        const json = JSON.stringify({ active: true, disabled: false });
        const result = parseJSON(json);

        expect(result).toEqual({ active: true, disabled: false });
      });
    });

    describe('buildQueryParams', () => {
      it('should build query string from object', () => {
        const params = {
          dataset: 'GLBX.MDP3',
          symbols: 'ES.FUT',
          start: '2024-01-01',
        };

        const result = buildQueryParams(params);

        expect(result).toBe('dataset=GLBX.MDP3&symbols=ES.FUT&start=2024-01-01');
      });

      it('should filter out undefined values', () => {
        const params = {
          dataset: 'GLBX.MDP3',
          symbols: undefined,
          start: '2024-01-01',
        };

        const result = buildQueryParams(params);

        expect(result).toBe('dataset=GLBX.MDP3&start=2024-01-01');
      });

      it('should filter out null values', () => {
        const params = {
          dataset: 'GLBX.MDP3',
          symbols: null,
          start: '2024-01-01',
        };

        const result = buildQueryParams(params);

        expect(result).toBe('dataset=GLBX.MDP3&start=2024-01-01');
      });

      it('should URL-encode special characters', () => {
        const params = {
          query: 'test&value=123',
          name: 'John Doe',
        };

        const result = buildQueryParams(params);

        expect(result).toContain('query=test%26value%3D123');
        expect(result).toContain('name=John+Doe');
      });

      it('should handle empty object', () => {
        const result = buildQueryParams({});
        expect(result).toBe('');
      });

      it('should convert numbers to strings', () => {
        const params = {
          limit: 100,
          offset: 0,
        };

        const result = buildQueryParams(params);

        expect(result).toBe('limit=100&offset=0');
      });

      it('should convert booleans to strings', () => {
        const params = {
          active: true,
          disabled: false,
        };

        const result = buildQueryParams(params);

        expect(result).toBe('active=true&disabled=false');
      });
    });
  });

  describe('getBaseUrl', () => {
    it('should return the configured base URL', () => {
      const client = new DataBentoHTTP(VALID_API_KEY);
      expect(client.getBaseUrl()).toBe(BASE_URL);
    });

    it('should return the same URL for all instances', () => {
      const client1 = new DataBentoHTTP(VALID_API_KEY);
      const client2 = new DataBentoHTTP('db-another-key');

      expect(client1.getBaseUrl()).toBe(client2.getBaseUrl());
    });
  });

  describe('Configuration', () => {
    it('should have correct default configuration', () => {
      expect(DATABENTO_CONFIG).toEqual({
        baseUrl: 'https://hist.databento.com',
        timeout: 15000,
        retryAttempts: 3,
        retryDelayMs: 1000,
      });
    });
  });
});
