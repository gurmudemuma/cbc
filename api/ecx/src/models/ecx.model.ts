/**
 * ECX (Ethiopian Commodity Exchange) Models
 * Represents coffee lots, warehouse receipts, and ownership verification
 */

export interface ECXLot {
  lotNumber: string;
  warehouseReceiptNumber: string;
  coffeeType: string;
  quantity: number; // in kg
  grade: string; // Preliminary grade from ECX
  warehouseLocation: string;
  ownerName: string;
  ownerTIN: string; // Tax Identification Number
  purchaseDate: string;
  expiryDate: string;
  status: ECXLotStatus;
  verifiedAt?: string;
  verifiedBy?: string;
}

export enum ECXLotStatus {
  AVAILABLE = 'AVAILABLE',
  RESERVED = 'RESERVED',
  VERIFIED = 'VERIFIED',
  EXPORTED = 'EXPORTED',
  EXPIRED = 'EXPIRED'
}

export interface WarehouseReceipt {
  receiptNumber: string;
  lotNumber: string;
  issueDate: string;
  expiryDate: string;
  warehouseLocation: string;
  quantity: number;
  coffeeType: string;
  grade: string;
  ownerName: string;
  ownerTIN: string;
  isValid: boolean;
}

export interface ECXVerificationRequest {
  exportId: string;
  lotNumber: string;
  warehouseReceiptNumber: string;
  exporterName: string;
  exporterTIN: string;
  requestedQuantity: number;
}

export interface ECXVerificationResponse {
  success: boolean;
  exportId: string;
  lotNumber: string;
  verified: boolean;
  message: string;
  lot?: ECXLot;
  blockchainTxId?: string;
}

export interface CreateExportRequestPayload {
  exportId: string;
  commercialBankId: string; // Changed from commercialbankId
  exporterName: string;
  exporterTIN: string;
  exportLicenseNumber: string;
  coffeeType: string;
  quantity: number;
  destinationCountry: string;
  estimatedValue: number;
  ecxLotNumber: string;
  warehouseLocation: string;
  warehouseReceiptNumber: string;
}

export interface ECXExportRecord {
  exportId: string;
  lotNumber: string;
  exporterName: string;
  quantity: number;
  status: string;
  createdAt: string;
  verifiedAt: string;
  blockchainTxId: string;
}
