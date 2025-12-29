import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
<<<<<<< HEAD
=======
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
<<<<<<< HEAD
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
=======
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
>>>>>>> 88f994dfc42661632577ad48da60b507d1284665
  </React.StrictMode>
);
