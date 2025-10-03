/**
 * DataBento API Client for MCP Server
 * Handles communication with DataBento historical and real-time APIs
 */

interface QuoteData {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  timestamp: Date;
  dataAge: number; // milliseconds since data was generated
}

interface BarData {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SessionInfo {
  currentSession: "Asian" | "London" | "NY" | "Unknown";
  sessionStart: Date;
  sessionEnd: Date;
  timestamp: Date;
}

const DATABENTO_CONFIG = {
  baseUrl: "https://hist.databento.com",
  timeout: 15000,
  retryAttempts: 3,
  retryDelayMs: 1000,
};

// Symbol mapping for continuous contracts
const SYMBOL_MAP: Record<string, string> = {
  ES: "ES.c.0", // E-mini S&P 500 continuous contract
  NQ: "NQ.c.0", // E-mini NASDAQ continuous contract
};

const DATASET = "GLBX.MDP3"; // CME Group Market Data Platform 3

/**
 * DataBento API Client
 */
export class DataBentoClient {
  private readonly apiKey: string;
  private priceCache: Map<string, { data: QuoteData; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error("DATABENTO_API_KEY is required");
    }
    if (!apiKey.startsWith("db-")) {
      throw new Error('DATABENTO_API_KEY must start with "db-"');
    }
    this.apiKey = apiKey;
  }

  /**
   * Make HTTP request to DataBento API with retries
   */
  private async makeRequest(
    endpoint: string,
    params: Record<string, any> = {}
  ): Promise<string> {
    const url = new URL(endpoint, DATABENTO_CONFIG.baseUrl);

    // Add query parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    for (let attempt = 1; attempt <= DATABENTO_CONFIG.retryAttempts; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method: "GET",
          headers: {
            Authorization: `Basic ${Buffer.from(`${this.apiKey}:`).toString("base64")}`,
            Accept: "application/json",
            "User-Agent": "DataBento-MCP-Server/1.0",
          },
          signal: AbortSignal.timeout(DATABENTO_CONFIG.timeout),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
        }

        return await response.text();
      } catch (error) {
        if (attempt === DATABENTO_CONFIG.retryAttempts) {
          throw new Error(
            `DataBento API request failed after ${DATABENTO_CONFIG.retryAttempts} attempts: ${error}`
          );
        }

        // Wait before retry with exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, DATABENTO_CONFIG.retryDelayMs * attempt)
        );
      }
    }

    throw new Error("Unexpected error in DataBento request");
  }

  /**
   * Get current quote for a futures symbol (ES or NQ)
   */
  async getQuote(symbol: "ES" | "NQ"): Promise<QuoteData> {
    // Check cache first
    const cacheKey = symbol;
    const cached = this.priceCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const databentoSymbol = SYMBOL_MAP[symbol];
    if (!databentoSymbol) {
      throw new Error(`Invalid symbol: ${symbol}`);
    }

    const today = new Date();
    const endDate = new Date(today);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 7); // 7-day lookback for weekends

    const params = {
      dataset: DATASET,
      symbols: databentoSymbol,
      stype_in: "continuous",
      stype_out: "instrument_id",
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
      schema: "mbp-1", // Market by price level 1 (best bid/ask)
      limit: 100,
    };

    const response = await this.makeRequest("/v0/timeseries.get_range", params);

    if (!response || response.length === 0) {
      throw new Error(`No quote data available for ${symbol}`);
    }

    // Parse CSV response
    const lines = response.split("\n");
    const dataLines = lines.slice(1).filter((line) => line.trim());

    if (dataLines.length === 0) {
      throw new Error(`No recent data available for ${symbol}`);
    }

    const latestLine = dataLines[dataLines.length - 1];
    const fields = latestLine.split(",");

    // CSV format: ts_recv,ts_event,rtype,publisher_id,instrument_id,action,side,depth,price,size,flags,ts_in_delta,sequence,bid_px_00,ask_px_00,...
    const bidPx = parseFloat(fields[13]) / 1e9; // bid_px_00
    const askPx = parseFloat(fields[14]) / 1e9; // ask_px_00
    const tsEvent = parseInt(fields[1]); // ts_event in nanoseconds

    const price = (bidPx + askPx) / 2;
    const timestamp = new Date(Math.floor(tsEvent / 1_000_000)); // nanoseconds to milliseconds
    const dataAge = Date.now() - timestamp.getTime();

    const quoteData: QuoteData = {
      symbol,
      price,
      bid: bidPx,
      ask: askPx,
      timestamp,
      dataAge,
    };

    // Cache the result
    this.priceCache.set(cacheKey, { data: quoteData, timestamp: Date.now() });

    return quoteData;
  }

  /**
   * Get historical bars for a symbol
   */
  async getHistoricalBars(
    symbol: "ES" | "NQ",
    timeframe: "1h" | "H4" | "1d",
    count: number
  ): Promise<BarData[]> {
    const databentoSymbol = SYMBOL_MAP[symbol];
    if (!databentoSymbol) {
      throw new Error(`Invalid symbol: ${symbol}`);
    }

    // Calculate date range based on count and timeframe
    const endDate = new Date();
    const startDate = new Date();

    if (timeframe === "1h") {
      startDate.setDate(startDate.getDate() - Math.ceil(count / 24) - 7);
    } else if (timeframe === "H4") {
      startDate.setDate(startDate.getDate() - Math.ceil(count / 6) - 7);
    } else if (timeframe === "1d") {
      startDate.setDate(startDate.getDate() - count - 7);
    }

    const schema = timeframe === "1d" ? "ohlcv-1d" : "ohlcv-1h";

    const params = {
      dataset: DATASET,
      symbols: databentoSymbol,
      stype_in: "continuous",
      stype_out: "instrument_id",
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
      schema: schema,
      limit: 1000,
    };

    const response = await this.makeRequest("/v0/timeseries.get_range", params);

    if (!response || response.length === 0) {
      throw new Error(`No bar data available for ${symbol}`);
    }

    // Parse CSV response
    const lines = response.split("\n");
    const dataLines = lines.slice(1).filter((line) => line.trim());

    if (dataLines.length === 0) {
      throw new Error(`No bar data available for ${symbol}`);
    }

    const bars: BarData[] = dataLines.map((line) => {
      const fields = line.split(",");

      // CSV format: ts_event,rtype,publisher_id,instrument_id,open,high,low,close,volume
      const tsEvent = parseInt(fields[0]);
      const open = parseFloat(fields[4]) / 1e9;
      const high = parseFloat(fields[5]) / 1e9;
      const low = parseFloat(fields[6]) / 1e9;
      const close = parseFloat(fields[7]) / 1e9;
      const volume = parseFloat(fields[8]);

      return {
        timestamp: new Date(Math.floor(tsEvent / 1_000_000)),
        open,
        high,
        low,
        close,
        volume,
      };
    });

    // Handle H4 aggregation if needed
    if (timeframe === "H4") {
      return this.aggregateToH4(bars);
    }

    // Return last N bars
    return bars.slice(-count);
  }

  /**
   * Aggregate 1h bars to H4 bars
   */
  private aggregateToH4(bars: BarData[]): BarData[] {
    const h4Bars: BarData[] = [];

    for (let i = 0; i < bars.length; i += 4) {
      const chunk = bars.slice(i, i + 4);
      if (chunk.length === 0) continue;

      h4Bars.push({
        timestamp: chunk[0].timestamp,
        open: chunk[0].open,
        high: Math.max(...chunk.map((b) => b.high)),
        low: Math.min(...chunk.map((b) => b.low)),
        close: chunk[chunk.length - 1].close,
        volume: chunk.reduce((sum, b) => sum + b.volume, 0),
      });
    }

    return h4Bars;
  }

  /**
   * Get current trading session info
   */
  getSessionInfo(timestamp?: Date): SessionInfo {
    const now = timestamp || new Date();
    const utcHour = now.getUTCHours();

    let currentSession: "Asian" | "London" | "NY" | "Unknown";
    let sessionStart: Date;
    let sessionEnd: Date;

    if (utcHour >= 0 && utcHour < 7) {
      // Asian session: 00:00 - 07:00 UTC
      currentSession = "Asian";
      sessionStart = new Date(now);
      sessionStart.setUTCHours(0, 0, 0, 0);
      sessionEnd = new Date(now);
      sessionEnd.setUTCHours(7, 0, 0, 0);
    } else if (utcHour >= 7 && utcHour < 14) {
      // London session: 07:00 - 14:00 UTC
      currentSession = "London";
      sessionStart = new Date(now);
      sessionStart.setUTCHours(7, 0, 0, 0);
      sessionEnd = new Date(now);
      sessionEnd.setUTCHours(14, 0, 0, 0);
    } else if (utcHour >= 14 && utcHour < 22) {
      // NY session: 14:00 - 22:00 UTC
      currentSession = "NY";
      sessionStart = new Date(now);
      sessionStart.setUTCHours(14, 0, 0, 0);
      sessionEnd = new Date(now);
      sessionEnd.setUTCHours(22, 0, 0, 0);
    } else {
      currentSession = "Unknown";
      sessionStart = now;
      sessionEnd = now;
    }

    return {
      currentSession,
      sessionStart,
      sessionEnd,
      timestamp: now,
    };
  }
}
