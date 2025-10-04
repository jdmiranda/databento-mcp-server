/**
 * Unit tests for ReferenceClient
 * Tests security search, corporate actions, and adjustment factors
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReferenceClient } from "../../../src/api/reference-client.js";
import { DataBentoHTTP } from "../../../src/http/databento-http.js";
import {
  generateSecurityRecord,
  generateCorporateAction,
  generateAdjustmentFactor,
  generateCSVResponse,
} from "../../fixtures/mock-data.js";

describe("ReferenceClient", () => {
  let referenceClient: ReferenceClient;
  let mockHTTP: DataBentoHTTP;

  beforeEach(() => {
    referenceClient = new ReferenceClient("db-test-api-key-12345");
    // Get the internal HTTP client and mock its methods
    mockHTTP = (referenceClient as any).http as DataBentoHTTP;
    vi.spyOn(mockHTTP, "get").mockResolvedValue("");
  });

  describe("searchSecurities", () => {
    it("should search securities successfully", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "ESH5",
          stype: "FUTURE",
          first_available: "2024-01-01T00:00:00Z",
          last_available: "2024-03-15T23:59:59Z",
          exchange: "CME",
          asset_class: "Index",
          description: "E-mini S&P 500 March 2025",
          currency: "USD",
          contract_size: "50",
          tick_size: "0.25",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: ["ESH5"],
      });

      expect(result.securities).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.securities[0].symbol).toBe("ESH5");
      expect(result.securities[0].instrument_id).toBe(12345);
    });

    it("should use correct endpoint", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "ESH5",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/metadata.list_symbols",
        expect.any(Object)
      );
    });

    it("should convert string symbols to comma-separated", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "ESH5",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/metadata.list_symbols",
        expect.objectContaining({
          symbols: "ESH5",
        })
      );
    });

    it("should convert array symbols to comma-separated", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: ["ESH5", "NQH5", "YMH5"],
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/metadata.list_symbols",
        expect.objectContaining({
          symbols: "ESH5,NQH5,YMH5",
        })
      );
    });

    it("should use default stype_in if not provided", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "ESH5",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/metadata.list_symbols",
        expect.objectContaining({
          stype_in: "raw_symbol",
        })
      );
    });

    it("should use custom stype_in when provided", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "12345",
        stype_in: "instrument_id",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/metadata.list_symbols",
        expect.objectContaining({
          stype_in: "instrument_id",
        })
      );
    });

    it("should use default limit if not provided", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "ESH5",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/metadata.list_symbols",
        expect.objectContaining({
          limit: 1000,
        })
      );
    });

    it("should use custom limit when provided", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "ESH5",
        limit: 500,
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/metadata.list_symbols",
        expect.objectContaining({
          limit: 500,
        })
      );
    });

    it("should include date range when provided", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "ESH5",
        start_date: "2024-01-01",
        end_date: "2024-01-31",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/metadata.list_symbols",
        expect.objectContaining({
          start: "2024-01-01",
          end: "2024-01-31",
        })
      );
    });

    it("should parse CSV to SecurityRecord objects", async () => {
      const csvData = [
        {
          instrument_id: "98765",
          raw_symbol: "NQH5",
          stype: "FUTURE",
          ts_start: "2024-01-01T00:00:00Z",
          ts_end: "2024-03-15T23:59:59Z",
          venue: "CME",
          asset_class: "Index",
          description: "E-mini Nasdaq-100 March 2025",
          isin: "US1234567890",
          currency: "USD",
          contract_size: "20",
          tick_size: "0.25",
          expiration: "2025-03-15",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "NQH5",
      });

      expect(result.securities[0]).toMatchObject({
        instrument_id: 98765,
        symbol: "NQH5",
        dataset: "GLBX.MDP3",
        stype: "FUTURE",
        first_available: "2024-01-01T00:00:00Z",
        last_available: "2024-03-15T23:59:59Z",
        exchange: "CME",
        asset_class: "Index",
        description: "E-mini Nasdaq-100 March 2025",
        isin: "US1234567890",
        currency: "USD",
        contract_size: 20,
        tick_size: 0.25,
        expiration: "2025-03-15",
      });
    });

    it("should handle alternative field names", async () => {
      const csvData = [
        {
          id: "12345",
          raw_symbol: "ESH5",
          stype: "FUTURE",
          ts_start: "2024-01-01T00:00:00Z",
          ts_end: "2024-03-15T23:59:59Z",
          venue: "CME",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "ESH5",
      });

      expect(result.securities[0].instrument_id).toBe(12345);
      expect(result.securities[0].exchange).toBe("CME");
    });

    it("should handle empty results", async () => {
      const mockResponse = generateCSVResponse([]);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "INVALID",
      });

      expect(result.securities).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it("should handle missing optional fields", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "ESH5",
          stype: "FUTURE",
          first_available: "2024-01-01T00:00:00Z",
          last_available: "2024-03-15T23:59:59Z",
          exchange: "CME",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: "ESH5",
      });

      expect(result.securities[0].asset_class).toBeUndefined();
      expect(result.securities[0].description).toBeUndefined();
      expect(result.securities[0].isin).toBeUndefined();
    });

    it("should propagate HTTP errors with context", async () => {
      const error = new Error("HTTP 401: Unauthorized");

      vi.spyOn(mockHTTP, "get").mockRejectedValue(error);

      await expect(
        referenceClient.searchSecurities({
          dataset: "GLBX.MDP3",
          symbols: "ESH5",
        })
      ).rejects.toThrow("Failed to search securities");
    });

    it("should handle multiple securities", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "ESH5",
          stype: "FUTURE",
          first_available: "2024-01-01T00:00:00Z",
          last_available: "2024-03-15T23:59:59Z",
          exchange: "CME",
        },
        {
          instrument_id: "67890",
          symbol: "NQH5",
          stype: "FUTURE",
          first_available: "2024-01-01T00:00:00Z",
          last_available: "2024-03-15T23:59:59Z",
          exchange: "CME",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.searchSecurities({
        dataset: "GLBX.MDP3",
        symbols: ["ESH5", "NQH5"],
      });

      expect(result.securities).toHaveLength(2);
      expect(result.count).toBe(2);
    });
  });

  describe("getCorporateActions", () => {
    it("should get corporate actions successfully", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          action_type: "DIVIDEND",
          ts_event: "2024-05-15T00:00:00Z",
          amount: "0.25",
          currency: "USD",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.actions).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.actions[0].action_type).toBe("DIVIDEND");
    });

    it("should use correct endpoint", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/timeseries.get_range",
        expect.objectContaining({
          schema: "corporate_actions",
        })
      );
    });

    it("should convert symbols to comma-separated string", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: ["AAPL", "MSFT", "GOOGL"],
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/timeseries.get_range",
        expect.objectContaining({
          symbols: "AAPL,MSFT,GOOGL",
        })
      );
    });

    it("should filter by action types", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          action_type: "DIVIDEND",
          ts_event: "2024-05-15T00:00:00Z",
          amount: "0.25",
        },
        {
          instrument_id: "12345",
          symbol: "AAPL",
          action_type: "SPLIT",
          ts_event: "2024-06-15T00:00:00Z",
          split_ratio: "2:1",
          split_factor: "2.0",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
        action_types: ["DIVIDEND"],
      });

      expect(result.actions).toHaveLength(1);
      expect(result.actions[0].action_type).toBe("DIVIDEND");
    });

    it("should not filter when action_types is empty", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          action_type: "DIVIDEND",
          ts_event: "2024-05-15T00:00:00Z",
        },
        {
          instrument_id: "12345",
          symbol: "AAPL",
          action_type: "SPLIT",
          ts_event: "2024-06-15T00:00:00Z",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
        action_types: [],
      });

      expect(result.actions).toHaveLength(2);
    });

    it("should filter multiple action types", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          action_type: "DIVIDEND",
          ts_event: "2024-05-15T00:00:00Z",
        },
        {
          instrument_id: "12345",
          symbol: "AAPL",
          action_type: "SPLIT",
          ts_event: "2024-06-15T00:00:00Z",
        },
        {
          instrument_id: "12345",
          symbol: "AAPL",
          action_type: "MERGER",
          ts_event: "2024-07-15T00:00:00Z",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
        action_types: ["DIVIDEND", "SPLIT"],
      });

      expect(result.actions).toHaveLength(2);
      expect(result.actions.map((a) => a.action_type)).toEqual([
        "DIVIDEND",
        "SPLIT",
      ]);
    });

    it("should parse all corporate action fields", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          type: "DIVIDEND",
          effective_date: "2024-05-15T00:00:00Z",
          announcement_date: "2024-04-15T00:00:00Z",
          ex_date: "2024-05-14T00:00:00Z",
          record_date: "2024-05-13T00:00:00Z",
          payment_date: "2024-05-20T00:00:00Z",
          amount: "0.25",
          currency: "USD",
          details: "Quarterly dividend",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.actions[0]).toMatchObject({
        instrument_id: 12345,
        symbol: "AAPL",
        dataset: "XNAS.ITCH",
        action_type: "DIVIDEND",
        effective_date: "2024-05-15T00:00:00Z",
        announcement_date: "2024-04-15T00:00:00Z",
        ex_date: "2024-05-14T00:00:00Z",
        record_date: "2024-05-13T00:00:00Z",
        payment_date: "2024-05-20T00:00:00Z",
        amount: 0.25,
        currency: "USD",
        details: "Quarterly dividend",
      });
    });

    it("should parse split actions", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          action_type: "SPLIT",
          effective_date: "2024-06-15T00:00:00Z",
          split_ratio: "4:1",
          split_factor: "4.0",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.actions[0].split_ratio).toBe("4:1");
      expect(result.actions[0].split_factor).toBe(4.0);
    });

    it("should handle alternative field names", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          type: "DIVIDEND",
          ts_event: "2024-05-15T00:00:00Z",
          amount: "0.25",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.actions[0].action_type).toBe("DIVIDEND");
      expect(result.actions[0].effective_date).toBe("2024-05-15T00:00:00Z");
    });

    it("should handle empty results", async () => {
      const mockResponse = generateCSVResponse([]);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "INVALID",
      });

      expect(result.actions).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it("should use default symbol from request when missing in CSV", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          action_type: "DIVIDEND",
          effective_date: "2024-05-15T00:00:00Z",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.actions[0].symbol).toBe("AAPL");
    });

    it("should propagate HTTP errors with context", async () => {
      const error = new Error("HTTP 404: Not Found");

      vi.spyOn(mockHTTP, "get").mockRejectedValue(error);

      await expect(
        referenceClient.getCorporateActions({
          dataset: "XNAS.ITCH",
          symbols: "AAPL",
        })
      ).rejects.toThrow("Failed to get corporate actions");
    });

    it("should include date range when provided", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/timeseries.get_range",
        expect.objectContaining({
          start: "2024-01-01",
          end: "2024-12-31",
        })
      );
    });

    it("should use default stype_in", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.getCorporateActions({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/timeseries.get_range",
        expect.objectContaining({
          stype_in: "raw_symbol",
        })
      );
    });
  });

  describe("getAdjustmentFactors", () => {
    it("should get adjustment factors successfully", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          effective_date: "2024-05-15T00:00:00Z",
          price_factor: "1.05",
          volume_factor: "0.95",
          reason: "DIVIDEND",
          action_type: "DIVIDEND",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.adjustments).toHaveLength(1);
      expect(result.count).toBe(1);
      expect(result.adjustments[0].price_factor).toBe(1.05);
    });

    it("should use correct endpoint", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/timeseries.get_range",
        expect.objectContaining({
          schema: "adjustment",
        })
      );
    });

    it("should parse all adjustment factor fields", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          effective_date: "2024-05-15T00:00:00Z",
          price_factor: "1.05",
          volume_factor: "0.95",
          reason: "DIVIDEND",
          action_type: "DIVIDEND",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.adjustments[0]).toMatchObject({
        instrument_id: 12345,
        symbol: "AAPL",
        dataset: "XNAS.ITCH",
        effective_date: "2024-05-15T00:00:00Z",
        price_factor: 1.05,
        volume_factor: 0.95,
        reason: "DIVIDEND",
        action_type: "DIVIDEND",
      });
    });

    it("should handle alternative field names", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          ts_event: "2024-05-15T00:00:00Z",
          price_adj_factor: "1.05",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.adjustments[0].effective_date).toBe("2024-05-15T00:00:00Z");
      expect(result.adjustments[0].price_factor).toBe(1.05);
    });

    it("should default price_factor to 1.0 if missing", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          effective_date: "2024-05-15T00:00:00Z",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.adjustments[0].price_factor).toBe(1.0);
    });

    it("should handle volume_factor when missing", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          effective_date: "2024-05-15T00:00:00Z",
          price_factor: "1.05",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.adjustments[0].volume_factor).toBeUndefined();
    });

    it("should convert symbols to comma-separated string", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: ["AAPL", "MSFT", "GOOGL"],
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/timeseries.get_range",
        expect.objectContaining({
          symbols: "AAPL,MSFT,GOOGL",
        })
      );
    });

    it("should handle empty results", async () => {
      const mockResponse = generateCSVResponse([]);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "INVALID",
      });

      expect(result.adjustments).toHaveLength(0);
      expect(result.count).toBe(0);
    });

    it("should use default symbol from request when missing in CSV", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          effective_date: "2024-05-15T00:00:00Z",
          price_factor: "1.05",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.adjustments[0].symbol).toBe("AAPL");
    });

    it("should handle multiple adjustment factors", async () => {
      const csvData = [
        {
          instrument_id: "12345",
          symbol: "AAPL",
          effective_date: "2024-05-15T00:00:00Z",
          price_factor: "1.05",
          reason: "DIVIDEND",
        },
        {
          instrument_id: "12345",
          symbol: "AAPL",
          effective_date: "2024-06-15T00:00:00Z",
          price_factor: "4.0",
          reason: "SPLIT",
        },
      ];
      const mockResponse = generateCSVResponse(csvData);

      vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      const result = await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(result.adjustments).toHaveLength(2);
      expect(result.count).toBe(2);
    });

    it("should include date range when provided", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
        start_date: "2024-01-01",
        end_date: "2024-12-31",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/timeseries.get_range",
        expect.objectContaining({
          start: "2024-01-01",
          end: "2024-12-31",
        })
      );
    });

    it("should use default stype_in", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "AAPL",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/timeseries.get_range",
        expect.objectContaining({
          stype_in: "raw_symbol",
        })
      );
    });

    it("should use custom stype_in when provided", async () => {
      const mockResponse = generateCSVResponse([]);
      const getSpy = vi.spyOn(mockHTTP, "get").mockResolvedValue(mockResponse);

      await referenceClient.getAdjustmentFactors({
        dataset: "XNAS.ITCH",
        symbols: "12345",
        stype_in: "instrument_id",
      });

      expect(getSpy).toHaveBeenCalledWith(
        "/v0/timeseries.get_range",
        expect.objectContaining({
          stype_in: "instrument_id",
        })
      );
    });

    it("should propagate HTTP errors with context", async () => {
      const error = new Error("HTTP 500: Internal Server Error");

      vi.spyOn(mockHTTP, "get").mockRejectedValue(error);

      await expect(
        referenceClient.getAdjustmentFactors({
          dataset: "XNAS.ITCH",
          symbols: "AAPL",
        })
      ).rejects.toThrow("Failed to get adjustment factors");
    });
  });
});
