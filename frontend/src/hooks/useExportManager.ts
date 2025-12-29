/**
 * Custom React Hook for Export Management
 * Best Practice: Reusable logic with proper state management
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/api';

// Export object shape
import { Export } from '../types';

// Create Export Data shape
export interface CreateExportData {
    coffeeType: string;
    quantity: number;
    destinationCountry: string;
    estimatedValue: number;
    status: string;
}

export interface ExportStats {
    totalExports: number;
    totalValue: number;
    completedExports: number;
    activeShipments: number;
    pendingAction: number;
}

/**
 * Hook for managing exports list
 */
export const useExports = () => {
    const queryClient = useQueryClient();

    // @ts-ignore - Response type wrapper handling
    const { data, isLoading, error, refetch } = useQuery<Export[]>({
        queryKey: ['exports'],
        queryFn: async () => {
            const response = await apiClient.get('/exports');
            return response.data.data || [];
        },
        // Auto-refresh every 5 seconds for real-time updates
        refetchInterval: 5000,
        // Stale time of 2 seconds allows for quick updates but prevents spamming
        staleTime: 2000,
    });

    const getExportById = useCallback(
        (id: string) => {
            if (!data) return undefined;
            return data.find((exp) => exp.exportId === id);
        },
        [data]
    );

    return {
        exports: data || [],
        loading: isLoading,
        error: error ? ((error as any).response?.data?.message || 'Failed to fetch exports') : null,
        fetchExports: refetch,
        refreshExports: refetch,
        getExportById,
    };
};

/**
 * Hook for managing single export
 */
export const useExport = (exportId: string) => {
    const { data, isLoading, error, refetch } = useQuery<Export | null>({
        queryKey: ['export', exportId],
        queryFn: async () => {
            if (!exportId) return null;
            const response = await apiClient.get(`/exports/${exportId}`);
            return response.data.data;
        },
        enabled: !!exportId,
        refetchInterval: 5000,
    });

    return {
        exportData: data,
        loading: isLoading,
        error: error ? ((error as any).response?.data?.message || 'Failed to fetch export') : null,
        refetch: refetch,
    };
};

/**
 * Hook for creating exports
 */
export const useCreateExport = () => {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: async (data: CreateExportData) => {
            const response = await apiClient.post('/exports', data);
            return response.data.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exports'] });
        },
    });

    return {
        createExport: mutation.mutateAsync,
        loading: mutation.isPending,
        error: mutation.error ? ((mutation.error as any).response?.data?.message || 'Failed to create export') : null,
        success: mutation.isSuccess,
    };
};

/**
 * Hook for export actions (approve, reject, etc.)
 */
export const useExportActions = () => {
    const queryClient = useQueryClient();

    const approveQuality = useMutation({
        mutationFn: async ({ exportId, data }: { exportId: string, data: any }) => {
            await apiClient.post(`/exports/${exportId}/approve-quality`, data);
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exports'] });
        },
    });

    const rejectQuality = useMutation({
        mutationFn: async ({ exportId, reason }: { exportId: string, reason: string }) => {
            await apiClient.post(`/exports/${exportId}/reject-quality`, { reason });
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exports'] });
        },
    });

    const approveFX = useMutation({
        mutationFn: async ({ exportId, data }: { exportId: string, data: any }) => {
            await apiClient.post(`/exports/${exportId}/approve-fx`, data);
            return true;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['exports'] });
        },
    });

    // Wrapper to maintain API compatibility
    return {
        approveQuality: (exportId: string, data: any) => approveQuality.mutateAsync({ exportId, data }),
        rejectQuality: (exportId: string, reason: string) => rejectQuality.mutateAsync({ exportId, reason }),
        approveFX: (exportId: string, data: any) => approveFX.mutateAsync({ exportId, data }),
        loading: approveQuality.isPending || rejectQuality.isPending || approveFX.isPending,
        error: ((approveQuality.error || rejectQuality.error || approveFX.error) as any)?.response?.data?.message || null,
    };
};

/**
 * Hook for filtered exports
 */
export const useFilteredExports = (filters: any) => {
    const { exports, loading, error, refreshExports } = useExports();

    // Client-side filtering
    const filteredExports = exports.filter((exp) => {
        if (filters.status && filters.status !== 'all' && exp.status !== filters.status) {
            return false;
        }
        if (filters.searchTerm) {
            const term = filters.searchTerm.toLowerCase();
            const matches =
                (exp.exportId && exp.exportId.toLowerCase().includes(term)) ||
                (exp.exporterName && exp.exporterName.toLowerCase().includes(term)) ||
                (exp.destinationCountry && exp.destinationCountry.toLowerCase().includes(term));
            if (!matches) return false;
        }
        return true;
    });


    return {
        exports: filteredExports,
        loading,
        error,
        refetch: refreshExports,
    };
};

/**
 * Hook for dashboard statistics
 */
export const useExportStats = () => {
    const { data, isLoading, error, refetch } = useQuery<ExportStats>({
        queryKey: ['exportStats'],
        queryFn: async () => {
            try {
                const response = await apiClient.get('/exports/stats');
                return response.data.data;
            } catch (error: any) {
                // Return fallback for Commercial Bank API path if 404
                if (error.response && error.response.status === 404) {
                    const fallbackResponse = await apiClient.get('/exports/dashboard/stats');
                    return fallbackResponse.data.data;
                }
                throw error;
            }
        },
        // Refresh stats every 30 seconds
        refetchInterval: 30000,
        staleTime: 10000,
    });

    return {
        stats: data || {
            totalExports: 0,
            totalValue: 0,
            completedExports: 0,
            activeShipments: 0,
            pendingAction: 0
        },
        loading: isLoading,
        error: error ? ((error as any).response?.data?.message || 'Failed to fetch stats') : null,
        refetch,
    };
};
