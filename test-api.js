#!/usr/bin/env node
/**
 * Simple smoke test for Databento MCP Server
 * Tests basic API connectivity and tool functionality
 */

const { DataBentoHTTP } = require('./dist/http/databento-http.js');
const { MetadataClient } = require('./dist/api/metadata-client.js');
require('dotenv').config();

const DATABENTO_API_KEY = process.env.DATABENTO_API_KEY;

async function runTests() {
  console.log('🧪 Databento MCP Server - API Smoke Test\n');

  if (!DATABENTO_API_KEY) {
    console.error('❌ DATABENTO_API_KEY not found in .env');
    process.exit(1);
  }

  console.log('✅ API key configured');

  const http = new DataBentoHTTP(DATABENTO_API_KEY);
  const metadataClient = new MetadataClient(http);

  // Test 1: List datasets
  try {
    console.log('\n📊 Test 1: metadata.list_datasets');
    const datasets = await metadataClient.listDatasets({});
    console.log(`✅ Success: Found ${datasets.length} datasets`);
    if (datasets.length > 0) {
      console.log(`   Sample: ${datasets.slice(0, 3).join(', ')}`);
    }
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  // Test 2: List schemas for GLBX.MDP3
  try {
    console.log('\n📋 Test 2: metadata.list_schemas (GLBX.MDP3)');
    const schemas = await metadataClient.listSchemas({ dataset: 'GLBX.MDP3' });
    console.log(`✅ Success: Found ${schemas.length} schemas`);
    if (schemas.length > 0) {
      console.log(`   Schemas: ${schemas.slice(0, 5).join(', ')}`);
    }
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  // Test 3: Get dataset range
  try {
    console.log('\n📅 Test 3: metadata.get_dataset_range (GLBX.MDP3)');
    const range = await metadataClient.getDatasetRange({ dataset: 'GLBX.MDP3' });
    console.log(`✅ Success: ${JSON.stringify(range, null, 2)}`);
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
  }

  console.log('\n✅ All smoke tests completed!\n');
  console.log('💡 To test more endpoints, update this script or use the MCP protocol.');
}

runTests().catch(console.error);
