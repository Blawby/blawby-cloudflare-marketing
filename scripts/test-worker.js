#!/usr/bin/env node

/**
 * Worker Testing Script
 * Tests all endpoints to ensure functionality is maintained during refactoring
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:8787";
const PROD_URL = "https://compass-ts.paulchrisluke.workers.dev";

// Test data
const TEST_DATA = {
  chat: {
    query: "what is blawby",
    userId: "test-user-" + Date.now(),
    chatHistory: [],
  },
  supportCase: {
    userId: "test-user-" + Date.now(),
    chatHistory: ["Hello, I need help with pricing"],
    otherContext: { source: "test-script" },
  },
  helpForm: {
    name: "Test User",
    email: "test@example.com",
    message: "This is a test message from the testing script",
  },
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, status, details = "") {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⚠️";
  const color =
    status === "PASS" ? "green" : status === "FAIL" ? "red" : "yellow";
  log(`${icon} ${name}: ${status}${details ? ` - ${details}` : ""}`, color);
}

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    return {
      ok: response.ok,
      status: response.status,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: { error: error.message },
      headers: {},
    };
  }
}

async function testEndpoint(name, url, options, expectedStatus = 200) {
  log(`\n${colors.cyan}Testing: ${name}${colors.reset}`);
  log(`URL: ${url}`, "blue");

  const result = await makeRequest(url, options);

  if (result.ok && result.status === expectedStatus) {
    logTest(name, "PASS", `Status: ${result.status}`);
    return { success: true, data: result.data };
  } else {
    logTest(
      name,
      "FAIL",
      `Status: ${result.status}, Expected: ${expectedStatus}`,
    );
    if (result.data.error) {
      log(`Error: ${result.data.error}`, "red");
    }
    return { success: false, data: result.data, status: result.status };
  }
}

async function runTests() {
  log(`\n${colors.bright}🚀 Starting Worker Tests${colors.reset}`, "cyan");
  log(`Base URL: ${BASE_URL}`, "blue");
  log(`Production URL: ${PROD_URL}`, "blue");

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
  };

  // Test 1: Chat endpoint
  results.total++;
  const chatResult = await testEndpoint("Chat Endpoint", `${BASE_URL}/chat`, {
    method: "POST",
    body: JSON.stringify(TEST_DATA.chat),
  });
  if (chatResult.success) results.passed++;
  else results.failed++;

  // Test 2: Support case creation
  results.total++;
  const supportResult = await testEndpoint(
    "Support Case Creation",
    `${BASE_URL}/support-case/create`,
    {
      method: "POST",
      body: JSON.stringify(TEST_DATA.supportCase),
    },
  );
  if (supportResult.success) results.passed++;
  else results.failed++;

  // Test 3: Help form submission
  results.total++;
  const helpFormResult = await testEndpoint(
    "Help Form Submission",
    `${BASE_URL}/api/help-form`,
    {
      method: "POST",
      body: JSON.stringify(TEST_DATA.helpForm),
    },
  );
  if (helpFormResult.success) results.passed++;
  else results.failed++;

  // Test 4: Query endpoint
  results.total++;
  const queryResult = await testEndpoint(
    "Query Endpoint",
    `${BASE_URL}/query`,
    {
      method: "POST",
      body: JSON.stringify({ query: "pricing" }),
    },
  );
  if (queryResult.success) results.passed++;
  else results.failed++;

  // Test 5: Support case retrieval (if we have a case ID)
  if (supportResult.success && supportResult.data.caseId) {
    results.total++;
    const retrieveResult = await testEndpoint(
      "Support Case Retrieval",
      `${BASE_URL}/support-case/${supportResult.data.caseId}`,
      { method: "GET" },
    );
    if (retrieveResult.success) results.passed++;
    else results.failed++;
  }

  // Test 6: CORS preflight
  results.total++;
  const corsResult = await testEndpoint(
    "CORS Preflight",
    `${BASE_URL}/chat`,
    { method: "OPTIONS" },
    200,
  );
  if (corsResult.success) results.passed++;
  else results.failed++;

  // Test 7: 404 handling
  results.total++;
  log(`\n${colors.cyan}Testing: 404 Handling${colors.reset}`);
  log(`URL: ${BASE_URL}/nonexistent-endpoint`, "blue");

  const notFoundResponse = await makeRequest(
    `${BASE_URL}/nonexistent-endpoint`,
    { method: "GET" },
  );

  if (notFoundResponse.status === 404) {
    logTest("404 Handling", "PASS", `Status: 404`);
    results.passed++;
  } else {
    logTest(
      "404 Handling",
      "FAIL",
      `Status: ${notFoundResponse.status}, Expected: 404`,
    );
    results.failed++;
  }

  // Summary
  log(`\n${colors.bright}📊 Test Summary${colors.reset}`, "cyan");
  log(`Total Tests: ${results.total}`, "blue");
  log(`Passed: ${results.passed}`, "green");
  log(`Failed: ${results.failed}`, results.failed > 0 ? "red" : "green");

  if (results.failed === 0) {
    log(`\n${colors.bright}🎉 All tests passed!${colors.reset}`, "green");
  } else {
    log(
      `\n${colors.bright}⚠️  Some tests failed. Please check the output above.${colors.reset}`,
      "yellow",
    );
  }

  return results;
}

// Production tests (optional)
async function runProductionTests() {
  if (process.argv.includes("--prod")) {
    log(`\n${colors.bright}🌐 Running Production Tests${colors.reset}`, "cyan");
    process.env.TEST_URL = PROD_URL;
    await runTests();
  }
}

// Main execution
async function main() {
  try {
    await runTests();
    await runProductionTests();
  } catch (error) {
    log(
      `\n${colors.red}Test runner failed: ${error.message}${colors.reset}`,
      "red",
    );
    process.exit(1);
  }
}

// Run the tests
main();
