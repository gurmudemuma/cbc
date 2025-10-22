package main

import (
	"log"

	"github.com/hyperledger/fabric-contract-api-go/v2/contractapi"
)

func main() {
	coffeeChaincode, err := contractapi.NewChaincode(&CoffeeExportContractV2{})
	if err != nil {
		log.Panicf("Error creating coffee export chaincode: %v", err)
	}

	if err := coffeeChaincode.Start(); err != nil {
		log.Panicf("Error starting coffee export chaincode: %v", err)
	}
}
