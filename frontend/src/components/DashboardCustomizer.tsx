import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Divider,
  TextField,
  Stack,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  X,
  Plus,
  Trash2,
  Copy,
  Save,
  RotateCcw,
  Eye,
  EyeOff,
  BarChart3,
  TrendingUp,
  AlertCircle,
  Activity,
  Table2,
  Clock,
} from 'lucide-react';
import { DashboardWidget, DashboardLayout } from '../hooks/useDashboardCustomization';

interface DashboardCustomizerProps {
  open: boolean;
  onClose: () => void;
  layout: DashboardLayout | undefined;
  onUpdateLayout: (layoutId: string, updates: Partial<DashboardLayout>) => void;
  onAddWidget: (layoutId: string, widget: DashboardWidget) => void;
  onRemoveWidget: (layoutId: string, widgetId: string) => void;
  onToggleVisibility: (layoutId: string, widgetId: string) => void;
}

const AVAILABLE_WIDGETS = [
  { id: 'stats', label: 'Statistics Card', icon: TrendingUp, description: 'Display key metrics' },
  { id: 'chart', label: 'Chart', icon: BarChart3, description: 'Visualize data trends' },
  { id: 'table', label: 'Data Table', icon: Table2, description: 'Show tabular data' },
  { id: 'timeline', label: 'Timeline', icon: Clock, description: 'Display events over time' },
  { id: 'alerts', label: 'Alerts', icon: AlertCircle, description: 'Show system alerts' },
  { id: 'activity', label: 'Activity Feed', icon: Activity, description: 'Recent activities' },
];

const WIDGET_SIZES = ['small', 'medium', 'large'] as const;

export const DashboardCustomizer: React.FC<DashboardCustomizerProps> = ({
  open,
  onClose,
  layout,
  onUpdateLayout,
  onAddWidget,
  onRemoveWidget,
  onToggleVisibility,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [newWidgetType, setNewWidgetType] = useState<string>('');
  const [newWidgetTitle, setNewWidgetTitle] = useState('');
  const [newWidgetSize, setNewWidgetSize] = useState<'small' | 'medium' | 'large'>('medium');

  if (!layout) return null;

  const handleAddWidget = () => {
    if (!newWidgetType || !newWidgetTitle) return;

    const widget: DashboardWidget = {
      id: `widget_${Date.now()}`,
      type: newWidgetType as any,
      title: newWidgetTitle,
      position: layout.widgets.length,
      size: newWidgetSize,
      isVisible: true,
    };

    onAddWidget(layout.id, widget);
    setNewWidgetType('');
    setNewWidgetTitle('');
    setNewWidgetSize('medium');
  };

  const handleRemoveWidget = (widgetId: string) => {
    onRemoveWidget(layout.id, widgetId);
  };

  const handleToggleVisibility = (widgetId: string) => {
    onToggleVisibility(layout.id, widgetId);
  };

  const handleUpdateWidgetSize = (widgetId: string, newSize: 'small' | 'medium' | 'large') => {
    const widget = layout.widgets.find(w => w.id === widgetId);
    if (widget) {
      onUpdateLayout(layout.id, {
        widgets: layout.widgets.map(w =>
          w.id === widgetId ? { ...w, size: newSize } : w
        ),
      });
    }
  };

  const getWidgetIcon = (type: string) => {
    const widget = AVAILABLE_WIDGETS.find(w => w.id === type);
    return widget?.icon;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 2,
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        <BarChart3 size={24} />
        Customize Dashboard
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: isMobile ? 'calc(100vh - 200px)' : 'auto' }}>
        <Stack spacing={3}>
          {/* Add New Widget Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Add New Widget
            </Typography>
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Widget Type
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 1 }}>
                  {AVAILABLE_WIDGETS.map(widget => {
                    const Icon = widget.icon;
                    return (
                      <motion.div
                        key={widget.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button
                          variant={newWidgetType === widget.id ? 'contained' : 'outlined'}
                          onClick={() => setNewWidgetType(widget.id)}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.5,
                            py: 1.5,
                            height: '100%',
                          }}
                          title={widget.description}
                        >
                          <Icon size={20} />
                          <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                            {widget.label}
                          </Typography>
                        </Button>
                      </motion.div>
                    );
                  })}
                </Box>
              </Box>

              <TextField
                label="Widget Title"
                value={newWidgetTitle}
                onChange={(e) => setNewWidgetTitle(e.target.value)}
                size="small"
                fullWidth
                placeholder="e.g., Export Statistics"
              />

              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Widget Size
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {WIDGET_SIZES.map(size => (
                    <motion.div key={size} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant={newWidgetSize === size ? 'contained' : 'outlined'}
                        onClick={() => setNewWidgetSize(size)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      >
                        {size}
                      </Button>
                    </motion.div>
                  ))}
                </Box>
              </Box>

              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={handleAddWidget}
                  disabled={!newWidgetType || !newWidgetTitle}
                  fullWidth
                >
                  Add Widget
                </Button>
              </motion.div>
            </Stack>
          </Box>

          <Divider />

          {/* Current Widgets Section */}
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
              Current Widgets ({layout.widgets.length})
            </Typography>
            <AnimatePresence>
              {layout.widgets.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No widgets added yet
                </Typography>
              ) : (
                <List sx={{ width: '100%' }}>
                  {layout.widgets.map((widget, index) => {
                    const Icon = getWidgetIcon(widget.type);
                    return (
                      <motion.div
                        key={widget.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ListItemButton
                          sx={{
                            mb: 1,
                            borderRadius: 1,
                            border: '1px solid',
                            borderColor: 'divider',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                            },
                          }}
                        >
                          <ListItemIcon>
                            <Checkbox
                              edge="start"
                              checked={widget.isVisible}
                              onChange={() => handleToggleVisibility(widget.id)}
                              tabIndex={-1}
                              disableRipple
                            />
                          </ListItemIcon>
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {Icon && <Icon size={18} />}
                          </ListItemIcon>
                          <ListItemText
                            primary={widget.title}
                            secondary={`Type: ${widget.type} • Size: ${widget.size}`}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Change size">
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                {WIDGET_SIZES.map(size => (
                                  <motion.div
                                    key={size}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                  >
                                    <Chip
                                      label={size.charAt(0).toUpperCase()}
                                      size="small"
                                      variant={widget.size === size ? 'filled' : 'outlined'}
                                      onClick={() => handleUpdateWidgetSize(widget.id, size)}
                                      sx={{ cursor: 'pointer' }}
                                    />
                                  </motion.div>
                                ))}
                              </Box>
                            </Tooltip>
                            <Tooltip title="Remove widget">
                              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <IconButton
                                  edge="end"
                                  size="small"
                                  onClick={() => handleRemoveWidget(widget.id)}
                                  color="error"
                                >
                                  <Trash2 size={16} />
                                </IconButton>
                              </motion.div>
                            </Tooltip>
                          </Box>
                        </ListItemButton>
                      </motion.div>
                    );
                  })}
                </List>
              )}
            </AnimatePresence>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </motion.div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={onClose} variant="contained" startIcon={<Save size={18} />}>
            Save Changes
          </Button>
        </motion.div>
      </DialogActions>
    </Dialog>
  );
};

export default DashboardCustomizer;
