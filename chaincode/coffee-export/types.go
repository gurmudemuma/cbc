package main

// ============================================================================
// TYPE DEFINITIONS FOR COFFEE EXPORT CHAINCODE
// ============================================================================

// ExportStatus represents the status of an export
type ExportStatus string

const (
	StatusDraft                  ExportStatus = "DRAFT"
	StatusPending                ExportStatus = "PENDING"
	StatusECTAApproved           ExportStatus = "ECTA_APPROVED"
	StatusECTAQualityApproved    ExportStatus = "ECTA_QUALITY_APPROVED"
	StatusECTAContractApproved   ExportStatus = "ECTA_CONTRACT_APPROVED"
	StatusQualityCertified       ExportStatus = "QUALITY_CERTIFIED"
	StatusNBEApproved            ExportStatus = "NBE_APPROVED"
	StatusPaymentReceived        ExportStatus = "PAYMENT_RECEIVED"
	StatusCustomsCleared         ExportStatus = "CUSTOMS_CLEARED"
	StatusShipped                ExportStatus = "SHIPPED"
	StatusDelivered              ExportStatus = "DELIVERED"
	StatusSettled                ExportStatus = "SETTLED"
	StatusDelinquent             ExportStatus = "DELINQUENT"
	StatusRejected               ExportStatus = "REJECTED"
	StatusCancelled              ExportStatus = "CANCELLED"
)

// MRPRecord represents Minimum Reference Price record from ECTA
type MRPRecord struct {
	CoffeeType    string  `json:"coffeeType"`
	Region        string  `json:"region"`
	Grade         string  `json:"grade"`
	MinimumPrice  float64 `json:"minimumPrice"`
	Currency      string  `json:"currency"`
	EffectiveDate string  `json:"effectiveDate"`
	ExpiryDate    string  `json:"expiryDate"`
	IsActive      bool    `json:"isActive"`
	UpdatedBy     string  `json:"updatedBy"`
	UpdatedAt     string  `json:"updatedAt"`
}

// TransportMode represents the mode of transport
type TransportMode string

const (
	ModeSea  TransportMode = "SEA"
	ModeAir  TransportMode = "AIR"
	ModeRail TransportMode = "RAIL"
	ModeRoad TransportMode = "ROAD"
)

// PaymentMethod represents payment method for exports
type PaymentMethod string

const (
	PaymentLC      PaymentMethod = "L/C"      // Letter of Credit
	PaymentCAD     PaymentMethod = "CAD"      // Cash Against Documents
	PaymentAdvance PaymentMethod = "ADVANCE"  // Advance Payment
	PaymentDP      PaymentMethod = "DP"       // Documents against Payment
)

// CoffeeGrade represents coffee quality grades
type CoffeeGrade string

const (
	GradeOne      CoffeeGrade = "Grade 1"
	GradeTwo      CoffeeGrade = "Grade 2"
	GradeThree    CoffeeGrade = "Grade 3"
	GradeFour     CoffeeGrade = "Grade 4"
	GradeFive     CoffeeGrade = "Grade 5"
	GradePremium  CoffeeGrade = "Premium"
	GradeStandard CoffeeGrade = "Standard"
)

// CoffeeType represents types of Ethiopian coffee
type CoffeeType string

const (
	TypeArabica CoffeeType = "Arabica"
	TypeRobusta CoffeeType = "Robusta"
	TypeWashed  CoffeeType = "Washed"
	TypeNatural CoffeeType = "Natural"
)

// Additional status constants
const (
	StatusFXRepatriated ExportStatus = "FX_REPATRIATED"
	StatusCompleted     ExportStatus = "COMPLETED"
)
