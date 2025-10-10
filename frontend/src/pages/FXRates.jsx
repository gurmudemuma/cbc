import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, XCircle, TrendingUp, Search } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import apiClient, { setApiBaseUrl } from '../services/api';
import { API_ENDPOINTS } from '../config/api.config';
import './CommonPages.css';

const FXRates = ({ user }) => {
  const [exports, setExports] = useState([]);
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('approve'); // 'approve' or 'reject'
  const [formData, setFormData] = useState({
    fxApprovalId: '',
    approvedBy: user?.username || '',
    rejectionReason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Set API base URL for National Bank
    setApiBaseUrl(API_ENDPOINTS.nationalbank);
    fetchExports();
  }, []);

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const fetchExports = async () => {
    try {
      const response = await apiClient.get('/fx/exports');
      setExports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching exports:', error);
    }
  };

  const filterExports = () => {
    let filtered = [...exports];

    // Filter by status
    if (statusFilter === 'pending') {
      filtered = filtered.filter(exp => exp.status === 'PENDING');
    } else if (statusFilter === 'approved') {
      filtered = filtered.filter(exp => exp.status === 'FX_APPROVED');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter(exp => exp.status === 'FX_REJECTED');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleApprove = (exportData) => {
    setSelectedExport(exportData);
    setModalType('approve');
    setFormData({
      fxApprovalId: `FX-${Date.now()}`,
      approvedBy: user?.username || '',
      rejectionReason: ''
    });
    setIsModalOpen(true);
  };

  const handleReject = (exportData) => {
    setSelectedExport(exportData);
    setModalType('reject');
    setFormData({
      fxApprovalId: '',
      approvedBy: user?.username || '',
      rejectionReason: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'approve') {
        await apiClient.post('/fx/approve', {
          exportId: selectedExport.exportId,
          fxApprovalId: formData.fxApprovalId,
          approvedBy: formData.approvedBy
        });
      } else {
        await apiClient.post('/fx/reject', {
          exportId: selectedExport.exportId,
          rejectionReason: formData.rejectionReason,
          rejectedBy: formData.approvedBy
        });
      }
      
      setIsModalOpen(false);
      fetchExports();
    } catch (error) {
      console.error('Error processing FX approval:', error);
      alert('Failed to process FX approval');
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      PENDING: 'status-pending',
      FX_APPROVED: 'status-certified',
      FX_REJECTED: 'status-rejected',
    };
    return statusMap[status] || 'status-pending';
  };

  const calculateFXAmount = (usdAmount) => {
    const fxRate = 118.45; // Mock FX rate KES/USD
    return (usdAmount * fxRate).toFixed(2);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Foreign Exchange Approval</h1>
          <p>Review and approve FX for export transactions</p>
        </div>
      </div>

      <div className="stats-row">
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-icon">
              <DollarSign size={24} />
            </div>
            <div>
              <div className="stat-mini-value">118.45</div>
              <div className="stat-mini-label">Current FX Rate (KES/USD)</div>
              <div className="stat-trend positive">
                <TrendingUp size={14} />
                <span>+0.5%</span>
              </div>
            </div>
          </div>
        </Card>
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'PENDING').length}
            </div>
            <div className="stat-mini-label">Pending Approval</div>
          </div>
        </Card>
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'FX_APPROVED').length}
            </div>
            <div className="stat-mini-label">Approved</div>
          </div>
        </Card>
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'FX_REJECTED').length}
            </div>
            <div className="stat-mini-label">Rejected</div>
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
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="table-card">
        <Card title="FX Approval Requests" icon={<DollarSign size={20} />}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Export ID</th>
                  <th>Exporter</th>
                  <th>Destination</th>
                  <th>USD Amount</th>
                  <th>KES Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExports.map(exp => (
                  <tr key={exp.exportId}>
                    <td className="font-mono">{exp.exportId}</td>
                    <td>{exp.exporterName}</td>
                    <td>{exp.destinationCountry}</td>
                    <td>${exp.estimatedValue.toLocaleString()}</td>
                    <td>KES {calculateFXAmount(exp.estimatedValue).toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(exp.status)}`}>
                        {exp.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{new Date(exp.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {exp.status === 'PENDING' && (
                          <>
                            <Button 
                              variant="success" 
                              size="small"
                              icon={<CheckCircle size={16} />}
                              onClick={() => handleApprove(exp)}
                            >
                              Approve
                            </Button>
                            <Button 
                              variant="danger" 
                              size="small"
                              icon={<XCircle size={16} />}
                              onClick={() => handleReject(exp)}
                            >
                              Reject
                            </Button>
                          </>
                        )}
                        {exp.status !== 'PENDING' && (
                          <Button variant="ghost" size="small">View</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredExports.length === 0 && (
              <div className="empty-state">
                <DollarSign size={48} style={{ opacity: 0.3 }} />
                <p>No exports found</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                {modalType === 'approve' ? 'Approve Foreign Exchange' : 'Reject FX Request'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="detail-item">
                <span className="detail-label">Export ID</span>
                <span className="detail-value font-mono">{selectedExport?.exportId}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Exporter</span>
                <span className="detail-value">{selectedExport?.exporterName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Destination</span>
                <span className="detail-value">{selectedExport?.destinationCountry}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">USD Amount</span>
                <span className="detail-value">${selectedExport?.estimatedValue.toLocaleString()}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">KES Amount (@ 118.45)</span>
                <span className="detail-value">
                  KES {calculateFXAmount(selectedExport?.estimatedValue || 0).toLocaleString()}
                </span>
              </div>

              <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />

              {modalType === 'approve' ? (
                <>
                  <div className="form-group">
                    <label>FX Approval ID *</label>
                    <input
                      type="text"
                      value={formData.fxApprovalId}
                      onChange={(e) => setFormData({ ...formData, fxApprovalId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Approved By *</label>
                    <input
                      type="text"
                      value={formData.approvedBy}
                      onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Rejection Reason *</label>
                    <textarea
                      value={formData.rejectionReason}
                      onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                      rows="4"
                      placeholder="Provide detailed reason for rejection..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Rejected By *</label>
                    <input
                      type="text"
                      value={formData.approvedBy}
                      onChange={(e) => setFormData({ ...formData, approvedBy: e.target.value })}
                      required
                    />
                  </div>
                </>
              )}
            </div>

            <div className="modal-actions">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant={modalType === 'approve' ? 'success' : 'danger'}
                onClick={handleSubmit}
                disabled={
                  modalType === 'approve' 
                    ? !formData.fxApprovalId || !formData.approvedBy
                    : !formData.rejectionReason || !formData.approvedBy
                }
              >
                {modalType === 'approve' ? 'Approve FX' : 'Reject Request'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FXRates;
