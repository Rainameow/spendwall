console.log("Spendwall protection active");

// ============================================
// SETTINGS
// ============================================

const SPENDWALL_API = "https://spendwall-umber.vercel.app";

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
  if (document.getElementById("spendwall-live-badge")) {
    return;
  }

  const badge = document.createElement("div");

  badge.id = "spendwall-live-badge";

  badge.style.cssText = `
    position: fixed;
    right: 22px;
    bottom: 22px;
    z-index: 2147483647;

    background: #f7f5ed;
    color: #151515;

    border: 3px solid #151515;
    border-radius: 14px;

    padding: 11px 15px;

    font-family:
      Arial,
      "Helvetica Neue",
      sans-serif;

    font-size: 13px;
    font-weight: 700;

    box-shadow: 5px 5px 0 #151515;

    cursor: pointer;

    transition:
      transform 0.18s ease,
      box-shadow 0.18s ease;
  `;

  badge.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 10px;
    ">

      <div
        id="spendwall-live-dot"
        style="
          width: 12px;
          height: 12px;

          flex-shrink: 0;

          border: 2px solid #151515;
          border-radius: 50%;

          background: #b8ff3d;
        "
      ></div>

      <div>
        <div style="
          font-size: 13px;
          font-weight: 800;
          letter-spacing: -0.2px;
          line-height: 1.1;
        ">
          Spendwall
        </div>

        <div
          id="spendwall-live-status"
          style="
            margin-top: 3px;

            color: #66645f;

            font-size: 10px;
            font-weight: 600;
            line-height: 1.1;
          "
        >
          Protection active
        </div>
      </div>

    </div>
  `;

  document.body.appendChild(badge);

  badge.addEventListener("mouseenter", () => {
    badge.style.transform = "translate(-2px, -2px)";
    badge.style.boxShadow = "7px 7px 0 #151515";
  });

  badge.addEventListener("mouseleave", () => {
    badge.style.transform = "translate(0, 0)";
    badge.style.boxShadow = "5px 5px 0 #151515";
  });

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

  if (type === "danger") {
    badge.style.border =
      "1px solid #ff477e";
  } else if (type === "warning") {
    badge.style.border =
      "1px solid #f59e0b";
  } else if (type === "safe") {
    badge.style.border =
      "1px solid #22c55e";
  } else {
    badge.style.border =
      "1px solid #30323a";
  }
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

  const reasons = [
    ...(result.violations || []),
    ...(result.warnings || []),
  ];

  let heading =
    "Spendwall approved this purchase.";

  if (result.decision === "BLOCK") {
    heading =
      "Spendwall stopped this purchase.";
  }

  if (result.decision === "WARN") {
    heading =
      "Spendwall found something to review.";
  }

  const canContinue =
    result.decision === "WARN" &&
    options.button;

  overlay.innerHTML = `
    <div class="spendwall-modal">

      <div class="spendwall-logo">
        S
      </div>

      <div class="spendwall-badge">
        ${result.decision}
      </div>

      <h1>${heading}</h1>

      <p>
        ${
          result.merchant
            ? `Merchant: ${escapeHtml(
                result.merchant
              )}<br>`
            : ""
        }

        ${
          result.item
            ? `Item: ${escapeHtml(
                result.item
              )}<br>`
            : ""
        }

        Risk score:
        ${result.riskScore ?? "—"}/100
      </p>

      ${
        reasons.length
          ? `
            <div class="spendwall-problems">
              ${reasons
                .map(
                  (reason) => `
                    <div>
                      <span>!</span>
                      ${escapeHtml(reason)}
                    </div>
                  `
                )
                .join("")}
            </div>
          `
          : `
            <p>
              No spending rules were violated.
            </p>
          `
      }

      ${
        canContinue
          ? `
            <button
              id="spendwall-continue"
              style="margin-bottom:10px;"
            >
              Continue anyway
            </button>

            <button id="spendwall-close">
              Go back
            </button>
          `
          : `
            <button id="spendwall-close">
              ${
                result.decision ===
                "BLOCK"
                  ? "Go back"
                  : "Close"
              }
            </button>
          `
      }

    </div>
  `;

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

  overlay.innerHTML = `
    <div class="spendwall-modal">

      <div class="spendwall-logo">
        S
      </div>

      <div class="spendwall-badge">
        CHECK INCOMPLETE
      </div>

      <h1>
        Spendwall couldn't fully verify this purchase.
      </h1>

      <p>
        ${escapeHtml(
          message ||
            "Some checkout information could not be verified."
        )}
      </p>

      <div class="spendwall-problems">
        <div>
          <span>!</span>
          Spendwall will not block you just because verification failed.
        </div>
      </div>

      <button
        id="spendwall-continue"
        style="margin-bottom:10px;"
      >
        Continue to checkout
      </button>

      <button id="spendwall-close">
        Stay here
      </button>

    </div>
  `;

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