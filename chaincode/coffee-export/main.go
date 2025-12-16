package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func main() {
	contract, err := contractapi.NewChaincode(&CoffeeExportContract{})
	if err != nil {
		log.Panicf("Error creating chaincode: %v", err)
	}

	if err := contract.Start(); err != nil {
		log.Panicf("Error starting chaincode: %v", err)
	}
}
