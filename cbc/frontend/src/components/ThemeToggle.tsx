import { useTheme } from '@mui/material/styles';
import { IconButton, Tooltip } from '@mui/material';
import { Brightness4 as DarkIcon, Brightness7 as LightIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ThemeToggle = ({ mode, onToggle }) => {
  const theme = useTheme();
  
  return (
    <Tooltip title={mode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <IconButton
          onClick={onToggle}
          color="inherit"
          sx={{
            p: 1.5,
            backgroundColor: 'background.paper',
            boxShadow: 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          {mode === 'dark' ? (
            <LightIcon sx={{ color: 'warning.main' }} />
          ) : (
            <DarkIcon color="action" />
          )}
        </IconButton>
      </motion.div>
    </Tooltip>
  );
};

export default ThemeToggle;
