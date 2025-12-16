package main

import (
	"encoding/json"
	"fmt"
	"time"
	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

type CoffeeExportContract struct {
	contractapi.Contract
}

type ExportRequest struct {
	ExportID           string              `json:"exportId"`
	ExporterID         string              `json:"exporterId"`
	CoffeeType         string              `json:"coffeeType"`
	Quantity           float64             `json:"quantity"`
	Destination        string              `json:"destination"`
	EstimatedValue     float64             `json:"estimatedValue"`
	Status             ExportStatus        `json:"status"`
	CreatedAt          string              `json:"createdAt"`
	UpdatedAt          string              `json:"updatedAt"`
	CreatedBy          string              `json:"createdBy"`
	QualityGrade       string              `json:"qualityGrade"`
	FXRetention        FXRetention         `json:"fxRetention"`
	ExportMode         ExportMode          `json:"exportMode,omitempty"`
	OriginRegion       string              `json:"originRegion,omitempty"`
	ModeSelectedAt     string              `json:"modeSelectedAt,omitempty"`
	ModeSelectedBy     string              `json:"modeSelectedBy,omitempty"`
	DocumentChecklist  *DocumentChecklist  `json:"documentChecklist,omitempty"`
	DocumentUploads    []DocumentUpload    `json:"documentUploads,omitempty"`
}

// FXRetention represents foreign exchange retention details
type FXRetention struct {
	TotalAmount          float64 `json:"totalAmount"`
	ExchangeRate         float64 `json:"exchangeRate"`
	ETBConverted         float64 `json:"etbConverted"`
	RetainedUSD          float64 `json:"retainedUSD"`
	ConversionDate       string  `json:"conversionDate"`
	ConversionPercentage float64 `json:"conversionPercentage"`
	RetentionPercentage  float64 `json:"retentionPercentage"`
	RepatriationDeadline string  `json:"repatriationDeadline"`
	RepatriatedAmount    float64 `json:"repatriatedAmount"`
	RepatriationDate     string  `json:"repatriationDate"`
	IsDelinquent         bool    `json:"isDelinquent"`
	DaysUntilDeadline    int     `json:"daysUntilDeadline"`
	DaysOverdue          int     `json:"daysOverdue"`
	PenaltyAmount        float64 `json:"penaltyAmount"`
	PenaltyRate          float64 `json:"penaltyRate"`
}

// ExportMode represents the export mode
type ExportMode string

const (
	ModeHorizontal ExportMode = "HORIZONTAL"
	ModeVertical   ExportMode = "VERTICAL"
)

// DocumentStatus represents the status of a document
type DocumentStatus string

const (
	DocNotRequired DocumentStatus = "NOT_REQUIRED"
	DocPending     DocumentStatus = "PENDING"
	DocUploaded    DocumentStatus = "UPLOADED"
	DocVerified    DocumentStatus = "VERIFIED"
	DocRejected    DocumentStatus = "REJECTED"
)

// DocumentUpload represents a document upload record
type DocumentUpload struct {
	DocumentType    string         `json:"documentType"`
	CID             string         `json:"cid"`
	UploadedAt      string         `json:"uploadedAt"`
	UploadedBy      string         `json:"uploadedBy"`
	VerifiedAt      string         `json:"verifiedAt,omitempty"`
	VerifiedBy      string         `json:"verifiedBy,omitempty"`
	Status          DocumentStatus `json:"status"`
	RejectionReason string         `json:"rejectionReason,omitempty"`
}

// DocumentChecklist represents the document checklist for an export
type DocumentChecklist struct {
	ExportLicense      DocumentStatus `json:"exportLicense"`
	VerticalContract   DocumentStatus `json:"verticalContract"`
	ECXContract        DocumentStatus `json:"ecxContract"`
	WarehouseReceipt   DocumentStatus `json:"warehouseReceipt"`
	SalesContract      DocumentStatus `json:"salesContract"`
	Invoice            DocumentStatus `json:"invoice"`
	QualityCert        DocumentStatus `json:"qualityCert"`
	OriginCert         DocumentStatus `json:"originCert"`
	DispatchLetter     DocumentStatus `json:"dispatchLetter"`
	CustomsDeclaration DocumentStatus `json:"customsDeclaration"`
}

// RegionModeMapping represents region-to-mode mapping
type RegionModeMapping struct {
	Region          string       `json:"region"`
	RecommendedMode ExportMode   `json:"recommendedMode"`
	AllowedModes    []ExportMode `json:"allowedModes"`
}

func (c *CoffeeExportContract) CreateExport(ctx contractapi.TransactionContextInterface, exportData string) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	
	if clientMSPID != "CommercialBankMSP" && clientMSPID != "ExporterMSP" {
		return fmt.Errorf("unauthorized: only Commercial Banks and Exporters can create exports")
	}
	
	var export ExportRequest
	err = json.Unmarshal([]byte(exportData), &export)
	if err != nil {
		return fmt.Errorf("failed to unmarshal export data: %v", err)
	}
	
	existing, _ := ctx.GetStub().GetState(export.ExportID)
	if existing != nil {
		return fmt.Errorf("export %s already exists", export.ExportID)
	}
	
	if err := ValidateExportID(export.ExportID); err != nil {
		return err
	}
	if err := ValidateCoffeeType(export.CoffeeType); err != nil {
		return err
	}
	if err := ValidateQuantity(export.Quantity); err != nil {
		return err
	}
	if err := ValidateEstimatedValue(export.EstimatedValue); err != nil {
		return err
	}
	
	now := time.Now().UTC().Format(time.RFC3339)
	export.CreatedAt = now
	export.UpdatedAt = now
	export.CreatedBy = clientMSPID
	export.Status = "PENDING"
	
	exporterKey, err := ctx.GetStub().CreateCompositeKey("exporter~export", []string{export.ExporterID, export.ExportID})
	if err != nil {
		return fmt.Errorf("failed to create composite key: %v", err)
	}
	
	exportBytes, _ := json.Marshal(export)
	if err := ctx.GetStub().PutState(export.ExportID, exportBytes); err != nil {
		return err
	}
	if err := ctx.GetStub().PutState(exporterKey, []byte{0x00}); err != nil {
		return err
	}
	
	eventPayload := map[string]interface{}{
		"exportId": export.ExportID,
		"action": "CREATE",
		"timestamp": now,
		"actor": clientMSPID,
	}
	eventBytes, _ := json.Marshal(eventPayload)
	ctx.GetStub().SetEvent("ExportCreated", eventBytes)
	
	return nil
}

func (c *CoffeeExportContract) GetExport(ctx contractapi.TransactionContextInterface, exportID string) (*ExportRequest, error) {
	exportBytes, err := ctx.GetStub().GetState(exportID)
	if err != nil {
		return nil, fmt.Errorf("failed to read export %s: %v", exportID, err)
	}
	if exportBytes == nil {
		return nil, fmt.Errorf("export %s does not exist", exportID)
	}

	var export ExportRequest
	err = json.Unmarshal(exportBytes, &export)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal export: %v", err)
	}

	return &export, nil
}

func (c *CoffeeExportContract) GetExportsByExporter(ctx contractapi.TransactionContextInterface, exporterID string) ([]*ExportRequest, error) {
	resultsIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("exporter~export", []string{exporterID})
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
		
		_, compositeKeyParts, err := ctx.GetStub().SplitCompositeKey(queryResponse.Key)
		if err != nil {
			return nil, err
		}
		
		exportID := compositeKeyParts[1]
		export, err := c.GetExport(ctx, exportID)
		if err != nil {
			continue
		}
		exports = append(exports, export)
	}
	
	return exports, nil
}

func (c *CoffeeExportContract) GetAllExports(ctx contractapi.TransactionContextInterface) ([]*ExportRequest, error) {
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

		var export ExportRequest
		err = json.Unmarshal(queryResponse.Value, &export)
		if err != nil {
			continue
		}
		exports = append(exports, &export)
	}

	return exports, nil
}

func (c *CoffeeExportContract) UpdateExportStatus(ctx contractapi.TransactionContextInterface, exportID string, status ExportStatus) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	
	export, err := c.GetExport(ctx, exportID)
	if err != nil {
		return err
	}
	
	if !isValidStatusTransition(export.Status, status, clientMSPID) {
		return fmt.Errorf("invalid status transition from %s to %s by %s", export.Status, status, clientMSPID)
	}
	
	export.Status = status
	export.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	
	exportBytes, _ := json.Marshal(export)
	if err := ctx.GetStub().PutState(exportID, exportBytes); err != nil {
		return err
	}
	
	eventPayload := map[string]interface{}{
		"exportId": exportID,
		"action": "STATUS_UPDATE",
		"newStatus": status,
		"timestamp": export.UpdatedAt,
		"actor": clientMSPID,
	}
	eventBytes, _ := json.Marshal(eventPayload)
	ctx.GetStub().SetEvent("ExportStatusUpdated", eventBytes)
	
	return nil
}

func isValidStatusTransition(currentStatus, newStatus ExportStatus, mspID string) bool {
	transitions := map[string]map[string][]string{
		"PENDING": {
			"ECTA_APPROVED": []string{"ECTAMSP"},
			"REJECTED": []string{"ECTAMSP", "NationalBankMSP", "CustomAuthoritiesMSP"},
		},
		"ECTA_APPROVED": {
			"QUALITY_CERTIFIED": []string{"ECTAMSP"},
			"REJECTED": []string{"ECTAMSP"},
		},
		"QUALITY_CERTIFIED": {
			"NBE_APPROVED": []string{"NationalBankMSP"},
			"REJECTED": []string{"NationalBankMSP"},
		},
		"NBE_APPROVED": {
			"CUSTOMS_CLEARED": []string{"CustomAuthoritiesMSP"},
			"REJECTED": []string{"CustomAuthoritiesMSP"},
		},
		"CUSTOMS_CLEARED": {
			"SHIPPED": []string{"ShippingLineMSP"},
		},
		"SHIPPED": {
			"DELIVERED": []string{"ShippingLineMSP"},
		},
	}
	
	allowedMSPs, exists := transitions[string(currentStatus)][string(newStatus)]
	if !exists {
		return false
	}
	
	for _, allowedMSP := range allowedMSPs {
		if mspID == allowedMSP {
			return true
		}
	}
	
	return false
}
