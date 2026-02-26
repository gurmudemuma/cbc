# Complete Exporter Workflow Verification

## Overview

This document verifies that all exporter actions are properly handled by the concerned organizations throughout the coffee export process.

## Workflow Stages & Responsible Organizations

### Stage 1: Initial Registration
**Exporter Action**: Register in the system
**Responsible Organization**: ECTA (Ethiopian Coffee & Tea Authority)

#### Implementation Status
- ✅ **Route**: `/api/auth/register` (auth.routes.js)
- ✅ **Endpoint**: POST - Exporter submits registration
- ✅ **Handler**: Creates user with status 'pending'
- ✅ **Database**: Stores in `users` table
- ✅ **Blockchain**: Synced via bridge
- ✅ **Notification**: Email sent to exporter (notification.service.js)

#### ECTA Actions
- ✅ **Route**: `/api/exporter/:id/approve` (exporter.routes.js)
- ✅ **Endpoint**: POST - ECTA approves/rejects registration
- ✅ **Handler**: Updates user status to 'approved' or 'rejected'
- ✅ **Notification**: Email sent on approval/rejection
- ✅ **Access Control**: Only ECTA role can approve

---

### Stage 2: Pre-Registration (Qualification)

#### 2.1 Laboratory Registration
**Exporter Action**: Register coffee laboratory
**Responsible Organization**: ECTA

##### Implementation Status
- ✅ **Route**: `/api/ecta/laboratory/register` (ecta.routes.js)
- ✅ **Endpoint**: POST - Exporter submits lab details
- ✅ **Database**: `coffee_laboratories` table
- ✅ **Blockchain**: Chaincode function `RegisterLaboratory`
- ✅ **Status**: Pending → Approved/Rejected

##### ECTA Actions
- ✅ **Route**: `/api/ecta/laboratory/:id/approve` (ecta.routes.js)
- ✅ **Endpoint**: POST - ECTA approves/rejects lab
- ✅ **Handler**: Updates lab status and issues certification number
- ✅ **Access Control**: ECTA role only

#### 2.2 Taster Registration
**Exporter Action**: Register qualified coffee taster
**Responsible Organization**: ECTA

##### Implementation Status
- ✅ **Route**: `/api/ecta/taster/register` (ecta.routes.js)
- ✅ **Endpoint**: POST - Exporter submits taster details
- ✅ **Database**: `coffee_tasters` table
- ✅ **Blockchain**: Chaincode function `RegisterTaster`
- ✅ **Status**: Pending → Approved/Rejected

##### ECTA Actions
- ✅ **Route**: `/api/ecta/taster/:id/verify` (ecta.routes.js)
- ✅ **Endpoint**: POST - ECTA verifies taster qualifications
- ✅ **Handler**: Updates taster status and issues certificate
- ✅ **Access Control**: ECTA role only

#### 2.3 Competence Certificate
**Exporter Action**: Apply for competence certificate
**Responsible Organization**: ECTA

##### Implementation Status
- ✅ **Route**: `/api/ecta/competence-certificate/apply` (ecta.routes.js)
- ✅ **Endpoint**: POST - Exporter applies for certificate
- ✅ **Database**: `competence_certificates` table
- ✅ **Blockchain**: Chaincode function `ApplyForCompetenceCertificate`
- ✅ **Status**: Pending → Approved/Rejected

##### ECTA Actions
- ✅ **Route**: `/api/ecta/competence-certificate/:id/approve` (ecta.routes.js)
- ✅ **Endpoint**: POST - ECTA approves and issues certificate
- ✅ **Handler**: Issues certificate number and expiry date
- ✅ **Access Control**: ECTA role only

#### 2.4 Export License
**Exporter Action**: Apply for export license
**Responsible Organization**: ECTA

##### Implementation Status
- ✅ **Route**: `/api/ecta/license/apply` (ecta.routes.js)
- ✅ **Endpoint**: POST - Exporter applies for license
- ✅ **Database**: `export_licenses` table
- ✅ **Blockchain**: Chaincode function `ApplyForLicense`
- ✅ **Status**: Pending → Approved/Rejected

##### ECTA Actions
- ✅ **Route**: `/api/ecta/license/:id/approve` (ecta.routes.js)
- ✅ **Endpoint**: POST - ECTA approves and issues license
- ✅ **Handler**: Issues license number with validity period
- ✅ **Access Control**: ECTA role only

---

### Stage 3: Coffee Sourcing

#### 3.1 Purchase Coffee from ECX
**Exporter Action**: Purchase coffee lots
**Responsible Organization**: ECX (Ethiopian Commodity Exchange)

##### Implementation Status
- ✅ **Route**: `/api/ecta/lot/purchase` (ecta.routes.js)
- ✅ **Endpoint**: POST - Exporter records lot purchase
- ✅ **Database**: `coffee_lots` table
- ✅ **Blockchain**: Chaincode function `PurchaseLot`
- ✅ **Fields**: ECX number, quantity, grade, price

##### ECX Actions
- ✅ **Route**: `/api/ecta/lot/:id/verify` (ecta.routes.js)
- ✅ **Endpoint**: POST - ECX verifies lot ownership
- ✅ **Handler**: Confirms lot transfer to exporter
- ✅ **Access Control**: ECX role only

---

### Stage 4: Quality Inspection

#### 4.1 Request Quality Inspection
**Exporter Action**: Request quality inspection
**Responsible Organization**: ECTA

##### Implementation Status
- ✅ **Route**: `/api/ecta/inspection/request` (ecta.routes.js)
- ✅ **Endpoint**: POST - Exporter requests inspection
- ✅ **Database**: `quality_inspections` table
- ✅ **Blockchain**: Chaincode function `RequestQualityInspection`
- ✅ **Status**: Requested → Scheduled → Completed

##### ECTA Actions
- ✅ **Route**: `/api/ecta/inspection/:id/schedule` (ecta.routes.js)
- ✅ **Endpoint**: POST - ECTA schedules inspection
- ✅ **Route**: `/api/ecta/inspection/:id/complete` (ecta.routes.js)
- ✅ **Endpoint**: POST - ECTA submits inspection results
- ✅ **Handler**: Issues quality certificate if passed
- ✅ **Access Control**: ECTA role only

---

### Stage 5: Sales Contract

#### 5.1 Register Sales Contract
**Exporter Action**: Register contract with buyer
**Responsible Organization**: ECTA (verification)

##### Implementation Status
- ✅ **Route**: `/api/ecta/contract/register` (ecta.routes.js)
- ✅ **Endpoint**: POST - Exporter submits contract details
- ✅ **Database**: `sales_contracts` table
- ✅ **Blockchain**: Chaincode function `RegisterContract`
- ✅ **Fields**: Buyer info, quantity, price, terms

##### ECTA Actions
- ✅ **Route**: `/api/ecta/contract/:id/approve` (ecta.routes.js)
- ✅ **Endpoint**: POST - ECTA verifies contract
- ✅ **Handler**: Approves contract for export
- ✅ **Access Control**: ECTA role only

---

### Stage 6: Export Declaration

#### 6.1 Submit Export Declaration
**Exporter Action**: Declare export shipment
**Responsible Organization**: ECTA

##### Implementation Status
- ✅ **Route**: `/api/exports/create` (exports.routes.js)
- ✅ **Endpoint**: POST - Exporter creates export declaration
- ✅ **Database**: `exports` table
- ✅ **Blockchain**: Chaincode function `CreateExport`
- ✅ **Fields**: Quantity, destination, value, documents

##### ECTA Actions
- ✅ **Route**: `/api/exports/:id/approve` (exports.routes.js)
- ✅ **Endpoint**: POST - ECTA approves export
- ✅ **Handler**: Changes status to 'approved'
- ✅ **Access Control**: ECTA role only

---

### Stage 7: Document Submission

#### 7.1 Upload Required Documents
**Exporter Action**: Upload export documents
**Responsible Organization**: ECTA (verification)

##### Implementation Status
- ✅ **Route**: `/api/documents/upload` (documents.routes.js)
- ✅ **Endpoint**: POST - Exporter uploads documents
- ✅ **Database**: `export_documents` table
- ✅ **Storage**: File system with metadata
- ✅ **Types**: Invoice, packing list, contract, certificates

##### ECTA Actions
- ✅ **Route**: `/api/documents/:id/verify` (documents.routes.js)
- ✅ **Endpoint**: POST - ECTA verifies documents
- ✅ **Handler**: Approves or requests corrections
- ✅ **Access Control**: ECTA role only

---

### Stage 8: Capital Verification

#### 8.1 Submit Capital Evidence
**Exporter Action**: Provide proof of capital
**Responsible Organization**: Commercial Bank

##### Implementation Status
- ✅ **Route**: `/api/documents/upload` (documents.routes.js)
- ✅ **Endpoint**: POST - Exporter uploads bank statements
- ✅ **Document Type**: 'capital_verification'
- ✅ **Database**: `export_documents` table

##### Bank Actions
- ✅ **Route**: `/api/documents/:id/verify` (documents.routes.js)
- ✅ **Endpoint**: POST - Bank verifies capital
- ✅ **Handler**: Confirms sufficient capital
- ✅ **Access Control**: Bank role only

---

### Stage 9: Facility Inspection

#### 9.1 Schedule Facility Inspection
**Exporter Action**: Request facility inspection
**Responsible Organization**: ECTA

##### Implementation Status
- ✅ **Route**: `/api/inspections/schedule` (inspections.routes.js)
- ✅ **Endpoint**: POST - ECTA schedules inspection
- ✅ **Database**: Stored in exporter profile
- ✅ **Blockchain**: Updated via `UpdateExporterProfile`

##### ECTA Actions
- ✅ **Route**: `/api/inspections/:id/report` (inspections.routes.js)
- ✅ **Endpoint**: POST - ECTA submits inspection report
- ✅ **Handler**: Records pass/fail status
- ✅ **Access Control**: ECTA role only

---

### Stage 10: ESW (Export Service Window)

#### 10.1 Submit ESW Application
**Exporter Action*