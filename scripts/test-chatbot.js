#!/usr/bin/env node

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

const BASE_URL = process.env.TEST_URL || "http://localhost:8787";

// Test cases for chatbot responses
const CHAT_TESTS = [
  {
    name: "Pricing Query",
    query: "how much does blawby cost",
    expectedKeywords: ["pricing", "cost", "fee", "monthly", "card", "ACH"],
    expectedBehavior: "Should provide specific pricing information",
  },
  {
    name: "General Product Question",
    query: "what is blawby",
    expectedKeywords: ["payment", "legal", "platform", "practice"],
    expectedBehavior: "Should explain what Blawby is",
  },
  {
    name: "Support Request",
    query: "I need help with my account",
    expectedKeywords: ["support", "help", "contact"],
    expectedBehavior: "Should offer support options",
  },
  {
    name: "Human Request",
    query: "speak to a human",
    expectedKeywords: ["human", "support", "team", "contact"],
    expectedBehavior: "Should direct to human support",
  },
  {
    name: "Technical Question",
    query: "how do I integrate blawby",
    expectedKeywords: ["integration", "setup", "connect"],
    expectedBehavior: "Should provide integration guidance",
  },
  {
    name: "Compliance Question",
    query: "is blawby compliant with trust accounting",
    expectedKeywords: ["compliance", "trust", "accounting", "iolta"],
    expectedBehavior: "Should address compliance concerns",
  },
  {
    name: "Frustrated User",
    query: "this is not working",
    expectedKeywords: ["help", "support", "issue", "problem"],
    expectedBehavior: "Should offer empathetic support",
  },
  {
    name: "Feature Question",
    query: "does blawby support recurring payments",
    expectedKeywords: ["recurring", "subscription", "payment"],
    expectedBehavior: "Should answer about features",
  },
  {
    name: "Payments Feature Doc Link",
    query: "what is payments about?",
    expectedKeywords: [
      "payment",
      "plan",
      "installment",
      "link",
      "/lessons/payments",
    ],
    expectedBehavior:
      "Should provide a context-rich answer with a documentation link",
    mustContainLink: "/lessons/payments",
  },
];

async function testChatResponse(testCase) {
  log(`\n${colors.cyan}Testing: ${testCase.name}${colors.reset}`);
  log(`Query: "${testCase.query}"`, "blue");
  log(`Expected: ${testCase.expectedBehavior}`, "yellow");

  try {
    const response = await fetch(`${BASE_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: testCase.query,
        userId: `test-${Date.now()}`,
        chatHistory: [],
      }),
    });

    if (!response.ok) {
      logTest(testCase.name, "FAIL", `HTTP ${response.status}`);
      return false;
    }

    const data = await response.json();
    const message = data.message || "";

    log(
      `Response: ${message.substring(0, 200)}${message.length > 200 ? "..." : ""}`,
      "green",
    );

    // Check if response contains expected keywords
    const foundKeywords = testCase.expectedKeywords.filter((keyword) =>
      message.toLowerCase().includes(keyword.toLowerCase()),
    );

    const keywordScore =
      foundKeywords.length / testCase.expectedKeywords.length;
    const hasReasonableLength = message.length > 20 && message.length < 1000;
    const isRelevant = keywordScore > 0.3; // At least 30% of expected keywords

    // Check for required doc link if specified
    if (testCase.mustContainLink) {
      if (!message.includes(testCase.mustContainLink)) {
        logTest(
          testCase.name,
          "FAIL",
          `Missing required doc link: ${testCase.mustContainLink}`,
        );
        return false;
      }
    }
    if (isRelevant && hasReasonableLength) {
      logTest(
        testCase.name,
        "PASS",
        `Found ${foundKeywords.length}/${testCase.expectedKeywords.length} keywords`,
      );
      return true;
    } else {
      logTest(
        testCase.name,
        "FAIL",
        `Missing keywords or inappropriate length (${message.length} chars)`,
      );
      log(`Found keywords: ${foundKeywords.join(", ")}`, "red");
      return false;
    }
  } catch (error) {
    logTest(testCase.name, "FAIL", `Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  for (const testCase of CHAT_TESTS) {
    if (await testChatResponse(testCase)) {
      logTest(testCase.name, "PASS");
    } else {
      logTest(testCase.name, "FAIL");
    }
  }
}

runTests();
