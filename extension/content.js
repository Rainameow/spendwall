console.log("Spendwall protection active");

function keywordFallback(pageText) {
  const problems = [];
  if (
    pageText.includes("subscription") ||
    pageText.includes("monthly") ||
    pageText.includes("recurring")
  ) {
    problems.push("Recurring subscription detected");
  }
  if (
    pageText.includes("final sale") ||
    pageText.includes("non-refundable")
  ) {
    problems.push("Purchase may be non-refundable");
  }
  return problems;
}

async function analyzeCheckout() {
  const pageText = document.body.innerText.toLowerCase();
  const problems = [];

  try {
    const response = await fetch("http://localhost:8000/api/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: pageText.slice(0, 2000) })
    });
    const data = await response.json();

    if (data.label === "dark_pattern") {
      problems.push("Spendwall ML classifier flagged manipulative checkout language");
    }
  } catch (err) {
    console.warn("Spendwall: classifier unreachable, using fallback rules only", err);
  }

  // Fast keyword rules always run too, as a safety net
  problems.push(...keywordFallback(pageText));

  return problems;
}

function showSpendwallWarning(problems) {
  if (document.getElementById("spendwall-warning")) {
    return;
  }

  const overlay = document.createElement("div");
  overlay.id = "spendwall-warning";

  overlay.innerHTML = `
    <div class="spendwall-modal">
      <div class="spendwall-logo">S</div>
      <div class="spendwall-badge">
        PURCHASE BLOCKED
      </div>
      <h1>Spendwall stopped this purchase.</h1>
      <p>
        This checkout conflicts with your spending rules.
      </p>
      <div class="spendwall-problems">
        ${problems
          .map(
            (problem) => `
              <div>
                <span>!</span>
                ${problem}
              </div>
            `
          )
          .join("")}
      </div>
      <button id="spendwall-close">
        Go back
      </button>
    </div>
  `;

  document.body.appendChild(overlay);

  document
    .getElementById("spendwall-close")
    .addEventListener("click", () => {
      overlay.remove();
    });
}

document.addEventListener(
  "click",
  async function (event) {
    const button = event.target.closest(
      "button, input[type='submit']"
    );

    if (!button) return;
    if (button.dataset.spendwallCleared === "true") return; // already checked, let it through

    const text =
      button.innerText?.toLowerCase() ||
      button.value?.toLowerCase() ||
      "";

    const paymentWords = [
      "pay",
      "purchase",
      "place order",
      "checkout",
      "buy now",
    ];

    const isPaymentButton = paymentWords.some((word) =>
      text.includes(word)
    );

    if (!isPaymentButton) return;

    // Hold the click while we check
    event.preventDefault();
    event.stopPropagation();

    const problems = await analyzeCheckout();

    if (problems.length > 0) {
      showSpendwallWarning(problems);
    } else {
      // Nothing flagged, let the original click through
      button.dataset.spendwallCleared = "true";
      button.click();
    }
  },
  true
);