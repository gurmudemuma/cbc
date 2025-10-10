import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Login from './pages/Login.tsx'
import Register from './pages/Register.tsx'
import Dashboard from './pages/Dashboard.tsx'
import CreateExport from './pages/CreateExport.tsx'
import ExportDetails from './pages/ExportDetails.tsx'
import ExportHistory from './pages/ExportHistory.tsx'
import PrivateRoute from './components/PrivateRoute.tsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/register',
    element: <Register />,
  },
  {
    path: '/dashboard',
    element: <PrivateRoute><Dashboard /></PrivateRoute>,
  },
  {
    path: '/create-export',
    element: <PrivateRoute><CreateExport /></PrivateRoute>,
  },
  {
    path: '/export/:id',
    element: <PrivateRoute><ExportDetails /></PrivateRoute>,
  },
  {
    path: '/history',
    element: <PrivateRoute><ExportHistory /></PrivateRoute>,
  },
  {
    path: '*',
    element: <Login />, // Redirect to login or handle 404
  },
], {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>,
)
