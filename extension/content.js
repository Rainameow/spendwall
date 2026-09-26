console.log("Spendwall protection active");

function analyzeCheckout() {
  const pageText = document.body.innerText.toLowerCase();

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
  function (event) {
    const button = event.target.closest(
      "button, input[type='submit']"
    );

    if (!button) return;

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

    const problems = analyzeCheckout();

    if (problems.length > 0) {
      event.preventDefault();
      event.stopPropagation();

      showSpendwallWarning(problems);
    }
  },
  true
);