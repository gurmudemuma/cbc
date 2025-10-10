import { useState, useEffect } from 'react';
import { Package, Award, DollarSign, Ship, TrendingUp, Activity } from 'lucide-react';
import Card from '../components/Card';
import apiClient from '../services/api';
import './Dashboard.css';

const Dashboard = ({ user }) => {
  const [stats, setStats] = useState({
    totalExports: 0,
    pendingCertifications: 0,
    activeShipments: 0,
    currentFXRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [exportsRes, pendingRes, shipmentsRes] = await Promise.all([
          apiClient.get('/exports'),
          apiClient.get('/exports/status/PENDING'),
          apiClient.get('/exports/status/SHIPMENT_SCHEDULED'),
        ]);

        setStats({
          totalExports: exportsRes.data.data.length,
          pendingCertifications: pendingRes.data.data.length,
          activeShipments: shipmentsRes.data.data.length,
          currentFXRate: 118.45, // Mocked for now
        });

        const sortedExports = [...exportsRes.data.data].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        setRecentActivity(sortedExports.slice(0, 5));

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  const statCards = [
    {
      title: 'Total Exports',
      value: stats.totalExports,
      icon: <Package size={24} />,
      color: 'golden',
      trend: '+12%' // Mocked
    },
    {
      title: 'Pending Certifications',
      value: stats.pendingCertifications,
      icon: <Award size={24} />,
      color: 'purple',
      trend: '-5%' // Mocked
    },
    {
      title: 'Active Shipments',
      value: stats.activeShipments,
      icon: <Ship size={24} />,
      color: 'golden',
      trend: '+8%' // Mocked
    },
    {
      title: 'Current FX Rate (KES/USD)',
      value: stats.currentFXRate.toFixed(2),
      icon: <DollarSign size={24} />,
      color: 'purple',
      trend: '+0.5%' // Mocked
    }
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back, {user.username}!</p>
        </div>
        <div className="dashboard-org">
          <Activity size={20} />
          <span>{user.organization}</span>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map((stat, index) => (
          <Card key={index} variant="elevated" className="stat-card">
            <div className="stat-content">
              <div className={`stat-icon stat-icon-${stat.color}`}>
                {stat.icon}
              </div>
              <div className="stat-details">
                <div className="stat-label">{stat.title}</div>
                <div className="stat-value">{stat.value}</div>
                <div className={`stat-trend ${stat.trend.startsWith('+') ? 'positive' : 'negative'}`}>
                  <TrendingUp size={14} />
                  <span>{stat.trend} from last month</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="dashboard-content">
        <Card 
          title="Recent Activity" 
          icon={<Activity size={20} />}
          className="activity-card"
        >
          <div className="activity-list">
            {recentActivity.map(activity => (
              <div key={activity.exportId} className="activity-item">
                <div className={`activity-dot activity-dot-export`}></div>
                <div className="activity-details">
                  <div className="activity-action">{`Export ${activity.exportId} was updated`}</div>
                  <div className="activity-time">{new Date(activity.updatedAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card 
          title="Quick Actions" 
          icon={<Package size={20} />}
          className="actions-card"
        >
          <div className="quick-actions">
            {user.organizationId === 'exporter' && (
              <button className="action-btn">
                <Package size={20} />
                <span>Create New Export</span>
              </button>
            )}
            {user.organizationId === 'ncat' && (
              <button className="action-btn">
                <Award size={20} />
                <span>Issue Certificate</span>
              </button>
            )}
            {user.organizationId === 'shipping' && (
              <button className="action-btn">
                <Ship size={20} />
                <span>Track Shipment</span>
              </button>
            )}
            {user.organizationId === 'nationalbank' && (
              <button className="action-btn">
                <DollarSign size={20} />
                <span>Update FX Rate</span>
              </button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
