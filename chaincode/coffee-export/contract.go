package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// CoffeeExportContractV2 provides functions for managing coffee exports with corrected workflow
type CoffeeExportContractV2 struct {
	contractapi.Contract
}

// ExportStatus represents the current status of an export - CORRECTED ETHIOPIAN WORKFLOW
// Workflow: Portal → ECX → ECTA → Commercial Bank → NBE → Customs → Shipping → Payment
type ExportStatus string

const (
	// Initial State (Portal submits)
	StatusDraft ExportStatus = "DRAFT"

	// ECX Phase (FIRST - Ethiopian Commodity Exchange verifies source)
	StatusECXPending  ExportStatus = "ECX_PENDING"
	StatusECXVerified ExportStatus = "ECX_VERIFIED"
	StatusECXRejected ExportStatus = "ECX_REJECTED"

	// ECTA Phase (SECOND - Ethiopian Coffee & Tea Authority - PRIMARY REGULATOR)
	// License Validation
	StatusECTALicensePending  ExportStatus = "ECTA_LICENSE_PENDING"
	StatusECTALicenseApproved ExportStatus = "ECTA_LICENSE_APPROVED"
	StatusECTALicenseRejected ExportStatus = "ECTA_LICENSE_REJECTED"
	// Quality Certification
	StatusECTAQualityPending  ExportStatus = "ECTA_QUALITY_PENDING"
	StatusECTAQualityApproved ExportStatus = "ECTA_QUALITY_APPROVED"
	StatusECTAQualityRejected ExportStatus = "ECTA_QUALITY_REJECTED"
	// Contract Approval
	StatusECTAContractPending  ExportStatus = "ECTA_CONTRACT_PENDING"
	StatusECTAContractApproved ExportStatus = "ECTA_CONTRACT_APPROVED"
	StatusECTAContractRejected ExportStatus = "ECTA_CONTRACT_REJECTED"

	// Commercial Bank Phase (THIRD - Document verification & FX intermediary)
	StatusBankDocumentPending  ExportStatus = "BANK_DOCUMENT_PENDING"
	StatusBankDocumentVerified ExportStatus = "BANK_DOCUMENT_VERIFIED"
	StatusBankDocumentRejected ExportStatus = "BANK_DOCUMENT_REJECTED"

	// NBE Phase (FOURTH - National Bank of Ethiopia FX approval ONLY)
	StatusFXApplicationPending ExportStatus = "FX_APPLICATION_PENDING"
	StatusFXApproved           ExportStatus = "FX_APPROVED"
	StatusFXRejected           ExportStatus = "FX_REJECTED"

	// Customs Phase (FIFTH - Export clearance)
	StatusCustomsPending  ExportStatus = "CUSTOMS_PENDING"
	StatusCustomsCleared  ExportStatus = "CUSTOMS_CLEARED"
	StatusCustomsRejected ExportStatus = "CUSTOMS_REJECTED"

	// Shipment Phase (SIXTH)
	StatusReadyForShipment  ExportStatus = "READY_FOR_SHIPMENT"
	StatusShipmentScheduled ExportStatus = "SHIPMENT_SCHEDULED"
	StatusShipped           ExportStatus = "SHIPPED"

	// Destination Phase (SEVENTH - import clearance)
	StatusArrived                ExportStatus = "ARRIVED"
	StatusImportCustomsPending   ExportStatus = "IMPORT_CUSTOMS_PENDING"
	StatusImportCustomsCleared   ExportStatus = "IMPORT_CUSTOMS_CLEARED"
	StatusImportCustomsRejected  ExportStatus = "IMPORT_CUSTOMS_REJECTED"
	StatusDelivered              ExportStatus = "DELIVERED"

	// Payment Phase (EIGHTH)
	StatusPaymentPending         ExportStatus = "PAYMENT_PENDING"
	StatusPaymentReceived        ExportStatus = "PAYMENT_RECEIVED"
	StatusFXRepatriationPending  ExportStatus = "FX_REPATRIATION_PENDING"
	StatusFXRepatriated          ExportStatus = "FX_REPATRIATED"

	// Terminal States
	StatusCompleted ExportStatus = "COMPLETED"
	StatusCancelled ExportStatus = "CANCELLED"
)

type TransportMode string

const (
	ModeSea  TransportMode = "SEA"
	ModeAir  TransportMode = "AIR"
	ModeRail TransportMode = "RAIL"
)

type Document struct {
	CID       string `json:"cid"`
	Version   int    `json:"version"`
	Timestamp string `json:"timestamp"`
	IsActive  bool   `json:"isActive"`
}

// ExportRequest represents a coffee export request with complete workflow fields
type ExportRequest struct {
	ExportID           string       `json:"exportId"`
	CommercialBankID   string       `json:"commercialBankId"`
	ExporterName       string       `json:"exporterName"`
	CoffeeType         string       `json:"coffeeType"`
	Quantity           float64      `json:"quantity"` // in kg
	DestinationCountry string       `json:"destinationCountry"`
	EstimatedValue     float64      `json:"estimatedValue"` // in USD
	Status             ExportStatus `json:"status"`
	CreatedAt          string       `json:"createdAt"`
	UpdatedAt          string       `json:"updatedAt"`

	// ECX fields (Ethiopian Commodity Exchange - FIRST STEP)
	ECXLotNumber           string     `json:"ecxLotNumber"`
	WarehouseReceiptNumber string     `json:"warehouseReceiptNumber,omitempty"`
	WarehouseLocation      string     `json:"warehouseLocation,omitempty"`
	ECXVerifiedBy          string     `json:"ecxVerifiedBy,omitempty"`
	ECXVerifiedAt          string     `json:"ecxVerifiedAt,omitempty"`
	ECXRejectionReason     string     `json:"ecxRejectionReason,omitempty"`

	// ECTA fields (Ethiopian Coffee & Tea Authority - PRIMARY REGULATOR)
	// Export License
	ExportLicenseNumber      string `json:"exportLicenseNumber"`
	ExportLicenseValidatedBy string `json:"exportLicenseValidatedBy,omitempty"`
	ExportLicenseValidatedAt string `json:"exportLicenseValidatedAt,omitempty"`
	// Quality Certification
	QualityDocuments       []Document `json:"qualityDocuments,omitempty"`
	QualityCertID          string     `json:"qualityCertId,omitempty"`
	QualityGrade           string     `json:"qualityGrade,omitempty"`
	QualityCertifiedBy     string     `json:"qualityCertifiedBy,omitempty"`
	QualityCertifiedAt     string     `json:"qualityCertifiedAt,omitempty"`
	QualityRejectionReason string     `json:"qualityRejectionReason,omitempty"`
	// Contract Approval
	ContractApprovedBy     string `json:"contractApprovedBy,omitempty"`
	ContractApprovedAt     string `json:"contractApprovedAt,omitempty"`
	ContractRejectionReason string `json:"contractRejectionReason,omitempty"`

	// NEW: Certificate of Origin
	OriginCertificateNumber    string     `json:"originCertificateNumber,omitempty"`
	OriginCertificateDate      string     `json:"originCertificateDate,omitempty"`
	OriginCertificateIssuedBy  string     `json:"originCertificateIssuedBy,omitempty"`
	OriginCertificateDocuments []Document `json:"originCertDocuments,omitempty"`

	// National Bank fields (FX Approval)
	FXDocuments       []Document `json:"fxDocuments,omitempty"`
	FXApprovedBy      string     `json:"fxApprovedBy,omitempty"`
	FXApprovedAt      string     `json:"fxApprovedAt,omitempty"`
	FXRejectionReason string     `json:"fxRejectionReason,omitempty"`

	// NEW: Export Customs fields (Origin - Ethiopia)
	ExportCustomsDeclarationNumber string     `json:"exportCustomsDeclarationNumber,omitempty"`
	ExportCustomsClearedBy         string     `json:"exportCustomsClearedBy,omitempty"`
	ExportCustomsClearedAt         string     `json:"exportCustomsClearedAt,omitempty"`
	ExportCustomsRejectionReason   string     `json:"exportCustomsRejectionReason,omitempty"`
	ExportCustomsDocuments         []Document `json:"exportCustomsDocuments,omitempty"`

	// Shipping Line fields
	ShipmentDocuments   []Document    `json:"shipmentDocuments,omitempty"`
	TransportIdentifier string        `json:"transportIdentifier,omitempty"`
	DepartureDate       string        `json:"departureDate,omitempty"`
	ArrivalDate         string        `json:"arrivalDate,omitempty"`
	ActualArrivalDate   string        `json:"actualArrivalDate,omitempty"`
	ShippingLineID      string        `json:"shippingLineId,omitempty"`
	TransportMode       TransportMode `json:"transportMode,omitempty"`
	ShippedAt           string        `json:"shippedAt,omitempty"`

	// NEW: Import Customs fields (Destination)
	ImportCustomsDeclarationNumber string     `json:"importCustomsDeclarationNumber,omitempty"`
	ImportCustomsClearedBy         string     `json:"importCustomsClearedBy,omitempty"`
	ImportCustomsClearedAt         string     `json:"importCustomsClearedAt,omitempty"`
	ImportCustomsRejectionReason   string     `json:"importCustomsRejectionReason,omitempty"`
	ImportCustomsDocuments         []Document `json:"importCustomsDocuments,omitempty"`

	// NEW: Delivery fields
	DeliveryConfirmedBy string `json:"deliveryConfirmedBy,omitempty"`
	DeliveryDate        string `json:"deliveryDate,omitempty"`

	// NEW: Payment & FX Repatriation fields
	PaymentMethod        string  `json:"paymentMethod,omitempty"` // LC, TT, DP, etc.
	PaymentReceivedDate  string  `json:"paymentReceivedDate,omitempty"`
	PaymentAmount        float64 `json:"paymentAmount,omitempty"`
	FXRepatriatedDate    string  `json:"fxRepatriatedDate,omitempty"`
	FXRepatriatedAmount  float64 `json:"fxRepatriatedAmount,omitempty"`
	FXRepatriatedBy      string  `json:"fxRepatriatedBy,omitempty"`
}

// HistoryQueryResult structure used for returning result of history query
type HistoryQueryResult struct {
	Record    *ExportRequest `json:"record"`
	TxId      string         `json:"txId"`
	Timestamp string         `json:"timestamp"`
	IsDelete  bool           `json:"isDelete"`
}

// InitLedger initializes the ledger
func (c *CoffeeExportContractV2) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// CreateExportRequest creates a new export request (called by ECX after lot verification)
// CORRECTED: ECX creates the initial blockchain record, not NBE
func (c *CoffeeExportContractV2) CreateExportRequest(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	commercialBankID string,
	exporterName string,
	exportLicenseNumber string,
	coffeeType string,
	quantity float64,
	destinationCountry string,
	estimatedValue float64,
	ecxLotNumber string,
	warehouseLocation string,
) error {
	// Enhanced input validation
	if err := ValidateExportID(exportID); err != nil {
		return fmt.Errorf("invalid export ID: %v", err)
	}
	if err := ValidateExportID(commercialBankID); err != nil {
		return fmt.Errorf("invalid commercial bank ID: %v", err)
	}
	if err := ValidateExporterName(exporterName); err != nil {
		return fmt.Errorf("invalid exporter name: %v", err)
	}
	if err := ValidateLicenseNumber(exportLicenseNumber); err != nil {
		return fmt.Errorf("invalid license number: %v", err)
	}
	if err := ValidateCoffeeType(coffeeType); err != nil {
		return fmt.Errorf("invalid coffee type: %v", err)
	}
	if err := ValidateQuantity(quantity); err != nil {
		return fmt.Errorf("invalid quantity: %v", err)
	}
	if err := ValidateDestinationCountry(destinationCountry); err != nil {
		return fmt.Errorf("invalid destination country: %v", err)
	}
	if err := ValidateEstimatedValue(estimatedValue); err != nil {
		return fmt.Errorf("invalid estimated value: %v", err)
	}

	// Check if export already exists
	exists, err := c.ExportExists(ctx, exportID)
	if err != nil {
		return fmt.Errorf("failed to check if export exists: %v", err)
	}
	if exists {
		return fmt.Errorf("export request %s already exists", exportID)
	}

	// Validate caller is Commercial Bank or ECX
	// Commercial Bank creates initial export request, ECX verifies lot
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ECXMSP" && clientMSPID != "CommercialBankMSP" {
		return fmt.Errorf("only Commercial Bank or ECX can create export requests, got MSP ID: %s", clientMSPID)
	}

	now := time.Now().UTC().Format(time.RFC3339)

	// Get caller identity for ECX verification tracking
	callerID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return fmt.Errorf("failed to get caller ID: %v", err)
	}

	exportRequest := ExportRequest{
		ExportID:            exportID,
		CommercialBankID:    commercialBankID,
		ExporterName:        exporterName,
		ExportLicenseNumber: exportLicenseNumber,
		CoffeeType:          coffeeType,
		Quantity:            quantity,
		DestinationCountry:  destinationCountry,
		EstimatedValue:      estimatedValue,
		ECXLotNumber:        ecxLotNumber,
		WarehouseLocation:   warehouseLocation,
		ECXVerifiedBy:       callerID,
		ECXVerifiedAt:       now,
		Status:              StatusECXVerified, // Start with ECX_VERIFIED
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal export request: %v", err)
	}

	err = ctx.GetStub().PutState(exportID, exportJSON)
	if err != nil {
		return fmt.Errorf("failed to put export request to state: %v", err)
	}

	return nil
}

// SubmitToECX - Exporter submits draft export to ECX for verification
// Status: DRAFT → ECX_PENDING
func (c *CoffeeExportContractV2) SubmitToECX(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	// Get export
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Validate current status
	if exportRequest.Status != StatusDraft {
		return fmt.Errorf("export must be in DRAFT status to submit to ECX, current status: %s", exportRequest.Status)
	}

	// Update status
	exportRequest.Status = StatusECXPending
	exportRequest.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	// Save updated export
	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal updated export: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// SubmitToECTA - Exporter submits ECX-verified export to ECTA for license approval
// Status: ECX_VERIFIED → ECTA_LICENSE_PENDING
func (c *CoffeeExportContractV2) SubmitToECTA(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	// Get export
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Validate current status
	if exportRequest.Status != StatusECXVerified {
		return fmt.Errorf("export must be ECX_VERIFIED to submit to ECTA, current status: %s", exportRequest.Status)
	}

	// Update status
	exportRequest.Status = StatusECTALicensePending
	exportRequest.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	// Save updated export
	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal updated export: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// SubmitToBank - Exporter submits ECTA-approved export to Commercial Bank for document verification
// Status: ECTA_CONTRACT_APPROVED → BANK_DOCUMENT_PENDING
func (c *CoffeeExportContractV2) SubmitToBank(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	// Get export
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Validate current status
	if exportRequest.Status != StatusECTAContractApproved {
		return fmt.Errorf("export must be ECTA_CONTRACT_APPROVED to submit to Bank, current status: %s", exportRequest.Status)
	}

	// Update status
	exportRequest.Status = StatusBankDocumentPending
	exportRequest.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	// Save updated export
	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal updated export: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// VerifyECXLot verifies ECX lot number (called by ECX)
func (c *CoffeeExportContractV2) VerifyECXLot(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	lotNumber string,
	warehouseReceiptNumber string,
) error {
	// Validate caller is ECX
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ECXMSP" {
		return fmt.Errorf("only ECX can verify lots, got MSP ID: %s", clientMSPID)
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECXPending {
		return fmt.Errorf("export is not in ECX_PENDING status, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	callerID, _ := ctx.GetClientIdentity().GetID()

	exportRequest.ECXLotNumber = lotNumber
	exportRequest.WarehouseReceiptNumber = warehouseReceiptNumber
	exportRequest.ECXVerifiedBy = callerID
	exportRequest.ECXVerifiedAt = now
	exportRequest.Status = StatusECXVerified
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal export request: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectECXVerification rejects ECX verification (called by ECX)
func (c *CoffeeExportContractV2) RejectECXVerification(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	reason string,
) error {
	// Validate caller is ECX
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ECXMSP" {
		return fmt.Errorf("only ECX can reject verification, got MSP ID: %s", clientMSPID)
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)

	exportRequest.ECXRejectionReason = reason
	exportRequest.Status = StatusECXRejected
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal export request: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ValidateExportLicense validates export license (called by ECTA)
// ECTA is the PRIMARY REGULATOR and FIRST regulatory step
func (c *CoffeeExportContractV2) ValidateExportLicense(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	// Validate caller is ECTA (formerly NCAT)
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ECTAMSP" {
		return fmt.Errorf("only ECTA can validate export license, got MSP ID: %s", clientMSPID)
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECXVerified {
		return fmt.Errorf("export must be ECX verified first, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	callerID, _ := ctx.GetClientIdentity().GetID()

	exportRequest.ExportLicenseValidatedBy = callerID
	exportRequest.ExportLicenseValidatedAt = now
	exportRequest.Status = StatusECTALicenseApproved
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal export request: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ApproveExportContract approves export contract (called by ECTA)
func (c *CoffeeExportContractV2) ApproveExportContract(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	// Validate caller is ECTA
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ECTAMSP" {
		return fmt.Errorf("only ECTA can approve contracts, got MSP ID: %s", clientMSPID)
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECTAQualityApproved {
		return fmt.Errorf("quality must be certified first, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	callerID, _ := ctx.GetClientIdentity().GetID()

	exportRequest.ContractApprovedBy = callerID
	exportRequest.ContractApprovedAt = now
	exportRequest.Status = StatusECTAContractApproved
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal export request: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// SubmitForBankingReview submits for banking/financial validation (after ECTA approval)
func (c *CoffeeExportContractV2) SubmitForBankingReview(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "NationalBankMSP" {
		return fmt.Errorf("only National Bank can submit for banking review")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusFXApproved {
		return fmt.Errorf("export must be FX_APPROVED to submit for banking review")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusBankDocumentPending
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ApproveBanking approves financial documents (Commercial Bank) - SECOND STAGE
func (c *CoffeeExportContractV2) ApproveBanking(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	approvedBy string,
	notes string,
	documentCIDs string,
) error {
	// Validate caller is Commercial Bank
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" {
		return fmt.Errorf("only Commercial Bank can approve banking, got MSP ID: %s", clientMSPID)
	}

	// Get export
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Validate current status
	if exportRequest.Status != StatusBankDocumentPending {
		return fmt.Errorf("export must be in BANK_DOCUMENT_PENDING status to approve banking, current status: %s", exportRequest.Status)
	}

	// Parse document CIDs
	var docs []Document
	if documentCIDs != "" && documentCIDs != "[]" {
		if err := json.Unmarshal([]byte(documentCIDs), &docs); err != nil {
			return fmt.Errorf("failed to parse document CIDs: %v", err)
		}
	}

	now := time.Now().UTC().Format(time.RFC3339)

	// Update export
	exportRequest.Status = StatusBankDocumentVerified
	exportRequest.FXDocuments = docs
	exportRequest.FXApprovedBy = approvedBy
	exportRequest.FXApprovedAt = now
	exportRequest.UpdatedAt = now

	// Save updated export
	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal updated export: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectBanking rejects financial documents (Commercial Bank)
func (c *CoffeeExportContractV2) RejectBanking(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	rejectedBy string,
	reason string,
) error {
	// Validate caller is Commercial Bank
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" {
		return fmt.Errorf("only Commercial Bank can reject banking, got MSP ID: %s", clientMSPID)
	}

	// Get export
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Validate current status
	if exportRequest.Status != StatusBankDocumentPending {
		return fmt.Errorf("export must be in BANK_DOCUMENT_PENDING status to reject banking, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)

	// Update export
	exportRequest.Status = StatusBankDocumentRejected
	exportRequest.FXRejectionReason = reason
	exportRequest.UpdatedAt = now

	// Save updated export
	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal updated export: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// SubmitForQuality submits export for quality certification (after banking approval)
func (c *CoffeeExportContractV2) SubmitForQuality(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" {
		return fmt.Errorf("only Commercial Bank can submit for quality")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusBankDocumentVerified {
		return fmt.Errorf("export must be BANK_DOCUMENT_VERIFIED to submit for quality, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECTAQualityPending
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// IssueQualityCertificate issues quality certificate (NCAT) - NOW HAPPENS FIRST
func (c *CoffeeExportContractV2) IssueQualityCertificate(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	qualityCertID string,
	qualityGrade string,
	certifiedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ECTAMSP" {
		return fmt.Errorf("only ECTA can issue quality certificates")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECTAQualityPending {
		return fmt.Errorf("export must be ECTA_QUALITY_PENDING to certify, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECTAQualityApproved
	exportRequest.QualityDocuments = append(exportRequest.QualityDocuments, Document{
		CID:       qualityCertID,
		Version:   len(exportRequest.QualityDocuments) + 1,
		Timestamp: now,
		IsActive:  true,
	})
	exportRequest.QualityGrade = qualityGrade
	exportRequest.QualityCertifiedBy = certifiedBy
	exportRequest.QualityCertifiedAt = now
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectQuality rejects quality certification (NCAT)
func (c *CoffeeExportContractV2) RejectQuality(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	rejectionReason string,
	rejectedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ECTAMSP" {
		return fmt.Errorf("only ECTA can reject quality")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECTAQualityPending {
		return fmt.Errorf("export must be ECTA_QUALITY_PENDING to reject")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECTAQualityRejected
	exportRequest.QualityRejectionReason = rejectionReason
	exportRequest.QualityCertifiedBy = rejectedBy
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// IssueOriginCertificate issues certificate of origin (NCAT or separate authority)
func (c *CoffeeExportContractV2) IssueOriginCertificate(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	certificateNumber string,
	certificateCID string,
	issuedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	// Allow NCAT or a dedicated Chamber of Commerce MSP
	if clientMSPID != "ECTAMSP" && clientMSPID != "ChamberOfCommerceMSP" {
		return fmt.Errorf("only ECTA or Chamber of Commerce can issue origin certificates")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECTAQualityApproved {
		return fmt.Errorf("export must be ECTA_QUALITY_APPROVED to issue origin certificate")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.OriginCertificateNumber = certificateNumber
	exportRequest.OriginCertificateDate = now
	exportRequest.OriginCertificateIssuedBy = issuedBy
	exportRequest.OriginCertificateDocuments = append(exportRequest.OriginCertificateDocuments, Document{
		CID:       certificateCID,
		Version:   len(exportRequest.OriginCertificateDocuments) + 1,
		Timestamp: now,
		IsActive:  true,
	})
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// SubmitForFX submits for FX approval (Exporter) - NOW HAPPENS AFTER QUALITY
func (c *CoffeeExportContractV2) SubmitForFX(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" {
		return fmt.Errorf("only Commercial Bank can submit for FX")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECTAContractApproved {
		return fmt.Errorf("export must be ECTA_CONTRACT_APPROVED to submit for FX, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusFXApplicationPending
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ApproveFX approves FX (National Bank) - NOW REQUIRES QUALITY_CERTIFIED
func (c *CoffeeExportContractV2) ApproveFX(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	fxApprovalID string,
	approvedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "NationalBankMSP" {
		return fmt.Errorf("only National Bank can approve FX")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusFXApplicationPending {
		return fmt.Errorf("export must be FX_APPLICATION_PENDING to approve FX, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusFXApproved
	exportRequest.FXDocuments = append(exportRequest.FXDocuments, Document{
		CID:       fxApprovalID,
		Version:   len(exportRequest.FXDocuments) + 1,
		Timestamp: now,
		IsActive:  true,
	})
	exportRequest.FXApprovedBy = approvedBy
	exportRequest.FXApprovedAt = now
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectFX rejects FX (National Bank)
func (c *CoffeeExportContractV2) RejectFX(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	rejectionReason string,
	rejectedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "NationalBankMSP" {
		return fmt.Errorf("only National Bank can reject FX")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusFXApplicationPending {
		return fmt.Errorf("export must be FX_APPLICATION_PENDING to reject FX")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusFXRejected
	exportRequest.FXRejectionReason = rejectionReason
	exportRequest.FXApprovedBy = rejectedBy
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// SubmitToExportCustoms submits to origin customs (Exporter)
func (c *CoffeeExportContractV2) SubmitToExportCustoms(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	declarationNumber string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" {
		return fmt.Errorf("only Commercial Bank can submit to export customs")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusFXApproved {
		return fmt.Errorf("export must be FX_APPROVED to submit to export customs")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusCustomsPending
	exportRequest.ExportCustomsDeclarationNumber = declarationNumber
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ClearExportCustoms clears export customs (Ethiopian Customs Authority)
func (c *CoffeeExportContractV2) ClearExportCustoms(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	clearanceCID string,
	clearedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ExportCustomsMSP" && clientMSPID != "CustomAuthoritiesMSP" {
		return fmt.Errorf("only Export Customs Authority can clear export customs")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusCustomsPending {
		return fmt.Errorf("export must be CUSTOMS_PENDING to clear")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusCustomsCleared
	exportRequest.ExportCustomsDocuments = append(exportRequest.ExportCustomsDocuments, Document{
		CID:       clearanceCID,
		Version:   len(exportRequest.ExportCustomsDocuments) + 1,
		Timestamp: now,
		IsActive:  true,
	})
	exportRequest.ExportCustomsClearedBy = clearedBy
	exportRequest.ExportCustomsClearedAt = now
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectExportCustoms rejects export customs clearance
func (c *CoffeeExportContractV2) RejectExportCustoms(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	rejectionReason string,
	rejectedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ExportCustomsMSP" && clientMSPID != "CustomAuthoritiesMSP" {
		return fmt.Errorf("only Export Customs Authority can reject export customs")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusCustomsPending {
		return fmt.Errorf("export must be CUSTOMS_PENDING to reject")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusCustomsRejected
	exportRequest.ExportCustomsRejectionReason = rejectionReason
	exportRequest.ExportCustomsClearedBy = rejectedBy
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ScheduleShipment schedules shipment (Shipping Line) - NOW REQUIRES EXPORT_CUSTOMS_CLEARED
func (c *CoffeeExportContractV2) ScheduleShipment(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	shipmentID string,
	transportIdentifier string,
	departureDate string,
	arrivalDate string,
	shippingLineID string,
	transportMode string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ShippingLineMSP" {
		return fmt.Errorf("only Shipping Line can schedule shipments")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusCustomsCleared {
		return fmt.Errorf("export must be CUSTOMS_CLEARED to schedule shipment, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusShipmentScheduled
	exportRequest.ShipmentDocuments = append(exportRequest.ShipmentDocuments, Document{
		CID:       shipmentID,
		Version:   len(exportRequest.ShipmentDocuments) + 1,
		Timestamp: now,
		IsActive:  true,
	})
	exportRequest.TransportIdentifier = transportIdentifier
	exportRequest.DepartureDate = departureDate
	exportRequest.ArrivalDate = arrivalDate
	exportRequest.ShippingLineID = shippingLineID
	exportRequest.TransportMode = TransportMode(transportMode)
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ConfirmShipment confirms shipment departure (Shipping Line)
func (c *CoffeeExportContractV2) ConfirmShipment(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ShippingLineMSP" {
		return fmt.Errorf("only Shipping Line can confirm shipments")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusShipmentScheduled {
		return fmt.Errorf("export must be SHIPMENT_SCHEDULED to confirm shipment")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusShipped
	exportRequest.ShippedAt = now
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// NotifyArrival notifies arrival at destination (Shipping Line)
func (c *CoffeeExportContractV2) NotifyArrival(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	actualArrivalDate string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ShippingLineMSP" {
		return fmt.Errorf("only Shipping Line can notify arrival")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusShipped {
		return fmt.Errorf("export must be SHIPPED to notify arrival")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusArrived
	exportRequest.ActualArrivalDate = actualArrivalDate
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// SubmitToImportCustoms submits to destination customs (Importer or Shipping Line)
func (c *CoffeeExportContractV2) SubmitToImportCustoms(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	declarationNumber string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	// Allow shipping line or importer to submit
	if clientMSPID != "ShippingLineMSP" && clientMSPID != "ImporterMSP" {
		return fmt.Errorf("only Shipping Line or Importer can submit to import customs")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusArrived {
		return fmt.Errorf("export must be ARRIVED to submit to import customs")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusImportCustomsPending
	exportRequest.ImportCustomsDeclarationNumber = declarationNumber
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ClearImportCustoms clears import customs (Destination Customs Authority)
func (c *CoffeeExportContractV2) ClearImportCustoms(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	clearanceCID string,
	clearedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ImportCustomsMSP" && clientMSPID != "DestinationCustomsMSP" {
		return fmt.Errorf("only Import Customs Authority can clear import customs")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusImportCustomsPending {
		return fmt.Errorf("export must be IMPORT_CUSTOMS_PENDING to clear")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusImportCustomsCleared
	exportRequest.ImportCustomsDocuments = append(exportRequest.ImportCustomsDocuments, Document{
		CID:       clearanceCID,
		Version:   len(exportRequest.ImportCustomsDocuments) + 1,
		Timestamp: now,
		IsActive:  true,
	})
	exportRequest.ImportCustomsClearedBy = clearedBy
	exportRequest.ImportCustomsClearedAt = now
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectImportCustoms rejects import customs clearance
func (c *CoffeeExportContractV2) RejectImportCustoms(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	rejectionReason string,
	rejectedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ImportCustomsMSP" && clientMSPID != "DestinationCustomsMSP" {
		return fmt.Errorf("only Import Customs Authority can reject import customs")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusImportCustomsPending {
		return fmt.Errorf("export must be IMPORT_CUSTOMS_PENDING to reject")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusImportCustomsRejected
	exportRequest.ImportCustomsRejectionReason = rejectionReason
	exportRequest.ImportCustomsClearedBy = rejectedBy
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ConfirmDelivery confirms delivery to buyer (Importer or Shipping Line)
func (c *CoffeeExportContractV2) ConfirmDelivery(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	confirmedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ImporterMSP" && clientMSPID != "ShippingLineMSP" {
		return fmt.Errorf("only Importer or Shipping Line can confirm delivery")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusImportCustomsCleared {
		return fmt.Errorf("export must be IMPORT_CUSTOMS_CLEARED to confirm delivery")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusDelivered
	exportRequest.DeliveryConfirmedBy = confirmedBy
	exportRequest.DeliveryDate = now
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ConfirmPayment confirms payment receipt (Commercial Bank or National Bank)
func (c *CoffeeExportContractV2) ConfirmPayment(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	confirmedBy string,
	paymentAmount float64,
	paymentDate string,
) error {
	// Validate caller is Commercial Bank or National Bank
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" && clientMSPID != "NBEMSP" {
		return fmt.Errorf("only Commercial Bank or National Bank can confirm payment, got MSP ID: %s", clientMSPID)
	}

	// Get export
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Validate current status
	if exportRequest.Status != StatusDelivered {
		return fmt.Errorf("export must be in DELIVERED status to confirm payment, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)

	// Update export
	exportRequest.Status = StatusPaymentReceived
	exportRequest.PaymentAmount = paymentAmount
	exportRequest.PaymentReceivedDate = paymentDate
	exportRequest.DeliveryConfirmedBy = confirmedBy
	exportRequest.UpdatedAt = now

	// Save updated export
	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal updated export: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ConfirmRepatriation confirms FX repatriation (National Bank)
func (c *CoffeeExportContractV2) ConfirmRepatriation(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	repatriatedAmount float64,
	repatriatedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "NationalBankMSP" {
		return fmt.Errorf("only National Bank can confirm FX repatriation")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusPaymentReceived {
		return fmt.Errorf("export must be PAYMENT_RECEIVED to confirm repatriation")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusFXRepatriated
	exportRequest.FXRepatriatedAmount = repatriatedAmount
	exportRequest.FXRepatriatedDate = now
	exportRequest.FXRepatriatedBy = repatriatedBy
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// CompleteExport marks export as completed (Commercial Bank or National Bank)
func (c *CoffeeExportContractV2) CompleteExport(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	completedBy string,
) error {
	// Validate caller is Commercial Bank or National Bank
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" && clientMSPID != "NBEMSP" {
		return fmt.Errorf("only Commercial Bank or National Bank can complete export, got MSP ID: %s", clientMSPID)
	}

	// Get export
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Validate current status
	allowedStatuses := []ExportStatus{StatusPaymentReceived, StatusFXRepatriated}
	validStatus := false
	for _, status := range allowedStatuses {
		if exportRequest.Status == status {
			validStatus = true
			break
		}
	}
	if !validStatus {
		return fmt.Errorf("export must be in PAYMENT_RECEIVED or FX_REPATRIATED status to complete, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)

	// Update export
	exportRequest.Status = StatusCompleted
	exportRequest.UpdatedAt = now

	// Save updated export
	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal updated export: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// CancelExport cancels an export (Commercial Bank or National Bank)
func (c *CoffeeExportContractV2) CancelExport(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	cancelledBy string,
	reason string,
) error {
	// Validate caller is Commercial Bank or National Bank
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" && clientMSPID != "NBEMSP" {
		return fmt.Errorf("only Commercial Bank or National Bank can cancel export, got MSP ID: %s", clientMSPID)
	}

	// Get export
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Validate current status (can cancel from most statuses except COMPLETED)
	if exportRequest.Status == StatusCompleted {
		return fmt.Errorf("cannot cancel completed export")
	}

	now := time.Now().UTC().Format(time.RFC3339)

	// Update export
	exportRequest.Status = StatusCancelled
	exportRequest.UpdatedAt = now

	// Save updated export
	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal updated export: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// UpdateRejectedExport allows exporter to update a rejected export request
func (c *CoffeeExportContractV2) UpdateRejectedExport(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	coffeeType string,
	quantity float64,
	destinationCountry string,
	estimatedValue float64,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" {
		return fmt.Errorf("only Commercial Bank can update exports")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Can only update rejected exports
	if exportRequest.Status != StatusECTAQualityRejected &&
		exportRequest.Status != StatusFXRejected &&
		exportRequest.Status != StatusCustomsRejected {
		return fmt.Errorf("can only update rejected exports, current status: %s", exportRequest.Status)
	}

	// Validate new values
	if coffeeType != "" {
		exportRequest.CoffeeType = coffeeType
	}
	if quantity > 0 {
		exportRequest.Quantity = quantity
	}
	if destinationCountry != "" {
		exportRequest.DestinationCountry = destinationCountry
	}
	if estimatedValue > 0 {
		exportRequest.EstimatedValue = estimatedValue
	}

	// Reset to DRAFT status so exporter can resubmit
	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusDraft
	exportRequest.UpdatedAt = now

	// Clear rejection reasons
	exportRequest.QualityRejectionReason = ""
	exportRequest.FXRejectionReason = ""
	exportRequest.ExportCustomsRejectionReason = ""

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

}

// ResubmitRejectedExport allows exporter to resubmit a rejected export without changes
func (c *CoffeeExportContractV2) ResubmitRejectedExport(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" {
		return fmt.Errorf("only Commercial Bank can resubmit exports")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Can only resubmit rejected exports
	if exportRequest.Status != StatusECTAQualityRejected &&
		exportRequest.Status != StatusFXRejected &&
		exportRequest.Status != StatusCustomsRejected {
		return fmt.Errorf("can only resubmit rejected exports, current status: %s", exportRequest.Status)
	}

	// Reset to DRAFT status
	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusDraft
	exportRequest.UpdatedAt = now

	// Keep rejection reasons for audit trail

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ============================================================================
// NEW FUNCTIONS FOR REORGANIZED WORKFLOW
// ============================================================================

// ApproveLotVerification approves ECX lot verification (called by ECX)
// Status: PENDING → ECX_VERIFIED
func (c *CoffeeExportContractV2) ApproveLotVerification(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	approvedBy string,
	notes string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != "PENDING" {
		return fmt.Errorf("export must be in PENDING status, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECXVerified
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectLotVerification rejects ECX lot verification (called by ECX)
// Status: PENDING → ECX_REJECTED
func (c *CoffeeExportContractV2) RejectLotVerification(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	reason string,
	rejectedBy string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != "PENDING" {
		return fmt.Errorf("export must be in PENDING status, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECXRejected
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ApproveLicense approves ECTA license (called by ECTA)
// Status: ECX_VERIFIED → ECTA_LICENSE_APPROVED
func (c *CoffeeExportContractV2) ApproveLicense(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	licenseNumber string,
	approvedBy string,
	notes string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECXVerified {
		return fmt.Errorf("export must be ECX_VERIFIED, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECTALicenseApproved
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectLicense rejects ECTA license (called by ECTA)
// Status: ECX_VERIFIED → ECTA_LICENSE_REJECTED
func (c *CoffeeExportContractV2) RejectLicense(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	reason string,
	rejectedBy string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECXVerified {
		return fmt.Errorf("export must be ECX_VERIFIED, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECTALicenseRejected
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ApproveQualityCertification approves ECTA quality (called by ECTA)
// Status: ECTA_LICENSE_APPROVED → ECTA_QUALITY_APPROVED
func (c *CoffeeExportContractV2) ApproveQualityCertification(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	qualityCertID string,
	qualityGrade string,
	approvedBy string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECTALicenseApproved {
		return fmt.Errorf("export must be ECTA_LICENSE_APPROVED, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECTAQualityApproved
	exportRequest.QualityCertID = qualityCertID
	exportRequest.QualityGrade = qualityGrade
	exportRequest.QualityCertifiedBy = approvedBy
	exportRequest.QualityCertifiedAt = now
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectQualityCertification rejects ECTA quality (called by ECTA)
// Status: ECTA_LICENSE_APPROVED → ECTA_QUALITY_REJECTED
func (c *CoffeeExportContractV2) RejectQualityCertification(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	reason string,
	rejectedBy string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECTALicenseApproved {
		return fmt.Errorf("export must be ECTA_LICENSE_APPROVED, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECTAQualityRejected
	exportRequest.QualityRejectionReason = reason
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ApproveContract approves ECTA contract (called by ECTA)
// Status: ECTA_QUALITY_APPROVED → ECTA_CONTRACT_APPROVED
func (c *CoffeeExportContractV2) ApproveContract(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	contractNumber string,
	originCertificateNumber string,
	approvedBy string,
	notes string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECTAQualityApproved {
		return fmt.Errorf("export must be ECTA_QUALITY_APPROVED, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECTAContractApproved
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectContract rejects ECTA contract (called by ECTA)
// Status: ECTA_QUALITY_APPROVED → ECTA_CONTRACT_REJECTED
func (c *CoffeeExportContractV2) RejectContract(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	reason string,
	rejectedBy string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECTAQualityApproved {
		return fmt.Errorf("export must be ECTA_QUALITY_APPROVED, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusECTAContractRejected
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// VerifyDocuments verifies documents (called by Commercial Bank)
// Status: ECTA_CONTRACT_APPROVED → BANK_DOCUMENT_VERIFIED
func (c *CoffeeExportContractV2) VerifyDocuments(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	verifiedBy string,
	notes string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusECTAContractApproved {
		return fmt.Errorf("export must be ECTA_CONTRACT_APPROVED, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusBankDocumentVerified
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// SubmitFXApplication submits FX application (called by Commercial Bank)
// Status: BANK_DOCUMENT_VERIFIED → FX_APPLICATION_PENDING
func (c *CoffeeExportContractV2) SubmitFXApplication(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	submittedBy string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusBankDocumentVerified {
		return fmt.Errorf("export must be BANK_DOCUMENT_VERIFIED, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusFXApplicationPending
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ============================================================================
// END NEW FUNCTIONS
// ============================================================================

// CancelExport cancels an export (commercialbank)
func (c *CoffeeExportContractV2) CancelExport(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "CommercialBankMSP" {
		return fmt.Errorf("only Commercial Bank can cancel exports")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Cannot cancel after shipped
	if exportRequest.Status == StatusShipped || exportRequest.Status == StatusArrived ||
		exportRequest.Status == StatusDelivered || exportRequest.Status == StatusCompleted {
		return fmt.Errorf("cannot cancel export that has been shipped or completed")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusCancelled
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// GetExportRequest retrieves an export request
func (c *CoffeeExportContractV2) GetExportRequest(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) (*ExportRequest, error) {
	exportJSON, err := ctx.GetStub().GetState(exportID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if exportJSON == nil {
		return nil, fmt.Errorf("export request %s does not exist", exportID)
	}

	var exportRequest ExportRequest
	err = json.Unmarshal(exportJSON, &exportRequest)
	if err != nil {
		return nil, err
	}

	return &exportRequest, nil
}

// ExportExists checks if export exists
func (c *CoffeeExportContractV2) ExportExists(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) (bool, error) {
	exportJSON, err := ctx.GetStub().GetState(exportID)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return exportJSON != nil, nil
}

// GetAllExports returns all exports
func (c *CoffeeExportContractV2) GetAllExports(
	ctx contractapi.TransactionContextInterface,
) ([]*ExportRequest, error) {
	resultsIterator, err := ctx.GetStub().GetStateByRange("EXP-", "EXP-~")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var exports []*ExportRequest
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var exportRequest ExportRequest
		err = json.Unmarshal(queryResponse.Value, &exportRequest)
		if err != nil {
			continue
		}
		exports = append(exports, &exportRequest)
	}

	return exports, nil
}

// GetExportsByStatus returns exports by status
func (c *CoffeeExportContractV2) GetExportsByStatus(
	ctx contractapi.TransactionContextInterface,
	status string,
) ([]*ExportRequest, error) {
	queryString := fmt.Sprintf(`{"selector":{"status":"%s"}}`, status)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var exports []*ExportRequest
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var exportRequest ExportRequest
		err = json.Unmarshal(queryResponse.Value, &exportRequest)
		if err != nil {
			return nil, err
		}
		exports = append(exports, &exportRequest)
	}

	return exports, nil
}

// GetExportHistory returns export history
func (c *CoffeeExportContractV2) GetExportHistory(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) ([]HistoryQueryResult, error) {
	resultsIterator, err := ctx.GetStub().GetHistoryForKey(exportID)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var records []HistoryQueryResult
	for resultsIterator.HasNext() {
		response, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var exportRequest ExportRequest
		if len(response.Value) > 0 {
			err = json.Unmarshal(response.Value, &exportRequest)
			if err != nil {
				return nil, err
			}
		}

		timestamp := time.Unix(response.Timestamp.Seconds, int64(response.Timestamp.Nanos)).UTC().Format(time.RFC3339)

		record := HistoryQueryResult{
			TxId:      response.TxId,
			Timestamp: timestamp,
			IsDelete:  response.IsDelete,
		}

		if len(response.Value) > 0 {
			record.Record = &exportRequest
		}

		records = append(records, record)
	}

	return records, nil
}
