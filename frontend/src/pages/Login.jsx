import { useState } from 'react';
import { Coffee, LogIn } from 'lucide-react';
import Button from '../components/Button';
import apiClient, { setApiBaseUrl } from '../services/api';
import { ORGANIZATIONS, getApiUrl } from '../config/api.config';
import './Login.css';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    organization: 'exporter'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const apiUrl = getApiUrl(formData.organization);
      setApiBaseUrl(apiUrl);

      const response = await apiClient.post('/auth/login', {
        username: formData.username,
        password: formData.password,
      });

      const { user, token } = response.data.data;
      localStorage.setItem('token', token);
      onLogin(user, token);
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="login-pattern"></div>
      </div>
      
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo">
              <Coffee size={48} />
            </div>
            <h1>Coffee Blockchain</h1>
            <p>Consortium Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="organization">Organization</label>
              <select
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                required
              >
                {ORGANIZATIONS.map(org => (
                  <option key={org.value} value={org.value}>
                    {org.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="large"
              fullWidth
              loading={loading}
              icon={<LogIn size={20} />}
            >
              Sign In
            </Button>
          </form>

          <div className="login-footer">
            <p>Secure blockchain-based coffee export management</p>
          </div>
        </div>

        <div className="login-info">
          <h2>Welcome to Coffee Blockchain Consortium</h2>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-icon">🔒</div>
              <h3>Secure</h3>
              <p>Blockchain-powered security</p>
            </div>
            <div className="info-item">
              <div className="info-icon">🌍</div>
              <h3>Transparent</h3>
              <p>End-to-end traceability</p>
            </div>
            <div className="info-item">
              <div className="info-icon">⚡</div>
              <h3>Efficient</h3>
              <p>Streamlined processes</p>
            </div>
            <div className="info-item">
              <div className="info-icon">🤝</div>
              <h3>Collaborative</h3>
              <p>Multi-party consensus</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
