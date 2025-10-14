import { Outlet, Link, useLocation } from 'react-router-dom'
import { Coffee, Package, Award, DollarSign, Ship, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import './Layout.css'

const Layout = ({ user, onLogout }) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: Coffee, roles: ['all'] },
    { name: 'Export Management', path: '/exports', icon: Package, roles: ['exporter'] },
    { name: 'Quality Certification', path: '/quality', icon: Award, roles: ['ncat'] },
    { name: 'FX Rates', path: '/fx-rates', icon: DollarSign, roles: ['nationalbank'] },
    { name: 'Shipment Tracking', path: '/shipments', icon: Ship, roles: ['shipping'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes('all') || item.roles.includes(user?.role?.toLowerCase())
  )

  const isActive = (path) => location.pathname === path

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="logo">
              <Coffee size={32} />
              <span className="logo-text">Coffee Blockchain</span>
            </div>
          </div>
          
          <div className="header-right">
            <div className="user-info">
              <div className="user-avatar">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.username}</div>
                <div className="user-org">{user?.organizationId || user?.role}</div>
              </div>
            </div>
            <button className="logout-btn" onClick={onLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <nav className="sidebar-nav">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}

export default Layout
