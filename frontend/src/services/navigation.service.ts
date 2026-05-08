import apiClient from './api';

export interface NavigationItem {
  name: string;
  path: string;
  icon: string;
  badge?: number;
  filter?: string;
  disabled?: boolean;
  children?: NavigationItem[];
}

export interface NetworkMember {
  code: string;
  name: string;
  id: string;
  type?: string;
  description?: string;
  isActive?: boolean;
}

/**
 * Fetch user's assigned network agencies from database
 */
export const fetchUserAgencies = async (): Promise<NetworkMember[]> => {
  try {
    const response = await apiClient.get('/api/network/agencies/my/list');
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch user agencies:', error);
    return [];
  }
};

/**
 * Fetch all network members from database
 */
export const fetchAllNetworkMembers = async (): Promise<NetworkMember[]> => {
  try {
    const response = await apiClient.get('/api/network/agencies/all');
    return response.data.data || [];
  } catch (error) {
    console.error('Failed to fetch network members:', error);
    return [];
  }
};

export default {
  fetchUserAgencies,
  fetchAllNetworkMembers,
};
