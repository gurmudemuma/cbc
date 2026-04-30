/**
 * ContractHistoryTimeline Component
 * Displays contract version history in a timeline view
 */

import React, { useState } from 'react';
import {
  Card, CardHeader, CardContent, Timeline, TimelineItem, TimelineSeparator,
  TimelineConnector, TimelineContent, TimelineDot, Typography, Box, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Stack, Divider,
} from '@mui/material';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface HistoryEntry {
  history_id: string;
  version_number: number;
  status: string;
  actor_type: string;
  actor_id: string;
  action: string;
  changes?: Record<string, any>;
  rejection_reason?: string;
  created_at: string;
}

interface ContractHistoryTimelineProps {
  draftId: string;
  history: HistoryEntry[];
  currentVersion: number;
  onVersionSelect?: (versionNumber: number) => void;
}

const ContractHistoryTimeline: React.FC<ContractHistoryTimelineProps> = ({
  draftId,
  history,
  currentVersion,
  onVersionSelect,
}) => {
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<HistoryEntry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getStatusColor = (status: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success'> = {
      DRAFT: 'default',
      COUNTERED: 'warning',
      ACCEPTED: 'info',
      REJECTED: 'error',
      FINALIZED: 'success',
    };
    return colors[status] || 'default';
  };

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      CREATED: 'Contract Created',
      SENT: 'Sent to Buyer',
      ACCEPTED: 'Counter Accepted',
      REJECTED: 'Contract Rejected',
      COUNTERED: 'Counter Offered',
      FINALIZED: 'Finalized to Blockchain',
      ECTA_REGISTERED: 'ECTA Registered',
      CERTIFICATE_GENERATED: 'Certificate Generated',
    };
    return labels[action] || action;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewDetails = (entry: HistoryEntry) => {
    setSelectedVersion(entry);
    setDetailsOpen(true);
  };

  const handleSelectVersion = (versionNumber: number) => {
    if (onVersionSelect) {
      onVersionSelect(versionNumber);
    }
  };

  return (
    <Card>
      <CardHeader
        title="Contract History"
        subheader={`${history.length} version${history.length !== 1 ? 's' : ''}`}
      />
      <Divider />
      <CardContent>
        <Timeline position="alternate">
          {history.map((entry, index) => (
            <TimelineItem key={entry.history_id}>
              <TimelineSeparator>
                <TimelineDot
                  color={entry.version_number === currentVersion ? 'primary' : 'grey'}
                  variant={entry.version_number === currentVersion ? 'filled' : 'outlined'}
                >
                  {entry.version_number}
                </TimelineDot>
                {index < history.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h6" component="span">
                      {getActionLabel(entry.action)}
                    </Typography>
                    <Chip
                      label={entry.status}
                      size="small"
                      color={getStatusColor(entry.status)}
                    />
                    {entry.version_number === currentVersion && (
                      <Chip label="Current" size="small" color="primary" />
                    )}
                  </Stack>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    {formatDate(entry.created_at)}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>Actor:</strong> {entry.actor_type} ({entry.actor_id})
                  </Typography>

                  {entry.rejection_reason && (
                    <Typography variant="body2" color="error" sx={{ mb: 1 }}>
                      <strong>Reason:</strong> {entry.rejection_reason}
                    </Typography>
                  )}

                  {entry.changes && Object.keys(entry.changes).length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        onClick={() =>
                          setExpandedVersion(
                            expandedVersion === entry.version_number ? null : entry.version_number
                          )
                        }
                        endIcon={
                          expandedVersion === entry.version_number ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )
                        }
                      >
                        {expandedVersion === entry.version_number ? 'Hide' : 'Show'} Changes
                      </Button>

                      {expandedVersion === entry.version_number && (
                        <Box sx={{ mt: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                          {Object.entries(entry.changes).map(([key, value]) => (
                            <Typography key={key} variant="caption" display="block" sx={{ mb: 0.5 }}>
                              <strong>{key}:</strong> {JSON.stringify(value)}
                            </Typography>
                          ))}
                        </Box>
                      )}
                    </Box>
                  )}

                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewDetails(entry)}
                    >
                      View Details
                    </Button>
                    {entry.version_number !== currentVersion && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleSelectVersion(entry.version_number)}
                      >
                        View Version
                      </Button>
                    )}
                  </Stack>
                </Box>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Version {selectedVersion?.version_number} Details</DialogTitle>
        <DialogContent>
          {selectedVersion && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Action:</strong> {getActionLabel(selectedVersion.action)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Status:</strong> {selectedVersion.status}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Timestamp:</strong> {formatDate(selectedVersion.created_at)}
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Actor:</strong> {selectedVersion.actor_type}
              </Typography>
              {selectedVersion.rejection_reason && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Rejection Reason:</strong> {selectedVersion.rejection_reason}
                </Typography>
              )}
              {selectedVersion.changes && Object.keys(selectedVersion.changes).length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Changes:
                  </Typography>
                  {Object.entries(selectedVersion.changes).map(([key, value]) => (
                    <Typography key={key} variant="caption" display="block" sx={{ mb: 0.5 }}>
                      <strong>{key}:</strong> {JSON.stringify(value)}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default ContractHistoryTimeline;
