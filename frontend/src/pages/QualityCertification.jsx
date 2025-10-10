import { useState, useEffect } from 'react';
import { Award, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import apiClient, { setApiBaseUrl } from '../services/api';
import { API_ENDPOINTS } from '../config/api.config';
import './CommonPages.css';

const QualityCertification = ({ user }) => {
  const [exports, setExports] = useState([]);
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('certify'); // 'certify' or 'reject'
  const [formData, setFormData] = useState({
    qualityGrade: '',
    certifiedBy: user?.username || '',
    rejectionReason: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Set API base URL for NCAT
    setApiBaseUrl(API_ENDPOINTS.ncat);
    fetchExports();
  }, []);

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const fetchExports = async () => {
    try {
      const response = await apiClient.get('/quality/exports');
      setExports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching exports:', error);
    }
  };

  const filterExports = () => {
    let filtered = [...exports];

    // Filter by status
    if (statusFilter === 'pending') {
      filtered = filtered.filter(exp => exp.status === 'FX_APPROVED');
    } else if (statusFilter === 'certified') {
      filtered = filtered.filter(exp => exp.status === 'QUALITY_CERTIFIED');
    } else if (statusFilter === 'rejected') {
      filtered = filtered.filter(exp => exp.status === 'QUALITY_REJECTED');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.coffeeType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredExports(filtered);
  };

  const handleCertify = (exportData) => {
    setSelectedExport(exportData);
    setModalType('certify');
    setFormData({
      qualityGrade: '',
      certifiedBy: user?.username || '',
      rejectionReason: ''
    });
    setIsModalOpen(true);
  };

  const handleReject = (exportData) => {
    setSelectedExport(exportData);
    setModalType('reject');
    setFormData({
      qualityGrade: '',
      certifiedBy: user?.username || '',
      rejectionReason: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'certify') {
        await apiClient.post('/quality/certify', {
          exportId: selectedExport.exportId,
          qualityCertId: `QC-${Date.now()}`,
          qualityGrade: formData.qualityGrade,
          certifiedBy: formData.certifiedBy
        });
      } else {
        await apiClient.post('/quality/reject', {
          exportId: selectedExport.exportId,
          rejectionReason: formData.rejectionReason,
          rejectedBy: formData.certifiedBy
        });
      }
      
      setIsModalOpen(false);
      fetchExports();
    } catch (error) {
      console.error('Error processing quality certification:', error);
      alert('Failed to process quality certification');
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      FX_APPROVED: 'status-pending',
      QUALITY_CERTIFIED: 'status-certified',
      QUALITY_REJECTED: 'status-rejected',
    };
    return statusMap[status] || 'status-pending';
  };

  const qualityGrades = [
    'Grade AA',
    'Grade A',
    'Grade B',
    'Grade C',
    'Premium',
    'Standard'
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Quality Certification</h1>
          <p>Review and certify coffee quality for exports</p>
        </div>
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
              <option value="pending">Pending Review</option>
              <option value="certified">Certified</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="stats-row">
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'FX_APPROVED').length}
            </div>
            <div className="stat-mini-label">Pending Review</div>
          </div>
        </Card>
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'QUALITY_CERTIFIED').length}
            </div>
            <div className="stat-mini-label">Certified</div>
          </div>
        </Card>
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'QUALITY_REJECTED').length}
            </div>
            <div className="stat-mini-label">Rejected</div>
          </div>
        </Card>
      </div>

      <div className="table-card">
        <Card title="Export Records" icon={<Award size={20} />}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Export ID</th>
                  <th>Exporter</th>
                  <th>Coffee Type</th>
                  <th>Quantity (kg)</th>
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
                    <td>{exp.coffeeType}</td>
                    <td>{exp.quantity.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(exp.status)}`}>
                        {exp.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{new Date(exp.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {exp.status === 'FX_APPROVED' && (
                          <>
                            <Button 
                              variant="success" 
                              size="small"
                              icon={<CheckCircle size={16} />}
                              onClick={() => handleCertify(exp)}
                            >
                              Certify
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
                        {exp.status !== 'FX_APPROVED' && (
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
                <Award size={48} style={{ opacity: 0.3 }} />
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
                {modalType === 'certify' ? 'Issue Quality Certificate' : 'Reject Quality'}
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
                <span className="detail-label">Coffee Type</span>
                <span className="detail-value">{selectedExport?.coffeeType}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Quantity</span>
                <span className="detail-value">{selectedExport?.quantity.toLocaleString()} kg</span>
              </div>

              <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />

              {modalType === 'certify' ? (
                <>
                  <div className="form-group">
                    <label>Quality Grade *</label>
                    <select
                      value={formData.qualityGrade}
                      onChange={(e) => setFormData({ ...formData, qualityGrade: e.target.value })}
                      required
                    >
                      <option value="">Select Grade</option>
                      {qualityGrades.map(grade => (
                        <option key={grade} value={grade}>{grade}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Certified By *</label>
                    <input
                      type="text"
                      value={formData.certifiedBy}
                      onChange={(e) => setFormData({ ...formData, certifiedBy: e.target.value })}
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
                      value={formData.certifiedBy}
                      onChange={(e) => setFormData({ ...formData, certifiedBy: e.target.value })}
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
                variant={modalType === 'certify' ? 'success' : 'danger'}
                onClick={handleSubmit}
                disabled={
                  modalType === 'certify' 
                    ? !formData.qualityGrade || !formData.certifiedBy
                    : !formData.rejectionReason || !formData.certifiedBy
                }
              >
                {modalType === 'certify' ? 'Issue Certificate' : 'Reject Quality'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QualityCertification;
