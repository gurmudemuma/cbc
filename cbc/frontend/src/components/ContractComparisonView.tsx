/**
 * ContractComparisonView Component
 * Side-by-side comparison of contract versions with difference highlighting
 */

import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent, Grid, Box, Typography, Chip, Stack,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Select, MenuItem, FormControl, InputLabel, Divider,
} from '@mui/material';
import { AlertCircle } from 'lucide-react';

interface ContractVersion {
  version_number: number;
  coffee_type: string;
  quantity_bags: number;
  unit_price: number;
  currency: string;
  payment_terms: string;
  delivery_location: string;
  delivery_date: string;
  incoterms: string;
  created_at: string;
}

interface ContractComparisonViewProps {
  originalVersion: ContractVersion;
  proposedVersion: ContractVersion;
  onVersionChange?: (versionNumber: number) => void;
}

const ContractComparisonView: React.FC<ContractComparisonViewProps> = ({
  originalVersion,
  proposedVersion,
  onVersionChange,
}) => {
  const [selectedVersion, setSelectedVersion] = useState(proposedVersion.version_number);

  const compareValues = (original: any, proposed: any): boolean => {
    return JSON.stringify(original) !== JSON.stringify(proposed);
  };

  const getHighlightColor = (isDifferent: boolean): string => {
    return isDifferent ? '#fff3cd' : 'transparent';
  };

  const fields = [
    { label: 'Coffee Type', key: 'coffee_type' },
    { label: 'Quantity (bags)', key: 'quantity_bags' },
    { label: 'Unit Price', key: 'unit_price' },
    { label: 'Currency', key: 'currency' },
    { label: 'Payment Terms', key: 'payment_terms' },
    { label: 'Delivery Location', key: 'delivery_location' },
    { label: 'Delivery Date', key: 'delivery_date' },
    { label: 'Incoterms', key: 'incoterms' },
  ];

  const formatValue = (value: any, key: string): string => {
    if (key === 'unit_price') {
      return `$${parseFloat(value).toFixed(2)}`;
    }
    if (key === 'quantity_bags') {
      return `${value} bags`;
    }
    return String(value);
  };

  const calculateDifferences = (): Record<string, boolean> => {
    const differences: Record<string, boolean> = {};
    fields.forEach(field => {
      differences[field.key] = compareValues(
        originalVersion[field.key as keyof ContractVersion],
        proposedVersion[field.key as keyof ContractVersion]
      );
    });
    return differences;
  };

  const differences = calculateDifferences();
  const changedFieldsCount = Object.values(differences).filter(v => v).length;

  return (
    <Card>
      <CardHeader
        title="Contract Comparison"
        subheader={`${changedFieldsCount} field${changedFieldsCount !== 1 ? 's' : ''} changed`}
      />
      <Divider />
      <CardContent>
        {changedFieldsCount > 0 && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#fff3cd', borderRadius: 1, display: 'flex', gap: 1 }}>
            <AlertCircle size={20} style={{ color: '#856404', flexShrink: 0 }} />
            <Typography variant="body2" color="#856404">
              {changedFieldsCount} field{changedFieldsCount !== 1 ? 's' : ''} differ between versions
            </Typography>
          </Box>
        )}

        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Compare with Version</InputLabel>
            <Select
              value={selectedVersion}
              label="Compare with Version"
              onChange={(e) => {
                setSelectedVersion(e.target.value as number);
                if (onVersionChange) {
                  onVersionChange(e.target.value as number);
                }
              }}
            >
              <MenuItem value={proposedVersion.version_number}>
                Version {proposedVersion.version_number} (Current)
              </MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Field</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Original (v{originalVersion.version_number})</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Proposed (v{proposedVersion.version_number})</TableCell>
                <TableCell sx={{ fontWeight: 600, width: 100 }}>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {fields.map((field) => {
                const isDifferent = differences[field.key];
                const originalValue = originalVersion[field.key as keyof ContractVersion];
                const proposedValue = proposedVersion[field.key as keyof ContractVersion];

                return (
                  <TableRow key={field.key}>
                    <TableCell sx={{ fontWeight: 500 }}>{field.label}</TableCell>
                    <TableCell sx={{ bgcolor: getHighlightColor(isDifferent) }}>
                      {formatValue(originalValue, field.key)}
                    </TableCell>
                    <TableCell sx={{ bgcolor: getHighlightColor(isDifferent) }}>
                      {formatValue(proposedValue, field.key)}
                    </TableCell>
                    <TableCell>
                      {isDifferent ? (
                        <Chip label="Changed" size="small" color="warning" />
                      ) : (
                        <Chip label="Same" size="small" variant="outlined" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            Version Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Original Version
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  v{originalVersion.version_number}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {new Date(originalVersion.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  Proposed Version
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  v{proposedVersion.version_number}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  {new Date(proposedVersion.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {changedFieldsCount === 0 && (
          <Box sx={{ mt: 3, p: 2, bgcolor: '#e8f5e9', borderRadius: 1, textAlign: 'center' }}>
            <Typography variant="body2" color="success.main">
              ✓ No differences between versions
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ContractComparisonView;
