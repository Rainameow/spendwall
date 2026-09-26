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
// READ CURRENT WEBSITE
// ============================================

function getCurrentPageData() {
  return {
    url: window.location.href,
    title: document.title,
    pageText: document.body.innerText.slice(0, 15000),
  };
}

// ============================================
// DETECT WHETHER THIS LOOKS LIKE SHOPPING
// ============================================

function looksLikeShoppingPage() {
  const text = document.body.innerText.toLowerCase();

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

  badge.style.cssText = `
    position: fixed;
    right: 22px;
    bottom: 22px;
    z-index: 2147483647;

    background: #111216;
    color: white;

    border: 1px solid #30323a;
    border-radius: 14px;

    padding: 12px 16px;

    font-family:
      -apple-system,
      BlinkMacSystemFont,
      "Segoe UI",
      sans-serif;

    font-size: 13px;
    font-weight: 600;

    box-shadow:
      0 12px 35px rgba(0,0,0,0.28);

    cursor: pointer;
  `;

  badge.innerHTML = `
    <div style="
      display:flex;
      align-items:center;
      gap:9px;
    ">

      <div style="
        width:26px;
        height:26px;
        border-radius:8px;

        background:linear-gradient(
          135deg,
          #ff477e,
          #8b5cf6
        );

        display:flex;
        align-items:center;
        justify-content:center;

        font-weight:800;
      ">
        S
      </div>

      <div>
        <div>Spendwall</div>

        <div
          id="spendwall-live-status"
          style="
            font-size:11px;
            opacity:.7;
            margin-top:2px;
          "
        >
          Protection active
        </div>
      </div>

    </div>
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

function updateBadge(status, type = "normal") {
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
// AUTOMATIC BACKGROUND SCAN
// ============================================

async function scanPage() {
  if (scanInProgress) {
    return;
  }

  scanInProgress = true;

  updateBadge("Scanning purchase...");

  try {
    latestCheckout =
      await extractCheckout();

    console.log(
      "Spendwall extracted:",
      latestCheckout
    );

    latestResult =
      await analyzeCheckout(
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
                result.decision === "BLOCK"
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

  document
    .getElementById(
      "spendwall-close"
    )
    .addEventListener(
      "click",
      () => {
        overlay.remove();
      }
    );

  document
    .getElementById(
      "spendwall-continue"
    )
    .addEventListener(
      "click",
      () => {
        overlay.remove();

        continueCheckout(button);
      }
    );
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
      // Re-scan because cart contents may
      // have changed since page load.
      latestCheckout =
        await extractCheckout();

      console.log(
        "Spendwall checkout:",
        latestCheckout
      );

      latestResult =
        await analyzeCheckout(
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
        latestResult.decision === "BLOCK"
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
        latestResult.decision === "WARN"
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

      // IMPORTANT:
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

  if (looksLikeShoppingPage()) {
    // Give dynamic shopping sites time
    // to render the cart.
    setTimeout(() => {
      scanPage();
    }, 1500);
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