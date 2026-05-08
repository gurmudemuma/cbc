/**
 * Agency Selector Component
 * Allows users to switch between agencies they belong to
 */

import React from 'react';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Box,
    Typography,
    Chip,
    SelectChangeEvent,
} from '@mui/material';
import { useAgency } from '../contexts/AgencyContext';

export const AgencySelector: React.FC = () => {
    const { agencies, currentAgency, selectAgency, isLoading } = useAgency();

    const handleChange = (event: SelectChangeEvent<string>) => {
        const agencyCode = event.target.value;
        const agency = agencies.find(a => a.agencyCode === agencyCode);
        if (agency) {
            selectAgency(agency);
        }
    };

    if (isLoading) {
        return (
            <Box sx={{ minWidth: 200 }}>
                <Typography variant="body2" color="text.secondary">
                    Loading agencies...
                </Typography>
            </Box>
        );
    }

    if (agencies.length === 0) {
        return null;
    }

    // Don't show selector if user only belongs to one agency
    if (agencies.length === 1) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">
                    Agency:
                </Typography>
                <Chip
                    label={currentAgency?.agencyName || agencies[0].agencyName}
                    color="primary"
                    size="small"
                />
            </Box>
        );
    }

    return (
        <FormControl sx={{ minWidth: 250 }} size="small">
            <InputLabel id="agency-selector-label">Select Agency</InputLabel>
            <Select
                labelId="agency-selector-label"
                id="agency-selector"
                value={currentAgency?.agencyCode || ''}
                label="Select Agency"
                onChange={handleChange}
            >
                {agencies.map((agency) => (
                    <MenuItem key={agency.agencyCode} value={agency.agencyCode}>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="body2" fontWeight="medium">
                                {agency.agencyName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {agency.agencyCode} • {agency.role}
                            </Typography>
                        </Box>
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
};

export default AgencySelector;
