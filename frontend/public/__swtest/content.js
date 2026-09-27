console.log("Spendwall protection active");

// ============================================
// SETTINGS
// ============================================

const SPENDWALL_API = "http://localhost:8000";

let latestCheckout = null;
let latestResult = null;
let scanInProgress = false;

// Prevent Spendwall from intercepting a click
// that Spendwall itself already approved.
let approvedButton = null;

// ============================================
// DARK PATTERN ML CLASSIFIER
// ============================================

function keywordFallback(pageText) {
  const problems = [];

  // Only use fallback checks for explicit restrictive
  // purchase language. Subscription status is handled
  // by checkout extraction + the deterministic rule engine.
  if (
    pageText.includes("final sale") ||
    pageText.includes("non-refundable") ||
    pageText.includes("no refunds")
  ) {
    problems.push("Purchase may be non-refundable");
  }

  return problems;
}

async function classifyDarkPatterns() {
  // Analyze the same purchase-relevant text used
  // for checkout extraction instead of the entire webpage.
  const pageText =
    getCurrentPageData().pageText.toLowerCase();

  const problems = [];

  try {
    const response = await fetch(
      `${SPENDWALL_API}/api/classify`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: pageText.slice(0, 2000),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Classifier returned ${response.status}`
      );
    }

    const data = await response.json();

    // Only surface strong ML predictions.
    // The normalized score is used as a model-strength
    // signal, not as a calibrated probability.
    if (
      data.label === "dark_pattern" &&
      data.darkConfidence >= 0.90
    ) {
      problems.push(
        "Spendwall ML classifier flagged manipulative checkout language"
      );
    }
  } catch (error) {
    console.warn(
      "Spendwall classifier unavailable; using fallback checks",
      error
    );
  }

  problems.push(
    ...keywordFallback(pageText)
  );

  return [...new Set(problems)];
}

// ============================================
// READ CURRENT WEBSITE
// ============================================

function getCurrentPageData() {
  const text = document.body.innerText;

  // Keep the most purchase-relevant parts of large shopping pages.
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const importantWords = [
    "subtotal",
    "total",
    "shipping",
    "delivery",
    "checkout",
    "order",
    "price",
    "return",
    "refund",
    "final sale",
    "subscription",
    "monthly",
    "recurring",
    "$",
  ];

  const relevantLines = lines.filter((line) =>
    importantWords.some((word) =>
      line.toLowerCase().includes(word)
    )
  );

  // On cart/checkout pages, preserve more surrounding context.
  const lowerText = text.toLowerCase();

  const isCheckoutPage =
    lowerText.includes("checkout") ||
    lowerText.includes("order summary") ||
    lowerText.includes("place order") ||
    lowerText.includes("cart");

  const pageText = isCheckoutPage
    ? text.slice(0, 10000)
    : relevantLines.slice(0, 120).join("\n").slice(0, 6000);

  return {
    url: window.location.href,
    title: document.title,
    pageText,
  };
}

// ============================================
// DETECT WHETHER THIS LOOKS LIKE SHOPPING
// ============================================

function looksLikeShoppingPage() {
  const text =
    document.body.innerText.toLowerCase();

  const shoppingWords = [
    "cart",
    "checkout",
    "order summary",
    "shipping",
    "subtotal",
    "total",
    "add to bag",
    "add to cart",
    "place order",
    "buy now",
  ];

  return shoppingWords.some((word) =>
    text.includes(word)
  );
}

// ============================================
// CREATE FLOATING SPENDWALL BADGE
// ============================================

function createBadge() {
  if (
    document.getElementById(
      "spendwall-live-badge"
    )
  ) {
    return;
  }

  const badge = document.createElement("div");

  badge.id = "spendwall-live-badge";
  badge.dataset.swState = "normal";
  badge.title = "Spendwall — click to review this purchase";

  badge.innerHTML = `
    <span class="sw-badge-mark">
      ${swIcon("shield")}
      <span class="sw-badge-dot"></span>
    </span>
    <span class="sw-badge-text">
      <span class="sw-badge-name">spendwall<i>.</i></span>
      <span id="spendwall-live-status" class="sw-badge-status">
        Protection active
      </span>
    </span>
  `;

  document.body.appendChild(badge);

  badge.addEventListener("click", () => {
    if (latestResult) {
      showSpendwallResult(latestResult);
    } else {
      scanPage();
    }
  });
}

// ============================================
// UPDATE BADGE
// ============================================

function updateBadge(
  status,
  type = "normal"
) {
  const statusElement =
    document.getElementById(
      "spendwall-live-status"
    );

  const badge =
    document.getElementById(
      "spendwall-live-badge"
    );

  if (!statusElement || !badge) {
    return;
  }

  statusElement.textContent = status;

  badge.dataset.swState = [
    "danger",
    "warning",
    "safe",
  ].includes(type)
    ? type
    : "normal";
}

// ============================================
// UI HELPERS (visual only)
// ============================================

const SW_ICON_PATHS = {
  shield:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  shieldX:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/>',
  shieldCheck:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
  shieldAlert:
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  alert:
    '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  bag: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  arrowLeft:
    '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  arrowRight:
    '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
};

function swIcon(name) {
  return `<svg class="sw-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SW_ICON_PATHS[name] || ""}</svg>`;
}

const SW_DECISION_UI = {
  BLOCK: {
    key: "block",
    icon: "shieldX",
    stamp: "Blocked",
    kicker: "Checkout blocked",
    heading: "Purchase stopped.",
  },
  WARN: {
    key: "warn",
    icon: "shieldAlert",
    stamp: "Warning",
    kicker: "Needs your review",
    heading: "Hold up. Check this first.",
  },
  ALLOW: {
    key: "allow",
    icon: "shieldCheck",
    stamp: "Allowed",
    kicker: "Checkout cleared",
    heading: "You\u2019re good to go.",
  },
  CHECK: {
    key: "check",
    icon: "alert",
    stamp: "Unverified",
    kicker: "Check incomplete",
    heading: "Spendwall couldn\u2019t fully verify this purchase.",
  },
};

function swFormatMoney(value) {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? `$${value.toFixed(2)}`
    : null;
}

function swShell({ ui, pill, facts = "", body }) {
  return `
    <div
      class="sw-modal"
      data-sw-decision="${ui.key}"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sw-title"
    >
      <div class="sw-hero">
        <div class="sw-topline">
          <span class="sw-brand">
            <span class="sw-brand-mark">${swIcon("shield")}</span>
            <span class="sw-brand-name">spendwall<i>.</i></span>
          </span>
          <span class="sw-pill">${pill}</span>
        </div>

        <div class="sw-hero-row">
          <div class="sw-hero-copy">
            <p class="sw-kicker">${ui.kicker}</p>
            <h1 id="sw-title">${ui.heading}</h1>
          </div>
          <div class="sw-stamp">
            ${swIcon(ui.icon)}
            <span>${ui.stamp}</span>
          </div>
        </div>

        ${facts}
      </div>

      <div class="sw-body">
        ${body}
      </div>
    </div>
  `;
}

// ============================================
// LOCAL CHECKOUT FALLBACK
// Used only when AI extraction fails.
// ============================================

function fallbackCheckoutExtraction() {
  const page = getCurrentPageData();
  const text = page.pageText;
  const lower = text.toLowerCase();

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  function moneyNear(labels) {
    for (let i = 0; i < lines.length; i++) {
      const lineLower = lines[i].toLowerCase();

      if (!labels.some((label) =>
        lineLower.includes(label)
      )) {
        continue;
      }

      // Check the label line plus nearby lines because
      // many stores put "Total" and "$97.57" separately.
      const nearby = lines
        .slice(i, Math.min(i + 3, lines.length))
        .join(" ");

      const match = nearby.match(
        /\$\s*([0-9,]+(?:\.[0-9]{1,2})?)/
      );

      if (match) {
        return Number(
          match[1].replace(/,/g, "")
        );
      }
    }

    return null;
  }

  const totalToday =
    moneyNear([
      "estimated price",
      "order total",
      "total today",
      "grand total",
      "estimated total",
      "total",
    ]);

  let shipping = null;

  if (
    lower.includes("free shipping") ||
    lower.includes("shipping free")
  ) {
    shipping = 0;
  } else {
    shipping = moneyNear([
      "shipping",
      "delivery",
    ]);
  }

  const nonRefundable =
    lower.includes("cannot be returned or exchanged") ||
    lower.includes("non-refundable") ||
    lower.includes("nonrefundable") ||
    lower.includes("no refunds") ||
    lower.includes("final sale");

  const subscription =
    lower.includes("recurring subscription") ||
    lower.includes("auto-renew") ||
    lower.includes("automatically renews");

  let merchant;

  try {
    merchant = new URL(page.url)
      .hostname
      .replace(/^www\./, "");
  } catch {
    merchant = page.title || "Unknown merchant";
  }

  return {
    merchant,
    item: page.title || "Current purchase",
    advertisedPrice: null,
    shipping,
    subscription,
    subscriptionPrice: null,
    refundable: nonRefundable ? false : null,
    finalSale: nonRefundable,
    totalToday,
    extractionSource: "local-fallback",
  };
}

// ============================================
// AI CHECKOUT EXTRACTION
// ============================================

async function extractCheckout() {
  const response = await fetch(
    `${SPENDWALL_API}/api/extract-checkout`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(
        getCurrentPageData()
      ),
    }
  );

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "Backend returned an invalid response"
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Checkout extraction failed"
    );
  }

  return data.checkout;
}

// ============================================
// RULE ENGINE
// ============================================

async function analyzeCheckout(checkout) {
  const response = await fetch(
    `${SPENDWALL_API}/api/analyze-checkout`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify(checkout),
    }
  );

  const text = await response.text();

  let data;

  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      "Backend returned an invalid response"
    );
  }

  if (!response.ok) {
    throw new Error(
      data.error ||
        "Checkout analysis failed"
    );
  }

  return data;
}

// ============================================
// COMBINE RULE ENGINE + ML RESULTS
// ============================================

async function runSpendwallCheck() {
  let checkout;

  try {
    checkout = await extractCheckout();
  } catch (error) {
    console.warn(
      "AI checkout extraction failed. Using local fallback:",
      error
    );

    checkout = fallbackCheckoutExtraction();
  }

  const [result, mlProblems] =
    await Promise.all([
      analyzeCheckout(checkout),
      classifyDarkPatterns(),
    ]);

  if (mlProblems.length > 0) {
    result.warnings = [
      ...(result.warnings || []),
      ...mlProblems,
    ];

    result.warnings = [
      ...new Set(result.warnings),
    ];

    // ML findings are informational only.
    // The user's purchasing rules determine
    // ALLOW, WARN, or BLOCK.
    result.mlSignals = mlProblems;
  }

  return {
    checkout,
    result,
  };
}

// ============================================
// AUTOMATIC BACKGROUND SCAN
// ============================================

async function scanPage() {
  if (scanInProgress) {
    return;
  }

  scanInProgress = true;

  updateBadge("Scanning purchase...");

  try {
    const check =
      await runSpendwallCheck();

    latestCheckout =
      check.checkout;

    latestResult =
      check.result;

    console.log(
      "Spendwall extracted:",
      latestCheckout
    );

    console.log(
      "Spendwall result:",
      latestResult
    );

    if (
      latestResult.decision === "BLOCK"
    ) {
      updateBadge(
        "Rule violation detected",
        "danger"
      );
    } else if (
      latestResult.decision === "WARN"
    ) {
      updateBadge(
        "Purchase needs review",
        "warning"
      );
    } else {
      updateBadge(
        "No violations detected",
        "safe"
      );
    }
  } catch (error) {
    console.error(
      "Spendwall scan error:",
      error
    );

    updateBadge(
      "Could not verify page",
      "warning"
    );
  } finally {
    scanInProgress = false;
  }
}

// ============================================
// FULL RESULT OVERLAY
// ============================================

function showSpendwallResult(
  result,
  options = {}
) {
  const existing =
    document.getElementById(
      "spendwall-warning"
    );

  if (existing) {
    existing.remove();
  }

  const overlay =
    document.createElement("div");

  overlay.id = "spendwall-warning";

  const violations = result.violations || [];
  const warnings = result.warnings || [];
  const mlSignals = result.mlSignals || [];

  const canContinue =
    result.decision === "WARN" &&
    options.button;

  const ui =
    SW_DECISION_UI[result.decision] ||
    SW_DECISION_UI.ALLOW;

  const risk = Number(result.riskScore);
  const hasRisk = Number.isFinite(risk);
  const riskPct = hasRisk
    ? Math.max(0, Math.min(100, risk))
    : 0;

  const total =
    latestResult === result
      ? swFormatMoney(latestCheckout?.totalToday)
      : null;

  const factItems = [
    result.merchant
      ? `<span class="sw-fact"><span class="sw-fact-label">Merchant</span><span class="sw-fact-value">${escapeHtml(result.merchant)}</span></span>`
      : "",
    result.item
      ? `<span class="sw-fact sw-fact--grow"><span class="sw-fact-label">Item</span><span class="sw-fact-value">${escapeHtml(result.item)}</span></span>`
      : "",
    total
      ? `<span class="sw-fact"><span class="sw-fact-label">Total today</span><span class="sw-fact-value">${total}</span></span>`
      : "",
  ].join("");

  const facts = `
    <div class="sw-facts">
      ${factItems}
    </div>
    <div class="sw-risk">
      <div class="sw-risk-head">
        <span>Risk score</span>
        <strong>${hasRisk ? riskPct : "\u2014"}<small>/100</small></strong>
      </div>
      <div class="sw-risk-track">
        <span class="sw-risk-fill" style="width:${riskPct}%"></span>
      </div>
    </div>
  `;

  const violationCards = violations
    .map(
      (reason, index) => `
        <li class="sw-reason sw-reason--rule">
          <span class="sw-reason-icon">${swIcon("x")}</span>
          <span class="sw-reason-copy">
            <span class="sw-reason-tag">Rule ${index + 1} broken</span>
            <span class="sw-reason-text">${escapeHtml(reason)}</span>
          </span>
        </li>
      `
    )
    .join("");

  const warningCards = warnings
    .map(
      (reason) => `
        <li class="sw-reason sw-reason--warn">
          <span class="sw-reason-icon">${swIcon("alert")}</span>
          <span class="sw-reason-copy">
            <span class="sw-reason-tag">${
              mlSignals.includes(reason)
                ? "ML signal"
                : "Heads up"
            }</span>
            <span class="sw-reason-text">${escapeHtml(reason)}</span>
          </span>
        </li>
      `
    )
    .join("");

  let summary = "No spending rules were violated.";

  if (violations.length) {
    summary = `This order breaks ${violations.length} of your spending ${
      violations.length === 1 ? "rule" : "rules"
    }.`;
  } else if (warnings.length) {
    summary = `${warnings.length} ${
      warnings.length === 1 ? "thing" : "things"
    } to look at before you pay.`;
  }

  const list =
    violationCards || warningCards
      ? `<ul class="sw-reasons">${violationCards}${warningCards}</ul>`
      : `
        <div class="sw-clear">
          <span class="sw-clear-icon">${swIcon("check")}</span>
          <span>
            <strong>Every rule passed.</strong>
            Price, shipping and refund terms fit your limits.
          </span>
        </div>
      `;

  let actions = `
    <button id="spendwall-close" class="sw-btn sw-btn--primary" type="button">
      ${swIcon(
        result.decision === "BLOCK"
          ? "arrowLeft"
          : "check"
      )}
      ${
        result.decision === "BLOCK"
          ? "Back to safety"
          : "Close"
      }
    </button>
  `;

  if (canContinue) {
    actions = `
      <button id="spendwall-close" class="sw-btn sw-btn--primary" type="button">
        ${swIcon("arrowLeft")}
        Go back
      </button>
      <button id="spendwall-continue" class="sw-btn sw-btn--ghost" type="button">
        Continue anyway
        ${swIcon("arrowRight")}
      </button>
    `;
  }

  overlay.innerHTML = swShell({
    ui,
    pill: "Checkout paused",
    facts,
    body: `
      <p class="sw-summary">${summary}</p>
      ${list}
      <div class="sw-actions">${actions}</div>
      <p class="sw-foot">
        ${swIcon("shield")}
        Decided by your Spendwall purchase rules
      </p>
    `,
  });

  document.body.appendChild(overlay);

  const closeButton =
    document.getElementById(
      "spendwall-close"
    );

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      () => {
        overlay.remove();
      }
    );
  }

  const continueButton =
    document.getElementById(
      "spendwall-continue"
    );

  if (
    continueButton &&
    options.button
  ) {
    continueButton.addEventListener(
      "click",
      () => {
        overlay.remove();

        continueCheckout(
          options.button
        );
      }
    );
  }
}

// ============================================
// ERROR OVERLAY
// ============================================

function showVerificationError(
  message,
  button
) {
  const existing =
    document.getElementById(
      "spendwall-warning"
    );

  if (existing) {
    existing.remove();
  }

  const overlay =
    document.createElement("div");

  overlay.id = "spendwall-warning";

  overlay.innerHTML = swShell({
    ui: SW_DECISION_UI.CHECK,
    pill: "Checkout paused",
    body: `
      <p class="sw-summary">
        ${escapeHtml(
          message ||
            "Some checkout information could not be verified."
        )}
      </p>
      <ul class="sw-reasons">
        <li class="sw-reason sw-reason--warn">
          <span class="sw-reason-icon">${swIcon("alert")}</span>
          <span class="sw-reason-copy">
            <span class="sw-reason-tag">Your call</span>
            <span class="sw-reason-text">Spendwall will not block you just because verification failed.</span>
          </span>
        </li>
      </ul>
      <div class="sw-actions">
        <button id="spendwall-close" class="sw-btn sw-btn--primary" type="button">
          ${swIcon("arrowLeft")}
          Stay here
        </button>
        <button id="spendwall-continue" class="sw-btn sw-btn--ghost" type="button">
          Continue to checkout
          ${swIcon("arrowRight")}
        </button>
      </div>
    `,
  });

  document.body.appendChild(overlay);

  const closeButton =
    document.getElementById(
      "spendwall-close"
    );

  if (closeButton) {
    closeButton.addEventListener(
      "click",
      () => {
        overlay.remove();
      }
    );
  }

  const continueButton =
    document.getElementById(
      "spendwall-continue"
    );

  if (continueButton) {
    continueButton.addEventListener(
      "click",
      () => {
        overlay.remove();

        continueCheckout(button);
      }
    );
  }
}

// ============================================
// ESCAPE AI / WEBSITE TEXT BEFORE HTML
// ============================================

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ============================================
// CONTINUE ORIGINAL WEBSITE ACTION
// ============================================

function continueCheckout(button) {
  if (!button) {
    return;
  }

  console.log(
    "Spendwall allowing checkout to continue"
  );

  approvedButton = button;

  // Trigger the website's original button again.
  button.click();

  // Reset shortly afterward.
  setTimeout(() => {
    approvedButton = null;
  }, 1000);
}

// ============================================
// INTERCEPT CHECKOUT / PURCHASE CLICKS
// ============================================

document.addEventListener(
  "click",

  async (event) => {
    const button =
      event.target.closest(`
        button,
        input[type="submit"],
        input[type="button"],
        [role="button"],
        a
      `);

    if (!button) {
      return;
    }

    // This is the second click generated by
    // Spendwall after approval.
    // DO NOT intercept it again.
    if (button === approvedButton) {
      console.log(
        "Spendwall approved click — continuing"
      );

      approvedButton = null;
      return;
    }

    const text = (
      button.innerText ||
      button.value ||
      button.getAttribute(
        "aria-label"
      ) ||
      button.textContent ||
      ""
    )
      .trim()
      .toLowerCase();

    const purchaseWords = [
      "checkout now",
      "proceed to checkout",
      "place order",
      "pay now",
      "complete purchase",
      "complete order",
      "submit order",
      "confirm purchase",
      "confirm order",
      "buy now",
    ];

    const purchaseButton =
      purchaseWords.some((word) =>
        text.includes(word)
      );

    if (!purchaseButton) {
      return;
    }

    console.log(
      "Spendwall intercepted:",
      text
    );

    // Temporarily stop the website while
    // Spendwall performs its check.
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    updateBadge(
      "Checking before proceeding..."
    );

    try {
      // Re-scan because the cart may have
      // changed since page load.
      const check =
        await runSpendwallCheck();

      latestCheckout =
        check.checkout;

      latestResult =
        check.result;

      console.log(
        "Spendwall checkout:",
        latestCheckout
      );

      console.log(
        "Spendwall decision:",
        latestResult
      );

      // ======================================
      // BLOCK
      // ======================================

      if (
        latestResult.decision ===
        "BLOCK"
      ) {
        updateBadge(
          "Purchase blocked",
          "danger"
        );

        showSpendwallResult(
          latestResult
        );

        return;
      }

      // ======================================
      // WARN
      // ======================================

      if (
        latestResult.decision ===
        "WARN"
      ) {
        updateBadge(
          "Review required",
          "warning"
        );

        showSpendwallResult(
          latestResult,
          {
            button,
          }
        );

        return;
      }

      // ======================================
      // ALLOW
      // ======================================

      updateBadge(
        "Purchase allowed",
        "safe"
      );

      continueCheckout(button);
    } catch (error) {
      console.error(
        "Spendwall purchase check failed:",
        error
      );

      updateBadge(
        "Could not verify purchase",
        "warning"
      );

      // Verification failure is NOT a block.
      // User gets the choice to continue.
      showVerificationError(
        error.message,
        button
      );
    }
  },

  true
);

// ============================================
// START SPENDWALL AUTOMATICALLY
// ============================================

function startSpendwall() {
  createBadge();

  // Do not automatically send shopping pages to the AI.
  // Spendwall performs the full check when the user
  // actually attempts to checkout.
  if (looksLikeShoppingPage()) {
    updateBadge(
      "Ready to protect checkout"
    );
  } else {
    updateBadge(
      "Protection active"
    );
  }
}

if (
  document.readyState === "loading"
) {
  document.addEventListener(
    "DOMContentLoaded",
    startSpendwall
  );
} else {
  startSpendwall();
}
