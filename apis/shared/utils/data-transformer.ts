/**
 * Unified Data Transformation Utilities
 * Ensures consistent data transformation across all layers
 */

import { EXPORT_STATUS, ExportStatus } from '../constants/status.constants';

/**
 * Transform blockchain export data to API response format
 */
export function transformBlockchainExportToAPI(blockchainData: any): any {
  if (!blockchainData) return null;

  return {
    exportId: blockchainData.exportId || blockchainData.ExportID,
    exporterName: blockchainData.exporterName || blockchainData.ExporterName,
    coffeeType: blockchainData.coffeeType || blockchainData.CoffeeType,
    quantity: parseFloat(blockchainData.quantity || blockchainData.Quantity || 0),
    destinationCountry: blockchainData.destinationCountry || blockchainData.DestinationCountry,
    estimatedValue: parseFloat(blockchainData.estimatedValue || blockchainData.EstimatedValue || 0),
    status: normalizeStatus(blockchainData.status || blockchainData.Status),
    createdAt: blockchainData.createdAt || blockchainData.CreatedAt,
    updatedAt: blockchainData.updatedAt || blockchainData.UpdatedAt,
    // Additional fields
    ecxLotNumber: blockchainData.ecxLotNumber || blockchainData.ECXLotNumber,
    exportLicenseNumber: blockchainData.exportLicenseNumber || blockchainData.ExportLicenseNumber,
    qualityGrade: blockchainData.qualityGrade || blockchainData.QualityGrade,
    // Metadata
    metadata: blockchainData.metadata || {},
  };
}

/**
 * Transform database export data to API response format
 */
export function transformDatabaseExportToAPI(dbData: any): any {
  if (!dbData) return null;

  return {
    exportId: dbData.export_id,
    exporterName: dbData.exporter_name,
    coffeeType: dbData.coffee_type,
    quantity: parseFloat(dbData.quantity || 0),
    destinationCountry: dbData.destination_country,
    estimatedValue: parseFloat(dbData.estimated_value || 0),
    status: normalizeStatus(dbData.status),
    createdAt: dbData.created_at,
    updatedAt: dbData.updated_at,
    // Additional fields
    ecxLotNumber: dbData.ecx_lot_number,
    exportLicenseNumber: dbData.export_license_number,
    qualityGrade: dbData.quality_grade,
    // Metadata
    metadata: dbData.metadata || {},
  };
}

/**
 * Transform API request data to blockchain format
 */
export function transformAPIExportToBlockchain(apiData: any): any {
  return {
    exportId: apiData.exportId,
    exporterName: apiData.exporterName,
    coffeeType: apiData.coffeeType,
    quantity: apiData.quantity.toString(),
    destinationCountry: apiData.destinationCountry,
    estimatedValue: apiData.estimatedValue.toString(),
    // Pre-existing documents
    exportLicenseNumber: apiData.exportLicenseNumber,
    competenceCertificateNumber: apiData.competenceCertificateNumber,
    ecxLotNumber: apiData.ecxLotNumber,
    warehouseReceiptNumber: apiData.warehouseReceiptNumber,
    qualityCertificateNumber: apiData.qualityCertificateNumber,
    salesContractNumber: apiData.salesContractNumber,
    exportPermitNumber: apiData.exportPermitNumber,
    originCertificateNumber: apiData.originCertificateNumber,
    qualityGrade: apiData.qualityGrade,
    metadata: apiData.metadata || {},
  };
}

/**
 * Transform API request data to database format
 */
export function transformAPIExportToDatabase(apiData: any): any {
  return {
    export_id: apiData.exportId,
    exporter_name: apiData.exporterName,
    coffee_type: apiData.coffeeType,
    quantity: apiData.quantity,
    destination_country: apiData.destinationCountry,
    estimated_value: apiData.estimatedValue,
    status: apiData.status || EXPORT_STATUS.DRAFT,
    ecx_lot_number: apiData.ecxLotNumber,
    export_license_number: apiData.exportLicenseNumber,
    quality_grade: apiData.qualityGrade,
    metadata: apiData.metadata || {},
    created_at: new Date(),
    updated_at: new Date(),
  };
}

/**
 * Normalize status across different formats
 */
export function normalizeStatus(status: any): ExportStatus {
  if (!status) return EXPORT_STATUS.DRAFT;

  // Convert to string and uppercase
  const statusStr = String(status).toUpperCase().trim();

  // Check if it's a valid status
  const validStatuses = Object.values(EXPORT_STATUS);
  if (validStatuses.includes(statusStr as ExportStatus)) {
    return statusStr as ExportStatus;
  }

  // Handle common variations
  const statusMap: Record<string, ExportStatus> = {
    PENDING: EXPORT_STATUS.ECX_PENDING,
    VERIFIED: EXPORT_STATUS.ECX_VERIFIED,
    REJECTED: EXPORT_STATUS.ECX_REJECTED,
    APPROVED: EXPORT_STATUS.ECTA_LICENSE_APPROVED,
    QUALITY_PENDING: EXPORT_STATUS.ECTA_QUALITY_PENDING,
    QUALITY_APPROVED: EXPORT_STATUS.ECTA_QUALITY_APPROVED,
    QUALITY_REJECTED: EXPORT_STATUS.ECTA_QUALITY_REJECTED,
    CUSTOMS_PENDING: EXPORT_STATUS.CUSTOMS_PENDING,
    CUSTOMS_CLEARED: EXPORT_STATUS.CUSTOMS_CLEARED,
    CUSTOMS_REJECTED: EXPORT_STATUS.CUSTOMS_REJECTED,
  };

  return statusMap[statusStr] || EXPORT_STATUS.DRAFT;
}

/**
 * Transform blockchain transaction response
 */
export function transformBlockchainResponse(response: any): any {
  if (!response) return null;

  // Handle Buffer response from blockchain
  if (Buffer.isBuffer(response)) {
    try {
      return JSON.parse(response.toString());
    } catch (error) {
      return response.toString();
    }
  }

  // Handle string response
  if (typeof response === 'string') {
    try {
      return JSON.parse(response);
    } catch (error) {
      return response;
    }
  }

  // Handle object response
  return response;
}

/**
 * Transform database row to object
 */
export function transformDatabaseRow(row: any): any {
  if (!row) return null;

  const transformed: any = {};

  // Convert snake_case to camelCase
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    transformed[camelKey] = value;
  }

  return transformed;
}

/**
 * Transform object to database format (camelCase to snake_case)
 */
export function transformToDatabaseFormat(obj: any): any {
  if (!obj) return null;

  const transformed: any = {};

  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
    transformed[snakeKey] = value;
  }

  return transformed;
}

/**
 * Sanitize export data for API response
 */
export function sanitizeExportData(data: any): any {
  if (!data) return null;

  return {
    exportId: data.exportId,
    exporterName: data.exporterName,
    coffeeType: data.coffeeType,
    quantity: data.quantity,
    destinationCountry: data.destinationCountry,
    estimatedValue: data.estimatedValue,
    status: data.status,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    // Only include non-sensitive fields
    ecxLotNumber: data.ecxLotNumber,
    exportLicenseNumber: data.exportLicenseNumber,
    qualityGrade: data.qualityGrade,
  };
}

/**
 * Batch transform multiple exports
 */
export function transformExports(exports: any[], transformer: (exp: any) => any): any[] {
  return exports.map((exp) => transformer(exp)).filter((exp) => exp !== null);
}

/**
 * Merge export data from multiple sources
 */
export function mergeExportData(blockchainData: any, databaseData: any): any {
  const merged = transformBlockchainExportToAPI(blockchainData);

  if (databaseData) {
    const dbTransformed = transformDatabaseExportToAPI(databaseData);
    // Merge, preferring blockchain data for status
    return {
      ...dbTransformed,
      ...merged,
      status: merged.status, // Blockchain is source of truth for status
    };
  }

  return merged;
}

/**
 * Extract export ID from various formats
 */
export function extractExportId(input: any): string | null {
  if (typeof input === 'string') {
    return input.startsWith('EXP-') ? input : null;
  }

  if (typeof input === 'object') {
    return input.exportId || input.export_id || input.ExportID || null;
  }

  return null;
}

/**
 * Validate export data structure
 */
export function isValidExportData(data: any): boolean {
  return (
    data &&
    typeof data === 'object' &&
    data.exportId &&
    data.exporterName &&
    data.coffeeType &&
    data.quantity &&
    data.destinationCountry &&
    data.estimatedValue !== undefined
  );
}
