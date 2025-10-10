export interface ExportRequest {
  exportId: string;
  exporterBankId: string;
  exporterName: string;
  coffeeType: string;
  quantity: number;
  destinationCountry: string;
  estimatedValue: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  fxApprovalId?: string;
  fxApprovedBy?: string;
  fxApprovedAt?: string;
  fxRejectionReason?: string;
  qualityCertId?: string;
  qualityGrade?: string;
  qualityCertifiedBy?: string;
  qualityCertifiedAt?: string;
  qualityRejectionReason?: string;
  shipmentId?: string;
  vesselName?: string;
  departureDate?: string;
  arrivalDate?: string;
  shippingLineId?: string;
  shippedAt?: string;
}

export interface HistoryEntry {
  txId: string;
  timestamp: string;
  isDelete: boolean;
  record: ExportRequest;
}