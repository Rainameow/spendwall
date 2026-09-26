import { useState } from "react";

export default function CheckoutSimulator() {
  const [result, setResult] = useState(null);

  const checkout = {
    merchant: "Nova Audio",
    item: "Nova Wireless Headphones",
    advertisedPrice: 79.99,
    shipping: 14.99,
    subscription: true,
    subscriptionPrice: 9.99,
    refundable: false,
    finalSale: true,
    totalToday: 104.97,
  };

  const testSpendwall = () => {
    const violations = [];

    if (checkout.subscription) {
      violations.push("Recurring subscription detected: $9.99/month");
    }

    if (!checkout.refundable) {
      violations.push("Item is final sale and non-refundable");
    }

    if (checkout.shipping > 15) {
      violations.push("Shipping exceeds your $15 limit");
    }

    if (checkout.totalToday > 120) {
      violations.push("Purchase exceeds your $120 spending limit");
    }

    setResult({
      decision: violations.length > 0 ? "BLOCK" : "ALLOW",
      violations,
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f5",
        padding: "50px 20px",
        fontFamily: "Arial",
      }}
    >
      <div
        style={{
          maxWidth: "600px",
          margin: "auto",
          background: "white",
          padding: "32px",
          borderRadius: "16px",
        }}
      >
        <p style={{ color: "#777" }}>NOVA AUDIO</p>

        <h1>Checkout</h1>

        <h2>Nova Wireless Headphones</h2>

        <hr />

        <p>Headphones: $79.99</p>
        <p>Shipping: $14.99</p>
        <p>Premium Membership: $9.99/month</p>

        <p style={{ color: "#b00020" }}>
          Final sale — this purchase is non-refundable.
        </p>

        <hr />

        <h2>Total today: $104.97</h2>

        <button
          onClick={testSpendwall}
          style={{
            width: "100%",
            padding: "16px",
            marginTop: "20px",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Place Order
        </button>

        {result && (
          <div
            style={{
              marginTop: "25px",
              padding: "20px",
              border: "2px solid #222",
              borderRadius: "12px",
            }}
          >
            <h2>🛡 Spendwall: {result.decision}</h2>

            {result.violations.map((violation, index) => (
              <p key={index}>✕ {violation}</p>
            ))}

            <p>
              Purchase stopped before payment because it conflicts with your
              Spendwall rules.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}