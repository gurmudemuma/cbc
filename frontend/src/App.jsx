import React, { useState, useEffect } from 'react';
import ApiService from './services/api';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [exports, setExports] = useState([]);
  const [services, setServices] = useState({});
  const [selectedOrg, setSelectedOrg] = useState('commercialBank');

  useEffect(() => {
    checkServices();
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const checkServices = async () => {
    const serviceStatus = await ApiService.checkAllServices();
    setServices(serviceStatus);
  };

  const handleLogin = async (credentials) => {
    try {
      const result = await ApiService.login(selectedOrg, credentials);
      if (result.success) {
        setUser(result.user);
        loadExports();
      }
    } catch (error) {
      alert('Login failed: ' + error.message);
    }
  };

  const loadExports = async () => {
    try {
      const result = await ApiService.getExports(selectedOrg);
      if (result.success) {
        setExports(result.data);
      }
    } catch (error) {
      console.error('Failed to load exports:', error);
    }
  };

  const createExport = async (exportData) => {
    try {
      const result = await ApiService.createExport(selectedOrg, exportData);
      if (result.success) {
        loadExports();
      }
    } catch (error) {
      alert('Failed to create export: ' + error.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Coffee Export Consortium</h1>
        
        {/* Organization Selector */}
        <div className="org-selector">
          <label>Organization: </label>
          <select value={selectedOrg} onChange={(e) => setSelectedOrg(e.target.value)}>
            <option value="commercialBank">Commercial Bank</option>
            <option value="nationalBank">National Bank</option>
            <option value="ecta">ECTA</option>
            <option value="ecx">ECX</option>
            <option value="shippingLine">Shipping Line</option>
            <option value="customAuthorities">Custom Authorities</option>
          </select>
        </div>

        {/* Service Status */}
        <div className="service-status">
          <h3>Service Status</h3>
          {Object.entries(services).map(([org, status]) => (
            <div key={org} className={`service ${status.status}`}>
              {org}: {status.status}
            </div>
          ))}
          <button onClick={checkServices}>Refresh Status</button>
        </div>

        {/* Login Form */}
        {!user && (
          <div className="login-form">
            <h3>Login to {selectedOrg}</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              handleLogin({
                username: formData.get('username'),
                password: formData.get('password')
              });
            }}>
              <input name="username" placeholder="Username" required />
              <input name="password" type="password" placeholder="Password" required />
              <button type="submit">Login</button>
            </form>
          </div>
        )}

        {/* User Dashboard */}
        {user && (
          <div className="dashboard">
            <h3>Welcome, {user.username} ({user.role})</h3>
            
            {/* Create Export Form */}
            <div className="create-export">
              <h4>Create Export</h4>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                createExport({
                  exportId: 'EXP-' + Date.now(),
                  exporterId: user.organizationId,
                  coffeeType: formData.get('coffeeType'),
                  quantity: parseInt(formData.get('quantity')),
                  destination: formData.get('destination'),
                  estimatedValue: parseInt(formData.get('estimatedValue')),
                  status: 'DRAFT',
                  createdAt: new Date().toISOString()
                });
                e.target.reset();
              }}>
                <input name="coffeeType" placeholder="Coffee Type" required />
                <input name="quantity" type="number" placeholder="Quantity (kg)" required />
                <input name="destination" placeholder="Destination Country" required />
                <input name="estimatedValue" type="number" placeholder="Estimated Value (USD)" required />
                <button type="submit">Create Export</button>
              </form>
            </div>

            {/* Exports List */}
            <div className="exports-list">
              <h4>Exports ({exports.length})</h4>
              <button onClick={loadExports}>Refresh</button>
              {exports.map(exp => (
                <div key={exp.exportId} className="export-item">
                  <strong>{exp.exportId}</strong> - {exp.coffeeType} - {exp.status}
                </div>
              ))}
            </div>

            <button onClick={() => {
              localStorage.clear();
              setUser(null);
              setExports([]);
            }}>Logout</button>
          </div>
        )}
      </header>
    </div>
  );
}

export default App;
