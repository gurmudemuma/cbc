import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { X, Keyboard } from 'lucide-react';
import { COMMON_SHORTCUTS, getShortcutDisplay } from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUT_CATEGORIES = {
  Navigation: [
    { ...COMMON_SHORTCUTS.NEXT_PAGE, category: 'Navigation' },
    { ...COMMON_SHORTCUTS.PREV_PAGE, category: 'Navigation' },
    { ...COMMON_SHORTCUTS.TOGGLE_SIDEBAR, category: 'Navigation' },
  ],
  Dashboard: [
    { ...COMMON_SHORTCUTS.CUSTOMIZE_DASHBOARD, category: 'Dashboard' },
    { ...COMMON_SHORTCUTS.REFRESH, category: 'Dashboard' },
  ],
  General: [
    { ...COMMON_SHORTCUTS.SEARCH, category: 'General' },
    { ...COMMON_SHORTCUTS.FOCUS_SEARCH, category: 'General' },
    { ...COMMON_SHORTCUTS.SAVE, category: 'General' },
    { ...COMMON_SHORTCUTS.HELP, category: 'General' },
  ],
  Theme: [
    { ...COMMON_SHORTCUTS.TOGGLE_THEME, category: 'Theme' },
  ],
  Account: [
    { ...COMMON_SHORTCUTS.OPEN_NOTIFICATIONS, category: 'Account' },
    { ...COMMON_SHORTCUTS.LOGOUT, category: 'Account' },
  ],
};

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const getKeyChipColor = (key: string): 'default' | 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success' => {
    if (key.includes('Ctrl') || key.includes('Shift') || key.includes('Alt')) return 'primary';
    return 'default';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
        <Keyboard size={24} />
        Keyboard Shortcuts
        <Box sx={{ ml: 'auto' }}>
          <Tooltip title="Close">
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <IconButton onClick={onClose} size="small">
                <X size={20} />
              </IconButton>
            </motion.div>
          </Tooltip>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ maxHeight: isMobile ? 'calc(100vh - 200px)' : 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {Object.entries(SHORTCUT_CATEGORIES).map(([category, shortcuts], categoryIndex) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: categoryIndex * 0.1 }}
            >
              <Box>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    pb: 1,
                    borderBottom: `2px solid ${theme.palette.primary.main}`,
                  }}
                >
                  {category}
                </Typography>

                <Grid container spacing={2}>
                  {shortcuts.map((shortcut, index) => (
                    <Grid item xs={12} sm={6} key={`${category}-${index}`}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (categoryIndex * 0.1) + (index * 0.05) }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: 1.5,
                            border: '1px solid',
                            borderColor: 'divider',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              borderColor: 'primary.main',
                              boxShadow: theme.shadows[2],
                              transform: 'translateY(-2px)',
                            },
                          }}
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                {shortcut.description}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              {getShortcutDisplay(shortcut)
                                .split(' + ')
                                .map((part, i) => (
                                  <motion.div
                                    key={i}
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                  >
                                    <Chip
                                      label={part}
                                      size="small"
                                      variant="outlined"
                                      color={getKeyChipColor(part)}
                                      sx={{
                                        fontFamily: 'monospace',
                                        fontWeight: 600,
                                        fontSize: '0.75rem',
                                      }}
                                    />
                                  </motion.div>
                                ))}
                            </Box>
                          </Box>
                        </Paper>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </motion.div>
          ))}

          {/* Tips Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: 1.5,
                backgroundColor: 'info.lighter',
                border: '1px solid',
                borderColor: 'info.light',
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                💡 Tips
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Shortcuts won't work when typing in input fields
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Use Ctrl (or Cmd on Mac) for most shortcuts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                • Press ? anytime to open this help dialog
              </Typography>
            </Paper>
          </motion.div>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsHelp;
