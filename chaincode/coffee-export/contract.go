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

// ExportStatus represents the current status of an export - CORRECTED WORKFLOW
type ExportStatus string

const (
	// Initial State (Portal submits)
	StatusDraft ExportStatus = "DRAFT"

	// FX Phase (FIRST - National Bank validates license & FX)
	StatusFXPending  ExportStatus = "FX_PENDING"
	StatusFXApproved ExportStatus = "FX_APPROVED"
	StatusFXRejected ExportStatus = "FX_REJECTED"

	// Banking Phase (SECOND - Exporter Bank validates financial docs)
	StatusBankingPending  ExportStatus = "BANKING_PENDING"
	StatusBankingApproved ExportStatus = "BANKING_APPROVED"
	StatusBankingRejected ExportStatus = "BANKING_REJECTED"

	// Quality Phase (THIRD - NCAT certifies quality)
	StatusQualityPending   ExportStatus = "QUALITY_PENDING"
	StatusQualityCertified ExportStatus = "QUALITY_CERTIFIED"
	StatusQualityRejected  ExportStatus = "QUALITY_REJECTED"

	// Origin Customs Phase (THIRD - export clearance)
	StatusExportCustomsPending  ExportStatus = "EXPORT_CUSTOMS_PENDING"
	StatusExportCustomsCleared  ExportStatus = "EXPORT_CUSTOMS_CLEARED"
	StatusExportCustomsRejected ExportStatus = "EXPORT_CUSTOMS_REJECTED"

	// Shipment Phase (FOURTH)
	StatusShipmentScheduled ExportStatus = "SHIPMENT_SCHEDULED"
	StatusShipped           ExportStatus = "SHIPPED"

	// Destination Customs Phase (FIFTH - import clearance)
	StatusArrived                ExportStatus = "ARRIVED"
	StatusImportCustomsPending   ExportStatus = "IMPORT_CUSTOMS_PENDING"
	StatusImportCustomsCleared   ExportStatus = "IMPORT_CUSTOMS_CLEARED"
	StatusImportCustomsRejected  ExportStatus = "IMPORT_CUSTOMS_REJECTED"

	// Delivery Phase (SIXTH)
	StatusDelivered ExportStatus = "DELIVERED"

	// Financial Phase (SEVENTH)
	StatusPaymentPending  ExportStatus = "PAYMENT_PENDING"
	StatusPaymentReceived ExportStatus = "PAYMENT_RECEIVED"
	StatusFXRepatriated   ExportStatus = "FX_REPATRIATED"

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
	ExporterBankID     string       `json:"exporterBankId"`
	ExporterName       string       `json:"exporterName"`
	CoffeeType         string       `json:"coffeeType"`
	Quantity           float64      `json:"quantity"` // in kg
	DestinationCountry string       `json:"destinationCountry"`
	EstimatedValue     float64      `json:"estimatedValue"` // in USD
	Status             ExportStatus `json:"status"`
	CreatedAt          string       `json:"createdAt"`
	UpdatedAt          string       `json:"updatedAt"`

	// NEW: Pre-export fields
	ExportLicenseNumber string `json:"exportLicenseNumber"`
	ECXLotNumber        string `json:"ecxLotNumber,omitempty"`
	WarehouseLocation   string `json:"warehouseLocation,omitempty"`

	// NCAT fields (Quality Certification)
	QualityDocuments       []Document `json:"qualityDocuments,omitempty"`
	QualityGrade           string     `json:"qualityGrade,omitempty"`
	QualityCertifiedBy     string     `json:"qualityCertifiedBy,omitempty"`
	QualityCertifiedAt     string     `json:"qualityCertifiedAt,omitempty"`
	QualityRejectionReason string     `json:"qualityRejectionReason,omitempty"`

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

// CreateExportRequest creates a new export request (called by National Bank when portal submits)
func (c *CoffeeExportContractV2) CreateExportRequest(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	exporterBankID string,
	exporterName string,
	exportLicenseNumber string,
	coffeeType string,
	quantity float64,
	destinationCountry string,
	estimatedValue float64,
	ecxLotNumber string,
	warehouseLocation string,
) error {
	// Input validation
	if exportID == "" {
		return fmt.Errorf("export ID cannot be empty")
	}
	if exporterBankID == "" {
		return fmt.Errorf("exporter bank ID cannot be empty")
	}
	if exporterName == "" {
		return fmt.Errorf("exporter name cannot be empty")
	}
	if exportLicenseNumber == "" {
		return fmt.Errorf("export license number cannot be empty")
	}
	if coffeeType == "" {
		return fmt.Errorf("coffee type cannot be empty")
	}
	if quantity <= 0 {
		return fmt.Errorf("quantity must be greater than 0")
	}
	if destinationCountry == "" {
		return fmt.Errorf("destination country cannot be empty")
	}
	if estimatedValue <= 0 {
		return fmt.Errorf("estimated value must be greater than 0")
	}

	// Check if export already exists
	exists, err := c.ExportExists(ctx, exportID)
	if err != nil {
		return fmt.Errorf("failed to check if export exists: %v", err)
	}
	if exists {
		return fmt.Errorf("export request %s already exists", exportID)
	}

	// Validate caller is National Bank (portal submits through National Bank)
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "NationalBankMSP" {
		return fmt.Errorf("only National Bank can create export requests (from portal), got MSP ID: %s", clientMSPID)
	}

	now := time.Now().UTC().Format(time.RFC3339)

	exportRequest := ExportRequest{
		ExportID:            exportID,
		ExporterBankID:      exporterBankID,
		ExporterName:        exporterName,
		ExportLicenseNumber: exportLicenseNumber,
		CoffeeType:          coffeeType,
		Quantity:            quantity,
		DestinationCountry:  destinationCountry,
		EstimatedValue:      estimatedValue,
		ECXLotNumber:        ecxLotNumber,
		WarehouseLocation:   warehouseLocation,
		Status:              StatusFXPending,
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



// SubmitForBankingReview submits for banking/financial validation (after FX approval)
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
	exportRequest.Status = StatusBankingPending
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ApproveBanking approves financial documents (Exporter Bank) - SECOND STAGE
func (c *CoffeeExportContractV2) ApproveBanking(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	bankingApprovalID string,
	approvedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ExporterBankMSP" {
		return fmt.Errorf("only Exporter Bank can approve banking/financial documents")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusBankingPending {
		return fmt.Errorf("export must be BANKING_PENDING to approve, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusBankingApproved
	exportRequest.FXDocuments = append(exportRequest.FXDocuments, Document{
		CID:       bankingApprovalID,
		Version:   len(exportRequest.FXDocuments) + 1,
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

// RejectBanking rejects financial documents (Exporter Bank)
func (c *CoffeeExportContractV2) RejectBanking(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	rejectionReason string,
	rejectedBy string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ExporterBankMSP" {
		return fmt.Errorf("only Exporter Bank can reject banking review")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusBankingPending {
		return fmt.Errorf("export must be BANKING_PENDING to reject")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusBankingRejected
	exportRequest.FXRejectionReason = rejectionReason
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
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
	if clientMSPID != "ExporterBankMSP" {
		return fmt.Errorf("only Exporter Bank can submit for quality")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusBankingApproved {
		return fmt.Errorf("export must be BANKING_APPROVED to submit for quality, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusQualityPending
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
	if clientMSPID != "NCATMSP" {
		return fmt.Errorf("only NCAT can issue quality certificates")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusQualityPending {
		return fmt.Errorf("export must be QUALITY_PENDING to certify, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusQualityCertified
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
	if clientMSPID != "NCATMSP" {
		return fmt.Errorf("only NCAT can reject quality")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusQualityPending {
		return fmt.Errorf("export must be QUALITY_PENDING to reject")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusQualityRejected
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
	if clientMSPID != "NCATMSP" && clientMSPID != "ChamberOfCommerceMSP" {
		return fmt.Errorf("only NCAT or Chamber of Commerce can issue origin certificates")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusQualityCertified {
		return fmt.Errorf("export must be QUALITY_CERTIFIED to issue origin certificate")
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
	if clientMSPID != "ExporterBankMSP" {
		return fmt.Errorf("only Exporter Bank can submit for FX")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusQualityCertified {
		return fmt.Errorf("export must be QUALITY_CERTIFIED to submit for FX, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusFXPending
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

	if exportRequest.Status != StatusFXPending {
		return fmt.Errorf("export must be FX_PENDING to approve FX, current status: %s", exportRequest.Status)
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

	if exportRequest.Status != StatusFXPending {
		return fmt.Errorf("export must be FX_PENDING to reject FX")
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
	if clientMSPID != "ExporterBankMSP" {
		return fmt.Errorf("only Exporter Bank can submit to export customs")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusFXApproved {
		return fmt.Errorf("export must be FX_APPROVED to submit to export customs")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusExportCustomsPending
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

	if exportRequest.Status != StatusExportCustomsPending {
		return fmt.Errorf("export must be EXPORT_CUSTOMS_PENDING to clear")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusExportCustomsCleared
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

	if exportRequest.Status != StatusExportCustomsPending {
		return fmt.Errorf("export must be EXPORT_CUSTOMS_PENDING to reject")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusExportCustomsRejected
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

	if exportRequest.Status != StatusExportCustomsCleared {
		return fmt.Errorf("export must be EXPORT_CUSTOMS_CLEARED to schedule shipment, current status: %s", exportRequest.Status)
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

// ConfirmPayment confirms payment receipt (Exporter Bank or National Bank)
func (c *CoffeeExportContractV2) ConfirmPayment(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	paymentMethod string,
	paymentAmount float64,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ExporterBankMSP" && clientMSPID != "NationalBankMSP" {
		return fmt.Errorf("only Exporter Bank or National Bank can confirm payment")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusDelivered {
		return fmt.Errorf("export must be DELIVERED to confirm payment")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusPaymentReceived
	exportRequest.PaymentMethod = paymentMethod
	exportRequest.PaymentAmount = paymentAmount
	exportRequest.PaymentReceivedDate = now
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
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

// CompleteExport marks export as completed (Exporter Bank or National Bank)
func (c *CoffeeExportContractV2) CompleteExport(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ExporterBankMSP" && clientMSPID != "NationalBankMSP" {
		return fmt.Errorf("only Exporter Bank or National Bank can complete exports")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusFXRepatriated {
		return fmt.Errorf("export must be FX_REPATRIATED to complete, current status: %s", exportRequest.Status)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusCompleted
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
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
	if clientMSPID != "ExporterBankMSP" {
		return fmt.Errorf("only Exporter Bank can update exports")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Can only update rejected exports
	if exportRequest.Status != StatusQualityRejected &&
		exportRequest.Status != StatusFXRejected &&
		exportRequest.Status != StatusExportCustomsRejected {
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

// ResubmitRejectedExport allows exporter to resubmit a rejected export without changes
func (c *CoffeeExportContractV2) ResubmitRejectedExport(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ExporterBankMSP" {
		return fmt.Errorf("only Exporter Bank can resubmit exports")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Can only resubmit rejected exports
	if exportRequest.Status != StatusQualityRejected &&
		exportRequest.Status != StatusFXRejected &&
		exportRequest.Status != StatusExportCustomsRejected {
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

// CancelExport cancels an export (Exporter Bank)
func (c *CoffeeExportContractV2) CancelExport(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ExporterBankMSP" {
		return fmt.Errorf("only Exporter Bank can cancel exports")
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
