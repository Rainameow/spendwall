import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import SpendwallDashboard from './SpendwallDashboard.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SpendwallDashboard />
  </StrictMode>,
)