package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func main() {
	userManagementContract := new(UserManagementContract)

	chaincode, err := contractapi.NewChaincode(userManagementContract)
	if err != nil {
		log.Panicf("Error creating user-management chaincode: %v", err)
	}

	if err := chaincode.Start(); err != nil {
		log.Panicf("Error starting user-management chaincode: %v", err)
	}
}
