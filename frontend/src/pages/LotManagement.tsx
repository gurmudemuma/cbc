import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  LinearProgress,
  Rating,
} from '@mui/material';
import {
  Package,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Coffee,
  Scale,
} from 'lucide-react';
import { motion } from 'framer-motion';
import lotService from '../services/lotService';

const LotManagement = ({ user, org }) => {
  const [lots, setLots] = useState([]);
  const [selectedLot, setSelectedLot] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [gradeData, setGradeData] = useState({
    grade: '',
    quality: 5,
    notes: '',
  });

  useEffect(() => {
    const loadLots = async () => {
      setLoading(true);
      try {
        const lotsData = await lotService.getAllLots();
        setLots(lotsData);
      } catch (error) {
        console.error('Error loading lots:', error);
        // Fallback to empty array on error
        setLots([]);
      } finally {
        setLoading(false);
      }
    };

    loadLots();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING_VERIFICATION': return 'warning';
      case 'VERIFIED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING_VERIFICATION': return <Clock size={16} />;
      case 'VERIFIED': return <CheckCircle size={16} />;
      case 'REJECTED': return <XCircle size={16} />;
      default: return <Package size={16} />;
    }
  };

  const handleViewDetails = (lot) => {
    setSelectedLot(lot);
    setDialogOpen(true);
  };

  const handleGradeLot = (lot) => {
    setSelectedLot(lot);
    setGradeData({
      grade: lot.grade || '',
      quality: lot.quality || 5,
      notes: '',
    });
    setGradeDialogOpen(true);
  };

  const handleSaveGrade = async () => {
    try {
      await lotService.gradeLot(selectedLot.id, gradeData);
      // Refresh lots data
      const lotsData = await lotService.getAllLots();
      setLots(lotsData);
      setGradeDialogOpen(false);
      setGradeData({ grade: '', quality: 5, notes: '' });
    } catch (error) {
      console.error('Error saving grade:', error);
    }
  };

  const getQualityColor = (quality) => {
    if (quality >= 4.5) return 'success';
    if (quality >= 3.5) return 'warning';
    return 'error';
  };

  const getLotStats = () => {
    return {
      total: lots.length,
      pending: lots.filter(lot => lot.status === 'PENDING_VERIFICATION').length,
      verified: lots.filter(lot => lot.status === 'VERIFIED').length,
      rejected: lots.filter(lot => lot.status === 'REJECTED').length,
      avgQuality: lots.filter(lot => lot.quality).reduce((sum, lot) => sum + lot.quality, 0) / lots.filter(lot => lot.quality).length || 0,
    };
  };

  const stats = getLotStats();

  return (
    <Box sx={{ p: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
          Lot Management
        </Typography>

        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Package size={40} color="#1976d2" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="primary" gutterBottom>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Lots
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Clock size={40} color="#ed6c02" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="warning.main" gutterBottom>
                  {stats.pending}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Verification
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle size={40} color="#2e7d32" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="success.main" gutterBottom>
                  {stats.verified}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verified
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Award size={40} color="#2e7d32" style={{ marginBottom: 8 }} />
                <Typography variant="h4" color="success.main" gutterBottom>
                  {stats.avgQuality.toFixed(1)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg Quality Rating
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Lots Table */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Coffee Lots
            </Typography>
            
            {loading && <LinearProgress sx={{ mb: 2 }} />}

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lot ID</TableCell>
                    <TableCell>Coffee Type</TableCell>
                    <TableCell>Origin</TableCell>
                    <TableCell>Quantity (kg)</TableCell>
                    <TableCell>Farmer</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Grade</TableCell>
                    <TableCell>Quality</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lots.map((lot) => (
                    <TableRow key={lot.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {lot.id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Coffee size={16} />
                          {lot.coffeeType}
                        </Box>
                      </TableCell>
                      <TableCell>{lot.origin}</TableCell>
                      <TableCell>{lot.quantity.toLocaleString()}</TableCell>
                      <TableCell>{lot.farmer}</TableCell>
                      <TableCell>
                        <Chip
                          icon={getStatusIcon(lot.status)}
                          label={lot.status.replace('_', ' ')}
                          color={getStatusColor(lot.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {lot.grade ? (
                          <Chip label={lot.grade} color="success" size="small" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not graded
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {lot.quality ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Rating value={lot.quality} readOnly size="small" />
                            <Typography variant="body2">
                              {lot.quality}
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not rated
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleViewDetails(lot)}>
                          <Eye size={18} />
                        </IconButton>
                        {lot.status === 'PENDING_VERIFICATION' && (
                          <IconButton size="small" onClick={() => handleGradeLot(lot)}>
                            <Scale size={18} />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {lots.length === 0 && !loading && (
              <Alert severity="info" sx={{ mt: 2 }}>
                No coffee lots found.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Lot Details Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            Lot Details - {selectedLot?.id}
          </DialogTitle>
          <DialogContent>
            {selectedLot && (
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Coffee Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLot.coffeeType}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Origin
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLot.origin}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Quantity
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLot.quantity.toLocaleString()} kg
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Farmer
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLot.farmer}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Moisture Content
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLot.moisture}%
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Defects
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLot.defects}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Typography variant="subtitle2" gutterBottom>
                    Screen Size
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedLot.screenSize}
                  </Typography>
                </Grid>
                {selectedLot.rejectionReason && (
                  <Grid item xs={12}>
                    <Alert severity="error">
                      <Typography variant="subtitle2" gutterBottom>
                        Rejection Reason
                      </Typography>
                      <Typography variant="body2">
                        {selectedLot.rejectionReason}
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Close</Button>
          </DialogActions>
        </Dialog>

        {/* Grade Lot Dialog */}
        <Dialog
          open={gradeDialogOpen}
          onClose={() => setGradeDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            Grade Lot - {selectedLot?.id}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label="Grade"
                  value={gradeData.grade}
                  onChange={(e) => setGradeData(prev => ({ ...prev, grade: e.target.value }))}
                >
                  <MenuItem value="Grade 1">Grade 1</MenuItem>
                  <MenuItem value="Grade 2">Grade 2</MenuItem>
                  <MenuItem value="Grade 3">Grade 3</MenuItem>
                  <MenuItem value="Grade 4">Grade 4</MenuItem>
                  <MenuItem value="Grade 5">Grade 5</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Quality Rating
                </Typography>
                <Rating
                  value={gradeData.quality}
                  onChange={(event, newValue) => {
                    setGradeData(prev => ({ ...prev, quality: newValue }));
                  }}
                  precision={0.5}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Grading Notes"
                  value={gradeData.notes}
                  onChange={(e) => setGradeData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter grading notes and observations..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGradeDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSaveGrade}
              disabled={!gradeData.grade}
            >
              Save Grade
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Box>
  );
};

export default LotManagement;
