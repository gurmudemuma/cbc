import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Box, useTheme, useMediaQuery, Paper, Skeleton } from '@mui/material';
import { DashboardWidget } from '../hooks/useDashboardCustomization';

interface ResponsiveGridProps {
  widgets: DashboardWidget[];
  onReorder?: (widgets: DashboardWidget[]) => void;
  renderWidget: (widget: DashboardWidget) => React.ReactNode;
  isLoading?: boolean;
  gap?: number;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  widgets,
  onReorder,
  renderWidget,
  isLoading = false,
  gap = 2,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  const [isDragging, setIsDragging] = useState(false);

  // Calculate grid columns based on screen size
  const getGridColumns = () => {
    if (isMobile) return 1;
    if (isTablet) return 2;
    return 3;
  };

  // Calculate widget span based on size
  const getWidgetSpan = (size: 'small' | 'medium' | 'large') => {
    const columns = getGridColumns();
    if (columns === 1) return 1;
    if (size === 'large') return columns;
    if (size === 'medium') return Math.ceil(columns / 2);
    return 1;
  };

  // Sort widgets by position
  const sortedWidgets = [...widgets].sort((a, b) => a.position - b.position);
  const visibleWidgets = sortedWidgets.filter(w => w.isVisible);

  const handleReorder = useCallback((newOrder: DashboardWidget[]) => {
    if (onReorder) {
      const reorderedWithPositions = newOrder.map((widget, index) => ({
        ...widget,
        position: index,
      }));
      onReorder(reorderedWithPositions);
    }
  }, [onReorder]);

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
          gap: theme.spacing(gap),
          width: '100%',
        }}
      >
        {[...Array(6)].map((_, i) => (
          <Paper key={i} sx={{ p: 2, borderRadius: 2 }}>
            <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
          </Paper>
        ))}
      </Box>
    );
  }

  if (visibleWidgets.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'divider',
          color: 'text.secondary',
        }}
      >
        No widgets to display. Add widgets to customize your dashboard.
      </Box>
    );
  }

  return (
    <Reorder.Group
      axis="y"
      values={visibleWidgets}
      onReorder={handleReorder}
      as="div"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${getGridColumns()}, 1fr)`,
        gap: theme.spacing(gap),
        width: '100%',
      }}
    >
      <AnimatePresence>
        {visibleWidgets.map((widget) => (
          <Reorder.Item
            key={widget.id}
            value={widget}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={() => setIsDragging(false)}
            as="div"
            style={{
              gridColumn: `span ${getWidgetSpan(widget.size)}`,
            }}
          >
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                duration: 0.3,
                type: 'spring',
                stiffness: 300,
                damping: 30,
              }}
              whileHover={!isDragging ? { y: -4 } : {}}
              whileDrag={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
              style={{
                cursor: isDragging ? 'grabbing' : 'grab',
                touchAction: 'none',
              }}
            >
              <Paper
                elevation={isDragging ? 8 : 1}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  height: '100%',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    elevation: 4,
                    boxShadow: theme.shadows[4],
                  },
                }}
              >
                {renderWidget(widget)}
              </Paper>
            </motion.div>
          </Reorder.Item>
        ))}
      </AnimatePresence>
    </Reorder.Group>
  );
};

export default ResponsiveGrid;
