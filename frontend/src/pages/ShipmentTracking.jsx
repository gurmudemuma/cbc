import { useState, useEffect } from 'react';
import { Ship, MapPin, Calendar, CheckCircle, Clock, Search } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import apiClient, { setApiBaseUrl } from '../services/api';
import { API_ENDPOINTS } from '../config/api.config';
import './CommonPages.css';

const ShipmentTracking = ({ user }) => {
  const [exports, setExports] = useState([]);
  const [filteredExports, setFilteredExports] = useState([]);
  const [selectedExport, setSelectedExport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('schedule'); // 'schedule' or 'confirm'
  const [formData, setFormData] = useState({
    shipmentId: '',
    vesselName: '',
    departureDate: '',
    arrivalDate: '',
    shippingLineId: 'SHIP-001'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Set API base URL for Shipping Line
    setApiBaseUrl(API_ENDPOINTS.shipping);
    fetchExports();
  }, []);

  useEffect(() => {
    filterExports();
  }, [exports, searchTerm, statusFilter]);

  const fetchExports = async () => {
    try {
      const response = await apiClient.get('/shipments/exports');
      setExports(response.data.data || []);
    } catch (error) {
      console.error('Error fetching exports:', error);
    }
  };

  const filterExports = () => {
    let filtered = [...exports];

    // Filter by status
    if (statusFilter === 'ready') {
      filtered = filtered.filter(exp => exp.status === 'QUALITY_CERTIFIED');
    } else if (statusFilter === 'scheduled') {
      filtered = filtered.filter(exp => exp.status === 'SHIPMENT_SCHEDULED');
    } else if (statusFilter === 'shipped') {
      filtered = filtered.filter(exp => exp.status === 'SHIPPED');
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(exp => 
        exp.exportId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.exporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.destinationCountry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.vesselName && exp.vesselName.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredExports(filtered);
  };

  const handleSchedule = (exportData) => {
    setSelectedExport(exportData);
    setModalType('schedule');
    setFormData({
      shipmentId: `SHIP-${Date.now()}`,
      vesselName: '',
      departureDate: '',
      arrivalDate: '',
      shippingLineId: 'SHIP-001'
    });
    setIsModalOpen(true);
  };

  const handleConfirm = (exportData) => {
    setSelectedExport(exportData);
    setModalType('confirm');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (modalType === 'schedule') {
        await apiClient.post('/shipments/schedule', {
          exportId: selectedExport.exportId,
          shipmentId: formData.shipmentId,
          vesselName: formData.vesselName,
          departureDate: formData.departureDate,
          arrivalDate: formData.arrivalDate,
          shippingLineId: formData.shippingLineId
        });
      } else {
        await apiClient.post('/shipments/confirm', {
          exportId: selectedExport.exportId
        });
      }
      
      setIsModalOpen(false);
      fetchExports();
    } catch (error) {
      console.error('Error processing shipment:', error);
      alert('Failed to process shipment');
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      QUALITY_CERTIFIED: 'status-pending',
      SHIPMENT_SCHEDULED: 'status-certified',
      SHIPPED: 'status-shipped',
      COMPLETED: 'status-completed',
    };
    return statusMap[status] || 'status-pending';
  };

  const calculateDuration = (departure, arrival) => {
    if (!departure || !arrival) return 'N/A';
    const days = Math.ceil((new Date(arrival) - new Date(departure)) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>Shipment Tracking</h1>
          <p>Schedule and track coffee export shipments</p>
        </div>
      </div>

      <div className="stats-row">
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'QUALITY_CERTIFIED').length}
            </div>
            <div className="stat-mini-label">Ready to Ship</div>
          </div>
        </Card>
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'SHIPMENT_SCHEDULED').length}
            </div>
            <div className="stat-mini-label">Scheduled</div>
          </div>
        </Card>
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'SHIPPED').length}
            </div>
            <div className="stat-mini-label">In Transit</div>
          </div>
        </Card>
        <Card variant="elevated" className="stat-mini">
          <div className="stat-mini-content">
            <div className="stat-mini-value">
              {exports.filter(e => e.status === 'COMPLETED').length}
            </div>
            <div className="stat-mini-label">Delivered</div>
          </div>
        </Card>
      </div>

      <Card className="filter-card">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={20} />
            <input 
              type="text" 
              placeholder="Search shipments..." 
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
              <option value="ready">Ready to Ship</option>
              <option value="scheduled">Scheduled</option>
              <option value="shipped">In Transit</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="table-card">
        <Card title="Shipment Records" icon={<Ship size={20} />}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Export ID</th>
                  <th>Exporter</th>
                  <th>Destination</th>
                  <th>Vessel</th>
                  <th>Departure</th>
                  <th>Arrival</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExports.map(exp => (
                  <tr key={exp.exportId}>
                    <td className="font-mono">{exp.exportId}</td>
                    <td>{exp.exporterName}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <MapPin size={14} />
                        {exp.destinationCountry}
                      </div>
                    </td>
                    <td>{exp.vesselName || '-'}</td>
                    <td>
                      {exp.departureDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={14} />
                          {new Date(exp.departureDate).toLocaleDateString()}
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      {exp.arrivalDate ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Calendar size={14} />
                          {new Date(exp.arrivalDate).toLocaleDateString()}
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(exp.status)}`}>
                        {exp.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {exp.status === 'QUALITY_CERTIFIED' && (
                          <Button 
                            variant="primary" 
                            size="small"
                            icon={<Ship size={16} />}
                            onClick={() => handleSchedule(exp)}
                          >
                            Schedule
                          </Button>
                        )}
                        {exp.status === 'SHIPMENT_SCHEDULED' && (
                          <Button 
                            variant="success" 
                            size="small"
                            icon={<CheckCircle size={16} />}
                            onClick={() => handleConfirm(exp)}
                          >
                            Confirm
                          </Button>
                        )}
                        {(exp.status === 'SHIPPED' || exp.status === 'COMPLETED') && (
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
                <Ship size={48} style={{ opacity: 0.3 }} />
                <p>No shipments found</p>
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
                {modalType === 'schedule' ? 'Schedule Shipment' : 'Confirm Shipment'}
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
              <div className="detail-item">
                <span className="detail-label">Destination</span>
                <span className="detail-value">{selectedExport?.destinationCountry}</span>
              </div>

              <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '1px solid var(--color-border)' }} />

              {modalType === 'schedule' ? (
                <>
                  <div className="form-group">
                    <label>Shipment ID *</label>
                    <input
                      type="text"
                      value={formData.shipmentId}
                      onChange={(e) => setFormData({ ...formData, shipmentId: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Vessel Name *</label>
                    <input
                      type="text"
                      value={formData.vesselName}
                      onChange={(e) => setFormData({ ...formData, vesselName: e.target.value })}
                      placeholder="e.g., MV Coffee Carrier"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Departure Date *</label>
                    <input
                      type="date"
                      value={formData.departureDate}
                      onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Estimated Arrival Date *</label>
                    <input
                      type="date"
                      value={formData.arrivalDate}
                      onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                      required
                    />
                  </div>
                  {formData.departureDate && formData.arrivalDate && (
                    <div className="info-box">
                      <Clock size={16} />
                      <span>Transit Duration: {calculateDuration(formData.departureDate, formData.arrivalDate)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="confirmation-message">
                  <Ship size={48} style={{ color: 'var(--color-primary)', marginBottom: '1rem' }} />
                  <h3>Confirm Shipment Departure</h3>
                  <p>Are you sure you want to confirm that this shipment has departed?</p>
                  <div className="detail-list" style={{ marginTop: '1.5rem' }}>
                    <div className="detail-item">
                      <span className="detail-label">Vessel</span>
                      <span className="detail-value">{selectedExport?.vesselName}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Departure Date</span>
                      <span className="detail-value">
                        {selectedExport?.departureDate && new Date(selectedExport.departureDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Expected Arrival</span>
                      <span className="detail-value">
                        {selectedExport?.arrivalDate && new Date(selectedExport.arrivalDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant={modalType === 'schedule' ? 'primary' : 'success'}
                onClick={handleSubmit}
                disabled={
                  modalType === 'schedule' && (
                    !formData.shipmentId || 
                    !formData.vesselName || 
                    !formData.departureDate || 
                    !formData.arrivalDate
                  )
                }
              >
                {modalType === 'schedule' ? 'Schedule Shipment' : 'Confirm Departure'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShipmentTracking;
