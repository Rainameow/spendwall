import { useState } from 'react'
import './App.css'

const initialRules = [
  {
    id: 1,
    icon: '↻',
    title: 'Block subscriptions',
    description: 'Recurring charges are automatically blocked.',
    enabled: true,
  },
  {
    id: 2,
    icon: '$',
    title: 'Approval over $100',
    description: 'Ask for confirmation before larger purchases.',
    enabled: true,
  },
  {
    id: 3,
    icon: '↗',
    title: 'Shipping limit',
    description: 'Warn when shipping costs more than $10.',
    enabled: true,
  },
  {
    id: 4,
    icon: '✓',
    title: 'Refundable only',
    description: 'Block final-sale and non-refundable purchases.',
    enabled: true,
  },
]

function App() {
  const [rules, setRules] = useState(initialRules)
  const [saved, setSaved] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)

  const toggleRule = (id) => {
    setRules(
      rules.map((rule) =>
        rule.id === id
          ? { ...rule, enabled: !rule.enabled }
          : rule
      )
    )
    setSaved(false)
  }

  const saveRules = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const activeRules = rules.filter((rule) => rule.enabled).length

  return (
    <div className="dashboard">

      {/* SIDEBAR */}

      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brandMark">S</div>
            <span>SPENDWALL</span>
          </div>

          <div className="nav">
            <button className="navItem active">
              <span>⌂</span>
              Overview
            </button>

            <button className="navItem">
              <span>◫</span>
              Rules
            </button>

            <button className="navItem">
              <span>↗</span>
              Activity
            </button>

            <button className="navItem">
              <span>⚙</span>
              Settings
            </button>
          </div>
        </div>

        <div className="sidebarBottom">

          <div className="protectionCard">
            <div className="protectionIcon">✓</div>

            <div>
              <span className="smallLabel">PROTECTION</span>
              <strong>Spendwall active</strong>
            </div>

            <span className="onlineDot"></span>
          </div>

          <div className="profile">
            <div className="avatar">RM</div>

            <div>
              <strong>Raina</strong>
              <span>Personal account</span>
            </div>

            <span className="dots">•••</span>
          </div>

        </div>
      </aside>

      {/* MAIN CONTENT */}

      <div className="content">

        <header>
          <div>
            <span className="pageLabel">OVERVIEW</span>
            <h1>Spending control center</h1>
          </div>

          <div className="headerStatus">
            <span className="liveDot"></span>
            Protection active
          </div>
        </header>

        <main>

          {/* FAKE CHECKOUT */}

          {showCheckout && (
            <div className="checkoutOverlay">

              <div className="checkout">

                <button
                  className="checkoutClose"
                  onClick={() => setShowCheckout(false)}
                >
                  ×
                </button>

                <div className="checkoutHeader">
                  <span>DEMO CHECKOUT</span>

                  <h2>Complete your order</h2>

                  <p>
                    Spendwall will analyze this purchase before payment.
                  </p>
                </div>

                <div className="product">

                  <div className="productImage">
                    🎧
                  </div>

                  <div>
                    <strong>Nova Wireless Headphones</strong>
                    <p>Midnight Black</p>
                  </div>

                  <strong>$79.99</strong>

                </div>

                <div className="checkoutDetails">

                  <div>
                    <span>Subtotal</span>
                    <strong>$79.99</strong>
                  </div>

                  <div>
                    <span>Shipping</span>
                    <strong>$14.99</strong>
                  </div>

                  <div>
                    <span>Premium Membership</span>
                    <strong>$9.99/month</strong>
                  </div>

                </div>

                <div className="badTerms">
                  By completing this purchase, you agree to a
                  <strong> recurring monthly subscription </strong>
                  of $9.99. This item is
                  <strong> final sale and non-refundable.</strong>
                </div>

                <div className="total">
                  <span>Due today</span>
                  <strong>$104.97</strong>
                </div>

                <button className="payButton">
                  Pay $104.97
                </button>

                <p className="checkoutSecure">
                  Secure demo checkout · No real payment will be processed
                </p>

              </div>

            </div>
          )}

          {/* INTRO */}

          <section className="intro">

            <div>
              <h2>Your money. Your boundaries.</h2>

              <p>
                Spendwall checks purchases against your personal
                rules before money leaves your account.
              </p>
            </div>

            <button
              className="testButton"
              onClick={() => setShowCheckout(true)}
            >
              Test a purchase
              <span>→</span>
            </button>

          </section>

          {/* STATS */}

          <section className="stats">

            <div className="statCard">
              <span className="statLabel">PROTECTED</span>

              <strong>$247.38</strong>

              <span className="statDetail">
                Across protected purchases
              </span>
            </div>

            <div className="statCard">
              <span className="statLabel">CHECKED</span>

              <strong>12</strong>

              <span className="statDetail">
                Purchases analyzed
              </span>
            </div>

            <div className="statCard">
              <span className="statLabel">BLOCKED</span>

              <strong>3</strong>

              <span className="statDetail warning">
                Risky purchases stopped
              </span>
            </div>

            <div className="statCard">
              <span className="statLabel">RULES</span>

              <strong>{activeRules}</strong>

              <span className="statDetail">
                Currently active
              </span>
            </div>

          </section>

          {/* DASHBOARD GRID */}

          <div className="mainGrid">

            {/* RULES */}

            <section className="panel rulesPanel">

              <div className="panelHeader">

                <div>
                  <span className="sectionLabel">
                    PERSONAL FIREWALL
                  </span>

                  <h3>Your rules</h3>
                </div>

                <span className="ruleCounter">
                  {activeRules}/{rules.length} active
                </span>

              </div>

              <div className="rules">

                {rules.map((rule) => (

                  <div
                    className={`rule ${
                      rule.enabled ? 'enabledRule' : ''
                    }`}
                    key={rule.id}
                  >

                    <div className="ruleIcon">
                      {rule.icon}
                    </div>

                    <div className="ruleText">
                      <strong>{rule.title}</strong>
                      <p>{rule.description}</p>
                    </div>

                    <button
                      className={`toggle ${
                        rule.enabled ? 'on' : ''
                      }`}
                      onClick={() => toggleRule(rule.id)}
                    >
                      <span></span>
                    </button>

                  </div>

                ))}

              </div>

              <button
                className={`saveButton ${
                  saved ? 'saved' : ''
                }`}
                onClick={saveRules}
              >
                {saved ? '✓ Rules saved' : 'Save changes'}
              </button>

            </section>

            {/* RIGHT COLUMN */}

            <section className="rightColumn">

              {/* LIVE MONITOR */}

              <div className="panel monitor">

                <div className="monitorHeader">

                  <div>
                    <span className="sectionLabel">
                      LIVE MONITOR
                    </span>

                    <h3>Checkout protection</h3>
                  </div>

                  <span className="monitorLive">
                    <span></span>
                    LIVE
                  </span>

                </div>

                <div className="scanArea">

                  <div className="scanGraphic">

                    <div className="scanShield">
                      S
                    </div>

                    <div className="scanRing ringOne"></div>

                    <div className="scanRing ringTwo"></div>

                  </div>

                  <strong>
                    Watching for purchases
                  </strong>

                  <p>
                    Spendwall is ready to analyze your next
                    checkout.
                  </p>

                </div>

                <div className="monitorFooter">

                  <span>
                    <i></i>
                    Extension connected
                  </span>

                  <span>
                    Last check 2m ago
                  </span>

                </div>

              </div>

              {/* RECENT CHECK */}

              <div className="panel recent">

                <div className="panelHeader">

                  <div>
                    <span className="sectionLabel">
                      RECENT CHECK
                    </span>

                    <h3>Purchase activity</h3>
                  </div>

                  <span className="blockedBadge">
                    BLOCKED
                  </span>

                </div>

                <div className="purchase">

                  <div className="storeIcon">
                    N
                  </div>

                  <div className="purchaseInfo">
                    <strong>Demo Store</strong>
                    <span>Today · 12:24 AM</span>
                  </div>

                  <strong className="price">
                    $104.97
                  </strong>

                </div>

                <div className="issues">

                  <div>
                    <span>!</span>
                    Subscription detected
                  </div>

                  <div>
                    <span>!</span>
                    Shipping exceeds $10
                  </div>

                </div>

              </div>

            </section>

          </div>

        </main>

      </div>

    </div>
  )
}

export default App