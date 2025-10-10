# 🔐 Chaincode Security Improvements

This document provides enhanced security implementations for the coffee-export chaincode.

---

## Issue: Insufficient Access Control

### Current Problem
```go
// Only checks MSP ID, not specific user identity
if clientMSPID != "ExporterBankMSP" {
    return fmt.Errorf("only Exporter Bank can create export requests")
}
```

**Problems:**
- Any user from the organization can perform actions
- No role-based access control
- No audit trail of specific users
- Cannot implement principle of least privilege

---

## Enhanced Chaincode with RBAC

### Step 1: Add User Identity and Role Structures

```go
package main

import (
	"encoding/json"
	"fmt"
	"time"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// UserRole represents different roles in the system
type UserRole string

const (
	RoleExporter        UserRole = "EXPORTER"
	RoleBankOfficer     UserRole = "BANK_OFFICER"
	RoleNationalBank    UserRole = "NATIONAL_BANK_OFFICER"
	RoleNCATInspector   UserRole = "NCAT_INSPECTOR"
	RoleShippingAgent   UserRole = "SHIPPING_AGENT"
	RoleAdmin           UserRole = "ADMIN"
)

// AuditLog represents an audit trail entry
type AuditLog struct {
	Timestamp    string `json:"timestamp"`
	UserID       string `json:"userId"`
	UserMSP      string `json:"userMsp"`
	Action       string `json:"action"`
	ResourceID   string `json:"resourceId"`
	Success      bool   `json:"success"`
	ErrorMessage string `json:"errorMessage,omitempty"`
}

// Enhanced ExportRequest with audit trail
type ExportRequest struct {
	ExportID          string       `json:"exportId"`
	ExporterBankID    string       `json:"exporterBankId"`
	ExporterName      string       `json:"exporterName"`
	CoffeeType        string       `json:"coffeeType"`
	Quantity          float64      `json:"quantity"`
	DestinationCountry string      `json:"destinationCountry"`
	EstimatedValue    float64      `json:"estimatedValue"`
	Status            ExportStatus `json:"status"`
	CreatedAt         string       `json:"createdAt"`
	CreatedBy         string       `json:"createdBy"`
	UpdatedAt         string       `json:"updatedAt"`
	UpdatedBy         string       `json:"updatedBy"`
	
	// Audit trail
	AuditTrail        []AuditLog   `json:"auditTrail"`
	
	// National Bank fields
	FXDocuments       []Document   `json:"fxDocuments,omitempty"`
	FXApprovedBy      string       `json:"fxApprovedBy,omitempty"`
	FXApprovedByID    string       `json:"fxApprovedById,omitempty"`
	FXApprovedAt      string       `json:"fxApprovedAt,omitempty"`
	FXRejectionReason string       `json:"fxRejectionReason,omitempty"`
	
	// NCAT fields
	QualityDocuments  []Document   `json:"qualityDocuments,omitempty"`
	QualityGrade      string       `json:"qualityGrade,omitempty"`
	QualityCertifiedBy string      `json:"qualityCertifiedBy,omitempty"`
	QualityCertifiedByID string    `json:"qualityCertifiedById,omitempty"`
	QualityCertifiedAt string      `json:"qualityCertifiedAt,omitempty"`
	QualityRejectionReason string  `json:"qualityRejectionReason,omitempty"`
	
	// Shipping Line fields
	ShipmentDocuments []Document   `json:"shipmentDocuments,omitempty"`
	VesselName        string       `json:"vesselName,omitempty"`
	DepartureDate     string       `json:"departureDate,omitempty"`
	ArrivalDate       string       `json:"arrivalDate,omitempty"`
	ShippingLineID    string       `json:"shippingLineId,omitempty"`
	ShippedBy         string       `json:"shippedBy,omitempty"`
	ShippedByID       string       `json:"shippedById,omitempty"`
	ShippedAt         string       `json:"shippedAt,omitempty"`
}
```

### Step 2: Add Access Control Helper Functions

```go
// getClientIdentity extracts user identity from transaction context
func (c *CoffeeExportContract) getClientIdentity(ctx contractapi.TransactionContextInterface) (string, string, error) {
	clientID, err := ctx.GetClientIdentity().GetID()
	if err != nil {
		return "", "", fmt.Errorf("failed to get client ID: %v", err)
	}

	clientMSPID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return "", "", fmt.Errorf("failed to get client MSP ID: %v", err)
	}

	return clientID, clientMSPID, nil
}

// validateMSPAccess checks if the client's MSP has access to perform an action
func (c *CoffeeExportContract) validateMSPAccess(ctx contractapi.TransactionContextInterface, allowedMSPs []string) error {
	_, clientMSPID, err := c.getClientIdentity(ctx)
	if err != nil {
		return err
	}

	for _, msp := range allowedMSPs {
		if clientMSPID == msp {
			return nil
		}
	}

	return fmt.Errorf("access denied: MSP %s not authorized for this operation", clientMSPID)
}

// addAuditLog adds an audit log entry to the export request
func (c *CoffeeExportContract) addAuditLog(
	ctx contractapi.TransactionContextInterface,
	exportRequest *ExportRequest,
	action string,
	success bool,
	errorMessage string,
) {
	clientID, clientMSPID, _ := c.getClientIdentity(ctx)
	
	auditLog := AuditLog{
		Timestamp:    time.Now().UTC().Format(time.RFC3339),
		UserID:       clientID,
		UserMSP:      clientMSPID,
		Action:       action,
		ResourceID:   exportRequest.ExportID,
		Success:      success,
		ErrorMessage: errorMessage,
	}
	
	exportRequest.AuditTrail = append(exportRequest.AuditTrail, auditLog)
}

// validateInput validates and sanitizes input parameters
func validateInput(fieldName string, value string, minLen int, maxLen int) error {
	if len(value) < minLen {
		return fmt.Errorf("%s must be at least %d characters", fieldName, minLen)
	}
	if len(value) > maxLen {
		return fmt.Errorf("%s must not exceed %d characters", fieldName, maxLen)
	}
	return nil
}

// validateNumericRange validates numeric values are within acceptable range
func validateNumericRange(fieldName string, value float64, min float64, max float64) error {
	if value < min {
		return fmt.Errorf("%s must be at least %.2f", fieldName, min)
	}
	if value > max {
		return fmt.Errorf("%s must not exceed %.2f", fieldName, max)
	}
	return nil
}
```

### Step 3: Enhanced CreateExportRequest with Validation

```go
// CreateExportRequest creates a new export request with enhanced validation
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
	// Validate MSP access
	err := c.validateMSPAccess(ctx, []string{"ExporterBankMSP"})
	if err != nil {
		return err
	}

	// Enhanced input validation
	if err := validateInput("exportID", exportID, 1, 100); err != nil {
		return err
	}
	if err := validateInput("exporterBankID", exporterBankID, 1, 100); err != nil {
		return err
	}
	if err := validateInput("exporterName", exporterName, 1, 200); err != nil {
		return err
	}
	if err := validateInput("coffeeType", coffeeType, 1, 100); err != nil {
		return err
	}
	if err := validateInput("destinationCountry", destinationCountry, 1, 100); err != nil {
		return err
	}

	// Validate numeric ranges
	if err := validateNumericRange("quantity", quantity, 0.01, 1000000); err != nil {
		return err
	}
	if err := validateNumericRange("estimatedValue", estimatedValue, 0.01, 1000000000); err != nil {
		return err
	}

	// Check if export already exists
	exists, err := c.ExportExists(ctx, exportID)
	if err != nil {
		return fmt.Errorf("failed to check if export exists: %v", err)
	}
	if exists {
		return fmt.Errorf("export request %s already exists", exportID)
	}

	// Get client identity for audit trail
	clientID, clientMSPID, err := c.getClientIdentity(ctx)
	if err != nil {
		return err
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
		CreatedBy:          clientID,
		UpdatedAt:          now,
		UpdatedBy:          clientID,
		AuditTrail:         []AuditLog{},
	}

	// Add audit log
	c.addAuditLog(ctx, &exportRequest, "CREATE_EXPORT", true, "")

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return fmt.Errorf("failed to marshal export request: %v", err)
	}

	err = ctx.GetStub().PutState(exportID, exportJSON)
	if err != nil {
		return fmt.Errorf("failed to put export request to state: %v", err)
	}

	// Emit event
	eventPayload := map[string]interface{}{
		"exportId":  exportID,
		"status":    StatusPending,
		"createdBy": clientID,
		"createdAt": now,
	}
	eventJSON, _ := json.Marshal(eventPayload)
	ctx.GetStub().SetEvent("ExportCreated", eventJSON)

	return nil
}
```

### Step 4: Enhanced ApproveFX with Audit Trail

```go
// ApproveFX approves foreign exchange with enhanced security
func (c *CoffeeExportContract) ApproveFX(
	ctx contractapi.TransactionContextInterface,
	exportID string,
	fxApprovalID string,
	approvedBy string,
) error {
	// Validate MSP access
	err := c.validateMSPAccess(ctx, []string{"NationalBankMSP"})
	if err != nil {
		return err
	}

	// Validate inputs
	if err := validateInput("exportID", exportID, 1, 100); err != nil {
		return err
	}
	if err := validateInput("fxApprovalID", fxApprovalID, 1, 100); err != nil {
		return err
	}
	if err := validateInput("approvedBy", approvedBy, 1, 200); err != nil {
		return err
	}

	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return err
	}

	// Validate state transition
	if exportRequest.Status != StatusPending {
		c.addAuditLog(ctx, exportRequest, "APPROVE_FX", false, 
			fmt.Sprintf("Invalid status: %s", exportRequest.Status))
		return fmt.Errorf("export request must be in PENDING status to approve FX, current status: %s", exportRequest.Status)
	}

	// Get client identity
	clientID, _, err := c.getClientIdentity(ctx)
	if err != nil {
		return err
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
	exportRequest.FXApprovedByID = clientID
	exportRequest.FXApprovedAt = now
	exportRequest.UpdatedAt = now
	exportRequest.UpdatedBy = clientID

	// Add audit log
	c.addAuditLog(ctx, exportRequest, "APPROVE_FX", true, "")

	exportJSON, err := json.Marshal(exportRequest)
	if err != nil {
		return err
	}

	err = ctx.GetStub().PutState(exportID, exportJSON)
	if err != nil {
		return err
	}

	// Emit event
	eventPayload := map[string]interface{}{
		"exportId":   exportID,
		"status":     StatusFXApproved,
		"approvedBy": clientID,
		"approvedAt": now,
	}
	eventJSON, _ := json.Marshal(eventPayload)
	ctx.GetStub().SetEvent("FXApproved", eventJSON)

	return nil
}
```

### Step 5: Add Query Functions for Audit Trail

```go
// GetAuditTrail returns the complete audit trail for an export
func (c *CoffeeExportContract) GetAuditTrail(
	ctx contractapi.TransactionContextInterface,
	exportID string,
) ([]AuditLog, error) {
	exportRequest, err := c.GetExportRequest(ctx, exportID)
	if err != nil {
		return nil, err
	}

	return exportRequest.AuditTrail, nil
}

// GetExportsByUser returns all exports created or modified by a specific user
func (c *CoffeeExportContract) GetExportsByUser(
	ctx contractapi.TransactionContextInterface,
	userID string,
) ([]*ExportRequest, error) {
	queryString := fmt.Sprintf(`{
		"selector": {
			"$or": [
				{"createdBy": "%s"},
				{"updatedBy": "%s"}
			]
		}
	}`, userID, userID)

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

// GetExportsByDateRange returns exports created within a date range
func (c *CoffeeExportContract) GetExportsByDateRange(
	ctx contractapi.TransactionContextInterface,
	startDate string,
	endDate string,
) ([]*ExportRequest, error) {
	queryString := fmt.Sprintf(`{
		"selector": {
			"createdAt": {
				"$gte": "%s",
				"$lte": "%s"
			}
		}
	}`, startDate, endDate)

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

// GetExportStatistics returns statistics about exports
func (c *CoffeeExportContract) GetExportStatistics(
	ctx contractapi.TransactionContextInterface,
) (map[string]interface{}, error) {
	// This would require CouchDB views or aggregation
	// For now, return basic stats by iterating
	
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	stats := map[string]interface{}{
		"total":     0,
		"byStatus":  make(map[ExportStatus]int),
		"totalValue": 0.0,
	}

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

		stats["total"] = stats["total"].(int) + 1
		statusMap := stats["byStatus"].(map[ExportStatus]int)
		statusMap[exportRequest.Status]++
		stats["totalValue"] = stats["totalValue"].(float64) + exportRequest.EstimatedValue
	}

	return stats, nil
}
```

### Step 6: Add Pagination Support

```go
// PaginatedQueryResult represents a paginated query result
type PaginatedQueryResult struct {
	Records     []*ExportRequest `json:"records"`
	Bookmark    string           `json:"bookmark"`
	HasMore     bool             `json:"hasMore"`
	TotalCount  int              `json:"totalCount"`
}

// GetExportsWithPagination returns exports with pagination support
func (c *CoffeeExportContract) GetExportsWithPagination(
	ctx contractapi.TransactionContextInterface,
	pageSize int32,
	bookmark string,
) (*PaginatedQueryResult, error) {
	if pageSize <= 0 || pageSize > 100 {
		pageSize = 10 // Default page size
	}

	queryString := `{"selector":{}}`
	
	resultsIterator, responseMetadata, err := ctx.GetStub().GetQueryResultWithPagination(
		queryString,
		pageSize,
		bookmark,
	)
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

	result := &PaginatedQueryResult{
		Records:    exports,
		Bookmark:   responseMetadata.Bookmark,
		HasMore:    responseMetadata.FetchedRecordsCount == pageSize,
		TotalCount: int(responseMetadata.FetchedRecordsCount),
	}

	return result, nil
}
```

---

## Deployment Steps

1. **Update Chaincode**
   ```bash
   cd chaincode/coffee-export
   # Backup current version
   cp contract.go contract.go.backup
   
   # Update with new code
   # ... paste enhanced code ...
   
   # Test compilation
   go mod tidy
   go build
   ```

2. **Package New Version**
   ```bash
   cd network
   ./network.sh deployCC -ccn coffee-export -ccs 2 -ccv 2.0
   ```

3. **Test New Functions**
   ```bash
   # Test audit trail
   peer chaincode query -C coffeechannel -n coffee-export \
     -c '{"function":"GetAuditTrail","Args":["EXP-123"]}'
   
   # Test pagination
   peer chaincode query -C coffeechannel -n coffee-export \
     -c '{"function":"GetExportsWithPagination","Args":["10",""]}'
   ```

---

## Benefits of Enhanced Chaincode

1. **Improved Security**
   - User-level access control
   - Complete audit trail
   - Input validation and sanitization

2. **Better Compliance**
   - Full audit logs for regulatory requirements
   - User accountability
   - Tamper-proof history

3. **Enhanced Functionality**
   - Pagination for large datasets
   - Advanced queries
   - Statistics and reporting

4. **Operational Excellence**
   - Better error messages
   - Event emissions for monitoring
   - Performance optimizations

---

## Testing Checklist

- [ ] Test MSP access control
- [ ] Verify audit trail creation
- [ ] Test input validation
- [ ] Verify pagination works
- [ ] Test all query functions
- [ ] Verify events are emitted
- [ ] Test error handling
- [ ] Performance test with large datasets
- [ ] Security audit of new code
- [ ] Documentation updated

---

**Implementation Priority:** HIGH  
**Estimated Time:** 3-4 days  
**Testing Time:** 2-3 days
