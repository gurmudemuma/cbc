import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Stack,
  Typography,
  Slider,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Settings, Eye, Volume2, Type } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Accessibility settings hook
 */
export interface AccessibilitySettings {
  highContrast: boolean;
  fontSize: number; // 100-200 (percentage)
  reduceMotion: boolean;
  screenReaderMode: boolean;
  focusIndicator: boolean;
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  fontSize: 100,
  reduceMotion: false,
  screenReaderMode: false,
  focusIndicator: true,
  colorBlindMode: 'none',
};

export const useAccessibilitySettings = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('accessibility_settings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load accessibility settings:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage
  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem('accessibility_settings', JSON.stringify(updated));
    applySettings(updated);
  };

  // Apply settings to DOM
  const applySettings = (appliedSettings: AccessibilitySettings) => {
    const root = document.documentElement;

    // Font size
    root.style.fontSize = `${appliedSettings.fontSize}%`;

    // High contrast
    if (appliedSettings.highContrast) {
      root.classList.add('high-contrast-mode');
    } else {
      root.classList.remove('high-contrast-mode');
    }

    // Reduce motion
    if (appliedSettings.reduceMotion) {
      root.classList.add('reduce-motion-mode');
    } else {
      root.classList.remove('reduce-motion-mode');
    }

    // Screen reader mode
    if (appliedSettings.screenReaderMode) {
      root.classList.add('screen-reader-mode');
    } else {
      root.classList.remove('screen-reader-mode');
    }

    // Focus indicator
    if (appliedSettings.focusIndicator) {
      root.classList.add('focus-indicator-mode');
    } else {
      root.classList.remove('focus-indicator-mode');
    }

    // Color blind mode
    root.setAttribute('data-colorblind-mode', appliedSettings.colorBlindMode);
  };

  return { settings, updateSettings, isLoaded };
};

/**
 * Accessibility settings dialog
 */
export interface AccessibilitySettingsDialogProps {
  open: boolean;
  onClose: () => void;
  settings: AccessibilitySettings;
  onSettingsChange: (settings: Partial<AccessibilitySettings>) => void;
}

export const AccessibilitySettingsDialog: React.FC<AccessibilitySettingsDialogProps> = ({
  open,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
        <Eye size={24} />
        Accessibility Settings
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* High Contrast */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.highContrast}
                  onChange={(e) => onSettingsChange({ highContrast: e.target.checked })}
                  inputProps={{ 'aria-label': 'High contrast mode' }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    High Contrast Mode
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Increases contrast for better visibility
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Font Size */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Font Size: {settings.fontSize}%
            </Typography>
            <Slider
              value={settings.fontSize}
              onChange={(e, value) => onSettingsChange({ fontSize: value as number })}
              min={100}
              max={200}
              step={10}
              marks={[
                { value: 100, label: '100%' },
                { value: 150, label: '150%' },
                { value: 200, label: '200%' },
              ]}
              valueLabelDisplay="auto"
              aria-label="Font size adjustment"
            />
          </Box>

          {/* Reduce Motion */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.reduceMotion}
                  onChange={(e) => onSettingsChange({ reduceMotion: e.target.checked })}
                  inputProps={{ 'aria-label': 'Reduce motion' }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Reduce Motion
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Minimizes animations and transitions
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Screen Reader Mode */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.screenReaderMode}
                  onChange={(e) => onSettingsChange({ screenReaderMode: e.target.checked })}
                  inputProps={{ 'aria-label': 'Screen reader mode' }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Screen Reader Mode
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Optimizes for screen reader compatibility
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Focus Indicator */}
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.focusIndicator}
                  onChange={(e) => onSettingsChange({ focusIndicator: e.target.checked })}
                  inputProps={{ 'aria-label': 'Focus indicator' }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Enhanced Focus Indicator
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Shows clear focus outline for keyboard navigation
                  </Typography>
                </Box>
              }
            />
          </Box>

          {/* Color Blind Mode */}
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
              Color Blind Mode
            </Typography>
            <Stack spacing={1}>
              {(['none', 'protanopia', 'deuteranopia', 'tritanopia'] as const).map(mode => (
                <FormControlLabel
                  key={mode}
                  control={
                    <Switch
                      checked={settings.colorBlindMode === mode}
                      onChange={(e) => {
                        if (e.target.checked) {
                          onSettingsChange({ colorBlindMode: mode });
                        }
                      }}
                      inputProps={{ 'aria-label': `${mode} color blind mode` }}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {mode === 'none' && 'Normal Vision'}
                      {mode === 'protanopia' && 'Protanopia (Red-Blind)'}
                      {mode === 'deuteranopia' && 'Deuteranopia (Green-Blind)'}
                      {mode === 'tritanopia' && 'Tritanopia (Blue-Yellow Blind)'}
                    </Typography>
                  }
                />
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button onClick={onClose} variant="outlined">
            Close
          </Button>
        </motion.div>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Accessibility settings button
 */
export interface AccessibilityButtonProps {
  settings: AccessibilitySettings;
  onOpenSettings: () => void;
}

export const AccessibilityButton: React.FC<AccessibilityButtonProps> = ({ settings, onOpenSettings }) => {
  return (
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <Button
        onClick={onOpenSettings}
        startIcon={<Settings size={20} />}
        variant="outlined"
        size="small"
        aria-label="Accessibility settings"
        title="Open accessibility settings"
      >
        Accessibility
      </Button>
    </motion.div>
  );
};

/**
 * Skip to main content link (for keyboard navigation)
 */
export const SkipToMainContent: React.FC = () => {
  return (
    <Box
      component="a"
      href="#main-content"
      sx={{
        position: 'absolute',
        top: -40,
        left: 0,
        backgroundColor: 'primary.main',
        color: 'primary.contrastText',
        padding: 1,
        textDecoration: 'none',
        zIndex: 100,
        '&:focus': {
          top: 0,
        },
      }}
    >
      Skip to main content
    </Box>
  );
};

/**
 * Accessible form label
 */
export interface AccessibleLabelProps {
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}

export const AccessibleLabel: React.FC<AccessibleLabelProps> = ({ htmlFor, required, children }) => {
  return (
    <Typography
      component="label"
      htmlFor={htmlFor}
      variant="body2"
      sx={{
        fontWeight: 600,
        display: 'block',
        mb: 0.5,
      }}
    >
      {children}
      {required && (
        <span aria-label="required" style={{ color: 'red', marginLeft: 4 }}>
          *
        </span>
      )}
    </Typography>
  );
};

/**
 * Accessible error message
 */
export interface AccessibleErrorProps {
  id: string;
  children: React.ReactNode;
}

export const AccessibleError: React.FC<AccessibleErrorProps> = ({ id, children }) => {
  return (
    <Typography
      id={id}
      variant="caption"
      color="error"
      role="alert"
      sx={{ display: 'block', mt: 0.5 }}
    >
      {children}
    </Typography>
  );
};

/**
 * CSS for accessibility modes
 */
export const ACCESSIBILITY_STYLES = `
  /* High Contrast Mode */
  .high-contrast-mode {
    --color-text: #000;
    --color-bg: #fff;
    --color-border: #000;
  }

  .high-contrast-mode * {
    border-width: 2px !important;
  }

  /* Reduce Motion Mode */
  .reduce-motion-mode * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Screen Reader Mode */
  .screen-reader-mode .sr-only {
    position: static !important;
    width: auto !important;
    height: auto !important;
    overflow: visible !important;
    clip: auto !important;
  }

  /* Focus Indicator Mode */
  .focus-indicator-mode *:focus {
    outline: 3px solid #4f46e5 !important;
    outline-offset: 2px !important;
  }

  /* Color Blind Modes */
  [data-colorblind-mode="protanopia"] {
    filter: url(#protanopia-filter);
  }

  [data-colorblind-mode="deuteranopia"] {
    filter: url(#deuteranopia-filter);
  }

  [data-colorblind-mode="tritanopia"] {
    filter: url(#tritanopia-filter);
  }
`;
