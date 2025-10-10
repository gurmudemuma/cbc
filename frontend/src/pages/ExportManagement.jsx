import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Plus, Search, Filter, Eye } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import apiClient from '../services/api';
import './CommonPages.css';

const ExportManagement = ({ user }) => {
  const navigate = useNavigate();
  const [exports, setExports] = useState([]);
  const [filteredExports, setFilteredExports] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [newExportData, setNewExportData] = useState({
    exporterName: '',
    coffeeType: '',
    quantity: '',
    destinationCountry: '',
    estimatedValue: '',
  });

  useEffect(() => {
    fetchExports();
  }, []);

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const fetchExports = async () => {
    try {
      const response = await apiClient.get('/exports');
      setExports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching exports:', error);
    }
  };

  const filterExports = () => {
    let filtered = [...exports];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(exp => exp.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.coffeeType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleCreateExport = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/exports', {
        ...newExportData,
        quantity: parseFloat(newExportData.quantity),
        estimatedValue: parseFloat(newExportData.estimatedValue)
      });
      setIsModalOpen(false);
      setNewExportData({
        exporterName: '',
        coffeeType: '',
        quantity: '',
        destinationCountry: '',
        estimatedValue: '',
      });
      fetchExports();
    } catch (error) {
      console.error('Error creating export:', error);
      alert('Failed to create export');
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      PENDING: 'status-pending',
      FX_APPROVED: 'status-certified',
      QUALITY_CERTIFIED: 'status-certified',
      SHIPMENT_SCHEDULED: 'status-shipped',
      SHIPPED: 'status-shipped',
      COMPLETED: 'status-completed',
      CANCELLED: 'status-cancelled',
      FX_REJECTED: 'status-rejected',
      QUALITY_REJECTED: 'status-rejected',
    };
    return statusMap[status] || 'status-pending';
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Export Management</h1>
          <p>Manage and track coffee export records</p>
        </div>
        <Button variant="primary" icon={<Plus size={20} />} onClick={() => setIsModalOpen(true)}>
          Create Export
        </Button>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Export</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCreateExport}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Exporter Name *</label>
                  <input 
                    type="text" 
                    value={newExportData.exporterName} 
                    onChange={(e) => setNewExportData({ ...newExportData, exporterName: e.target.value })}
                    placeholder="e.g., ABC Coffee Exporters"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Coffee Type *</label>
                  <input 
                    type="text" 
                    value={newExportData.coffeeType} 
                    onChange={(e) => setNewExportData({ ...newExportData, coffeeType: e.target.value })}
                    placeholder="e.g., Arabica Premium"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity (kg) *</label>
                  <input 
                    type="number" 
                    value={newExportData.quantity} 
                    onChange={(e) => setNewExportData({ ...newExportData, quantity: e.target.value })}
                    placeholder="e.g., 5000"
                    min="1"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Destination Country *</label>
                  <input 
                    type="text" 
                    value={newExportData.destinationCountry} 
                    onChange={(e) => setNewExportData({ ...newExportData, destinationCountry: e.target.value })}
                    placeholder="e.g., United States"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Value (USD) *</label>
                  <input 
                    type="number" 
                    value={newExportData.estimatedValue} 
                    onChange={(e) => setNewExportData({ ...newExportData, estimatedValue: e.target.value })}
                    placeholder="e.g., 75000"
                    min="1"
                    required
                  />
                </div>
              </div>
              <div className="modal-actions">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Create Export</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="stats-row">
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">{exports.length}</div>
            <div className="stat-mini-label">Total Exports</div>
          </div>
        </Card>
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'PENDING').length}
            </div>
            <div className="stat-mini-label">Pending</div>
          </div>
        </Card>
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'COMPLETED').length}
            </div>
            <div className="stat-mini-label">Completed</div>
          </div>
        </Card>
      </div>

      <Card className="filter-card">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Search exports..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-buttons">
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="FX_APPROVED">FX Approved</option>
              <option value="QUALITY_CERTIFIED">Quality Certified</option>
              <option value="SHIPMENT_SCHEDULED">Shipment Scheduled</option>
              <option value="SHIPPED">Shipped</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="table-card">
        <Card title="Export Records" icon={<Package size={20} />}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Export ID</th>
                  <th>Quantity (kg)</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExports.map(exp => (
                  <tr key={exp.exportId}>
                    <td className="font-mono">{exp.exportId}</td>
                    <td>{exp.quantity.toLocaleString()}</td>
                    <td>{exp.destinationCountry}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(exp.status)}`}>
                        {exp.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{new Date(exp.createdAt).toLocaleDateString()}</td>
                    <td>
                      <Button 
                        variant="ghost" 
                        size="small"
                        icon={<Eye size={16} />}
                        onClick={() => navigate(`/exports/${exp.exportId}`)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ExportManagement;
