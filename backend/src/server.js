require("dotenv").config();

const natural = require("natural");
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

let darkPatternClassifier = null;

try {
  if (natural?.BayesClassifier?.load) {
    natural.BayesClassifier.load(
      __dirname + "/ml/dark-pattern-model.json",
      null,
      (err, classifier) => {
        if (err) {
          console.error("Could not load classifier:", err);
          return;
        }

        darkPatternClassifier = classifier;
        console.log("Dark pattern classifier loaded");
      }
    );
  } else {
    console.warn(
      "BayesClassifier unavailable; backend will run without ML classifier."
    );
  }
} catch (error) {
  console.error(
    "Classifier initialization failed:",
    error
  );
}

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// ============================================
// GROQ
// ============================================

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ============================================
// SUPABASE
// ============================================

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// ============================================
// HEALTH CHECK
// ============================================

app.get("/", (req, res) => {
  res.json({
    status: "Spendwall backend is running",
  });
});

// ============================================
// SPENDWALL AI COPILOT
// ============================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
You are Spendwall Copilot, an AI shopping safety assistant.

Spendwall protects users when they or AI shopping agents make purchases.

The user's current rules are:
- Block recurring subscriptions.
- Purchases over $120 require approval.
- Shipping must cost $15 or less.
- Purchases must be refundable.

When the user talks about buying something:
- Identify the item, merchant, and price if provided.
- Compare what is known against the user's Spendwall rules.
- Clearly mention any rule that could be violated.
- If important information such as shipping, refundability, or subscription status is unknown, say that it still needs to be checked.
- Do not invent checkout information.
- Keep your response short and conversational.

You help explain purchases.
Spendwall's deterministic rule engine ultimately decides whether a transaction is allowed, warned, or blocked.
          `,
        },
        {
          role: "user",
          content: message,
        },
      ],

      model: "openai/gpt-oss-20b",
      temperature: 0.2,
      max_completion_tokens: 250,
    });

    const response =
      completion.choices[0]?.message?.content ||
      "I couldn't analyze that purchase.";

    res.json({
      response,
    });
  } catch (error) {
    console.error("Groq error:", error);

    res.status(500).json({
      error: "Spendwall AI failed to respond.",
    });
  }
});

// ============================================
// AI CHECKOUT EXTRACTION
// ============================================

app.post("/api/extract-checkout", async (req, res) => {
  try {
    const { pageText, url, title } = req.body;

    if (!pageText) {
      return res.status(400).json({
        error: "Page text is required",
      });
    }

    // Prevent sending enormous webpages to the model.
    const trimmedPageText = pageText.slice(0, 15000);

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
You are the checkout extraction engine for Spendwall.

Your job is to inspect visible text from an online shopping or
checkout page and extract the purchase information.

Return ONLY valid JSON.

Use exactly this structure:

{
  "merchant": null,
  "item": null,
  "advertisedPrice": null,
  "shipping": null,
  "subscription": false,
  "subscriptionPrice": null,
  "refundable": null,
  "finalSale": false,
  "totalToday": null
}

Rules:

- merchant: store or website name.
- item: main product being purchased.
- advertisedPrice: product price before shipping or extra fees.
- shipping: shipping or delivery charge.
- subscription: true only if the page indicates recurring billing,
  membership, subscription, auto-renewal, monthly billing,
  yearly billing, or another recurring charge.
- subscriptionPrice: recurring charge amount when visible.
- refundable: true if clearly refundable.
- refundable: false if clearly non-refundable or final sale.
- refundable: null if refund information is unknown.
- finalSale: true only if the page indicates final sale or no returns.
- totalToday: amount being charged today.

IMPORTANT:

- Do not invent information.
- Unknown values must be null.
- Prices must be numbers without dollar signs.
- Boolean values must be true or false.
- Ignore unrelated recommended products.
- Ignore advertisements.
- Ignore navigation and footer content when possible.
- Prefer checkout and order-summary information.
- Return JSON only.
- Do not return markdown.
- Do not include an explanation outside the JSON.
          `,
        },
        {
          role: "user",
          content: `
WEBSITE URL:
${url || "Unknown"}

PAGE TITLE:
${title || "Unknown"}

VISIBLE PAGE TEXT:
${trimmedPageText}
          `,
        },
      ],

      model: "openai/gpt-oss-20b",
      temperature: 0,
      max_completion_tokens: 800,

      response_format: {
        type: "json_object",
      },
    });

    const rawResponse =
      completion.choices[0]?.message?.content;

    if (!rawResponse) {
      throw new Error(
        "Groq returned an empty checkout extraction"
      );
    }

    const checkout = JSON.parse(rawResponse);

    console.log(
      "AI extracted checkout:",
      checkout
    );

    res.json({
      checkout,
    });
  } catch (error) {
    console.error(
      "Checkout extraction error:",
      error
    );

    res.status(500).json({
      error:
        "Spendwall could not extract checkout information.",
    });
  }
});

// ============================================
// CHECKOUT ANALYSIS / RULE ENGINE
// ============================================

app.post("/api/analyze-checkout", async (req, res) => {
  try {
    const {
      merchant,
      item,
      advertisedPrice,
      shipping,
      subscription,
      subscriptionPrice,
      refundable,
      finalSale,
      totalToday,
    } = req.body;

    const violations = [];
    const warnings = [];

    // ========================================
    // RULE 1: BLOCK SUBSCRIPTIONS
    // ========================================

    if (subscription) {
      violations.push(
        `Recurring subscription detected${
          subscriptionPrice
            ? `: $${subscriptionPrice}/month`
            : ""
        }`
      );
    }

    // ========================================
    // RULE 2: $120 SPENDING LIMIT
    // ========================================

    if (
      typeof totalToday === "number" &&
      totalToday > 120
    ) {
      violations.push(
        `Total $${totalToday.toFixed(
          2
        )} exceeds your $120 spending limit`
      );
    }

    // ========================================
    // RULE 3: $15 SHIPPING LIMIT
    // ========================================

    if (typeof shipping === "number") {
      if (shipping > 15) {
        violations.push(
          `Shipping $${shipping.toFixed(
            2
          )} exceeds your $15 limit`
        );
      } else if (shipping >= 12) {
        warnings.push(
          `Shipping $${shipping.toFixed(
            2
          )} is close to your $15 limit`
        );
      }
    }

    // ========================================
    // RULE 4: MUST BE REFUNDABLE
    // ========================================

    if (
      finalSale ||
      refundable === false
    ) {
      violations.push(
        "Purchase is final sale or non-refundable"
      );
    }

    // ========================================
    // UNKNOWN INFORMATION WARNINGS
    // ========================================

    if (refundable === null) {
      warnings.push(
        "Refund policy could not be verified"
      );
    }

    // ========================================
    // FINAL DECISION
    // ========================================

    let decision = "ALLOW";

    if (violations.length > 0) {
      decision = "BLOCK";
    } else if (warnings.length > 0) {
      decision = "WARN";
    }

    // ========================================
    // TEMPORARY RISK SCORE
    // ========================================

    let riskScore = 10;

    riskScore += violations.length * 30;
    riskScore += warnings.length * 10;

    if (subscription) {
      riskScore += 10;
    }

    if (
      finalSale ||
      refundable === false
    ) {
      riskScore += 10;
    }

    riskScore = Math.min(
      riskScore,
      100
    );

    // ========================================
    // SAVE TRANSACTION TO SUPABASE
    // ========================================

    const {
      data: savedTransaction,
      error: databaseError,
    } = await supabase
      .from("transactions")
      .insert([
        {
          merchant: merchant || null,
          item: item || null,

          advertised_price:
            advertisedPrice ?? null,

          shipping:
            shipping ?? null,

          subscription:
            subscription ?? null,

          subscription_price:
            subscriptionPrice ?? null,

          refundable:
            refundable ?? null,

          final_sale:
            finalSale ?? null,

          total_today:
            totalToday ?? null,

          decision,

          risk_score:
            riskScore,

          violations,

          warnings,
        },
      ])
      .select()
      .single();

    if (databaseError) {
      console.error(
        "Supabase error:",
        databaseError
      );

      return res.status(500).json({
        error:
          "Checkout was analyzed, but the transaction could not be saved.",

        decision,
        riskScore,
        violations,
        warnings,
      });
    }

    console.log(
      `Spendwall ${decision}:`,
      merchant,
      item
    );

    // ========================================
    // RETURN RESULT
    // ========================================

    res.json({
      merchant,
      item,
      decision,
      riskScore,
      violations,
      warnings,

      checkout: {
        advertisedPrice,
        shipping,
        subscription,
        subscriptionPrice,
        refundable,
        finalSale,
        totalToday,
      },

      transactionId:
        savedTransaction?.id ?? null,
    });
  } catch (error) {
    console.error(
      "Checkout analysis error:",
      error
    );

    res.status(500).json({
      error:
        "Spendwall could not analyze this checkout.",
    });
  }
});

// ============================================
// ML DARK-PATTERN CLASSIFIER
// ============================================

app.post("/api/classify", (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({
      error: "text is required",
    });
  }

  if (!darkPatternClassifier) {
    return res.status(503).json({
      error: "still loading, try again",
    });
  }

  const classifications =
    darkPatternClassifier.getClassifications(text);

  const darkScore =
    classifications.find(
      (result) => result.label === "dark_pattern"
    )?.value || 0;

  const normalScore =
    classifications.find(
      (result) => result.label === "normal"
    )?.value || 0;

  const totalScore = darkScore + normalScore;

  const darkConfidence =
    totalScore > 0
      ? darkScore / totalScore
      : 0;

  res.json({
    label:
      darkScore > normalScore
        ? "dark_pattern"
        : "normal",
    darkConfidence,
    classifications,
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(
    `Spendwall backend running on http://localhost:${PORT}`
  );
});