import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#8e24aa',
      light: '#ab47bc',
      dark: '#6a1b9a',
    },
    secondary: {
      main: '#f1c40f',
    },
    success: {
      main: '#4caf50',
    },
    error: {
      main: '#f44336',
    },
    warning: {
      main: '#ff9800',
    },
    info: {
      main: '#2196f3',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        ::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        ::-webkit-scrollbar-track {
          background: #e8eaf6;
        }
        ::-webkit-scrollbar-thumb {
          background: #8e24aa;
          border-radius: 8px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #6a1b9a;
        }
        ::selection {
          background-color: #4f46e5;
          color: #ffffff;
          text-shadow: none;
        }
        input::selection,
        select::selection,
        textarea::selection,
        .MuiSelect-select::selection,
        .MuiMenuItem-root::selection,
        .MuiInputBase-input::selection {
          background-color: #4f46e5 !important;
          color: #ffffff !important;
          text-shadow: none !important;
        }
        .MuiSelect-select {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        .MuiPaper-root .MuiMenuItem-root {
          user-select: text !important;
          -webkit-user-select: text !important;
        }
        ::-moz-selection {
          background-color: #4f46e5;
          color: #ffffff;
        }
        :focus-visible {
          outline: 2px solid #8e24aa;
          outline-offset: 2px;
        }
      `,
    },
  },
});

export default theme;
