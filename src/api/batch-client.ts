/**
 * Databento Batch API Client
 * Handles batch job submission, listing, and download operations
 */

import { DataBentoHTTP, parseJSON } from "../http/databento-http.js";
import type {
  BatchJobRequest,
  BatchJobInfo,
  ListJobsParams,
  BatchDownloadInfo,
  BatchDownloadResult,
  BatchJobState,
} from "../types/batch.js";

/**
 * Batch API Client
 * Provides methods for managing batch data download jobs
 */
export class BatchClient {
  private readonly http: DataBentoHTTP;

  constructor(http: DataBentoHTTP) {
    this.http = http;
  }

  /**
   * Submit a new batch data download job
   *
   * @param params - Job request parameters
   * @returns Job information including job ID and status
   */
  async submitJob(params: BatchJobRequest): Promise<BatchJobInfo> {
    // Validate required parameters
    this.validateJobRequest(params);

    // Prepare form data for submission
    const formData: Record<string, any> = {
      dataset: params.dataset,
      symbols: params.symbols, // Will be joined with commas by postForm
      schema: params.schema,
      start: params.start,
    };

    // Add optional parameters if provided
    if (params.end) formData.end = params.end;
    if (params.encoding) formData.encoding = params.encoding;
    if (params.compression) formData.compression = params.compression;
    if (params.stype_in) formData.stype_in = params.stype_in;
    if (params.stype_out) formData.stype_out = params.stype_out;
    if (params.split_duration) formData.split_duration = params.split_duration;
    if (params.split_size) formData.split_size = params.split_size;
    if (params.split_symbols !== undefined) formData.split_symbols = params.split_symbols;
    if (params.limit) formData.limit = params.limit;
    if (params.ts_out !== undefined) formData.ts_out = params.ts_out;

    // Submit the job via form-encoded POST
    const response = await this.http.postForm("/v0/batch.submit_job", formData);

    // Parse and return job info
    const jobInfo = parseJSON<BatchJobInfo>(response);
    return jobInfo;
  }

  /**
   * List all batch jobs with optional filtering
   *
   * @param params - Filter parameters (states, since)
   * @returns List of batch job information
   */
  async listJobs(params?: ListJobsParams): Promise<BatchJobInfo[]> {
    const queryParams: Record<string, any> = {};

    // Add filter parameters if provided
    if (params?.states && params.states.length > 0) {
      queryParams.states = params.states.join(",");
    }
    if (params?.since) {
      queryParams.since = params.since;
    }

    // Make GET request to list jobs
    const response = await this.http.get("/v0/batch.list_jobs", queryParams);

    // Parse and return job list
    const jobs = parseJSON<BatchJobInfo[]>(response);
    return jobs;
  }

  /**
   * Get download information for a completed batch job
   *
   * IMPORTANT: This does NOT download the actual files. It returns metadata
   * and download URLs that can be used with standard HTTP clients.
   *
   * @param jobId - Batch job identifier
   * @returns Download information including URLs and expiration
   */
  async getDownloadInfo(jobId: string): Promise<BatchDownloadResult> {
    if (!jobId || jobId.trim().length === 0) {
      throw new Error("Job ID is required");
    }

    try {
      // First, get the job info to check status
      const jobs = await this.listJobs();
      const job = jobs.find((j) => j.id === jobId);

      if (!job) {
        return {
          job_id: jobId,
          state: "expired",
          message: `Job ${jobId} not found. It may have expired or does not exist.`,
          error: "Job not found",
        };
      }

      // Check job state
      if (job.state !== "done") {
        return {
          job_id: jobId,
          state: job.state,
          message: this.getJobStatusMessage(job),
        };
      }

      // Job is done, construct download info
      const downloadInfo: BatchDownloadInfo = {
        id: job.id,
        state: job.state,
        download_url: `${this.http.getBaseUrl()}/v0/batch.download/${jobId}`,
        total_size: job.total_size,
        ts_expiration: job.ts_expiration,
        record_count: job.record_count,
        file_count: job.file_count,
      };

      // If job has split files, list them
      if (job.file_count && job.file_count > 1) {
        downloadInfo.filenames = this.generateFilenames(job);
      }

      return {
        job_id: jobId,
        state: job.state,
        message: `Job completed successfully. ${job.file_count || 1} file(s) ready for download.`,
        download_info: downloadInfo,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        job_id: jobId,
        state: "expired",
        message: `Failed to get download info: ${errorMessage}`,
        error: errorMessage,
      };
    }
  }

  /**
   * Get a human-readable status message for a job
   */
  private getJobStatusMessage(job: BatchJobInfo): string {
    switch (job.state) {
      case "received":
        return `Job ${job.id} received and pending validation. Check back shortly.`;
      case "queued":
        return `Job ${job.id} is queued for processing. Queued at ${job.ts_queued}.`;
      case "processing":
        return `Job ${job.id} is currently being processed. Started at ${job.ts_process_start}.`;
      case "done":
        return `Job ${job.id} completed. ${job.record_count} records across ${job.file_count} file(s).`;
      case "expired":
        return `Job ${job.id} has expired. Files are no longer available for download.`;
      default:
        return `Job ${job.id} status: ${job.state}`;
    }
  }

  /**
   * Generate likely filenames for a split job
   * Note: This is an approximation. Actual filenames should come from the API.
   */
  private generateFilenames(job: BatchJobInfo): string[] {
    const filenames: string[] = [];
    const extension = this.getFileExtension(job.encoding, job.compression);

    if (job.file_count) {
      for (let i = 0; i < job.file_count; i++) {
        filenames.push(`${job.id}_${i}${extension}`);
      }
    }

    return filenames;
  }

  /**
   * Get file extension based on encoding and compression
   */
  private getFileExtension(encoding: string, compression: string): string {
    let ext = "";

    // Base extension from encoding
    switch (encoding) {
      case "dbn":
        ext = ".dbn";
        break;
      case "csv":
        ext = ".csv";
        break;
      case "json":
        ext = ".json";
        break;
      default:
        ext = ".bin";
    }

    // Add compression extension
    switch (compression) {
      case "zstd":
        ext += ".zst";
        break;
      case "gzip":
        ext += ".gz";
        break;
      case "none":
        // No compression extension
        break;
    }

    return ext;
  }

  /**
   * Validate batch job request parameters
   */
  private validateJobRequest(params: BatchJobRequest): void {
    if (!params.dataset || params.dataset.trim().length === 0) {
      throw new Error("Dataset is required");
    }

    if (!params.symbols || params.symbols.length === 0) {
      throw new Error("At least one symbol is required");
    }

    if (params.symbols.length > 2000) {
      throw new Error("Maximum 2,000 symbols allowed per batch job");
    }

    if (!params.schema || params.schema.trim().length === 0) {
      throw new Error("Schema is required");
    }

    if (!params.start || params.start.trim().length === 0) {
      throw new Error("Start date is required");
    }

    // Validate date format (basic check)
    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (!dateRegex.test(params.start)) {
      throw new Error("Start date must be in YYYY-MM-DD or ISO 8601 format");
    }

    if (params.end && !dateRegex.test(params.end)) {
      throw new Error("End date must be in YYYY-MM-DD or ISO 8601 format");
    }
  }
}
