// @ts-nocheck
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardActions,
  Button,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Box,
  Typography,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
} from '@mui/material';
import { CheckCircle, XCircle, Award, Upload } from 'lucide-react';
import RejectionDialog from '../RejectionDialog';

/**
 * ECTA Quality Certification Form
 * Used by ECTA to certify coffee quality
 */
const ECTAQualityForm = ({ exportData, onApprove, onReject, loading = false }) => {
  const [formData, setFormData] = useState({
    qualityGrade: '',
    qualityCertNumber: `QC-${Date.now()}`,
    moistureContent: '',
    defectCount: '',
    cupScore: '',
    inspectionNotes: '',
  });
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [errors, setErrors] = useState({});
  const [uploadedDocs, setUploadedDocs] = useState([]);

  const qualityGrades = [
    { value: 'Grade 1', label: 'Grade 1 (Specialty - 90+ points)', minScore: 90 },
    { value: 'Grade 2', label: 'Grade 2 (Premium - 85-89 points)', minScore: 85 },
    { value: 'Grade 3', label: 'Grade 3 (Exchange - 80-84 points)', minScore: 80 },
    { value: 'Grade 4', label: 'Grade 4 (Standard - 75-79 points)', minScore: 75 },
    { value: 'Grade 5', label: 'Grade 5 (Below Standard - <75 points)', minScore: 0 },
  ];

  const handleChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value,
    });
    if (errors[field]) {
      setErrors({ ...errors, [field]: null });
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedDocs([...uploadedDocs, ...files]);
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.qualityGrade) {
      newErrors.qualityGrade = 'Quality grade is required';
    }
    if (!formData.qualityCertNumber || formData.qualityCertNumber.trim().length < 5) {
      newErrors.qualityCertNumber = 'Quality certificate number is required';
    }
    if (!formData.moistureContent || parseFloat(formData.moistureContent) < 0 || parseFloat(formData.moistureContent) > 100) {
      newErrors.moistureContent = 'Valid moisture content (0-100%) is required';
    }
    if (parseFloat(formData.moistureContent) > 12.5) {
      newErrors.moistureContent = 'Moisture content exceeds maximum allowed (12.5%)';
    }
    if (!formData.defectCount || parseInt(formData.defectCount) < 0) {
      newErrors.defectCount = 'Defect count is required';
    }
    if (!formData.cupScore || parseFloat(formData.cupScore) < 0 || parseFloat(formData.cupScore) > 100) {
      newErrors.cupScore = 'Valid cup score (0-100) is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApprove = () => {
    if (!validate()) {
      return;
    }

    onApprove({
      qualityGrade: formData.qualityGrade,
      qualityCertNumber: formData.qualityCertNumber.trim(),
      moistureContent: parseFloat(formData.moistureContent),
      defectCount: parseInt(formData.defectCount),
      cupScore: parseFloat(formData.cupScore),
      inspectionNotes: formData.inspectionNotes.trim(),
      documents: uploadedDocs,
    });
  };

  const handleReject = (rejectionData) => {
    setShowRejectDialog(false);
    onReject(rejectionData);
  };

  const getGradeColor = (grade) => {
    if (grade.includes('Grade 1')) return 'success';
    if (grade.includes('Grade 2')) return 'info';
    if (grade.includes('Grade 3')) return 'warning';
    return 'error';
  };

  return (
    <>
      <Card>
        <CardHeader
          avatar={<Award size={32} color="#1976d2" />}
          title="ECTA Quality Certification"
          subheader={`Export ID: ${exportData.exportId}`}
        />
        <Divider />
        <CardContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              Conduct quality inspection and issue quality certificate. Coffee must meet minimum 
              standards for export. Grade 5 (Below Standard) should be rejected.
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Export Information
                </Typography>
                <Typography variant="body2">
                  <strong>Exporter:</strong> {exportData.exporterName}
                </Typography>
                <Typography variant="body2">
                  <strong>Coffee Type:</strong> {exportData.coffeeType}
                </Typography>
                <Typography variant="body2">
                  <strong>Quantity:</strong> {exportData.quantity} kg
                </Typography>
                <Typography variant="body2">
                  <strong>ECX Lot:</strong> {exportData.ecxLotNumber}
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required error={!!errors.qualityGrade}>
                <InputLabel>Quality Grade *</InputLabel>
                <Select
                  value={formData.qualityGrade}
                  onChange={handleChange('qualityGrade')}
                  label="Quality Grade *"
                >
                  {qualityGrades.map((grade) => (
                    <MenuItem key={grade.value} value={grade.value}>
                      {grade.label}
                    </MenuItem>
                  ))}
                </Select>
                {errors.qualityGrade && (
                  <Typography variant="caption" color="error">
                    {errors.qualityGrade}
                  </Typography>
                )}
              </FormControl>
              {formData.qualityGrade && (
                <Chip
                  label={formData.qualityGrade}
                  color={getGradeColor(formData.qualityGrade)}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                label="Quality Certificate Number *"
                value={formData.qualityCertNumber}
                onChange={handleChange('qualityCertNumber')}
                fullWidth
                required
                error={!!errors.qualityCertNumber}
                helperText={errors.qualityCertNumber || 'Unique certificate number'}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Moisture Content (%) *"
                type="number"
                value={formData.moistureContent}
                onChange={handleChange('moistureContent')}
                fullWidth
                required
                error={!!errors.moistureContent}
                helperText={errors.moistureContent || 'Max: 12.5%'}
                inputProps={{ step: '0.1', min: '0', max: '100' }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Defect Count *"
                type="number"
                value={formData.defectCount}
                onChange={handleChange('defectCount')}
                fullWidth
                required
                error={!!errors.defectCount}
                helperText={errors.defectCount || 'Number of defects per 300g'}
                inputProps={{ min: '0' }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                label="Cup Score *"
                type="number"
                value={formData.cupScore}
                onChange={handleChange('cupScore')}
                fullWidth
                required
                error={!!errors.cupScore}
                helperText={errors.cupScore || 'Score: 0-100'}
                inputProps={{ step: '0.5', min: '0', max: '100' }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Inspection Notes"
                value={formData.inspectionNotes}
                onChange={handleChange('inspectionNotes')}
                multiline
                rows={4}
                fullWidth
                placeholder="Detailed inspection findings, aroma, flavor profile, body, acidity, etc..."
                helperText="Provide detailed quality assessment notes"
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<Upload size={18} />}
                fullWidth
              >
                Upload Quality Certificate Documents
                <input
                  type="file"
                  hidden
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                />
              </Button>
              {uploadedDocs.length > 0 && (
                <Box sx={{ mt: 1 }}>
                  {uploadedDocs.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      size="small"
                      sx={{ mr: 1, mt: 0.5 }}
                      onDelete={() => setUploadedDocs(uploadedDocs.filter((_, i) => i !== index))}
                    />
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </CardContent>
        <Divider />
        <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
          <Button
            variant="outlined"
            color="error"
            startIcon={<XCircle size={18} />}
            onClick={() => setShowRejectDialog(true)}
            disabled={loading}
          >
            Reject Quality
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <CheckCircle size={18} />}
            onClick={handleApprove}
            disabled={loading}
            size="large"
          >
            {loading ? 'Issuing...' : 'Issue Quality Certificate'}
          </Button>
        </CardActions>
      </Card>

      <RejectionDialog
        open={showRejectDialog}
        onClose={() => setShowRejectDialog(false)}
        onReject={handleReject}
        stageName="ECTA_QUALITY"
        exportId={exportData.exportId}
        loading={loading}
      />
    </>
  );
};

export default ECTAQualityForm;
