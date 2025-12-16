package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

// ============================================================================
// PHASE 2: MODE SELECTION & DOCUMENT MANAGEMENT
// ============================================================================

// ExportMode represents the export mode (Horizontal or Vertical)
// ============================================================================
// MODE SELECTION FUNCTIONS
// ============================================================================

// StoreRegionModeMapping stores region-to-mode mappings
func (c *CoffeeExportContract) StoreRegionModeMapping(
	ctx contractapi.TransactionContextInterface,
	mappingsJSON string,
) error {
	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get client MSP ID: %v", err)
	}
	if clientMSPID != "ECTAMSP" && clientMSPID != "AdminMSP" {
		return fmt.Errorf("only ECTA or Admin can store region-mode mappings, got MSP ID: %s", clientMSPID)
	}

	var mappings []RegionModeMapping
	if err := json.Unmarshal([]byte(mappingsJSON), &mappings); err != nil {
		return fmt.Errorf("failed to parse mappings: %v", err)
	}

	for _, mapping := range mappings {
		key := fmt.Sprintf("REGION-MODE-%s", mapping.Region)
		mappingJSON, err := json.Marshal(mapping)
		if err != nil {
			return fmt.Errorf("failed to marshal mapping: %v", err)
		}
		if err := ctx.GetStub().PutState(key, mappingJSON); err != nil {
			return fmt.Errorf("failed to store mapping: %v", err)
		}
	}

	return nil
}

// GetRecommendedMode returns recommended mode for a region
func (c *CoffeeExportContract) GetRecommendedMode(
	ctx contractapi.TransactionContextInterface,
	region string,
) (ExportMode, error) {
	key := fmt.Sprintf("REGION-MODE-%s", region)
	
	mappingJSON, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("failed to get region mapping: %v", err)
	}
	if mappingJSON == nil {
		return ModeVertical, nil // Default to vertical
	}

	var mapping RegionModeMapping
	if err := json.Unmarshal(mappingJSON, &mapping); err != nil {
		return "", fmt.Errorf("failed to unmarshal mapping: %v", err)
	}

	return mapping.RecommendedMode, nil
}

// SelectExportMode allows exporter to select mode
func (c *CoffeeExportContract) SelectExportMode(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	mode ExportMode,
	region string,
) error {
	exportRequest, err := c.GetExport(ctx, exportID)
	if err != nil {
		return err
	}

	// Validate status
	if exportRequest.Status != StatusDraft {
		return fmt.Errorf("can only select mode for DRAFT exports, current status: %s", exportRequest.Status)
	}

	// Validate mode
	if mode != ModeHorizontal && mode != ModeVertical {
		return fmt.Errorf("invalid mode: %s", mode)
	}

	// Get recommended mode for region
	recommendedMode, err := c.GetRecommendedMode(ctx, region)
	if err != nil {
		return fmt.Errorf("failed to get recommended mode: %v", err)
	}

	// Warn if mode doesn't match recommendation (but allow it)
	if mode != recommendedMode {
		// Log warning - could emit event
	}

	now := time.Now().UTC().Format(time.RFC3339)
	callerID, _ := ctx.GetClientIdentity().GetID()

	// Update export with mode selection
	exportRequest.ExportMode = mode
	exportRequest.OriginRegion = region
	exportRequest.ModeSelectedAt = now
	exportRequest.ModeSelectedBy = callerID
	exportRequest.UpdatedAt = now

	// Initialize document checklist based on mode
	if err := c.initializeDocumentChecklist(exportRequest, mode); err != nil {
		return fmt.Errorf("failed to initialize document checklist: %v", err)
	}

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal export request: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// GetExportsByMode returns exports by mode
func (c *CoffeeExportContract) GetExportsByMode(
	ctx contractapi.TransactionContextInterface,
	mode ExportMode,
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

		if exportRequest.ExportMode == mode {
			exports = append(exports, &exportRequest)
		}
	}

	return exports, nil
}

// GetModeUsageReport returns mode usage statistics
func (c *CoffeeExportContract) GetModeUsageReport(
	ctx contractapi.TransactionContextInterface,
) (map[string]interface{}, error) {
	verticalExports, err := c.GetExportsByMode(ctx, ModeVertical)
	if err != nil {
		return nil, err
	}

	horizontalExports, err := c.GetExportsByMode(ctx, ModeHorizontal)
	if err != nil {
		return nil, err
	}

	total := len(verticalExports) + len(horizontalExports)
	verticalPercentage := 0.0
	horizontalPercentage := 0.0

	if total > 0 {
		verticalPercentage = (float64(len(verticalExports)) / float64(total)) * 100
		horizontalPercentage = (float64(len(horizontalExports)) / float64(total)) * 100
	}

	report := map[string]interface{}{
		"reportType":           "MODE_USAGE_REPORT",
		"generatedAt":          time.Now().UTC().Format(time.RFC3339),
		"totalExports":         total,
		"verticalMode":         len(verticalExports),
		"verticalPercentage":   verticalPercentage,
		"horizontalMode":       len(horizontalExports),
		"horizontalPercentage": horizontalPercentage,
	}

	return report, nil
}

// ============================================================================
// DOCUMENT MANAGEMENT FUNCTIONS
// ============================================================================

// InitializeDocumentChecklist initializes document checklist based on mode
func (c *CoffeeExportContract) initializeDocumentChecklist(
	exportRequest *ExportRequest,
	mode ExportMode,
) error {
	// Initialize checklist based on mode
	checklist := DocumentChecklist{
		ExportLicense:      DocPending,
		SalesContract:      DocPending,
		Invoice:            DocPending,
		QualityCert:        DocPending,
		OriginCert:         DocPending,
		DispatchLetter:     DocPending,
		CustomsDeclaration: DocPending,
	}

	// Mode-specific documents
	if mode == ModeHorizontal {
		checklist.ECXContract = DocPending
		checklist.WarehouseReceipt = DocPending
		checklist.VerticalContract = DocNotRequired
	} else if mode == ModeVertical {
		checklist.VerticalContract = DocPending
		checklist.ECXContract = DocNotRequired
		checklist.WarehouseReceipt = DocNotRequired
	}

	exportRequest.DocumentChecklist = &checklist
	exportRequest.DocumentUploads = []DocumentUpload{}

	return nil
}

// UploadDocument uploads a document and updates checklist
func (c *CoffeeExportContract) UploadDocument(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	documentType string,
	cid string,
) error {
	exportRequest, err := c.GetExport(ctx, exportID)
	if err != nil {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	callerID, _ := ctx.GetClientIdentity().GetID()

	// Create document upload record
	upload := DocumentUpload{
		DocumentType: documentType,
		CID:          cid,
		UploadedAt:   now,
		UploadedBy:   callerID,
		Status:       DocUploaded,
	}

	exportRequest.DocumentUploads = append(exportRequest.DocumentUploads, upload)

	// Update checklist status
	c.updateChecklistStatus(exportRequest, documentType, DocUploaded)

	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal export request: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// DocumentValidationResult represents the result of document validation
type DocumentValidationResult struct {
	IsComplete   bool     `json:"isComplete"`
	MissingDocs  []string `json:"missingDocs"`
}

// ValidateDocumentCompleteness checks if all required documents are uploaded
func (c *CoffeeExportContract) ValidateDocumentCompleteness(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) (*DocumentValidationResult, error) {
	exportRequest, err := c.GetExport(ctx, exportID)
	if err != nil {
		return nil, err
	}

	var missingDocs []string
	checklist := exportRequest.DocumentChecklist

	// Check required documents
	if checklist.ExportLicense != DocUploaded && checklist.ExportLicense != DocVerified {
		missingDocs = append(missingDocs, "EXPORT_LICENSE")
	}
	if checklist.SalesContract != DocUploaded && checklist.SalesContract != DocVerified {
		missingDocs = append(missingDocs, "SALES_CONTRACT")
	}
	if checklist.Invoice != DocUploaded && checklist.Invoice != DocVerified {
		missingDocs = append(missingDocs, "INVOICE")
	}
	if checklist.QualityCert != DocUploaded && checklist.QualityCert != DocVerified {
		missingDocs = append(missingDocs, "QUALITY_CERT")
	}
	if checklist.OriginCert != DocUploaded && checklist.OriginCert != DocVerified {
		missingDocs = append(missingDocs, "ORIGIN_CERT")
	}
	if checklist.DispatchLetter != DocUploaded && checklist.DispatchLetter != DocVerified {
		missingDocs = append(missingDocs, "DISPATCH_LETTER")
	}
	if checklist.CustomsDeclaration != DocUploaded && checklist.CustomsDeclaration != DocVerified {
		missingDocs = append(missingDocs, "CUSTOMS_DECLARATION")
	}

	// Mode-specific checks
	if exportRequest.ExportMode == ModeHorizontal {
		if checklist.ECXContract != DocUploaded && checklist.ECXContract != DocVerified {
			missingDocs = append(missingDocs, "ECX_CONTRACT")
		}
		if checklist.WarehouseReceipt != DocUploaded && checklist.WarehouseReceipt != DocVerified {
			missingDocs = append(missingDocs, "WAREHOUSE_RECEIPT")
		}
	} else if exportRequest.ExportMode == ModeVertical {
		if checklist.VerticalContract != DocUploaded && checklist.VerticalContract != DocVerified {
			missingDocs = append(missingDocs, "VERTICAL_CONTRACT")
		}
	}

	isComplete := len(missingDocs) == 0

	return &DocumentValidationResult{
		IsComplete:  isComplete,
		MissingDocs: missingDocs,
	}, nil
}

// VerifyDocument marks a document as verified
func (c *CoffeeExportContract) VerifyDocument(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	documentType string,
) error {
	exportRequest, err := c.GetExport(ctx, exportID)
	if err != nil {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	callerID, _ := ctx.GetClientIdentity().GetID()

	// Find and update document
	for i, upload := range exportRequest.DocumentUploads {
		if upload.DocumentType == documentType {
			exportRequest.DocumentUploads[i].Status = DocVerified
			exportRequest.DocumentUploads[i].VerifiedAt = now
			exportRequest.DocumentUploads[i].VerifiedBy = callerID
			break
		}
	}

	// Update checklist status
	c.updateChecklistStatus(exportRequest, documentType, DocVerified)

	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal export request: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// RejectDocument marks a document as rejected
func (c *CoffeeExportContract) RejectDocument(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	documentType string,
	rejectionReason string,
) error {
	exportRequest, err := c.GetExport(ctx, exportID)
	if err != nil {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	callerID, _ := ctx.GetClientIdentity().GetID()

	// Find and update document
	for i, upload := range exportRequest.DocumentUploads {
		if upload.DocumentType == documentType {
			exportRequest.DocumentUploads[i].Status = DocRejected
			exportRequest.DocumentUploads[i].RejectionReason = rejectionReason
			exportRequest.DocumentUploads[i].VerifiedAt = now
			exportRequest.DocumentUploads[i].VerifiedBy = callerID
			break
		}
	}

	// Update checklist status
	c.updateChecklistStatus(exportRequest, documentType, DocRejected)

	exportRequest.UpdatedAt = now

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal export request: %v", err)
	}

	return ctx.GetStub().PutState(exportID, exportJSON)
}

// GetDocumentStatus returns the status of all documents for an export
func (c *CoffeeExportContract) GetDocumentStatus(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) (map[string]interface{}, error) {
	exportRequest, err := c.GetExport(ctx, exportID)
	if err != nil {
		return nil, err
	}

	status := map[string]interface{}{
		"exportId":           exportID,
		"mode":               exportRequest.ExportMode,
		"checklist":          exportRequest.DocumentChecklist,
		"uploads":            exportRequest.DocumentUploads,
		"isComplete":         false,
		"missingDocuments":   []string{},
	}

	// Check completeness
	result, err := c.ValidateDocumentCompleteness(ctx, exportID)
	if err == nil {
		status["isComplete"] = result.IsComplete
		status["missingDocuments"] = result.MissingDocs
	}

	return status, nil
}

// GetExportsByDocumentStatus returns exports by document completion status
func (c *CoffeeExportContract) GetExportsByDocumentStatus(
	ctx contractapi.TransactionContextInterface,
	isComplete bool,
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

		result, err := c.ValidateDocumentCompleteness(ctx, exportRequest.ExportID)
		if err == nil && result.IsComplete == isComplete {
			exports = append(exports, &exportRequest)
		}
	}

	return exports, nil
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

// updateChecklistStatus updates the checklist status for a document type
func (c *CoffeeExportContract) updateChecklistStatus(
	exportRequest *ExportRequest,
	documentType string,
	status DocumentStatus,
) {
	switch documentType {
	case "EXPORT_LICENSE":
		exportRequest.DocumentChecklist.ExportLicense = status
	case "VERTICAL_CONTRACT":
		exportRequest.DocumentChecklist.VerticalContract = status
	case "ECX_CONTRACT":
		exportRequest.DocumentChecklist.ECXContract = status
	case "WAREHOUSE_RECEIPT":
		exportRequest.DocumentChecklist.WarehouseReceipt = status
	case "SALES_CONTRACT":
		exportRequest.DocumentChecklist.SalesContract = status
	case "INVOICE":
		exportRequest.DocumentChecklist.Invoice = status
	case "QUALITY_CERT":
		exportRequest.DocumentChecklist.QualityCert = status
	case "ORIGIN_CERT":
		exportRequest.DocumentChecklist.OriginCert = status
	case "DISPATCH_LETTER":
		exportRequest.DocumentChecklist.DispatchLetter = status
	case "CUSTOMS_DECLARATION":
		exportRequest.DocumentChecklist.CustomsDeclaration = status
	}
}

// ============================================================================
// END PHASE 2: MODE SELECTION & DOCUMENT MANAGEMENT
// ============================================================================
