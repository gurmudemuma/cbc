import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Package, Calendar, MapPin, DollarSign, Award, Ship, 
  CheckCircle, XCircle, Clock, ArrowLeft, History, FileText 
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import apiClient from '../services/api';
import './CommonPages.css';

const ExportDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exportData, setExportData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    const fetchExportDetails = async () => {
      try {
        const [detailsRes, historyRes] = await Promise.all([
          apiClient.get(`/exports/${id}`),
          apiClient.get(`/exports/${id}/history`)
        ]);
        
        setExportData(detailsRes.data.data);
        setHistory(historyRes.data.data || []);
      } catch (error) {
        console.error('Error fetching export details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExportDetails();
  }, [id]);

  const handleCompleteExport = async () => {
    try {
      await apiClient.put(`/exports/${id}/complete`);
      const response = await apiClient.get(`/exports/${id}`);
      setExportData(response.data.data);
    } catch (error) {
      console.error('Error completing export:', error);
      alert('Failed to complete export');
    }
  };

  const handleCancelExport = async () => {
    if (window.confirm('Are you sure you want to cancel this export?')) {
      try {
        await apiClient.put(`/exports/${id}/cancel`);
        const response = await apiClient.get(`/exports/${id}`);
        setExportData(response.data.data);
      } catch (error) {
        console.error('Error cancelling export:', error);
        alert('Failed to cancel export');
      }
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#f59e0b',
      FX_APPROVED: '#3b82f6',
      FX_REJECTED: '#ef4444',
      QUALITY_CERTIFIED: '#10b981',
      QUALITY_REJECTED: '#ef4444',
      SHIPMENT_SCHEDULED: '#8b5cf6',
      SHIPPED: '#06b6d4',
      COMPLETED: '#22c55e',
      CANCELLED: '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    if (status.includes('REJECTED') || status === 'CANCELLED') {
      return <XCircle size={20} />;
    }
    if (status === 'COMPLETED') {
      return <CheckCircle size={20} />;
    }
    return <Clock size={20} />;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  if (!exportData) {
    return (
      <div className="page-container">
        <Card>
          <p>Export not found</p>
          <Button onClick={() => navigate('/exports')}>Back to Exports</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <Button 
            variant="ghost" 
            icon={<ArrowLeft size={20} />}
            onClick={() => navigate('/exports')}
          >
            Back
          </Button>
          <h1 style={{ marginTop: '1rem' }}>Export Details</h1>
          <p className="font-mono" style={{ color: 'var(--color-text-secondary)' }}>
            {exportData.exportId}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {user.organizationId === 'exporter' && exportData.status === 'SHIPPED' && (
            <Button variant="primary" onClick={handleCompleteExport}>
              Complete Export
            </Button>
          )}
          {user.organizationId === 'exporter' && 
           !['COMPLETED', 'CANCELLED', 'SHIPPED'].includes(exportData.status) && (
            <Button variant="danger" onClick={handleCancelExport}>
              Cancel Export
            </Button>
          )}
        </div>
      </div>

      <div className="status-banner" style={{ 
        backgroundColor: `${getStatusColor(exportData.status)}15`,
        border: `2px solid ${getStatusColor(exportData.status)}`,
        padding: '1rem',
        borderRadius: '8px',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem'
      }}>
        <div style={{ color: getStatusColor(exportData.status) }}>
          {getStatusIcon(exportData.status)}
        </div>
        <div>
          <div style={{ fontWeight: '600', color: getStatusColor(exportData.status) }}>
            Status: {exportData.status.replace(/_/g, ' ')}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            Last updated: {new Date(exportData.updatedAt).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'details' ? 'active' : ''}`}
          onClick={() => setActiveTab('details')}
        >
          <FileText size={18} />
          Details
        </button>
        <button 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <History size={18} />
          History
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="details-grid">
          <Card title="Basic Information" icon={<Package size={20} />}>
            <div className="detail-list">
              <div className="detail-item">
                <span className="detail-label">Exporter Name</span>
                <span className="detail-value">{exportData.exporterName}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Coffee Type</span>
                <span className="detail-value">{exportData.coffeeType}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Quantity</span>
                <span className="detail-value">{exportData.quantity.toLocaleString()} kg</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Destination Country</span>
                <span className="detail-value">
                  <MapPin size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  {exportData.destinationCountry}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Estimated Value</span>
                <span className="detail-value">
                  <DollarSign size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  ${exportData.estimatedValue.toLocaleString()}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Created At</span>
                <span className="detail-value">
                  <Calendar size={16} style={{ display: 'inline', marginRight: '0.25rem' }} />
                  {new Date(exportData.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {exportData.fxApprovalId && (
            <Card title="FX Approval" icon={<DollarSign size={20} />}>
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Approval ID</span>
                  <span className="detail-value font-mono">{exportData.fxApprovalId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Approved By</span>
                  <span className="detail-value">{exportData.fxApprovedBy}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Approved At</span>
                  <span className="detail-value">
                    {new Date(exportData.fxApprovedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {exportData.fxRejectionReason && (
            <Card title="FX Rejection" icon={<XCircle size={20} />}>
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Rejection Reason</span>
                  <span className="detail-value">{exportData.fxRejectionReason}</span>
                </div>
              </div>
            </Card>
          )}

          {exportData.qualityCertId && (
            <Card title="Quality Certification" icon={<Award size={20} />}>
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Certificate ID</span>
                  <span className="detail-value font-mono">{exportData.qualityCertId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Quality Grade</span>
                  <span className="detail-value">{exportData.qualityGrade}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Certified By</span>
                  <span className="detail-value">{exportData.qualityCertifiedBy}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Certified At</span>
                  <span className="detail-value">
                    {new Date(exportData.qualityCertifiedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          )}

          {exportData.qualityRejectionReason && (
            <Card title="Quality Rejection" icon={<XCircle size={20} />}>
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Rejection Reason</span>
                  <span className="detail-value">{exportData.qualityRejectionReason}</span>
                </div>
              </div>
            </Card>
          )}

          {exportData.shipmentId && (
            <Card title="Shipment Information" icon={<Ship size={20} />}>
              <div className="detail-list">
                <div className="detail-item">
                  <span className="detail-label">Shipment ID</span>
                  <span className="detail-value font-mono">{exportData.shipmentId}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Vessel Name</span>
                  <span className="detail-value">{exportData.vesselName}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Departure Date</span>
                  <span className="detail-value">
                    {new Date(exportData.departureDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Arrival Date</span>
                  <span className="detail-value">
                    {new Date(exportData.arrivalDate).toLocaleDateString()}
                  </span>
                </div>
                {exportData.shippedAt && (
                  <div className="detail-item">
                    <span className="detail-label">Shipped At</span>
                    <span className="detail-value">
                      {new Date(exportData.shippedAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <Card title="Transaction History" icon={<History size={20} />}>
          <div className="timeline">
            {history.map((record, index) => (
              <div key={index} className="timeline-item">
                <div className="timeline-marker"></div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-status">
                      {record.record?.status || 'Unknown'}
                    </span>
                    <span className="timeline-time">
                      {new Date(record.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="timeline-tx">
                    Transaction ID: <span className="font-mono">{record.txId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default ExportDetails;
