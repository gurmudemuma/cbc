import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  callback: () => void;
  description: string;
}

export const useKeyboardShortcuts = (shortcuts: KeyboardShortcut[], enabled = true) => {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      shortcuts.forEach(shortcut => {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.callback();
        }
      });
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

// Common shortcuts
export const COMMON_SHORTCUTS = {
  SEARCH: { key: 'k', ctrl: true, description: 'Open search' },
  HELP: { key: '?', description: 'Show help' },
  ESCAPE: { key: 'Escape', description: 'Close dialog' },
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  REFRESH: { key: 'r', ctrl: true, description: 'Refresh' },
  FOCUS_SEARCH: { key: '/', description: 'Focus search' },
  NEXT_PAGE: { key: 'n', ctrl: true, description: 'Next page' },
  PREV_PAGE: { key: 'p', ctrl: true, description: 'Previous page' },
  TOGGLE_SIDEBAR: { key: 'b', ctrl: true, description: 'Toggle sidebar' },
  CUSTOMIZE_DASHBOARD: { key: 'd', ctrl: true, shift: true, description: 'Customize dashboard' },
  TOGGLE_THEME: { key: 't', ctrl: true, shift: true, description: 'Toggle theme' },
  OPEN_NOTIFICATIONS: { key: 'n', ctrl: true, shift: true, description: 'Open notifications' },
  LOGOUT: { key: 'l', ctrl: true, shift: true, description: 'Logout' },
};

export const getShortcutDisplay = (shortcut: Partial<KeyboardShortcut>): string => {
  const parts: string[] = [];
  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  parts.push(shortcut.key?.toUpperCase() || '');
  return parts.join(' + ');
};
