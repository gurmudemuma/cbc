package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// CoffeeExportContract provides functions for managing coffee exports
type CoffeeExportContract struct {
	contractapi.Contract
}

// ExportStatus represents the current status of an export
type ExportStatus string

const (
	StatusPending            ExportStatus = "PENDING"
	StatusFXApproved         ExportStatus = "FX_APPROVED"
	StatusFXRejected         ExportStatus = "FX_REJECTED"
	StatusQualityCertified   ExportStatus = "QUALITY_CERTIFIED"
	StatusQualityRejected    ExportStatus = "QUALITY_REJECTED"
	StatusShipmentScheduled  ExportStatus = "SHIPMENT_SCHEDULED"
	StatusShipped            ExportStatus = "SHIPPED"
	StatusCompleted          ExportStatus = "COMPLETED"
	StatusCancelled          ExportStatus = "CANCELLED"
)

type Document struct {
	CID       string `json:"cid"`
	Version   int    `json:"version"`
	Timestamp string `json:"timestamp"`
	IsActive  bool   `json:"isActive"`
}

// ExportRequest represents a coffee export request
type ExportRequest struct {
	ExportID          string       `json:"exportId"`
	ExporterBankID    string       `json:"exporterBankId"`
	ExporterName      string       `json:"exporterName"`
	CoffeeType        string       `json:"coffeeType"`
	Quantity          float64      `json:"quantity"` // in kg
	DestinationCountry string      `json:"destinationCountry"`
	EstimatedValue    float64      `json:"estimatedValue"` // in USD
	Status            ExportStatus `json:"status"`
	CreatedAt         string       `json:"createdAt"`
	UpdatedAt         string       `json:"updatedAt"`
	
	// National Bank fields
	FXDocuments       []Document   `json:"fxDocuments,omitempty"`
	FXApprovedBy      string       `json:"fxApprovedBy,omitempty"`
	FXApprovedAt      string       `json:"fxApprovedAt,omitempty"`
	FXRejectionReason string       `json:"fxRejectionReason,omitempty"`
	
	// NCAT fields
	QualityDocuments  []Document   `json:"qualityDocuments,omitempty"`
	QualityGrade      string       `json:"qualityGrade,omitempty"`
	QualityCertifiedBy string      `json:"qualityCertifiedBy,omitempty"`
	QualityCertifiedAt string      `json:"qualityCertifiedAt,omitempty"`
	QualityRejectionReason string  `json:"qualityRejectionReason,omitempty"`
	
	// Shipping Line fields
	ShipmentDocuments []Document   `json:"shipmentDocuments,omitempty"`
	VesselName        string       `json:"vesselName,omitempty"`
	DepartureDate     string       `json:"departureDate,omitempty"`
	ArrivalDate       string       `json:"arrivalDate,omitempty"`
	ShippingLineID    string       `json:"shippingLineId,omitempty"`
	ShippedAt         string       `json:"shippedAt,omitempty"`
}

// HistoryQueryResult structure used for returning result of history query
type HistoryQueryResult struct {
	Record    *ExportRequest `json:"record"`
	TxId      string         `json:"txId"`
	Timestamp string         `json:"timestamp"`
	IsDelete  bool           `json:"isDelete"`
}

// InitLedger initializes the ledger with sample data (optional)
func (c *CoffeeExportContract) InitLedger(ctx contractapi.TransactionContextInterface) error {
	return nil
}

// CreateExportRequest creates a new export request (called by Exporter Bank)
func (c *CoffeeExportContract) CreateExportRequest(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	exporterBankID string,
	exporterName string,
	coffeeType string,
	quantity float64,
	destinationCountry string,
	estimatedValue float64,
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

	// Validate caller is from Exporter Bank
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ExporterBankMSP" {
		return fmt.Errorf("only Exporter Bank can create export requests, got MSP ID: %s", clientMSPID)
	}

	now := time.Now().UTC().Format(time.RFC3339)
	
	exportRequest := ExportRequest{
		ExportID:           exportID,
		ExporterBankID:     exporterBankID,
		ExporterName:       exporterName,
		CoffeeType:         coffeeType,
		Quantity:           quantity,
		DestinationCountry: destinationCountry,
		EstimatedValue:     estimatedValue,
		Status:             StatusPending,
		CreatedAt:          now,
		UpdatedAt:          now,
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

// ApproveFX approves foreign exchange for an export (called by National Bank)
func (c *CoffeeExportContract) ApproveFX(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	fxApprovalID string,
	approvedBy string,
) error {
	// Validate caller is from National Bank
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

	if exportRequest.Status != StatusPending {
		return fmt.Errorf("export request must be in PENDING status to approve FX")
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

// RejectFX rejects foreign exchange for an export (called by National Bank)
func (c *CoffeeExportContract) RejectFX(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	rejectionReason string,
	rejectedBy string,
) error {
	// Validate caller is from National Bank
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

	if exportRequest.Status != StatusPending {
		return fmt.Errorf("export request must be in PENDING status to reject FX")
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

// IssueQualityCertificate issues a quality certificate (called by NCAT)
func (c *CoffeeExportContract) IssueQualityCertificate(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	qualityCertID string,
	qualityGrade string,
	certifiedBy string,
) error {
	// Validate caller is from NCAT
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

	if exportRequest.Status != StatusFXApproved {
		return fmt.Errorf("export request must have FX approval before quality certification")
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

// RejectQuality rejects quality certification (called by NCAT)
func (c *CoffeeExportContract) RejectQuality(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	rejectionReason string,
	rejectedBy string,
) error {
	// Validate caller is from NCAT
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

	if exportRequest.Status != StatusFXApproved {
		return fmt.Errorf("export request must have FX approval before quality rejection")
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

// ScheduleShipment schedules a shipment (called by Shipping Line)
func (c *CoffeeExportContract) ScheduleShipment(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	shipmentID string,
	vesselName string,
	departureDate string,
	arrivalDate string,
	shippingLineID string,
) error {
	// Validate caller is from Shipping Line
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

	if exportRequest.Status != StatusQualityCertified {
		return fmt.Errorf("export request must have quality certification before scheduling shipment")
	}

	now := time.Now().UTC().Format(time.RFC3339)
	exportRequest.Status = StatusShipmentScheduled
	exportRequest.ShipmentDocuments = append(exportRequest.ShipmentDocuments, Document{
		CID:       shipmentID,
		Version:   len(exportRequest.ShipmentDocuments) + 1,
		Timestamp: now,
		IsActive:  true,
	})
	exportRequest.VesselName = vesselName
	exportRequest.DepartureDate = departureDate
	exportRequest.ArrivalDate = arrivalDate
	exportRequest.ShippingLineID = shippingLineID
	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// ConfirmShipment confirms that goods have been shipped (called by Shipping Line)
func (c *CoffeeExportContract) ConfirmShipment(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	// Validate caller is from Shipping Line
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
		return fmt.Errorf("export request must have scheduled shipment before confirmation")
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

// CompleteExport marks an export as completed (called by Exporter Bank)
func (c *CoffeeExportContract) CompleteExport(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	// Validate caller is from Exporter Bank
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ExporterBankMSP" {
		return fmt.Errorf("only Exporter Bank can complete exports")
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	if exportRequest.Status != StatusShipped {
		return fmt.Errorf("export request must be shipped before completion")
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

// CancelExport cancels an export request (called by Exporter Bank)
func (c *CoffeeExportContract) CancelExport(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) error {
	// Validate caller is from Exporter Bank
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

	if exportRequest.Status == StatusShipped || exportRequest.Status == StatusCompleted {
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

// GetExportRequest retrieves an export request by ID
func (c *CoffeeExportContract) GetExportRequest(
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

// ExportExists checks if an export request exists
func (c *CoffeeExportContract) ExportExists(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) (bool, error) {
	exportJSON, err := ctx.GetStub().GetState(exportID)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}

	return exportJSON != nil, nil
}

// GetAllExports returns all export requests
func (c *CoffeeExportContract) GetAllExports(
	ctx contractapi.TransactionContextInterface,
) ([]*ExportRequest, error) {
	// Use prefix to only get export records (those starting with "EXP-")
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
			// Skip records that can't be unmarshaled as ExportRequest
			continue
		}
		exports = append(exports, &exportRequest)
	}

	return exports, nil
}

// GetExportsByStatus returns all exports with a specific status
func (c *CoffeeExportContract) GetExportsByStatus(
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

func (c *CoffeeExportContract) AddDocument(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	docType string,
	cid string,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	doc := Document{
		CID:       cid,
		Version:   1, // Logic to increment version based on existing
		Timestamp: now,
		IsActive:  true,
	}

	switch docType {
	case "fx":
		doc.Version = len(exportRequest.FXDocuments) + 1
		exportRequest.FXDocuments = append(exportRequest.FXDocuments, doc)
	case "quality":
		doc.Version = len(exportRequest.QualityDocuments) + 1
		exportRequest.QualityDocuments = append(exportRequest.QualityDocuments, doc)
	case "shipment":
		doc.Version = len(exportRequest.ShipmentDocuments) + 1
		exportRequest.ShipmentDocuments = append(exportRequest.ShipmentDocuments, doc)
	default:
		return fmt.Errorf("unknown document type: %s", docType)
	}

	exportRequest.UpdatedAt = now
	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(exportID, exportJSON)
}

func (c *CoffeeExportContract) DeleteDocument(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	docType string,
	version int,
) error {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	var found bool

	switch docType {
	case "fx":
		for i := range exportRequest.FXDocuments {
			if exportRequest.FXDocuments[i].Version == version {
				exportRequest.FXDocuments[i].IsActive = false
				found = true
				break
			}
		}
	case "quality":
		for i := range exportRequest.QualityDocuments {
			if exportRequest.QualityDocuments[i].Version == version {
				exportRequest.QualityDocuments[i].IsActive = false
				found = true
				break
			}
		}
	case "shipment":
		for i := range exportRequest.ShipmentDocuments {
			if exportRequest.ShipmentDocuments[i].Version == version {
				exportRequest.ShipmentDocuments[i].IsActive = false
				found = true
				break
			}
		}
	default:
		return fmt.Errorf("unknown document type: %s", docType)
	}

	if !found {
		return fmt.Errorf("document version %d not found for type %s", version, docType)
	}

	exportRequest.UpdatedAt = now
	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(exportID, exportJSON)
}

// GetExportHistory returns the history of an export request
func (c *CoffeeExportContract) GetExportHistory(
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
