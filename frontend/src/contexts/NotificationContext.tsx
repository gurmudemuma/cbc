import { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Snackbar, Alert, Slide } from '@mui/material';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const queueRef = useRef([]);
  const processing = useRef(false);

  const processQueue = useCallback(() => {
    if (queueRef.current.length > 0 && !processing.current) {
      const notification = queueRef.current.shift();
      setNotifications(prev => [...prev, { ...notification, id: Date.now() }]);
      processing.current = true;
    }
  }, []);

  const showNotification = useCallback((message, severity = 'info', options = {}) => {
    const { autoHideDuration = 6000, ...otherOptions } = options;
    
    const notification = {
      message,
      severity,
      autoHideDuration,
      ...otherOptions,
    };

    queueRef.current.push(notification);
    processQueue();
  }, [processQueue]);

  const handleClose = useCallback((id) => {
    setNotifications(prev => {
      const newNotifications = prev.filter(n => n.id !== id);
      if (newNotifications.length === 0) {
        processing.current = false;
        processQueue();
      }
      return newNotifications;
    });
  }, [processQueue]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={notification.autoHideDuration}
          onClose={() => handleClose(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          TransitionComponent={Slide}
          TransitionProps={{ direction: 'left' }}
          sx={{
            '& .MuiPaper-root': {
              minWidth: '300px',
              borderRadius: '8px',
              boxShadow: '0 4px 20px 0 rgba(0,0,0,0.1)',
              overflow: 'hidden',
            },
          }}
        >
          <Alert
            onClose={() => handleClose(notification.id)}
            severity={notification.severity}
            variant="filled"
            sx={{
              width: '100%',
              alignItems: 'center',
              '& .MuiAlert-message': {
                flex: '1 1 auto',
              },
            }}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
