package main

import (
	"fmt"
	"regexp"
	"strings"
	"unicode/utf8"
)

// Validation constants
const (
	MaxStringLength        = 500
	MaxQuantity            = 1000000.0 // 1 million kg
	MinQuantity            = 0.1       // 100 grams
	MaxEstimatedValue      = 100000000 // 100 million USD
	MinEstimatedValue      = 1.0
	MaxCoffeeTypeLength    = 100
	MaxCountryNameLength   = 100
	MaxExporterNameLength  = 200
	MaxLicenseNumberLength = 50
	MaxReasonLength        = 1000
)

// ValidateExportID validates the export ID format
func ValidateExportID(exportID string) error {
	if exportID == "" {
		return fmt.Errorf("export ID cannot be empty")
	}
	if utf8.RuneCountInString(exportID) > MaxStringLength {
		return fmt.Errorf("export ID exceeds maximum length of %d characters", MaxStringLength)
	}
	// Check for valid characters (alphanumeric, hyphens, underscores)
	matched, _ := regexp.MatchString("^[a-zA-Z0-9_-]+$", exportID)
	if !matched {
		return fmt.Errorf("export ID contains invalid characters (only alphanumeric, hyphens, and underscores allowed)")
	}
	return nil
}

// ValidateExporterName validates the exporter name
func ValidateExporterName(name string) error {
	if name == "" {
		return fmt.Errorf("exporter name cannot be empty")
	}
	if utf8.RuneCountInString(name) > MaxExporterNameLength {
		return fmt.Errorf("exporter name exceeds maximum length of %d characters", MaxExporterNameLength)
	}
	// Check for control characters
	if containsControlCharacters(name) {
		return fmt.Errorf("exporter name contains invalid control characters")
	}
	return nil
}

// ValidateCoffeeType validates the coffee type
func ValidateCoffeeType(coffeeType string) error {
	if coffeeType == "" {
		return fmt.Errorf("coffee type cannot be empty")
	}
	if utf8.RuneCountInString(coffeeType) > MaxCoffeeTypeLength {
		return fmt.Errorf("coffee type exceeds maximum length of %d characters", MaxCoffeeTypeLength)
	}
	// Check for control characters
	if containsControlCharacters(coffeeType) {
		return fmt.Errorf("coffee type contains invalid control characters")
	}
	// Accept any coffee type - frontend provides the list
	return nil
}

// ValidateQuantity validates the coffee quantity
func ValidateQuantity(quantity float64) error {
	if quantity < MinQuantity {
		return fmt.Errorf("quantity must be at least %.2f kg", MinQuantity)
	}
	if quantity > MaxQuantity {
		return fmt.Errorf("quantity cannot exceed %.0f kg", MaxQuantity)
	}
	// Check for reasonable precision (max 2 decimal places)
	if !isValidPrecision(quantity, 2) {
		return fmt.Errorf("quantity can have at most 2 decimal places")
	}
	return nil
}

// ValidateEstimatedValue validates the estimated value
func ValidateEstimatedValue(value float64) error {
	if value < MinEstimatedValue {
		return fmt.Errorf("estimated value must be at least $%.2f", MinEstimatedValue)
	}
	if value > MaxEstimatedValue {
		return fmt.Errorf("estimated value cannot exceed $%.0f", MaxEstimatedValue)
	}
	// Check for reasonable precision (max 2 decimal places)
	if !isValidPrecision(value, 2) {
		return fmt.Errorf("estimated value can have at most 2 decimal places")
	}
	return nil
}

// ValidateDestinationCountry validates the destination country
func ValidateDestinationCountry(country string) error {
	if country == "" {
		return fmt.Errorf("destination country cannot be empty")
	}
	if utf8.RuneCountInString(country) > MaxCountryNameLength {
		return fmt.Errorf("destination country exceeds maximum length of %d characters", MaxCountryNameLength)
	}
	// Check for valid characters (letters, spaces, hyphens)
	matched, _ := regexp.MatchString("^[a-zA-Z\\s-]+$", country)
	if !matched {
		return fmt.Errorf("destination country contains invalid characters")
	}
	return nil
}

// ValidateLicenseNumber validates the export license number
func ValidateLicenseNumber(licenseNumber string) error {
	if licenseNumber == "" {
		return fmt.Errorf("export license number cannot be empty")
	}
	if utf8.RuneCountInString(licenseNumber) > MaxLicenseNumberLength {
		return fmt.Errorf("export license number exceeds maximum length of %d characters", MaxLicenseNumberLength)
	}
	// Check for valid characters (alphanumeric, hyphens, slashes)
	matched, _ := regexp.MatchString("^[a-zA-Z0-9/-]+$", licenseNumber)
	if !matched {
		return fmt.Errorf("export license number contains invalid characters")
	}
	return nil
}

// ValidateRejectionReason validates rejection reason text
func ValidateRejectionReason(reason string) error {
	if reason == "" {
		return fmt.Errorf("rejection reason cannot be empty")
	}
	if utf8.RuneCountInString(reason) > MaxReasonLength {
		return fmt.Errorf("rejection reason exceeds maximum length of %d characters", MaxReasonLength)
	}
	if containsControlCharacters(reason) {
		return fmt.Errorf("rejection reason contains invalid control characters")
	}
	return nil
}

// ValidateApproverName validates the name of the person approving/rejecting
func ValidateApproverName(name string) error {
	if name == "" {
		return fmt.Errorf("approver name cannot be empty")
	}
	if utf8.RuneCountInString(name) > MaxExporterNameLength {
		return fmt.Errorf("approver name exceeds maximum length of %d characters", MaxExporterNameLength)
	}
	if containsControlCharacters(name) {
		return fmt.Errorf("approver name contains invalid control characters")
	}
	return nil
}

// ValidateTransportIdentifier validates vessel/flight/train identifier
func ValidateTransportIdentifier(identifier string) error {
	if identifier == "" {
		return fmt.Errorf("transport identifier cannot be empty")
	}
	if utf8.RuneCountInString(identifier) > MaxStringLength {
		return fmt.Errorf("transport identifier exceeds maximum length of %d characters", MaxStringLength)
	}
	// Allow alphanumeric, spaces, hyphens
	matched, _ := regexp.MatchString("^[a-zA-Z0-9\\s-]+$", identifier)
	if !matched {
		return fmt.Errorf("transport identifier contains invalid characters")
	}
	return nil
}

// ValidateQualityGrade validates the quality grade
func ValidateQualityGrade(grade string) error {
	if grade == "" {
		return fmt.Errorf("quality grade cannot be empty")
	}
	if utf8.RuneCountInString(grade) > 50 {
		return fmt.Errorf("quality grade exceeds maximum length of 50 characters")
	}
	// Validate against common grades
	validGrades := []string{"Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "A", "B", "C", "Premium", "Standard"}
	normalized := strings.ToUpper(strings.TrimSpace(grade))
	isValid := false
	for _, validGrade := range validGrades {
		if strings.Contains(normalized, strings.ToUpper(validGrade)) {
			isValid = true
			break
		}
	}
	if !isValid {
		return fmt.Errorf("quality grade must be one of the standard grades")
	}
	return nil
}

// Helper function to check for control characters
func containsControlCharacters(s string) bool {
	for _, r := range s {
		if r < 32 && r != 9 && r != 10 && r != 13 { // Allow tab, newline, carriage return
			return true
		}
	}
	return false
}

// Helper function to check decimal precision
func isValidPrecision(value float64, maxDecimals int) bool {
	// Convert to string and check decimal places
	str := fmt.Sprintf("%.10f", value)
	parts := strings.Split(str, ".")
	if len(parts) != 2 {
		return true
	}
	// Trim trailing zeros
	decimals := strings.TrimRight(parts[1], "0")
	return len(decimals) <= maxDecimals
}

// ValidateTransportMode validates the transport mode
func ValidateTransportMode(mode TransportMode) error {
	validModes := []TransportMode{ModeSea, ModeAir, ModeRail}
	for _, validMode := range validModes {
		if mode == validMode {
			return nil
		}
	}
	return fmt.Errorf("invalid transport mode: %s (must be SEA, AIR, or RAIL)", mode)
}

// ValidatePaymentAmount validates payment amount
func ValidatePaymentAmount(amount float64) error {
	if amount < 0 {
		return fmt.Errorf("payment amount cannot be negative")
	}
	if amount > MaxEstimatedValue {
		return fmt.Errorf("payment amount cannot exceed $%.0f", MaxEstimatedValue)
	}
	if !isValidPrecision(amount, 2) {
		return fmt.Errorf("payment amount can have at most 2 decimal places")
	}
	return nil
}
