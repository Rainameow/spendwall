import React from "react";
import ReactDOM from "react-dom/client";
import SpendwallDashboard from "./SpendwallDashboard.jsx";
import CheckoutSimulator from "./CheckoutSimulator.jsx";
import "./index.css";

const isCheckout = window.location.pathname === "/checkout";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isCheckout ? <CheckoutSimulator /> : <SpendwallDashboard />}
  </React.StrictMode>
);