import { useState } from "react";
import { Headphones, XCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { BrandMark } from "./components/Brand.jsx";
import { DecisionStamp } from "./components/Decision.jsx";

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

  const firstYearCost = checkout.subscription
    ? checkout.totalToday + checkout.subscriptionPrice * 11
    : checkout.totalToday;
  const hiddenMarkup = firstYearCost - checkout.advertisedPrice;

  return (
    <div className="min-h-screen bg-paper px-4 py-8 font-sans text-ink sm:py-12">
      <div className="mx-auto max-w-xl space-y-5">
        <div className="flex items-center justify-between">
          <a href="/" className="group flex items-center gap-1 text-sm font-bold text-muted transition hover:text-ink">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
            Dashboard
          </a>
          <span className="rounded-full border-2 border-ink/10 bg-white px-3 py-1 text-xs font-bold text-muted">
            Demo merchant page
          </span>
        </div>

        <main className="overflow-hidden rounded-[32px] bg-white shadow-card">
          <div className="flex items-center gap-4 border-b-2 border-paper p-6 sm:p-8">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-paper">
              <Headphones className="h-8 w-8" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">NOVA AUDIO</p>
              <h1 className="font-display text-4xl font-extrabold leading-none tracking-tight">Checkout</h1>
            </div>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            <h2 className="font-display text-xl font-bold">Nova Wireless Headphones</h2>

            <table className="w-full text-sm">
              <caption className="sr-only">Order summary</caption>
              <tbody>
                <tr className="border-b border-paper">
                  <th scope="row" className="py-2.5 text-left font-medium text-muted">Headphones</th>
                  <td className="py-2.5 text-right font-bold tabular-nums">$79.99</td>
                </tr>
                <tr className="border-b border-paper">
                  <th scope="row" className="py-2.5 text-left font-medium text-muted">Shipping</th>
                  <td className="py-2.5 text-right font-bold tabular-nums">$14.99</td>
                </tr>
                <tr className="border-b border-paper">
                  <th scope="row" className="py-2.5 text-left font-medium text-muted">Premium Membership</th>
                  <td className="py-2.5 text-right font-bold tabular-nums">$9.99/month</td>
                </tr>
              </tbody>
            </table>

            <p className="rounded-2xl bg-coral/15 px-4 py-3 text-sm font-bold text-ink">
              Final sale — this purchase is non-refundable.
            </p>

            <h2 className="border-t-2 border-ink pt-4 font-display">
              <span className="text-lg font-bold">Total today: </span>
              <span className="text-4xl font-extrabold tabular-nums tracking-tight">$104.97</span>
            </h2>

            <button
              type="button"
              onClick={testSpendwall}
              className="w-full rounded-full border-2 border-ink bg-ink px-6 py-4 text-base font-bold text-paper transition hover:-translate-y-0.5 hover:shadow-pop"
            >
              Place Order
            </button>
          </div>
        </main>

        {result && (
          <section
            aria-live="polite"
            className="animate-rise overflow-hidden rounded-[32px] border-2 border-ink bg-white shadow-pop-lg"
          >
            <div className={`flex flex-wrap items-center justify-between gap-4 p-6 ${result.decision === "BLOCK" ? "bg-coral/20" : "bg-lime/30"}`}>
              <div>
                <BrandMark />
                <p className="mt-3 text-sm font-bold text-ink/70">Spendwall decision</p>
              </div>
              <DecisionStamp decision={result.decision} />
            </div>

            <div className="space-y-5 p-6">
              {result.violations.length > 0 && (
                <ul className="space-y-2">
                  {result.violations.map((violation, index) => (
                    <li key={index} className="flex items-start gap-2.5 rounded-2xl bg-paper px-4 py-3 text-sm font-bold">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral" aria-hidden="true" />
                      {violation}
                    </li>
                  ))}
                </ul>
              )}

              <div className="rounded-3xl bg-ink p-5 text-paper">
                <p className="font-display text-lg font-extrabold">
                  TrueCost<span className="text-lime">.</span>
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-xs text-paper/60">Advertised</dt>
                    <dd className="font-display text-2xl font-extrabold tabular-nums">${checkout.advertisedPrice.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-paper/60">First 12 months</dt>
                    <dd className="font-display text-2xl font-extrabold tabular-nums text-coral">${firstYearCost.toFixed(2)}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs leading-relaxed text-paper/70">
                  Includes shipping and 12 months of the membership. That is ${hiddenMarkup.toFixed(2)} more than the sticker price.
                </p>
              </div>

              <p className="flex items-start gap-2 text-sm leading-relaxed text-muted">
                {result.decision === "BLOCK" ? (
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral" aria-hidden="true" />
                ) : (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lime-deep" aria-hidden="true" />
                )}
                {result.decision === "BLOCK"
                  ? "Purchase stopped before payment because it conflicts with your Spendwall rules."
                  : "This purchase fits your Spendwall rules."}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
