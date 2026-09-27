# Spendwall
A personalized AI firewall for safer agentic commerce.

### Your money. Your rules.

Spendwall is a personalized checkout firewall that protects shoppers before they pay.

Instead of deciding what is a "good" or "bad" purchase, Spendwall checks a transaction against rules defined by the user. Its browser extension analyzes real shopping pages and can allow, warn about, or block a purchase when checkout conditions violate those rules.

## Why Spendwall?

Online checkout is becoming increasingly complex. Prices can change, subscriptions can be introduced, fees can appear, and purchase terms can be easy to miss.

As AI shopping agents become more common, the same problem becomes even more important: how do we make sure a purchase still matches what the user actually authorized?

Spendwall acts as a safety layer between shopping and payment.

## How It Works

1. Shop normally on an online store.
2. Spendwall detects and analyzes purchase information.
3. The checkout is evaluated against your purchase rules.
4. Spendwall returns one of three decisions:

- **ALLOW** — the purchase follows your rules.
- **WARN** — something deserves your attention before continuing.
- **BLOCK** — the purchase violates a hard boundary.

## Features

- Real-time browser checkout protection
- AI-powered checkout information extraction
- Personalized purchase rules
- ALLOW / WARN / BLOCK decision engine
- Subscription and recurring-charge detection
- Spending-limit enforcement
- Shipping and return-policy awareness
- TrueCost checkout analysis
- Transaction audit trail
- Web dashboard for managing protection
- Persistent transaction history

## Tech Stack

**Frontend**
- React
- Vite
- JavaScript

**Backend**
- Node.js
- Express

**AI / ML**
- Groq
- Custom dark-pattern classification

**Data**
- Supabase

**Extension**
- Chrome Extension APIs
- JavaScript
- CSS

**Deployment**
- Vercel

## Architecture

Online Store
→ Spendwall Browser Extension
→ Checkout Extraction
→ AI Analysis + Policy Engine
→ ALLOW / WARN / BLOCK
→ Transaction History + Dashboard

## Agentic Commerce

Spendwall currently protects users directly while they shop in the browser.

The same policy layer can also sit between an autonomous shopping agent and checkout, allowing users to define exactly what an agent is authorized to purchase before money is spent.

## Demo

Live Dashboard: https://spendwall-umber.vercel.app

## Built at HackGT 13

Built for the Oracle of the Deep AI/ML track at HackGT 13.
