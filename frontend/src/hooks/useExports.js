/**
 * Custom React Hook for Export Management
 * Best Practice: Reusable logic with proper state management
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

// Export object shape
// {
//   exportId: string;
//   exporterName: string;
//   coffeeType: string;
//   quantity: number;
//   destinationCountry: string;
//   estimatedValue: number;
//   status: string;
//   createdAt: string;
//   updatedAt: string;
// }

/**
 * Hook for managing exports list
 */
export const useExports = (autoFetch = true) => {
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/api/exports');
      setExports(response.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exports');
      console.error('Error fetching exports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshExports = useCallback(async () => {
    await fetchExports();
  }, [fetchExports]);

  const getExportById = useCallback(
    (id) => {
      return exports.find((exp) => exp.exportId === id);
    },
    [exports]
  );

  useEffect(() => {
    if (autoFetch) {
      fetchExports();
    }
  }, [autoFetch, fetchExports]);

  return {
    exports,
    loading,
    error,
    fetchExports,
    refreshExports,
    getExportById,
  };
};

/**
 * Hook for managing single export
 */
export const useExport = (exportId) => {
  const [exportData, setExportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExport = useCallback(async () => {
    if (!exportId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/api/exports/${exportId}`);
      setExportData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch export');
      console.error('Error fetching export:', err);
    } finally {
      setLoading(false);
    }
  }, [exportId]);

  useEffect(() => {
    fetchExport();
  }, [fetchExport]);

  return {
    exportData,
    loading,
    error,
    refetch: fetchExport,
  };
};

/**
 * Hook for creating exports
 */
export const useCreateExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const createExport = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.post('/api/exports', data);
      setSuccess(true);
      return response.data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create export');
      console.error('Error creating export:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createExport,
    loading,
    error,
    success,
  };
};

/**
 * Hook for export actions (approve, reject, etc.)
 */
export const useExportActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const approveQuality = useCallback(async (exportId, data) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/api/exports/${exportId}/approve-quality`, data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve quality');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectQuality = useCallback(async (exportId, reason) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/api/exports/${exportId}/reject-quality`, { reason });
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject quality');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveFX = useCallback(async (exportId, data) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/api/exports/${exportId}/approve-fx`, data);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve FX');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    approveQuality,
    rejectQuality,
    approveFX,
    loading,
    error,
  };
};

/**
 * Hook for filtered exports
 */
export const useFilteredExports = (filters) => {
  const { exports, loading, error, fetchExports } = useExports();
  const [filteredExports, setFilteredExports] = useState([]);

  useEffect(() => {
    let filtered = [...exports];

    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter((exp) => exp.status === filters.status);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (exp) =>
          exp.exportId.toLowerCase().includes(term) ||
          exp.exporterName.toLowerCase().includes(term) ||
          exp.destinationCountry.toLowerCase().includes(term)
      );
    }

    setFilteredExports(filtered);
  }, [exports, filters]);

  return {
    exports: filteredExports,
    loading,
    error,
    refetch: fetchExports,
  };
};
