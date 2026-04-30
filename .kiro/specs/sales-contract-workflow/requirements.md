# Sales Contract Workflow Requirements

## Introduction

The Sales Contract Workflow feature enables coffee exporters to create, negotiate, and finalize sales contracts with international buyers through a structured digital process. Exporters can draft contracts with detailed coffee specifications, pricing, and payment terms, then collaborate with buyers through a negotiation workflow. Once both parties reach agreement, exporters finalize contracts to the blockchain for ECTA registration and certificate generation. This workflow streamlines international coffee trade by providing a transparent, auditable contract management system integrated with the export certification platform.

## Glossary

- **Exporter**: A coffee export company that initiates and manages sales contracts
- **Buyer**: An international coffee purchaser who reviews and responds to contract proposals
- **Draft Contract**: A contract in initial creation state, editable by the exporter
- **Counter-Offer**: A buyer's response proposing modifications to contract terms
- **Accepted Contract**: A contract where both exporter and buyer have agreed to all terms
- **Finalized Contract**: A contract submitted to blockchain and registered with ECTA
- **ECTA**: Ethiopian Coffee and Tea Authority, the regulatory body that registers contracts
- **ECTA Reference Number**: A unique identifier assigned by ECTA upon contract registration
- **Contract Certificate**: A downloadable document issued by ECTA confirming contract registration
- **Negotiation**: The process of exchanging counter-offers until agreement is reached
- **Contract History**: An immutable audit trail of all contract versions and status changes
- **Blockchain**: Distributed ledger technology used to finalize and register contracts
- **LC Number**: Letter of Credit number for payment verification
- **Contract Status**: Current state of the contract (DRAFT, COUNTERED, ACCEPTED, REJECTED, FINALIZED)
- **System**: The Sales Contract Workflow system
- **Notification**: An alert sent to a party about contract activity
- **Buyer Portal**: The interface where buyers access and respond to contracts

## Requirements

### Requirement 1: Create Draft Sales Contract

**User Story:** As an exporter, I want to create a new draft sales contract with buyer details and coffee specifications, so that I can initiate the sales process with international buyers.

#### Acceptance Criteria

1. WHEN an exporter clicks the "New Draft" button on the SalesContractDashboard, THE System SHALL display a contract creation form
2. THE System SHALL require the exporter to enter: buyer name, buyer email, coffee type, quantity (in bags), unit price, currency, payment terms, delivery location, and delivery date
3. WHEN the exporter submits the form with all required fields, THE System SHALL create a draft contract with status DRAFT and store it in the contract_drafts table
4. WHEN the exporter submits the form, THE System SHALL assign a unique draft_id to the contract
5. WHEN the exporter submits the form, THE System SHALL set the exporter_id to the authenticated exporter's ID
6. WHEN the exporter submits the form, THE System SHALL set the buyer_id to null until the buyer accepts the contract
7. WHEN the exporter submits the form, THE System SHALL initialize the contract with empty lc_number and ecta_reference_number fields
8. WHEN the exporter submits the form with missing required fields, THE System SHALL display validation errors and prevent contract creation
9. WHEN the exporter enters a delivery date in the past, THE System SHALL display a validation error
10. WHEN the exporter enters a quantity less than 1 bag, THE System SHALL display a validation error
11. WHEN the exporter enters a unit price less than or equal to zero, THE System SHALL display a validation error
12. WHEN the exporter successfully creates a draft, THE System SHALL display a success message and redirect to the draft details view

### Requirement 2: Save and Edit Draft Contracts

**User Story:** As an exporter, I want to save my work in progress and edit draft contracts before sending them to buyers, so that I can refine contract terms without losing my changes.

#### Acceptance Criteria

1. WHEN an exporter is viewing a draft contract with status DRAFT, THE System SHALL display an "Edit" button
2. WHEN an exporter clicks the "Edit" button, THE System SHALL allow modification of: buyer email, coffee type, quantity, unit price, currency, payment terms, delivery location, and delivery date
3. WHEN an exporter modifies contract fields and clicks "Save", THE System SHALL update the contract in the contract_drafts table
4. WHEN an exporter modifies contract fields and clicks "Save", THE System SHALL preserve the draft_id and creation timestamp
5. WHEN an exporter modifies contract fields and clicks "Save", THE System SHALL update the last_modified_timestamp
6. WHEN an exporter modifies contract fields and clicks "Save", THE System SHALL validate all fields before saving
7. WHEN an exporter attempts to save with invalid data, THE System SHALL display validation errors and prevent the save
8. WHEN an exporter is editing a draft, THE System SHALL display the current contract values in the form fields
9. WHEN an exporter clicks "Cancel" while editing, THE System SHALL discard unsaved changes and return to the draft details view
10. WHEN an exporter deletes a draft contract with status DRAFT, THE System SHALL remove it from the contract_drafts table and display a confirmation message

### Requirement 3: Send Draft to Buyer for Review

**User Story:** As an exporter, I want to send my draft contract to a buyer for review, so that I can initiate the negotiation process.

#### Acceptance Criteria

1. WHEN an exporter is viewing a draft contract with status DRAFT, THE System SHALL display a "Send to Buyer" button
2. WHEN an exporter clicks "Send to Buyer", THE System SHALL display a confirmation dialog
3. WHEN an exporter confirms sending the contract, THE System SHALL update the contract status to COUNTERED (awaiting buyer response)
4. WHEN an exporter confirms sending the contract, THE System SHALL send an email notification to the buyer with the contract details and a link to the Buyer Portal
5. WHEN an exporter confirms sending the contract, THE System SHALL create a notification record for the buyer
6. WHEN an exporter confirms sending the contract, THE System SHALL record the send timestamp in the contract history
7. WHEN an exporter confirms sending the contract, THE System SHALL display a success message confirming the contract was sent
8. WHEN an exporter sends a contract, THE System SHALL prevent further edits until the buyer responds
9. WHEN an exporter sends a contract, THE System SHALL move the contract from the "Drafts" tab to the "Negotiation" tab on the SalesContractDashboard

### Requirement 4: Track Buyer Responses

**User Story:** As an exporter, I want to see buyer responses to my contracts, so that I can track the negotiation status and know when action is required.

#### Acceptance Criteria

1. WHEN a buyer responds to a contract, THE System SHALL update the contract status to reflect the buyer's response (ACCEPTED, REJECTED, or COUNTERED)
2. WHEN a buyer accepts a contract, THE System SHALL update the contract status to ACCEPTED
3. WHEN a buyer rejects a contract, THE System SHALL update the contract status to REJECTED and store the rejection reason
4. WHEN a buyer submits a counter-offer, THE System SHALL update the contract status to COUNTERED and store the proposed modifications
5. WHEN a buyer responds to a contract, THE System SHALL send a notification to the exporter
6. WHEN a buyer responds to a contract, THE System SHALL display the response in the contract details view with timestamp
7. WHEN a buyer responds to a contract, THE System SHALL display the buyer's proposed changes (if counter-offer) in a comparison view
8. WHEN a contract status changes, THE System SHALL update the contract record in the contract_drafts table
9. WHEN a contract is rejected, THE System SHALL display the rejection reason to the exporter
10. WHEN a contract receives a counter-offer, THE System SHALL allow the exporter to review and respond to the proposed changes

### Requirement 5: Negotiate Contract Terms

**User Story:** As an exporter, I want to respond to buyer counter-offers and propose modifications, so that I can reach agreement on contract terms.

#### Acceptance Criteria

1. WHEN a contract has status COUNTERED with buyer modifications, THE System SHALL display the proposed changes to the exporter
2. WHEN an exporter reviews a counter-offer, THE System SHALL display a side-by-side comparison of original and proposed terms
3. WHEN an exporter reviews a counter-offer, THE System SHALL allow the exporter to accept the counter-offer or propose counter-modifications
4. WHEN an exporter accepts a counter-offer, THE System SHALL update the contract with the buyer's proposed terms and set status to ACCEPTED
5. WHEN an exporter accepts a counter-offer, THE System SHALL send a notification to the buyer confirming acceptance
6. WHEN an exporter proposes counter-modifications, THE System SHALL update the contract with the exporter's proposed terms and set status to COUNTERED
7. WHEN an exporter proposes counter-modifications, THE System SHALL send a notification to the buyer with the new proposal
8. WHEN an exporter proposes counter-modifications, THE System SHALL create a new version entry in the contract history
9. WHEN an exporter proposes counter-modifications, THE System SHALL preserve all previous versions in the contract history
10. WHEN a contract reaches ACCEPTED status, THE System SHALL display a "Finalize Contract" button to the exporter

### Requirement 6: Maintain Contract History and Version Control

**User Story:** As an exporter, I want to see the complete history of contract versions and negotiations, so that I can track how terms evolved and maintain an audit trail.

#### Acceptance Criteria

1. WHEN a contract is created, THE System SHALL initialize a contract history record
2. WHEN a contract is modified, THE System SHALL create a new version entry in the contract history
3. WHEN a contract status changes, THE System SHALL record the status change with timestamp and actor (exporter or buyer)
4. WHEN a contract receives a counter-offer, THE System SHALL store the proposed modifications in the history with the buyer's timestamp
5. WHEN an exporter views a contract, THE System SHALL display a timeline of all versions and status changes
6. WHEN an exporter views the contract history, THE System SHALL display: version number, timestamp, actor (exporter/buyer), action (created/modified/countered/accepted), and changes made
7. WHEN an exporter views a previous contract version, THE System SHALL display the complete contract terms as they existed at that version
8. WHEN a contract is finalized, THE System SHALL lock the contract history and prevent further modifications
9. WHEN a contract is finalized, THE System SHALL preserve all historical versions immutably
10. THE System SHALL maintain an audit trail that cannot be altered after contract finalization

### Requirement 7: Validate Contract Terms Compliance

**User Story:** As the system, I want to validate that contract terms comply with international standards, so that contracts meet regulatory requirements before finalization.

#### Acceptance Criteria

1. WHEN an exporter creates or modifies a contract, THE System SHALL validate that the delivery date is in the future
2. WHEN an exporter creates or modifies a contract, THE System SHALL validate that the quantity is at least 1 bag
3. WHEN an exporter creates or modifies a contract, THE System SHALL validate that the unit price is greater than zero
4. WHEN an exporter creates or modifies a contract, THE System SHALL validate that the payment terms are one of: "Advance Payment", "Letter of Credit", "Cash on Delivery", "Net 30", "Net 60", "Net 90"
5. WHEN an exporter creates or modifies a contract, THE System SHALL validate that the currency is a valid ISO 4217 currency code
6. WHEN an exporter creates or modifies a contract, THE System SHALL validate that the coffee type is one of the supported varieties
7. WHEN an exporter creates or modifies a contract, THE System SHALL validate that the delivery location is a valid port or city
8. WHEN an exporter attempts to finalize a contract, THE System SHALL verify that all required fields are populated
9. WHEN an exporter attempts to finalize a contract, THE System SHALL verify that both parties have accepted the terms
10. WHEN validation fails, THE System SHALL display specific error messages indicating which fields are invalid

### Requirement 8: Finalize Contract to Blockchain

**User Story:** As an exporter, I want to finalize an accepted contract to the blockchain, so that the contract is registered with ECTA and becomes legally binding.

#### Acceptance Criteria

1. WHEN a contract has status ACCEPTED, THE System SHALL display a "Finalize Contract" button to the exporter
2. WHEN an exporter clicks "Finalize Contract", THE System SHALL display a confirmation dialog with contract summary
3. WHEN an exporter confirms finalization, THE System SHALL validate that both parties have accepted the contract
4. WHEN an exporter confirms finalization, THE System SHALL validate that all required contract fields are populated
5. WHEN an exporter confirms finalization, THE System SHALL submit the contract to the blockchain network
6. WHEN the blockchain submission succeeds, THE System SHALL update the contract status to FINALIZED
7. WHEN the blockchain submission succeeds, THE System SHALL record the blockchain transaction hash in the contract record
8. WHEN the blockchain submission succeeds, THE System SHALL trigger ECTA registration process
9. WHEN the blockchain submission fails, THE System SHALL display an error message and allow the exporter to retry
10. WHEN an exporter finalizes a contract, THE System SHALL lock the contract from further edits

### Requirement 9: ECTA Registration and Reference Number Generation

**User Story:** As the system, I want to register finalized contracts with ECTA and generate unique reference numbers, so that contracts are officially recognized by the regulatory authority.

#### Acceptance Criteria

1. WHEN a contract is finalized to blockchain, THE System SHALL automatically submit a registration request to ECTA
2. WHEN ECTA receives a registration request, THE System SHALL generate a unique ECTA reference number
3. WHEN ECTA generates a reference number, THE System SHALL update the contract record with the ecta_reference_number
4. WHEN ECTA generates a reference number, THE System SHALL update the contract status to FINALIZED
5. WHEN ECTA generates a reference number, THE System SHALL send a notification to the exporter with the reference number
6. WHEN ECTA generates a reference number, THE System SHALL make the reference number visible in the contract details view
7. WHEN a contract is registered with ECTA, THE System SHALL record the registration timestamp
8. WHEN ECTA registration fails, THE System SHALL retry the registration process up to 3 times
9. WHEN ECTA registration fails after 3 retries, THE System SHALL notify the exporter and provide manual registration instructions
10. THE System SHALL ensure ECTA reference numbers are globally unique across all contracts

### Requirement 10: Generate and Download Contract Certificate

**User Story:** As an exporter, I want to download a certificate confirming my contract registration with ECTA, so that I have proof of the registered contract for my records.

#### Acceptance Criteria

1. WHEN a contract is finalized and registered with ECTA, THE System SHALL generate a contract certificate
2. WHEN a contract certificate is generated, THE System SHALL include: contract details, ECTA reference number, registration date, exporter name, buyer name, and coffee specifications
3. WHEN a contract certificate is generated, THE System SHALL include a digital signature or QR code for verification
4. WHEN an exporter views a finalized contract, THE System SHALL display a "Download Certificate" button
5. WHEN an exporter clicks "Download Certificate", THE System SHALL generate a PDF file with the contract certificate
6. WHEN an exporter clicks "Download Certificate", THE System SHALL allow the exporter to download the PDF to their device
7. WHEN a certificate is downloaded, THE System SHALL record the download timestamp and exporter ID
8. WHEN an exporter downloads a certificate, THE System SHALL display a success message
9. WHEN a certificate is generated, THE System SHALL store a copy in the system for audit purposes
10. WHEN an exporter views a finalized contract, THE System SHALL display the certificate generation date

### Requirement 11: Notify Parties of Contract Activity

**User Story:** As the system, I want to send notifications to exporters and buyers about contract activity, so that all parties stay informed about negotiation progress.

#### Acceptance Criteria

1. WHEN an exporter sends a contract to a buyer, THE System SHALL send an email notification to the buyer
2. WHEN an exporter sends a contract to a buyer, THE System SHALL include a link to the Buyer Portal in the notification
3. WHEN a buyer responds to a contract, THE System SHALL send an email notification to the exporter
4. WHEN a buyer accepts a contract, THE System SHALL send a notification indicating acceptance
5. WHEN a buyer rejects a contract, THE System SHALL send a notification with the rejection reason
6. WHEN a buyer submits a counter-offer, THE System SHALL send a notification with the proposed modifications
7. WHEN an exporter finalizes a contract, THE System SHALL send a notification to the buyer confirming finalization
8. WHEN ECTA registers a contract, THE System SHALL send a notification to the exporter with the reference number
9. WHEN a contract certificate is generated, THE System SHALL send a notification to the exporter with a download link
10. WHEN a notification is sent, THE System SHALL record the notification in the notification center for audit purposes

### Requirement 12: Buyer Portal Access and Response Interface

**User Story:** As a buyer, I want to access contracts sent to me and respond with acceptance, rejection, or counter-offers, so that I can participate in the negotiation process.

#### Acceptance Criteria

1. WHEN a buyer receives a contract notification, THE System SHALL provide a link to access the contract in the Buyer Portal
2. WHEN a buyer accesses the Buyer Portal, THE System SHALL display all contracts sent to them
3. WHEN a buyer views a contract, THE System SHALL display all contract details: coffee specifications, pricing, payment terms, delivery terms, and legal framework
4. WHEN a buyer views a contract, THE System SHALL display the contract history and previous versions
5. WHEN a buyer views a contract, THE System SHALL display an "Accept", "Reject", or "Counter-Offer" button
6. WHEN a buyer clicks "Accept", THE System SHALL update the contract status to ACCEPTED
7. WHEN a buyer clicks "Reject", THE System SHALL display a form to enter rejection reason and update status to REJECTED
8. WHEN a buyer clicks "Counter-Offer", THE System SHALL display a form to propose modifications to contract terms
9. WHEN a buyer submits a counter-offer, THE System SHALL validate that at least one field is modified
10. WHEN a buyer submits a response, THE System SHALL record the buyer's ID and timestamp in the contract record

### Requirement 13: Restrict Contract Access and Modifications

**User Story:** As the system, I want to ensure only authorized parties can access and modify contracts, so that contract integrity and confidentiality are maintained.

#### Acceptance Criteria

1. WHEN an exporter views a contract, THE System SHALL verify the exporter_id matches the authenticated user
2. WHEN an exporter attempts to edit a contract, THE System SHALL verify the exporter_id matches the authenticated user
3. WHEN an exporter attempts to edit a contract with status other than DRAFT, THE System SHALL prevent the edit
4. WHEN a buyer attempts to access a contract, THE System SHALL verify the buyer email matches the contract buyer_email
5. WHEN a buyer attempts to respond to a contract, THE System SHALL verify the buyer email matches the contract buyer_email
6. WHEN a contract is finalized, THE System SHALL prevent any further modifications by either party
7. WHEN a contract is rejected, THE System SHALL prevent further responses from the buyer
8. WHEN an unauthorized user attempts to access a contract, THE System SHALL display an access denied error
9. WHEN an unauthorized user attempts to modify a contract, THE System SHALL display an access denied error
10. WHEN a contract is accessed, THE System SHALL log the access attempt with user ID and timestamp

### Requirement 14: Integrate with Export Management System

**User Story:** As an exporter, I want my sales contracts to be linked with my export shipments, so that I can track which contracts correspond to which exports.

#### Acceptance Criteria

1. WHEN an exporter creates an export shipment, THE System SHALL allow linking to a finalized sales contract
2. WHEN an exporter links a contract to an export, THE System SHALL store the relationship in the database
3. WHEN an exporter views an export, THE System SHALL display the linked sales contract details
4. WHEN an exporter views a finalized contract, THE System SHALL display any linked exports
5. WHEN an exporter views the SalesContractDashboard, THE System SHALL display contract status alongside export status
6. WHEN a contract is finalized, THE System SHALL make it available for linking to new exports
7. WHEN an export is created, THE System SHALL allow selection from available finalized contracts
8. WHEN an export is linked to a contract, THE System SHALL validate that the contract is finalized
9. WHEN an export is linked to a contract, THE System SHALL validate that the coffee type and quantity match
10. WHEN an export is linked to a contract, THE System SHALL record the link timestamp

### Requirement 15: Display Contract Dashboard with Tabs

**User Story:** As an exporter, I want to view my contracts organized by status on a dashboard, so that I can easily find contracts at different stages of the workflow.

#### Acceptance Criteria

1. WHEN an exporter accesses the SalesContractDashboard, THE System SHALL display three tabs: "Drafts", "Negotiation", and "Finalized"
2. WHEN an exporter views the "Drafts" tab, THE System SHALL display all contracts with status DRAFT
3. WHEN an exporter views the "Negotiation" tab, THE System SHALL display all contracts with status COUNTERED or ACCEPTED
4. WHEN an exporter views the "Finalized" tab, THE System SHALL display all contracts with status FINALIZED
5. WHEN an exporter views the "Drafts" tab, THE System SHALL display: draft creation date, buyer email, coffee type, quantity, and unit price
6. WHEN an exporter views the "Negotiation" tab, THE System SHALL display: current status, last update date, buyer email, and action buttons
7. WHEN an exporter views the "Finalized" tab, THE System SHALL display: ECTA reference number, finalization date, buyer email, and download certificate button
8. WHEN an exporter clicks on a contract in any tab, THE System SHALL navigate to the contract details view
9. WHEN an exporter views the dashboard, THE System SHALL display the total count of contracts in each tab
10. WHEN an exporter views the dashboard, THE System SHALL display a "New Draft" button to create a new contract

