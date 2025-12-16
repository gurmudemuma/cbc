import { Box, Skeleton, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

export const SkeletonCard = ({ height = 200, width = '100%', borderRadius = 2 }) => {
  const theme = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 0.8 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse' }}
    >
      <Skeleton 
        variant="rectangular" 
        width={width}
        height={height}
        sx={{ 
          borderRadius: borderRadius,
          bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.11)' : 'rgba(0, 0, 0, 0.11)'
        }}
      />
    </motion.div>
  );
};

export const SkeletonList = ({ count = 3, itemHeight = 72, spacing = 2 }) => {
  return (
    <Box sx={{ width: '100%', '& > *:not(:last-child)': { mb: spacing } }}>
      {Array.from(new Array(count)).map((_, index) => (
        <Skeleton 
          key={index} 
          variant="rectangular" 
          height={itemHeight} 
          sx={{ 
            borderRadius: 2,
            bgcolor: 'background.paper',
            boxShadow: 1,
          }} 
        />
      ))}
    </Box>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4, cellHeight = 53 }) => {
  const theme = useTheme();
  
  return (
    <Box sx={{ width: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', mb: 1 }}>
        {Array.from(new Array(columns)).map((_, colIndex) => (
          <Skeleton
            key={`header-${colIndex}`}
            variant="text"
            width={`${100 / columns}%`}
            height={48}
            sx={{ 
              mx: 0.5,
              bgcolor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.08)'
            }}
          />
        ))}
      </Box>
      
      {/* Rows */}
      <Box>
        {Array.from(new Array(rows)).map((_, rowIndex) => (
          <Box key={`row-${rowIndex}`} sx={{ display: 'flex', mb: 0.5 }}>
            {Array.from(new Array(columns)).map((_, colIndex) => (
              <Skeleton
                key={`cell-${rowIndex}-${colIndex}`}
                variant="rectangular"
                width={`${100 / columns}%`}
                height={cellHeight}
                sx={{ 
                  mx: 0.5,
                  borderRadius: 1,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                }}
              />
            ))}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

const LoadingSkeleton = ({ type = 'card', ...props }) => {
  switch (type) {
    case 'list':
      return <SkeletonList {...props} />;
    case 'table':
      return <SkeletonTable {...props} />;
    case 'card':
    default:
      return <SkeletonCard {...props} />;
  }
};

export default LoadingSkeleton;
