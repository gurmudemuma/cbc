import React, { useState, useEffect } from 'react';
import './App.css';

const API_ENDPOINTS = {
  'commercial-bank': 'http://localhost:3001',
  'national-bank': 'http://localhost:3002',
  'ecta': 'http://localhost:3003',
  'ecx': 'http://localhost:3004',
  'shipping-line': 'http://localhost:3005',
  'custom-authorities': 'http://localhost:3006'
};

function App() {
  const [exports, setExports] = useState([]);
  const [apiStatus, setApiStatus] = useState({});
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedOrg, setSelectedOrg] = useState('commercial-bank');
  const [formData, setFormData] = useState({
    exportId: '',
    quantity: '',
    destination: '',
    coffeeType: 'Arabica'
  });

  useEffect(() => {
    checkAllAPIs();
    loadExports();
    const interval = setInterval(checkAllAPIs, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkAllAPIs = async () => {
    const status = {};
    for (const [org, url] of Object.entries(API_ENDPOINTS)) {
      try {
        const response = await fetch(`${url}/health`);
        status[org] = response.ok ? 'online' : 'offline';
      } catch (error) {
        status[org] = 'offline';
      }
    }
    setApiStatus(status);
  };

  const login = async (organization) => {
    try {
      const response = await fetch(`${API_ENDPOINTS[organization]}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      const data = await response.json();
      if (data.success) {
        setCurrentUser({ ...data.user, organization });
        localStorage.setItem('token', data.token);
        localStorage.setItem('organization', organization);
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const loadExports = async () => {
    try {
      const response = await fetch(`${API_ENDPOINTS[selectedOrg]}/api/exports`);
      const data = await response.json();
      if (data.success) {
        setExports(data.data);
      }
    } catch (error) {
      console.error('Failed to load exports:', error);
    }
  };

  const createExport = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${API_ENDPOINTS[selectedOrg]}/api/exports`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...formData,
          quantity: parseInt(formData.quantity)
        })
      });
      const data = await response.json();
      if (data.success) {
        setFormData({ exportId: '', quantity: '', destination: '', coffeeType: 'Arabica' });
        loadExports();
        alert('Export created successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>Coffee Export Consortium</h1>
        <p>Blockchain-Powered Supply Chain Management</p>
      </header>

      <div className="container">
        {/* System Status */}
        <div className="card">
          <h3>System Status</h3>
          <div className="status-grid">
            {Object.entries(API_ENDPOINTS).map(([org, url]) => (
              <div key={org} className="status-item">
                <div className={`status-dot ${apiStatus[org] || 'offline'}`}></div>
                <span>{org.replace('-', ' ').toUpperCase()}</span>
                <button 
                  className="btn-small" 
                  onClick={() => login(org)}
                  disabled={apiStatus[org] !== 'online'}
                >
                  Login
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* User Info */}
        {currentUser && (
          <div className="card user-info">
            <h3>Logged in as: {currentUser.username} ({currentUser.organization})</h3>
          </div>
        )}

        {/* Export Creation */}
        <div className="card">
          <h3>Create Export</h3>
          <div className="form-group">
            <label>Organization:</label>
            <select 
              value={selectedOrg} 
              onChange={(e) => setSelectedOrg(e.target.value)}
            >
              {Object.keys(API_ENDPOINTS).map(org => (
                <option key={org} value={org}>
                  {org.replace('-', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          
          <form onSubmit={createExport}>
            <div className="form-row">
              <div className="form-group">
                <label>Export ID:</label>
                <input
                  type="text"
                  value={formData.exportId}
                  onChange={(e) => setFormData({...formData, exportId: e.target.value})}
                  required
                  placeholder="EXP001"
                />
              </div>
              <div className="form-group">
                <label>Coffee Type:</label>
                <select
                  value={formData.coffeeType}
                  onChange={(e) => setFormData({...formData, coffeeType: e.target.value})}
                >
                  <option value="Arabica">Arabica</option>
                  <option value="Robusta">Robusta</option>
                  <option value="Ethiopian Premium">Ethiopian Premium</option>
                  <option value="Colombian">Colombian</option>
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Quantity (kg):</label>
                <input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  required
                  placeholder="1000"
                />
              </div>
              <div className="form-group">
                <label>Destination:</label>
                <input
                  type="text"
                  value={formData.destination}
                  onChange={(e) => setFormData({...formData, destination: e.target.value})}
                  required
                  placeholder="USA"
                />
              </div>
            </div>
            
            <button type="submit" className="btn-primary">Create Export</button>
          </form>
        </div>

        {/* Export List */}
        <div className="card">
          <h3>Export History</h3>
          <button className="btn-secondary" onClick={loadExports}>Refresh</button>
          
          <div className="export-list">
            {exports.length > 0 ? (
              exports.map(exp => (
                <div key={exp.id} className="export-item">
                  <div className="export-header">
                    <strong>{exp.export_id}</strong>
                    <span className={`status-badge ${exp.status}`}>{exp.status}</span>
                  </div>
                  <div className="export-details">
                    <p><strong>Organization:</strong> {exp.organization}</p>
                    <p><strong>Coffee:</strong> {exp.coffee_type}</p>
                    <p><strong>Quantity:</strong> {exp.quantity} kg</p>
                    <p><strong>Destination:</strong> {exp.destination}</p>
                    <p><strong>Created:</strong> {new Date(exp.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <p>No exports found. Create your first export above.</p>
            )}
          </div>
        </div>

        {/* Blockchain Info */}
        <div className="card blockchain-info">
          <h3>Blockchain Network</h3>
          <div className="network-stats">
            <div className="stat">
              <h4>{exports.length}</h4>
              <p>Total Exports</p>
            </div>
            <div className="stat">
              <h4>6</h4>
              <p>Organizations</p>
            </div>
            <div className="stat">
              <h4>{Object.values(apiStatus).filter(s => s === 'online').length}</h4>
              <p>Active APIs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
