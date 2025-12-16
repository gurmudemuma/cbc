import { ExportRequest } from './exportService';

export interface SearchCriteria {
  status?: string | string[];
  dateFrom?: string;
  dateTo?: string;
  exporterName?: string;
  coffeeType?: string;
  destinationCountry?: string | string[];
  commercialBankId?: string; // Changed from commercialbankId
  minQuantity?: number;
  maxQuantity?: number;
  minEstimatedValue?: number;
  maxEstimatedValue?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  searchTerm?: string;
  createdAfter?: Date;
  createdBefore?: Date;
  minValue?: number;
  maxValue?: number;
}

// ExportFilters interface removed - using SearchCriteria instead

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface SearchResult<T> extends PaginatedResult<T> {
  filters: SearchCriteria;
  executionTime: number;
}

export class SearchService {
  private static instance: SearchService;

  private constructor() {}

  public static getInstance(): SearchService {
    if (!SearchService.instance) {
      SearchService.instance = new SearchService();
    }
    return SearchService.instance;
  }

  /**
   * Search and filter exports
   */
  public searchExports(
    exports: ExportRequest[],
    criteria: SearchCriteria
  ): SearchResult<ExportRequest> {
    const startTime = Date.now();

    let filtered = [...exports];

    // Apply filters
    filtered = this.applyFilters(filtered, criteria);

    // Apply sorting
    filtered = this.applySorting(filtered, criteria);

    // Apply pagination
    const paginated = this.applyPagination(filtered, criteria);

    const executionTime = Date.now() - startTime;

    return {
      ...paginated,
      filters: criteria,
      executionTime,
    };
  }

  /**
   * Apply all filters to exports
   */
  private applyFilters(exports: any[], criteria: SearchCriteria): any[] {
    let filtered = [...exports];

    // Status filter
    if (criteria.status) {
      filtered = filtered.filter((exp) => exp.status === criteria.status);
    }

    // Exporter name filter
    if (criteria.exporterName) {
      filtered = filtered.filter((exp) =>
        exp.exporterName.toLowerCase().includes(criteria.exporterName!.toLowerCase())
      );
    }

    // Coffee type filter
    if (criteria.coffeeType) {
      filtered = filtered.filter((exp) =>
        exp.coffeeType.toLowerCase().includes(criteria.coffeeType!.toLowerCase())
      );
    }

    // Destination country filter
    if (criteria.destinationCountry) {
      const countryFilter = Array.isArray(criteria.destinationCountry)
        ? criteria.destinationCountry
        : [criteria.destinationCountry];
      filtered = filtered.filter((exp) =>
        countryFilter.some((country) =>
          exp.destinationCountry.toLowerCase().includes(country.toLowerCase())
        )
      );
    }

    // Commercial bank ID filter (Changed from commercialbankId)
    if (criteria.commercialBankId) {
      filtered = filtered.filter((exp) => exp.commercialBankId === criteria.commercialBankId);
    }

    // Quantity range filter
    if (criteria.minQuantity !== undefined || criteria.maxQuantity !== undefined) {
      filtered = filtered.filter((exp) => {
        const quantity = exp.quantity;
        return (
          (criteria.minQuantity === undefined || quantity >= criteria.minQuantity) &&
          (criteria.maxQuantity === undefined || quantity <= criteria.maxQuantity)
        );
      });
    }

    // Estimated value range filter
    if (criteria.minEstimatedValue !== undefined || criteria.maxEstimatedValue !== undefined) {
      filtered = filtered.filter((exp) => {
        const value = exp.estimatedValue;
        return (
          (criteria.minEstimatedValue === undefined || value >= criteria.minEstimatedValue) &&
          (criteria.maxEstimatedValue === undefined || value <= criteria.maxEstimatedValue)
        );
      });
    }

    // Date range filter
    if (criteria.dateFrom || criteria.dateTo) {
      filtered = filtered.filter((exp) => {
        const exportDate = new Date(exp.createdAt);
        return (
          (!criteria.dateFrom || exportDate >= new Date(criteria.dateFrom)) &&
          (!criteria.dateTo || exportDate <= new Date(criteria.dateTo))
        );
      });
    }

    return filtered;
  }

  /**
   * Apply sorting
   */
  private applySorting(exports: ExportRequest[], criteria: SearchCriteria): ExportRequest[] {
    if (!criteria.sortBy) {
      // Default sort by createdAt descending
      return exports.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }

    const sortOrder = criteria.sortOrder || 'asc';
    const multiplier = sortOrder === 'asc' ? 1 : -1;

    return exports.sort((a, b) => {
      const aValue = (a as any)[criteria.sortBy!];
      const bValue = (b as any)[criteria.sortBy!];

      if (aValue === undefined || bValue === undefined) return 0;

      // Handle different types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return multiplier * aValue.localeCompare(bValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return multiplier * (aValue - bValue);
      }

      // Date comparison
      if (criteria.sortBy === 'createdAt' || criteria.sortBy === 'updatedAt') {
        return (
          multiplier * (new Date(aValue as string).getTime() - new Date(bValue as string).getTime())
        );
      }

      return 0;
    });
  }

  /**
   * Apply pagination
   */
  private applyPagination(
    exports: ExportRequest[],
    criteria: SearchCriteria
  ): PaginatedResult<ExportRequest> {
    const page = criteria.page || 1;
    const limit = criteria.limit || 20;
    const total = exports.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const data = exports.slice(startIndex, endIndex);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get facets (aggregations) for search results
   */
  public getFacets(exports: ExportRequest[]): {
    statuses: Record<string, number>;
    countries: Record<string, number>;
    qualityGrades: Record<string, number>;
    valueRanges: Record<string, number>;
  } {
    const statuses: Record<string, number> = {};
    const countries: Record<string, number> = {};
    const qualityGrades: Record<string, number> = {};
    const valueRanges: Record<string, number> = {
      '0-10000': 0,
      '10000-50000': 0,
      '50000-100000': 0,
      '100000+': 0,
    };

    exports.forEach((exp) => {
      // Status facets
      statuses[exp.status] = (statuses[exp.status] || 0) + 1;

      // Country facets
      countries[exp.destinationCountry] = (countries[exp.destinationCountry] || 0) + 1;

      // Quality grade facets
      if (exp.qualityGrade) {
        qualityGrades[exp.qualityGrade] = (qualityGrades[exp.qualityGrade] || 0) + +1;
      }

      // Value range facets
      if (exp.estimatedValue < 10000) {
        valueRanges['0-10000']++;
      } else if (exp.estimatedValue < 50000) {
        valueRanges['10000-50000']++;
      } else if (exp.estimatedValue < 100000) {
        valueRanges['50000-100000']++;
      } else {
        valueRanges['100000+']++;
      }
    });

    return { statuses, countries, qualityGrades, valueRanges };
  }

  /**
   * Get suggested filters based on current results
   */
  public getSuggestedFilters(exports: ExportRequest[]): {
    popularCountries: string[];
    commonStatuses: string[];
    valueRanges: Array<{ min: number; max: number; count: number }>;
  } {
    const facets = this.getFacets(exports);

    // Get top 5 countries by count
    const popularCountries = Object.entries(facets.countries)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([country]) => country);

    // Get top 5 statuses by count
    const commonStatuses = Object.entries(facets.statuses)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([status]) => status);

    // Value ranges with counts
    const valueRanges = [
      { min: 0, max: 10000, count: facets.valueRanges['0-10000'] || 0 },
      { min: 10000, max: 50000, count: facets.valueRanges['10000-50000'] || 0 },
      { min: 50000, max: 100000, count: facets.valueRanges['50000-100000'] || 0 },
      { min: 100000, max: Infinity, count: facets.valueRanges['100000+'] || 0 },
    ];

    return { popularCountries, commonStatuses, valueRanges };
  }

  /**
   * Build search query from URL parameters
   */
  public buildCriteriaFromParams(params: Record<string, any>): SearchCriteria {
    const criteria: SearchCriteria = {};

    if (params.search) criteria.searchTerm = params.search;
    if (params.status) {
      criteria.status = params.status.includes(',') ? params.status.split(',') : params.status;
    }
    if (params.createdAfter) criteria.createdAfter = new Date(params.createdAfter);
    if (params.createdBefore) criteria.createdBefore = new Date(params.createdBefore);
    if (params.minValue) criteria.minValue = parseFloat(params.minValue);
    if (params.maxValue) criteria.maxValue = parseFloat(params.maxValue);
    if (params.minQuantity) criteria.minQuantity = parseFloat(params.minQuantity);
    if (params.maxQuantity) criteria.maxQuantity = parseFloat(params.maxQuantity);
    if (params.country) {
      criteria.destinationCountry = params.country.includes(',')
        ? params.country.split(',')
        : params.country;
    }
    if (params.exporter) criteria.exporterName = params.exporter;
    if (params.page) criteria.page = parseInt(params.page);
    if (params.limit) criteria.limit = parseInt(params.limit);
    if (params.sortBy) criteria.sortBy = params.sortBy;
    if (params.sortOrder) criteria.sortOrder = params.sortOrder;

    return criteria;
  }

  /**
   * Export search results to CSV
   */
  public exportToCSV(exports: ExportRequest[]): string {
    const headers = [
      'Export ID',
      'Exporter Name',
      'Coffee Type',
      'Quantity (kg)',
      'Destination',
      'Estimated Value (USD)',
      'Status',
      'Created At',
      'Updated At',
    ];

    const rows = exports.map((exp) => [
      exp.exportId,
      exp.exporterName,
      exp.coffeeType,
      exp.quantity.toString(),
      exp.destinationCountry,
      exp.estimatedValue.toString(),
      exp.status,
      exp.createdAt,
      exp.updatedAt,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}

// Export singleton instance
export const searchService = SearchService.getInstance();
