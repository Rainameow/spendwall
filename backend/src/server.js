
require('dotenv').config();
const natural = require('natural');
let darkPatternClassifier = null;
natural.BayesClassifier.load(__dirname + '/ml/dark-pattern-model.json', null, (err, classifier) => {
  if (err) return console.error('Could not load classifier:', err);
  darkPatternClassifier = classifier;
  console.log('Dark pattern classifier loaded');
});
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.get("/", (req, res) => {
  res.json({ status: "Spendwall backend is running" });
});

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
- Purchases over $100 require approval.
- Shipping must cost $10 or less.
- Purchases must be refundable.

When the user talks about buying something:
- Identify the item, merchant, and price if provided.
- Compare what is known against the user's Spendwall rules.
- Clearly mention any rule that could be violated.
- If important information such as shipping, refundability, or subscription status is unknown, say that it still needs to be checked.
- Do not invent checkout information.
- Keep your response short and conversational.

You help explain purchases. Spendwall's deterministic rule engine ultimately decides whether a transaction is allowed, warned, or blocked.
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

    res.json({ response });
  } catch (error) {
    console.error("Groq error:", error);

    res.status(500).json({
      error: "Spendwall AI failed to respond.",
    });
  }
});

app.post('/api/classify', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });
  if (!darkPatternClassifier) return res.status(503).json({ error: 'still loading, try again' });

  res.json({
    label: darkPatternClassifier.classify(text),
    classifications: darkPatternClassifier.getClassifications(text)
  });
});

app.listen(PORT, () => {
  console.log(`Spendwall backend running on http://localhost:${PORT}`);
});