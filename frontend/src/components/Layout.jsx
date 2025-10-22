import { Outlet, Link, useLocation } from 'react-router-dom'
import { Coffee, Package, Award, DollarSign, Ship, LogOut, Menu, X, ShieldCheck, Users, FileCheck, Plane } from 'lucide-react'
import { useState } from 'react'
import './Layout.css'

const Layout = ({ user, org, onLogout }) => {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const navigation = [
    { name: 'Dashboard', path: '/dashboard', icon: Coffee, orgs: ['all'] },
    
    // Exporter Portal - Off-chain: submits to National Bank
    { name: 'Export Management', path: '/exports', icon: Package, orgs: ['exporter-portal', 'exporter'] },
    
    // National Bank - Creates blockchain records, approves FX (FIRST STEP)
    { name: 'Export Requests', path: '/exports', icon: Package, orgs: ['nationalbank'] },
    { name: 'FX Approval', path: '/fx-approval', icon: DollarSign, orgs: ['nationalbank'] },
    { name: 'FX Rates', path: '/fx-rates', icon: DollarSign, orgs: ['nationalbank'] },
    { name: 'User Management', path: '/users', icon: Users, orgs: ['nationalbank'] },
    
    // Exporter Bank - Banking/Financial validation (SECOND STEP, after FX)
    { name: 'Banking Approval', path: '/banking', icon: Package, orgs: ['exporter', 'exporterbank'] },
    
    // NCAT - Quality Certification (THIRD STEP, after banking)
    { name: 'Quality Certification', path: '/quality', icon: Award, orgs: ['ncat'] },
    { name: 'Origin Certificates', path: '/origin-certificates', icon: FileCheck, orgs: ['ncat'] },
    
    // Export Customs Authority - Export clearance (FOURTH STEP, before shipment)
    { name: 'Export Customs', path: '/customs/export', icon: ShieldCheck, orgs: ['customauthorities', 'export-customs'] },
    
    // Shipping Line - Shipment & Arrival (FIFTH & SIXTH STEPS)
    { name: 'Shipment Management', path: '/shipments', icon: Ship, orgs: ['shipping'] },
    { name: 'Arrival Notifications', path: '/arrivals', icon: Plane, orgs: ['shipping'] },
    
    // Import Customs Authority - Import clearance (SEVENTH STEP, after arrival)
    { name: 'Import Customs', path: '/customs/import', icon: ShieldCheck, orgs: ['customauthorities', 'import-customs'] },
  ]

  const filteredNavigation = navigation.filter(item => 
    item.orgs.includes('all') || item.orgs.includes((org || user?.role || '').toLowerCase())
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
          <nav className="sidebar-nav" role="navigation" aria-label="Main Navigation">
            {filteredNavigation.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={`${item.path}-${item.name}`}
                  to={item.path}
                  className={`nav-item ${active ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                  aria-current={active ? 'page' : undefined}
                  title={item.name}
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
