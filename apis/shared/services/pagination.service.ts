/**
 * Pagination Service
 * Handles pagination, filtering, and sorting for API responses
 */

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  timestamp: string;
}

export interface FilterOptions {
  [key: string]: any;
}

/**
 * Pagination Service
 */
export class PaginationService {
  /**
   * Paginate array
   */
  static paginate<T>(items: T[], page: number, limit: number): { data: T[]; total: number } {
    const total = items.length;
    const offset = (page - 1) * limit;
    const data = items.slice(offset, offset + limit);

    return { data, total };
  }

  /**
   * Sort array
   */
  static sort<T extends Record<string, any>>(
    items: T[],
    sortField: string,
    order: 'asc' | 'desc' = 'asc'
  ): T[] {
    return items.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];

      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;

      let comparison = 0;
      if (aVal > bVal) {
        comparison = 1;
      } else if (aVal < bVal) {
        comparison = -1;
      }

      return order === 'desc' ? comparison * -1 : comparison;
    });
  }

  /**
   * Filter array
   */
  static filter<T extends Record<string, any>>(items: T[], filters: FilterOptions): T[] {
    return items.filter((item) => {
      return Object.keys(filters).every((key) => {
        const filterValue = filters[key];
        const itemValue = item[key];

        if (filterValue === undefined || filterValue === null) {
          return true;
        }

        if (typeof filterValue === 'string') {
          return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
        }

        if (Array.isArray(filterValue)) {
          return filterValue.includes(itemValue);
        }

        return itemValue === filterValue;
      });
    });
  }

  /**
   * Apply pagination, filtering, and sorting
   */
  static apply<T extends Record<string, any>>(
    items: T[],
    filters: FilterOptions,
    pagination: PaginationParams
  ): { data: T[]; total: number } {
    // Filter
    let filtered = this.filter(items, filters);

    // Sort
    if (pagination.sort) {
      filtered = this.sort(filtered, pagination.sort, pagination.order);
    }

    // Paginate
    return this.paginate(filtered, pagination.page, pagination.limit);
  }

  /**
   * Build paginated response
   */
  static buildResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success'
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return {
      success: true,
      message,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Validate pagination params
   */
  static validateParams(page: number, limit: number): { valid: boolean; error?: string } {
    if (page < 1) {
      return { valid: false, error: 'Page must be >= 1' };
    }

    if (limit < 1 || limit > 100) {
      return { valid: false, error: 'Limit must be between 1 and 100' };
    }

    return { valid: true };
  }

  /**
   * Get offset from page and limit
   */
  static getOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Get page from offset and limit
   */
  static getPage(offset: number, limit: number): number {
    return Math.floor(offset / limit) + 1;
  }

  /**
   * Calculate total pages
   */
  static getTotalPages(total: number, limit: number): number {
    return Math.ceil(total / limit);
  }
}

/**
 * Factory function
 */
export function createPaginationService(): typeof PaginationService {
  return PaginationService;
}
