import {
    Timeline,
    TimelineItem,
    TimelineSeparator,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineOppositeContent,
} from '@mui/lab';
import {
    Typography,
    Paper,
    Box,
    Chip,
    Avatar,
} from '@mui/material';
import {
    CheckCircle,
    XCircle,
    Clock,
    User,
    Building,
    FileText,
} from 'lucide-react';

/**
 * Workflow Timeline Component
 * Displays chronological history of workflow state transitions
 * Shows stakeholder actions, timestamps, and status changes
 */

interface WorkflowEvent {
    id: string;
    timestamp: string;
    eventType: string;
    oldStatus?: string;
    newStatus: string;
    changedBy: string;
    organization: string;
    notes?: string;
    reason?: string;
}

interface WorkflowTimelineProps {
    events: WorkflowEvent[];
    title?: string;
}

const WorkflowTimeline: React.FC<WorkflowTimelineProps> = ({
    events,
    title = 'Workflow History'
}) => {
    const getEventIcon = (event: WorkflowEvent) => {
        const status = event.newStatus.toLowerCase();

        if (status.includes('approved') || status.includes('active') || status.includes('verified') || status.includes('cleared')) {
            return <CheckCircle size={20} color="#4caf50" />;
        }

        if (status.includes('rejected') || status.includes('cancelled')) {
            return <XCircle size={20} color="#f44336" />;
        }

        if (status.includes('pending') || status.includes('review')) {
            return <Clock size={20} color="#ff9800" />;
        }

        return <FileText size={20} color="#2196f3" />;
    };

    const getEventColor = (event: WorkflowEvent) => {
        const status = event.newStatus.toLowerCase();

        if (status.includes('approved') || status.includes('active') || status.includes('verified') || status.includes('cleared')) {
            return 'success';
        }

        if (status.includes('rejected') || status.includes('cancelled')) {
            return 'error';
        }

        if (status.includes('pending') || status.includes('review')) {
            return 'warning';
        }

        return 'info';
    };

    const formatStatus = (status: string) => {
        return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    };

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        });
    };

    const getOrgIcon = (org: string) => {
        const orgLower = org.toLowerCase();
        if (orgLower.includes('ecta')) return <Building size={16} />;
        if (orgLower.includes('bank')) return <Building size={16} />;
        if (orgLower.includes('customs')) return <Building size={16} />;
        if (orgLower.includes('shipping')) return <Building size={16} />;
        return <User size={16} />;
    };

    // Sort events by timestamp (newest first)
    const sortedEvents = [...events].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={24} />
                {title}
            </Typography>

            {sortedEvents.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="text.secondary">
                        No workflow events yet
                    </Typography>
                </Box>
            ) : (
                <Timeline position="right">
                    {sortedEvents.map((event, index) => (
                        <TimelineItem key={event.id}>
                            <TimelineOppositeContent
                                sx={{ m: 'auto 0', minWidth: 100 }}
                                variant="body2"
                                color="text.secondary"
                            >
                                {formatTimestamp(event.timestamp)}
                            </TimelineOppositeContent>

                            <TimelineSeparator>
                                <TimelineConnector sx={{ visibility: index === 0 ? 'hidden' : 'visible' }} />
                                <TimelineDot color={getEventColor(event) as any} variant="outlined">
                                    {getEventIcon(event)}
                                </TimelineDot>
                                <TimelineConnector sx={{ visibility: index === sortedEvents.length - 1 ? 'hidden' : 'visible' }} />
                            </TimelineSeparator>

                            <TimelineContent sx={{ py: '12px', px: 2 }}>
                                <Paper
                                    elevation={1}
                                    sx={{
                                        p: 2,
                                        bgcolor: 'background.paper',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Chip
                                            label={formatStatus(event.newStatus)}
                                            size="small"
                                            color={getEventColor(event) as any}
                                            sx={{ fontWeight: 'medium' }}
                                        />
                                        {event.oldStatus && (
                                            <Typography variant="caption" color="text.secondary">
                                                from {formatStatus(event.oldStatus)}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                                        {event.eventType}
                                    </Typography>

                                    {event.notes && (
                                        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                                            {event.notes}
                                        </Typography>
                                    )}

                                    {event.reason && (
                                        <Box sx={{ p: 1, bgcolor: '#ffebee', borderRadius: 1, mb: 1 }}>
                                            <Typography variant="caption" color="error.dark">
                                                <strong>Reason:</strong> {event.reason}
                                            </Typography>
                                        </Box>
                                    )}

                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
                                            {event.changedBy.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Typography variant="caption" color="text.secondary">
                                            {event.changedBy}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            {getOrgIcon(event.organization)}
                                            <Typography variant="caption" color="text.secondary">
                                                {event.organization}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </TimelineContent>
                        </TimelineItem>
                    ))}
                </Timeline>
            )}
        </Paper>
    );
};

export default WorkflowTimeline;
