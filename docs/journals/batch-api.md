# Batch API Implementation Journal

**Date**: 2025-10-03
**Component**: Historical Batch API Client
**Status**: In Progress

## Overview

Implementing the Databento Historical Batch API client to support asynchronous batch data downloads through the MCP server.

## Implementation Plan

### 1. Type Definitions (src/types/batch.ts)
- BatchJobRequest: Parameters for submitting batch jobs
- BatchJobStatus: Job status enumeration (pending, queued, processing, done, expired)
- BatchJobInfo: Job metadata response
- BatchDownloadResult: Download information response

### 2. HTTP Base Client (src/http/databento-http.ts)
- Extract shared HTTP logic from databento-client.ts
- Support both GET and POST methods
- Handle form-encoded data for batch submissions
- Maintain retry logic and authentication

### 3. Batch API Client (src/api/batch-client.ts)
Methods:
- submitJob(params): Submit batch download job (POST /v0/batch.submit_job)
- listJobs(states?, since?): List all batch jobs (GET /v0/batch.list_jobs)
- download(jobId, outputPath): Download completed job files (GET /v0/batch.download/{job_id})

### 4. MCP Tools
- batch_submit_job: Submit a new batch data download job
- batch_list_jobs: List all batch jobs with optional filtering
- batch_download: Get download information for completed jobs

## Design Decisions

### File Download Handling
**Decision**: Do NOT stream large files through MCP responses
**Rationale**:
- MCP is designed for tool metadata, not large binary transfers
- Batch files can be GB+ in size
- Instead, return download URLs and metadata

**Implementation**:
- batch_download returns job info with download URLs
- Users can download files directly using standard HTTP clients
- Provide file size, expiration time, and download links

### Authentication
- Use Basic Auth with API key (same as existing client)
- Format: `Basic base64(api_key:)`

### Error Handling
- Validate job states before download
- Clear error messages for expired/unavailable jobs
- HTTP error mapping with retry logic

## API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /v0/batch.submit_job | Submit batch job |
| GET | /v0/batch.list_jobs | List jobs |
| GET | /v0/batch.download/{job_id} | Get download info |

## Parameters

### submit_job
Required:
- dataset (string): Dataset code
- symbols (string[]): Instrument symbols
- schema (string): Data schema
- start (string): ISO date
- end (string): ISO date

Optional:
- encoding (string): dbn, csv, json (default: dbn)
- compression (string): none, zstd, gzip (default: zstd)
- stype_in (string): Symbol input type
- stype_out (string): Symbol output type
- split_duration (string): Split files by duration
- split_size (number): Split files by size
- split_symbols (boolean): Split by symbol

## Limitations

1. **No File Streaming**: MCP tools return metadata only, not file content
2. **Download URLs Expire**: Jobs expire after a period (check job info)
3. **API Key Permissions**: User must have batch API access
4. **Rate Limits**: Batch submissions may have rate limits
5. **Job Processing Time**: Batch jobs are async, may take minutes/hours

## Testing Considerations

- Mock responses for job submission
- Test job state transitions
- Validate parameter serialization (especially form data)
- Error handling for expired jobs

## References

- [Databento Batch API Docs](https://databento.com/docs/api-reference-historical/batch)
- [Python SDK Implementation](https://github.com/databento/databento-python/blob/main/databento/historical/api/batch.py)
- ADR 001: Databento API Expansion Architecture

## Implementation Summary

### Completed Components

1. **Type Definitions** (`src/types/batch.ts`)
   - BatchJobRequest: Complete parameters for job submission
   - BatchJobInfo: Job metadata and status
   - BatchJobState: State enumeration (received, queued, processing, done, expired)
   - BatchDownloadInfo: Download metadata
   - BatchDownloadResult: Download operation result
   - DataEncoding, CompressionType, SymbologyType enums

2. **HTTP Base Client** (`src/http/databento-http.ts`)
   - Added `postForm()` method for form-encoded POST requests
   - Handles array serialization (comma-separated for symbols)
   - Added `getBaseUrl()` public method for URL construction

3. **Batch API Client** (`src/api/batch-client.ts`)
   - `submitJob(params)`: Submit batch download jobs with validation
   - `listJobs(params?)`: List jobs with optional state/time filtering
   - `getDownloadInfo(jobId)`: Get download metadata (NOT file streaming)
   - Comprehensive parameter validation
   - Human-readable status messages

4. **MCP Tool Handlers** (`src/api/batch-handlers.ts`)
   - Tool definitions for ListToolsRequestSchema
   - Handler functions for CallToolRequestSchema
   - Structured JSON responses with relevant metadata
   - Integration guide for index.ts

5. **Integration**
   - BatchClient instantiated in index.ts
   - Type imports added
   - Tool handlers ready for integration into switch statement

### Key Design Decisions

1. **No File Streaming**: The `batch_download` tool returns download metadata and URLs, NOT file contents. This is by design because:
   - MCP is for metadata/tool results, not large binary transfers
   - Batch files can be gigabytes in size
   - Users download files directly via HTTP using the provided URLs

2. **Form-Encoded Submission**: Batch job submission uses `application/x-www-form-urlencoded` as per Databento API spec

3. **Validation**: Client-side validation for:
   - Required parameters
   - Symbol count limits (max 2000)
   - Date format validation
   - Dataset/schema combinations

### Integration Instructions

To complete integration in `src/index.ts`:

1. Import batch handlers:
```typescript
import { batchToolDefinitions, handleBatchSubmitJob, handleBatchListJobs, handleBatchDownload } from "./api/batch-handlers.js";
```

2. Add to tools array in ListToolsRequestSchema:
```typescript
...batchToolDefinitions,
```

3. Add cases to CallToolRequestSchema switch:
```typescript
case "batch_submit_job":
  return await handleBatchSubmitJob(batchClient, args);

case "batch_list_jobs":
  return await handleBatchListJobs(batchClient, args);

case "batch_download":
  return await handleBatchDownload(batchClient, args);
```

## Limitations and Considerations

### User-Facing Limitations

1. **No Direct File Access**: MCP returns download URLs, not file content
   - Users must download files separately using HTTP clients
   - Download URLs are time-limited (expire per Databento policy)

2. **Async Processing**: Batch jobs are not immediate
   - Job submission returns quickly but processing takes time
   - Users must poll with `batch_list_jobs` or `batch_download` to check status
   - Processing time depends on data volume and queue depth

3. **API Key Permissions**: Users need batch API access
   - Not all Databento accounts have batch access enabled
   - Will fail with permission errors if not authorized

4. **Cost Tracking**: Jobs incur costs
   - Cost returned in job submission response
   - Users should use `metadata_get_cost` first to estimate
   - All charges are in USD

5. **File Expiration**: Downloaded files expire
   - Check `ts_expiration` in job info
   - Re-submit job if files have expired

### Technical Limitations

1. **Symbol Limit**: Maximum 2,000 symbols per batch job
2. **Form Encoding**: Arrays must be comma-separated strings
3. **No Retry Logic**: Job submissions don't auto-retry on failure
4. **State Transitions**: Jobs progress through states linearly
5. **Download URLs**: Constructed but not validated (API may change format)

## Testing Recommendations

1. **Mock Responses**: Test with mock job submissions
2. **State Transitions**: Verify all job states handled correctly
3. **Error Cases**:
   - Invalid dataset codes
   - Exceeded symbol limits
   - Expired job downloads
   - Missing required parameters
4. **Form Data**: Validate array serialization
5. **URL Construction**: Ensure download URLs are correct

## Example Usage

### Submit a Batch Job
```json
{
  "dataset": "GLBX.MDP3",
  "symbols": ["ES.FUT", "NQ.FUT"],
  "schema": "ohlcv-1d",
  "start": "2024-01-01",
  "end": "2024-12-31",
  "encoding": "csv",
  "compression": "gzip"
}
```

### List Jobs
```json
{
  "states": ["done", "processing"],
  "since": "2024-01-01T00:00:00Z"
}
```

### Get Download Info
```json
{
  "job_id": "abc123-def456"
}
```

## Progress Log

- 2025-10-03 14:00: Created journal
- 2025-10-03 14:05: Defined type system
- 2025-10-03 14:10: Created HTTP base client with form encoding
- 2025-10-03 14:15: Implemented batch client with validation
- 2025-10-03 14:20: Created MCP tool handlers
- 2025-10-03 14:25: Documented implementation and limitations
- 2025-10-03 14:30: Implementation complete, ready for integration
