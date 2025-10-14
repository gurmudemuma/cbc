import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ExportManagement from './pages/ExportManagement'
import QualityCertification from './pages/QualityCertification'
import FXRates from './pages/FXRates'
import ShipmentTracking from './pages/ShipmentTracking'
import ExportDetails from './pages/ExportDetails'
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { setApiBaseUrl } from './services/api'
import { getApiUrl } from './config/api.config'

function App() {
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#8E24AA',
        light: '#AB47BC',
        dark: '#7B1FA2',
      },
      secondary: {
        main: '#7C4DFF',
        light: '#B388FF',
        dark: '#651FFF',
      },
      background: {
        default: '#F3E5F5',
        paper: '#FFFFFF',
      },
      text: {
        primary: '#212121',
        secondary: '#616161',
      },
      divider: '#E1BEE7',
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setApiBaseUrl(getApiUrl(parsedUser.role))
    }
    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    setApiBaseUrl(getApiUrl(userData.role))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
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
        <RouterProvider router={createBrowserRouter([
          {
            path: "/login",
            element: user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />,
          },
          {
            path: "/",
            element: user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />,
            children: [
              { index: true, element: <Navigate to="/dashboard" /> },
              { path: "dashboard", element: <Dashboard user={user} /> },
              { path: "exports", element: <ExportManagement user={user} /> },
              { path: "exports/:id", element: <ExportDetails user={user} /> },
              { path: "quality", element: <QualityCertification user={user} /> },
              { path: "fx-rates", element: <FXRates user={user} /> },
              { path: "shipments", element: <ShipmentTracking user={user} /> },
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
      )}
    </ThemeProvider>
  )
}

export default App