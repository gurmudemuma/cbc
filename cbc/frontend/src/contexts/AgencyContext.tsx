/**
 * Agency Context Provider
 * Manages agency selection and context for agency users
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import eswService from '../services/esw.service';

export interface Agency {
    id: string;
    agencyCode: string;
    agencyName: string;
    organizationId: string;
    role: string;
    permissions: string[];
    isActive: boolean;
    assignedAt: string;
}

interface AgencyContextType {
    agencies: Agency[];
    currentAgency: Agency | null;
    isLoading: boolean;
    error: string | null;
    selectAgency: (agency: Agency) => void;
    refreshAgencies: () => Promise<void>;
    hasPermission: (permission: string) => boolean;
    hasRole: (role: string) => boolean;
}

const AgencyContext = createContext<AgencyContextType | undefined>(undefined);

export const useAgency = () => {
    const context = useContext(AgencyContext);
    if (!context) {
        throw new Error('useAgency must be used within AgencyProvider');
    }
    return context;
};

interface AgencyProviderProps {
    children: React.ReactNode;
}

export const AgencyProvider: React.FC<AgencyProviderProps> = ({ children }) => {
    const [agencies, setAgencies] = useState<Agency[]>([]);
    const [currentAgency, setCurrentAgency] = useState<Agency | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Load agencies on mount
    useEffect(() => {
        loadAgencies();
    }, []);

    // Load current agency from localStorage
    useEffect(() => {
        if (agencies.length > 0) {
            const savedAgencyCode = localStorage.getItem('selectedAgencyCode');
            if (savedAgencyCode) {
                const agency = agencies.find(a => a.agencyCode === savedAgencyCode);
                if (agency) {
                    setCurrentAgency(agency);
                    return;
                }
            }
            // Default to first agency if no saved selection
            setCurrentAgency(agencies[0]);
        }
    }, [agencies]);

    const loadAgencies = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await eswService.getMyAgencies();
            setAgencies(response.data || []);
        } catch (err: any) {
            console.error('Failed to load agencies:', err);
            setError(err.message || 'Failed to load agencies');
            setAgencies([]);
        } finally {
            setIsLoading(false);
        }
    };

    const selectAgency = (agency: Agency) => {
        setCurrentAgency(agency);
        localStorage.setItem('selectedAgencyCode', agency.agencyCode);
    };

    const refreshAgencies = async () => {
        await loadAgencies();
    };

    const hasPermission = (permission: string): boolean => {
        if (!currentAgency) return false;
        return currentAgency.permissions.includes(permission);
    };

    const hasRole = (role: string): boolean => {
        if (!currentAgency) return false;
        return currentAgency.role === role;
    };

    const value: AgencyContextType = {
        agencies,
        currentAgency,
        isLoading,
        error,
        selectAgency,
        refreshAgencies,
        hasPermission,
        hasRole,
    };

    return (
        <AgencyContext.Provider value={value}>
            {children}
        </AgencyContext.Provider>
    );
};

export default AgencyContext;
