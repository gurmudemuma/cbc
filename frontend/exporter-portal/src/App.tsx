import { Routes, Route } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateExport from './pages/CreateExport';
import ExportDetails from './pages/ExportDetails';
import ExportHistory from './pages/ExportHistory';

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/create-export" element={<PrivateRoute><CreateExport /></PrivateRoute>} />
        <Route path="/export/:id" element={<PrivateRoute><ExportDetails /></PrivateRoute>} />
        <Route path="/history" element={<PrivateRoute><ExportHistory /></PrivateRoute>} />
      </Routes>
    </div>
  );
}

export default App;