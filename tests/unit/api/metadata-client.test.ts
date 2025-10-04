/**
 * Unit tests for MetadataClient
 * Tests all 8 methods with parameter validation, response parsing, and error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetadataClient } from '../../../src/api/metadata-client.js';
import { DataBentoHTTP } from '../../../src/http/databento-http.js';
import {
  mockDatasets,
  mockSchemas,
  mockPublishers,
  mockFields,
  mockUnitPrices,
  mockDatasetRange,
  mockDatasetCondition,
  mockCost,
  toJSONResponse,
  mockErrorResponses,
} from '../../fixtures/databento-responses.js';

describe('MetadataClient', () => {
  let client: MetadataClient;
  let mockHttp: DataBentoHTTP;

  beforeEach(() => {
    // Create mock HTTP client
    mockHttp = {
      get: vi.fn(),
      post: vi.fn(),
      postForm: vi.fn(),
      getBaseUrl: vi.fn(() => 'https://hist.databento.com'),
    } as any;

    client = new MetadataClient(mockHttp);
  });

  describe('listDatasets', () => {
    it('should list all datasets without parameters', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockDatasets));

      const result = await client.listDatasets();

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.list_datasets', {});
      expect(result).toEqual(mockDatasets);
      expect(result).toHaveLength(4);
      expect(result).toContain('GLBX.MDP3');
      expect(result).toContain('XNAS.ITCH');
    });

    it('should list datasets with start_date filter', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockDatasets));

      const result = await client.listDatasets({ start_date: '2024-01-01' });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.list_datasets', {
        start_date: '2024-01-01',
      });
      expect(result).toEqual(mockDatasets);
    });

    it('should list datasets with date range filter', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockDatasets));

      const result = await client.listDatasets({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.list_datasets', {
        start_date: '2024-01-01',
        end_date: '2024-12-31',
      });
      expect(result).toEqual(mockDatasets);
    });

    it('should handle empty dataset list', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse([]));

      const result = await client.listDatasets();

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should propagate HTTP errors', async () => {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(
        new Error(mockErrorResponses.unauthorized)
      );

      await expect(client.listDatasets()).rejects.toThrow('Unauthorized');
    });

    it('should handle malformed JSON response', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce('invalid json {');

      await expect(client.listDatasets()).rejects.toThrow('Failed to parse JSON');
    });
  });

  describe('listSchemas', () => {
    it('should list schemas for a dataset', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockSchemas));

      const result = await client.listSchemas({ dataset: 'GLBX.MDP3' });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.list_schemas', {
        dataset: 'GLBX.MDP3',
      });
      expect(result).toEqual(mockSchemas);
      expect(result).toContain('mbp-1');
      expect(result).toContain('trades');
      expect(result).toContain('ohlcv-1h');
    });

    it('should handle empty schema list', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse([]));

      const result = await client.listSchemas({ dataset: 'UNKNOWN.DATASET' });

      expect(result).toEqual([]);
    });

    it('should propagate errors for invalid dataset', async () => {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(
        new Error(mockErrorResponses.notFound)
      );

      await expect(client.listSchemas({ dataset: 'INVALID' })).rejects.toThrow(
        'Not Found'
      );
    });
  });

  describe('listPublishers', () => {
    it('should list all publishers without dataset filter', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockPublishers));

      const result = await client.listPublishers();

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.list_publishers', {});
      expect(result).toEqual(mockPublishers);
      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('publisher_id', 1);
      expect(result[0]).toHaveProperty('venue', 'CME');
    });

    it('should list publishers filtered by dataset', async () => {
      const filteredPublishers = [mockPublishers[0]];
      vi.mocked(mockHttp.get).mockResolvedValueOnce(
        toJSONResponse(filteredPublishers)
      );

      const result = await client.listPublishers('GLBX.MDP3');

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.list_publishers', {
        dataset: 'GLBX.MDP3',
      });
      expect(result).toEqual(filteredPublishers);
      expect(result).toHaveLength(1);
      expect(result[0].dataset).toBe('GLBX.MDP3');
    });

    it('should validate publisher response structure', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockPublishers));

      const result = await client.listPublishers();

      result.forEach((publisher) => {
        expect(publisher).toHaveProperty('publisher_id');
        expect(publisher).toHaveProperty('dataset');
        expect(publisher).toHaveProperty('venue');
        expect(publisher).toHaveProperty('description');
        expect(typeof publisher.publisher_id).toBe('number');
        expect(typeof publisher.dataset).toBe('string');
      });
    });

    it('should handle empty publisher list', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse([]));

      const result = await client.listPublishers('NONEXISTENT');

      expect(result).toEqual([]);
    });
  });

  describe('listFields', () => {
    it('should list fields for a schema', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockFields));

      const result = await client.listFields({ schema: 'trades' });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.list_fields', {
        schema: 'trades',
      });
      expect(result).toEqual(mockFields);
      expect(result).toHaveLength(4);
    });

    it('should list fields with encoding parameter', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockFields));

      const result = await client.listFields({
        schema: 'trades',
        encoding: 'csv',
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.list_fields', {
        schema: 'trades',
        encoding: 'csv',
      });
      expect(result).toEqual(mockFields);
    });

    it('should validate field response structure', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockFields));

      const result = await client.listFields({ schema: 'trades' });

      result.forEach((field) => {
        expect(field).toHaveProperty('name');
        expect(field).toHaveProperty('type');
        expect(typeof field.name).toBe('string');
        expect(typeof field.type).toBe('string');
      });
    });

    it('should handle different encoding types', async () => {
      const encodings = ['csv', 'json', 'dbn'];

      for (const encoding of encodings) {
        vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockFields));

        const result = await client.listFields({ schema: 'trades', encoding });

        expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.list_fields', {
          schema: 'trades',
          encoding,
        });
        expect(result).toEqual(mockFields);
      }
    });
  });

  describe('listUnitPrices', () => {
    it('should list unit prices for a dataset', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockUnitPrices));

      const result = await client.listUnitPrices({ dataset: 'GLBX.MDP3' });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.list_unit_prices', {
        dataset: 'GLBX.MDP3',
      });
      expect(result).toEqual(mockUnitPrices);
      expect(result).toHaveLength(3);
    });

    it('should validate unit price response structure', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockUnitPrices));

      const result = await client.listUnitPrices({ dataset: 'GLBX.MDP3' });

      result.forEach((price) => {
        expect(price).toHaveProperty('mode');
        expect(price).toHaveProperty('schema');
        expect(price).toHaveProperty('unit_price');
        expect(price).toHaveProperty('currency');
        expect(typeof price.unit_price).toBe('number');
        expect(price.currency).toBe('USD');
      });
    });

    it('should handle various pricing models', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockUnitPrices));

      const result = await client.listUnitPrices({ dataset: 'GLBX.MDP3' });

      expect(result.some((p) => p.schema === 'mbp-1')).toBe(true);
      expect(result.some((p) => p.schema === 'trades')).toBe(true);
      expect(result.some((p) => p.schema === 'ohlcv-1h')).toBe(true);
    });

    it('should handle empty unit prices', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse([]));

      const result = await client.listUnitPrices({ dataset: 'FREE.DATASET' });

      expect(result).toEqual([]);
    });
  });

  describe('getDatasetRange', () => {
    it('should get dataset date range', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(
        toJSONResponse(mockDatasetRange)
      );

      const result = await client.getDatasetRange({ dataset: 'GLBX.MDP3' });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.get_dataset_range', {
        dataset: 'GLBX.MDP3',
      });
      expect(result).toEqual(mockDatasetRange);
      expect(result).toHaveProperty('start_date');
      expect(result).toHaveProperty('end_date');
      expect(result).toHaveProperty('available_date');
    });

    it('should validate date range format', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(
        toJSONResponse(mockDatasetRange)
      );

      const result = await client.getDatasetRange({ dataset: 'GLBX.MDP3' });

      expect(result.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.end_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result.available_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should handle errors for invalid dataset', async () => {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(
        new Error(mockErrorResponses.notFound)
      );

      await expect(
        client.getDatasetRange({ dataset: 'INVALID' })
      ).rejects.toThrow('Not Found');
    });
  });

  describe('getDatasetCondition', () => {
    it('should get dataset condition without date range', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(
        toJSONResponse(mockDatasetCondition)
      );

      const result = await client.getDatasetCondition({ dataset: 'GLBX.MDP3' });

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/v0/metadata.get_dataset_condition',
        {
          dataset: 'GLBX.MDP3',
        }
      );
      expect(result).toEqual(mockDatasetCondition);
      expect(result).toHaveLength(3);
    });

    it('should get dataset condition with start_date', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(
        toJSONResponse(mockDatasetCondition)
      );

      const result = await client.getDatasetCondition({
        dataset: 'GLBX.MDP3',
        start_date: '2024-01-01',
      });

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/v0/metadata.get_dataset_condition',
        {
          dataset: 'GLBX.MDP3',
          start_date: '2024-01-01',
        }
      );
      expect(result).toEqual(mockDatasetCondition);
    });

    it('should get dataset condition with date range', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(
        toJSONResponse(mockDatasetCondition)
      );

      const result = await client.getDatasetCondition({
        dataset: 'GLBX.MDP3',
        start_date: '2024-01-01',
        end_date: '2024-01-03',
      });

      expect(mockHttp.get).toHaveBeenCalledWith(
        '/v0/metadata.get_dataset_condition',
        {
          dataset: 'GLBX.MDP3',
          start_date: '2024-01-01',
          end_date: '2024-01-03',
        }
      );
      expect(result).toEqual(mockDatasetCondition);
    });

    it('should validate condition values', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(
        toJSONResponse(mockDatasetCondition)
      );

      const result = await client.getDatasetCondition({ dataset: 'GLBX.MDP3' });

      const validConditions = ['available', 'pending', 'missing', 'degraded'];
      result.forEach((condition) => {
        expect(validConditions).toContain(condition.condition);
        expect(condition).toHaveProperty('date');
        expect(condition.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });

    it('should handle empty condition array', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse([]));

      const result = await client.getDatasetCondition({
        dataset: 'GLBX.MDP3',
        start_date: '2099-01-01',
      });

      expect(result).toEqual([]);
    });
  });

  describe('getCost', () => {
    it('should calculate cost with minimal parameters', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockCost));

      const result = await client.getCost({
        dataset: 'GLBX.MDP3',
        start: '2024-01-01',
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.get_cost', {
        dataset: 'GLBX.MDP3',
        start: '2024-01-01',
      });
      expect(result).toEqual(mockCost);
      expect(result).toHaveProperty('total_cost');
      expect(result).toHaveProperty('currency', 'USD');
    });

    it('should calculate cost with all parameters', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockCost));

      const result = await client.getCost({
        dataset: 'GLBX.MDP3',
        symbols: ['ES.c.0', 'NQ.c.0'],
        schema: 'ohlcv-1h',
        start: '2024-01-01',
        end: '2024-01-31',
        mode: 'historical',
        stype_in: 'continuous',
        stype_out: 'instrument_id',
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.get_cost', {
        dataset: 'GLBX.MDP3',
        symbols: 'ES.c.0,NQ.c.0',
        schema: 'ohlcv-1h',
        start: '2024-01-01',
        end: '2024-01-31',
        mode: 'historical',
        stype_in: 'continuous',
        stype_out: 'instrument_id',
      });
      expect(result).toEqual(mockCost);
    });

    it('should handle symbols as string', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockCost));

      const result = await client.getCost({
        dataset: 'GLBX.MDP3',
        symbols: 'ES.c.0,NQ.c.0',
        start: '2024-01-01',
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.get_cost', {
        dataset: 'GLBX.MDP3',
        symbols: 'ES.c.0,NQ.c.0',
        start: '2024-01-01',
      });
      expect(result).toEqual(mockCost);
    });

    it('should handle symbols as array', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockCost));

      const result = await client.getCost({
        dataset: 'GLBX.MDP3',
        symbols: ['ES.c.0', 'NQ.c.0'],
        start: '2024-01-01',
      });

      expect(mockHttp.get).toHaveBeenCalledWith('/v0/metadata.get_cost', {
        dataset: 'GLBX.MDP3',
        symbols: 'ES.c.0,NQ.c.0',
        start: '2024-01-01',
      });
    });

    it('should validate cost response structure', async () => {
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(mockCost));

      const result = await client.getCost({
        dataset: 'GLBX.MDP3',
        start: '2024-01-01',
      });

      expect(result).toHaveProperty('dataset');
      expect(result).toHaveProperty('schema');
      expect(result).toHaveProperty('start');
      expect(result).toHaveProperty('mode');
      expect(result).toHaveProperty('total_cost');
      expect(result).toHaveProperty('currency');
      expect(typeof result.total_cost).toBe('number');
      expect(result.total_cost).toBeGreaterThanOrEqual(0);
    });

    it('should handle zero cost queries', async () => {
      const zeroCost = { ...mockCost, total_cost: 0, total_records: 0 };
      vi.mocked(mockHttp.get).mockResolvedValueOnce(toJSONResponse(zeroCost));

      const result = await client.getCost({
        dataset: 'GLBX.MDP3',
        start: '2099-01-01',
      });

      expect(result.total_cost).toBe(0);
      expect(result.total_records).toBe(0);
    });

    it('should propagate errors for invalid parameters', async () => {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(
        new Error(mockErrorResponses.badRequest)
      );

      await expect(
        client.getCost({
          dataset: 'INVALID',
          start: 'invalid-date',
        })
      ).rejects.toThrow('Bad Request');
    });
  });

  describe('error handling', () => {
    it('should handle 401 Unauthorized errors', async () => {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(
        new Error(mockErrorResponses.unauthorized)
      );

      await expect(client.listDatasets()).rejects.toThrow('Unauthorized');
    });

    it('should handle 403 Forbidden errors', async () => {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(
        new Error(mockErrorResponses.forbidden)
      );

      await expect(client.listSchemas({ dataset: 'PREMIUM' })).rejects.toThrow(
        'Forbidden'
      );
    });

    it('should handle 429 Rate Limited errors', async () => {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(
        new Error(mockErrorResponses.rateLimited)
      );

      await expect(client.listDatasets()).rejects.toThrow('Rate limit exceeded');
    });

    it('should handle 500 Server errors', async () => {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(
        new Error(mockErrorResponses.serverError)
      );

      await expect(client.listDatasets()).rejects.toThrow('Internal Server Error');
    });

    it('should handle network errors', async () => {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      await expect(client.listDatasets()).rejects.toThrow('Network request failed');
    });

    it('should handle timeout errors', async () => {
      vi.mocked(mockHttp.get).mockRejectedValueOnce(new Error('Request timeout'));

      await expect(client.listDatasets()).rejects.toThrow('timeout');
    });
  });
});
