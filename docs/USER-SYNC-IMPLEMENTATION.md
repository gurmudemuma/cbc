# User Synchronization Implementation

## Overview
This document describes the user management synchronization system between PostgreSQL (CBC services) and Hyperledger Fabric (blockchain).

## Architecture

### Components

1. **Blockchain Bridge Service** (`services/blockchain-bridge`)
   - Central synchronization service
   - Manages user data consistency between PostgreSQL and blockchain
   - Handles initial user setup and ongoing synchronization

2. **User Sync Service** (`services/blockchain-bridge/src/services/user-sync-service.ts`)
   - Creates users in 