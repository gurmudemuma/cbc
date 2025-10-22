// Force reload
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useState, useEffect, useMemo } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ExportManagement from './pages/ExportManagement'
import QualityCertification from './pages/QualityCertification'
import FXRates from './pages/FXRates'
import UserManagement from './pages/UserManagement'
import ShipmentTracking from './pages/ShipmentTracking'
import ExportDetails from './pages/ExportDetails'
import CustomsClearance from './pages/CustomsClearance'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { setApiBaseUrl } from './services/api'
import { getApiUrl } from './config/api.config'
import { getThemeConfig } from './config/theme.config'

function App() {
  const [user, setUser] = useState(null)
  const [org, setOrg] = useState(null)
  const [loading, setLoading] = useState(true)

  const theme = useMemo(() => createTheme(getThemeConfig(org)), [org]);

  const getOrgClass = (org) => {
    const map = {
      'exporter-portal': 'exporter-portal',
      'exporter': 'exporter-bank',
      'nationalbank': 'national-bank',
      'ncat': 'ncat',
      'shipping': 'shipping-line',
      'customauthorities': 'custom-authorities',
    };
    return map[org] || 'custom-authorities';
  };

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    const storedOrg = localStorage.getItem('org')
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      const effectiveOrg = storedOrg || parsedUser.role
      setOrg(effectiveOrg)
      setApiBaseUrl(getApiUrl(effectiveOrg))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token, selectedOrg) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('org', selectedOrg)
    setUser(userData)
    setOrg(selectedOrg)
    setApiBaseUrl(getApiUrl(selectedOrg))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('org')
    setUser(null)
    setOrg(null)
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {loading ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: 'var(--color-background)'
        }}>
          <div className="spinner"></div>
        </div>
      ) : (
        <div className={`organization-${getOrgClass(org)}`} style={{ minHeight: '100vh' }}>
          <RouterProvider router={createBrowserRouter([
            {
              path: "/login",
              element: user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />,
            },
            {
              path: "/",
              element: user ? <Layout user={user} org={org} onLogout={handleLogout} /> : <Navigate to="/login" />,
              children: [
                { index: true, element: <Navigate to="/dashboard" /> },
                { path: "dashboard", element: <Dashboard user={user} org={org} /> },
                { path: "exports", element: <ExportManagement user={user} org={org} /> },
                { path: "exports/:id", element: <ExportDetails user={user} org={org} /> },
                { path: "quality", element: <QualityCertification user={user} org={org} /> },
                { path: "origin-certificates", element: <QualityCertification user={user} org={org} /> },
                { path: "fx-approval", element: <ExportManagement user={user} org={org} /> },
                { path: "fx-rates", element: <FXRates user={user} org={org} /> },
                { path: "payment-repatriation", element: <ExportManagement user={user} org={org} /> },
                { path: "banking", element: <ExportManagement user={user} org={org} /> },
                { path: "shipments", element: <ShipmentTracking user={user} org={org} /> },
                { path: "arrivals", element: <ShipmentTracking user={user} org={org} /> },
                { path: "users", element: <UserManagement user={user} org={org} /> },
                { path: "customs", element: <CustomsClearance user={user} org={org} /> },
                { path: "customs/export", element: <CustomsClearance user={user} org={org} /> },
                { path: "customs/import", element: <CustomsClearance user={user} org={org} /> },
              ],
            },
            {
              path: "*",
              element: <Navigate to="/dashboard" />,
            },
          ], {
            future: {
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            },
          })} />
        </div>
      )}
    </ThemeProvider>
  )
}

export default App
