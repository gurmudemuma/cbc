package main

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
	"golang.org/x/crypto/bcrypt"
)

// UserManagementContract provides functions for managing users
type UserManagementContract struct {
	contractapi.Contract
}

// User represents a user in the system
type User struct {
	ID             string `json:"id"`
	Username       string `json:"username"`
	PasswordHash   string `json:"passwordHash"`
	Email          string `json:"email"`
	OrganizationID string `json:"organizationId"`
	Role           string `json:"role"`
	CreatedAt      string `json:"createdAt"`
	UpdatedAt      string `json:"updatedAt"`
	LastLogin      string `json:"lastLogin"`
	IsActive       bool   `json:"isActive"`
}

// UserExists checks if a user exists by ID
func (c *UserManagementContract) UserExists(ctx contractapi.TransactionContextInterface, userID string) (bool, error) {
	userJSON, err := ctx.GetStub().GetState(userID)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return userJSON != nil, nil
}

// UsernameExists checks if a username is already taken
func (c *UserManagementContract) UsernameExists(ctx contractapi.TransactionContextInterface, username string) (bool, error) {
	// Query by username using composite key
	usernameKey, err := ctx.GetStub().CreateCompositeKey("username", []string{username})
	if err != nil {
		return false, err
	}

	usernameJSON, err := ctx.GetStub().GetState(usernameKey)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return usernameJSON != nil, nil
}

// EmailExists checks if an email is already registered
func (c *UserManagementContract) EmailExists(ctx contractapi.TransactionContextInterface, email string) (bool, error) {
	// Query by email using composite key
	emailKey, err := ctx.GetStub().CreateCompositeKey("email", []string{email})
	if err != nil {
		return false, err
	}

	emailJSON, err := ctx.GetStub().GetState(emailKey)
	if err != nil {
		return false, fmt.Errorf("failed to read from world state: %v", err)
	}
	return emailJSON != nil, nil
}

// RegisterUser creates a new user account
func (c *UserManagementContract) RegisterUser(
	ctx contractapi.TransactionContextInterface,
	userID string,
	username string,
	passwordHash string,
	email string,
	organizationID string,
	role string,
) error {
	// Check if user already exists
	exists, err := c.UserExists(ctx, userID)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("user %s already exists", userID)
	}

	// Check if username is taken
	usernameExists, err := c.UsernameExists(ctx, username)
	if err != nil {
		return err
	}
	if usernameExists {
		return fmt.Errorf("username %s is already taken", username)
	}

	// Check if email is registered
	emailExists, err := c.EmailExists(ctx, email)
	if err != nil {
		return err
	}
	if emailExists {
		return fmt.Errorf("email %s is already registered", email)
	}

	now := time.Now().UTC().Format(time.RFC3339)

	user := User{
		ID:             userID,
		Username:       username,
		PasswordHash:   passwordHash,
		Email:          email,
		OrganizationID: organizationID,
		Role:           role,
		CreatedAt:      now,
		UpdatedAt:      now,
		LastLogin:      "",
		IsActive:       true,
	}

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	// Store user by ID
	err = ctx.GetStub().PutState(userID, userJSON)
	if err != nil {
		return err
	}

	// Create composite key for username lookup
	usernameKey, err := ctx.GetStub().CreateCompositeKey("username", []string{username})
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(usernameKey, []byte(userID))
	if err != nil {
		return err
	}

	// Create composite key for email lookup
	emailKey, err := ctx.GetStub().CreateCompositeKey("email", []string{email})
	if err != nil {
		return err
	}
	err = ctx.GetStub().PutState(emailKey, []byte(userID))
	if err != nil {
		return err
	}

	return nil
}

// GetUser retrieves a user by ID
func (c *UserManagementContract) GetUser(ctx contractapi.TransactionContextInterface, userID string) (*User, error) {
	userJSON, err := ctx.GetStub().GetState(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if userJSON == nil {
		return nil, fmt.Errorf("user %s does not exist", userID)
	}

	var user User
	err = json.Unmarshal(userJSON, &user)
	if err != nil {
		return nil, err
	}

	return &user, nil
}

// GetUserByUsername retrieves a user by username
func (c *UserManagementContract) GetUserByUsername(ctx contractapi.TransactionContextInterface, username string) (*User, error) {
	// Get user ID from username composite key
	usernameKey, err := ctx.GetStub().CreateCompositeKey("username", []string{username})
	if err != nil {
		return nil, err
	}

	userIDBytes, err := ctx.GetStub().GetState(usernameKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if userIDBytes == nil {
		return nil, fmt.Errorf("user with username %s does not exist", username)
	}

	userID := string(userIDBytes)
	return c.GetUser(ctx, userID)
}

// GetUserByEmail retrieves a user by email
func (c *UserManagementContract) GetUserByEmail(ctx contractapi.TransactionContextInterface, email string) (*User, error) {
	// Get user ID from email composite key
	emailKey, err := ctx.GetStub().CreateCompositeKey("email", []string{email})
	if err != nil {
		return nil, err
	}

	userIDBytes, err := ctx.GetStub().GetState(emailKey)
	if err != nil {
		return nil, fmt.Errorf("failed to read from world state: %v", err)
	}
	if userIDBytes == nil {
		return nil, fmt.Errorf("user with email %s does not exist", email)
	}

	userID := string(userIDBytes)
	return c.GetUser(ctx, userID)
}

// UpdateLastLogin updates the user's last login timestamp
func (c *UserManagementContract) UpdateLastLogin(ctx contractapi.TransactionContextInterface, userID string) error {
	user, err := c.GetUser(ctx, userID)
	if err != nil {
		return err
	}

	now := time.Now().UTC().Format(time.RFC3339)
	user.LastLogin = now
	user.UpdatedAt = now

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userID, userJSON)
}

// UpdatePassword updates a user's password hash
func (c *UserManagementContract) UpdatePassword(ctx contractapi.TransactionContextInterface, userID string, newPasswordHash string) error {
	user, err := c.GetUser(ctx, userID)
	if err != nil {
		return err
	}

	user.PasswordHash = newPasswordHash
	user.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userID, userJSON)
}

// DeactivateUser deactivates a user account
func (c *UserManagementContract) DeactivateUser(ctx contractapi.TransactionContextInterface, userID string) error {
	user, err := c.GetUser(ctx, userID)
	if err != nil {
		return err
	}

	user.IsActive = false
	user.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userID, userJSON)
}

// ActivateUser activates a user account
func (c *UserManagementContract) ActivateUser(ctx contractapi.TransactionContextInterface, userID string) error {
	user, err := c.GetUser(ctx, userID)
	if err != nil {
		return err
	}

	user.IsActive = true
	user.UpdatedAt = time.Now().UTC().Format(time.RFC3339)

	userJSON, err := json.Marshal(user)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState(userID, userJSON)
}

// GetAllUsers returns all users (admin function)
func (c *UserManagementContract) GetAllUsers(ctx contractapi.TransactionContextInterface) ([]*User, error) {
	// Query all users using range query
	resultsIterator, err := ctx.GetStub().GetStateByRange("", "")
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var users []*User
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		// Skip composite keys (they start with 0x00)
		if len(queryResponse.Key) > 0 && queryResponse.Key[0] == 0 {
			continue
		}

		var user User
		err = json.Unmarshal(queryResponse.Value, &user)
		if err != nil {
			// Skip if not a user object
			continue
		}

		users = append(users, &user)
	}

	return users, nil
}

// GetUsersByOrganization returns all users for a specific organization
func (c *UserManagementContract) GetUsersByOrganization(ctx contractapi.TransactionContextInterface, organizationID string) ([]*User, error) {
	queryString := fmt.Sprintf(`{"selector":{"organizationId":"%s"}}`, organizationID)

	resultsIterator, err := ctx.GetStub().GetQueryResult(queryString)
	if err != nil {
		return nil, err
	}
	defer resultsIterator.Close()

	var users []*User
	for resultsIterator.HasNext() {
		queryResponse, err := resultsIterator.Next()
		if err != nil {
			return nil, err
		}

		var user User
		err = json.Unmarshal(queryResponse.Value, &user)
		if err != nil {
			return nil, err
		}

		users = append(users, &user)
	}

	return users, nil
}

// VerifyPassword verifies a password against the stored hash (helper for off-chain use)
// Note: In production, password verification should be done off-chain for security
func VerifyPassword(passwordHash string, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(password))
}

// HashPassword creates a bcrypt hash of a password (helper for off-chain use)
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 10)
	return string(bytes), err
}
