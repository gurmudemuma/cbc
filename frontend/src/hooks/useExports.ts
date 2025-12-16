/**
 * Custom React Hook for Export Management
 * Best Practice: Reusable logic with proper state management
 */

import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';

// Export object shape
interface Export {
  exportId: string;
  exporterName: string;
  coffeeType: string;
  quantity: number;
  destinationCountry: string;
  estimatedValue: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

interface UseExportsReturn {
  exports: Export[];
  loading: boolean;
  error: string | null;
  fetchExports: () => Promise<void>;
  refreshExports: () => Promise<void>;
  getExportById: (id: string) => Export | undefined;
}

interface UseExportReturn {
  exportData: Export | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface UseCreateExportReturn {
  createExport: (data: any) => Promise<any>;
  loading: boolean;
  error: string | null;
  success: boolean;
}

interface UseExportActionsReturn {
  approveQuality: (exportId: string, data: any) => Promise<boolean>;
  rejectQuality: (exportId: string, reason: string) => Promise<boolean>;
  approveFX: (exportId: string, data: any) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

interface UseFilteredExportsReturn {
  exports: Export[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

interface FilterOptions {
  status?: string;
  searchTerm?: string;
  [key: string]: any;
}

/**
 * Hook for managing exports list
 */
export const useExports = (autoFetch = true): UseExportsReturn => {
  const [exports, setExports] = useState<Export[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExports = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/api/exports');
      setExports(response.data.data || []);
    } catch (err: any) {
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
    (id: string) => {
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
export const useExport = (exportId: string): UseExportReturn => {
  const [exportData, setExportData] = useState<Export | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchExport = useCallback(async () => {
    if (!exportId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get(`/api/exports/${exportId}`);
      setExportData(response.data.data);
    } catch (err: any) {
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
export const useCreateExport = (): UseCreateExportReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const createExport = useCallback(async (data: any) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await apiClient.post('/api/exports', data);
      setSuccess(true);
      return response.data.data;
    } catch (err: any) {
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
export const useExportActions = (): UseExportActionsReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const approveQuality = useCallback(async (exportId: string, data: any) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/api/exports/${exportId}/approve-quality`, data);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to approve quality');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const rejectQuality = useCallback(async (exportId: string, reason: string) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/api/exports/${exportId}/reject-quality`, { reason });
      return true;
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject quality');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const approveFX = useCallback(async (exportId: string, data: any) => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.post(`/api/exports/${exportId}/approve-fx`, data);
      return true;
    } catch (err: any) {
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
export const useFilteredExports = (filters: FilterOptions): UseFilteredExportsReturn => {
  const { exports, loading, error, fetchExports } = useExports();
  const [filteredExports, setFilteredExports] = useState<Export[]>([]);

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
