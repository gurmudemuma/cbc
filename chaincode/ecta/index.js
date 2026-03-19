'use strict';

const { Contract } = require('fabric-contract-api');
const customsLogistics = require('./customs-logistics');

/**
 * Ethiopian Coffee Export Chaincode
 * Manages the complete coffee export workflow from exporter registration to shipment
 */
class CoffeeExportContract extends Contract {

    // ============================================================================
    // USER MANAGEMENT (AUTHENTICATION & AUTHORIZATION)
    // ============================================================================

    /**
     * Register user with credentials and profile
     */
    async RegisterUser(ctx, userDataJSON) {
        const userData = JSON.parse(userDataJSON);
        const { username, passwordHash, email, role, companyName, tin, capitalETB, businessType, status, validationReason, registrationNumber } = userData;

        // Validate required fields
        if (!username || !passwordHash || !email || !role) {
            throw new Error('Missing required fields: username, passwordHash, email, role');
        }

        // Check if user already exists
        const existingUser = await ctx.stub.getState(`USER_${username}`);
        if (existingUser && existingUser.length > 0) {
            throw new Error(`User ${username} already exists`);
        }

        // Get deterministic timestamp from transaction
        const txTimestamp = ctx.stub.getTxTimestamp();
        const timestamp = new Date(txTimestamp.seconds.toNumber() * 1000).toISOString();

        // Use status from gateway validation, or perform smart contract validation
        let autoApprovalStatus = status || 'pending_approval';
        let rejectionReasons = [];
        
        if (role === 'exporter' && !status) {
            // If no status provided, perform smart contract validation
            // 1. Validate minimum capital requirements (Ethiopian Coffee Export Regulations)
            const type = businessType || 'PRIVATE_EXPORTER';
            const capitalType = (type === 'UNION' || type === 'FARMER_COOPERATIVE') ? 'company' : 'individual';
            const minimumCapital = capitalType === 'individual' ? 15000000 : 20000000;
            
            if (!capitalETB || capitalETB < minimumCapital) {
                rejectionReasons.push(`Insufficient capital: ${capitalETB} ETB (minimum: ${minimumCapital} ETB for ${type})`);
            }
            
            // 2. Validate TIN format (Ethiopian TIN: 10 digits)
            if (!tin || !/^\d{10}$/.test(tin.toString())) {
                rejectionReasons.push('Invalid TIN format (must be 10 digits)');
            }
            
            // 3. Validate email format
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                rejectionReasons.push('Invalid email format');
            }
            
            // 4. Validate company name
            if (!companyName || companyName.length < 3) {
                rejectionReasons.push('Company name must be at least 3 characters');
            }
            
            // Determine final status based on validations
            if (rejectionReasons.length > 0) {
                autoApprovalStatus = 'rejected';
            } else {
                autoApprovalStatus = 'approved';
            }
        }

        const user = {
            docType: 'user',
            username,
            passwordHash,
            email,
            phone: userData.phone || '',
            role,
            companyName: companyName || '',
            tin: tin || '',
            registrationNumber: registrationNumber || null,
            capitalETB: capitalETB || 0,
            businessType: businessType || 'PRIVATE_EXPORTER',
            address: userData.address || '',
            contactPerson: userData.contactPerson || '',
            status: role === 'exporter' ? autoApprovalStatus : 'approved',
            registeredAt: timestamp,
            updatedAt: timestamp,
            validationResults: role === 'exporter' ? {
                autoValidated: true,
                validatedAt: timestamp,
                validatedBy: status ? 'GATEWAY' : 'SMART_CONTRACT',
                passed: autoApprovalStatus === 'approved',
                rejectionReasons: rejectionReasons,
                validationReason: validationReason || null
            } : null,
            approvedAt: autoApprovalStatus === 'approved' ? timestamp : null,
            approvedBy: autoApprovalStatus === 'approved' ? (status ? 'GATEWAY' : 'SMART_CONTRACT') : null,
            approvalComments: autoApprovalStatus === 'approved' ? (validationReason || 'Automatically approved - all validation rules passed') : null,
            rejectedAt: autoApprovalStatus === 'rejected' ? timestamp : null,
            rejectedBy: autoApprovalStatus === 'rejected' ? (status ? 'GATEWAY' : 'SMART_CONTRACT') : null,
            rejectionReason: autoApprovalStatus === 'rejected' ? (validationReason || rejectionReasons.join('; ')) : null
        };

        await ctx.stub.putState(`USER_${username}`, Buffer.from(JSON.stringify(user)));
        
        // If exporter and auto-approved, create exporter profile
        if (role === 'exporter' && autoApprovalStatus === 'approved') {
            const type = businessType || 'PRIVATE_EXPORTER';
            const capitalType = (type === 'UNION' || type === 'FARMER_COOPERATIVE') ? 'company' : 'individual';
            const minimumRequired = capitalType === 'individual' ? 15000000 : 20000000;
            
            const preRegistrationStatus = {
                profile: { 
                    status: 'approved', 
                    submittedAt: timestamp,
                    approvedAt: timestamp,
                    approvedBy: status ? 'GATEWAY' : 'SMART_CONTRACT',
                    autoApprovalReason: `Capital ${capitalETB} ETB meets ${capitalType} minimum requirement (${minimumRequired} ETB)`
                },
                laboratory: { 
                    status: 'unlocked',
                    unlockedAt: timestamp
                },
                taster: { 
                    status: 'not_started'
                },
                competenceCertificate: { 
                    status: 'not_started'
                },
                exportLicense: { 
                    status: 'not_started'
                }
            };
            
            const exporterProfile = {
                docType: 'exporter',
                exporterId: username,
                companyName: companyName || '',
                tin: tin || '',
                capitalETB: capitalETB || 0,
                businessType: businessType || 'PRIVATE_EXPORTER',
                address: userData.address || '',
                contactPerson: userData.contactPerson || '',
                phone: userData.phone || '',
                email: email || '',
                status: 'approved',
                licenseNumber: null,
                licenseIssuedDate: null,
                licenseExpiryDate: null,
                fullyQualified: false,
                autoQualificationLevel: 'PROFILE_ONLY',
                capitalType: capitalType,
                minimumCapitalRequired: minimumRequired,
                preRegistrationStatus: preRegistrationStatus,
                createdAt: timestamp,
                updatedAt: timestamp
            };
            
            await ctx.stub.putState(username, Buffer.from(JSON.stringify(exporterProfile)));
            
            ctx.stub.setEvent('ExporterProfileCreated', Buffer.from(JSON.stringify({
                exporterId: username,
                status: 'approved',
                fullyQualified: false,
                autoQualificationLevel: 'PROFILE_ONLY',
                capitalType: capitalType,
                capitalETB: capitalETB,
                minimumRequired: minimumRequired,
                nextStep: 'laboratory',
                timestamp: timestamp
            })));
        }
        
        ctx.stub.setEvent('UserRegistered', Buffer.from(JSON.stringify({
            username,
            role,
            status: user.status,
            autoValidated: role === 'exporter',
            validatedBy: status ? 'GATEWAY' : 'SMART_CONTRACT',
            timestamp: timestamp
        })));

        return JSON.stringify({ 
            success: true, 
            username, 
            status: user.status,
            autoValidated: role === 'exporter',
            validatedBy: status ? 'GATEWAY' : 'SMART_CONTRACT',
            rejectionReasons: rejectionReasons.length > 0 ? rejectionReasons : null
        });
    }

    /**
     * Get user by username
     */
    async GetUser(ctx, username) {
        const userData = await ctx.stub.getState(`USER_${username}`);
        
        if (!userData || userData.length === 0) {
            throw new Error(`User ${username} does not exist`);
        }

        return userData.toString();
    }

    /**
     * Update user status (approve/reject/suspend)
     */
    async UpdateUserStatus(ctx, username, statusDataJSON) {
        const statusData = JSON.parse(statusDataJSON);
        const userData = await ctx.stub.getState(`USER_${username}`);
        
        if (!userData || userData.length === 0) {
            throw new Error(`User ${username} does not exist`);
        }

        const user = JSON.parse(userData.toString());
        
        // Update status
        user.status = statusData.status; // approved, rejected, suspended, active
        user.updatedAt = new Date().toISOString();
        
        if (statusData.status === 'approved') {
            user.approvedAt = new Date().toISOString();
            user.approvedBy = statusData.approvedBy || 'ECTA';
            user.approvalComments = statusData.comments || '';
        } else if (statusData.status === 'rejected') {
            user.rejectedAt = new Date().toISOString();
            user.rejectedBy = statusData.rejectedBy || 'ECTA';
            user.rejectionReason = statusData.reason || '';
        } else if (statusData.status === 'suspended') {
            user.suspendedAt = new Date().toISOString();
            user.suspendedBy = statusData.suspendedBy || 'ECTA';
            user.suspensionReason = statusData.reason || '';
        }

        await ctx.stub.putState(`USER_${username}`, Buffer.from(JSON.stringify(user)));
        
        // If exporter, also update exporter profile
        if (user.role === 'exporter') {
            const exporterData = await ctx.stub.getState(username);
            if (exporterData && exporterData.length > 0) {
                const exporter = JSON.parse(exporterData.toString());
                exporter.status = statusData.status;
                exporter.updatedAt = new Date().toISOString();
                await ctx.stub.putState(username, Buffer.from(JSON.stringify(exporter)));
            }
        }
        
        ctx.stub.setEvent('UserStatusUpdated', Buffer.from(JSON.stringify({
            username,
            status: statusData.status,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, username, status: statusData.status });
    }

    /**
     * Get users by role
     */
    async GetUsersByRole(ctx, role) {
        const queryString = {
            selector: {
                docType: 'user',
                role: role
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    /**
     * Get pending user registrations
     */
    async GetPendingUsers(ctx) {
        const queryString = {
            selector: {
                docType: 'user',
                status: 'pending_approval'
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    /**
     * Get users by status
     */
    async GetUsersByStatus(ctx, status) {
        const queryString = {
            selector: {
                docType: 'user',
                status: status
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    // ============================================================================
    // EXPORTER MANAGEMENT
    // ============================================================================

    /**
     * Initialize ledger with sample data (optional)
     */
    async InitLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
        return JSON.stringify({ success: true, message: 'Ledger initialized' });
    }

    /**
     * Submit exporter pre-registration
     */
    async SubmitPreRegistration(ctx, preRegDataJSON) {
        const preRegData = JSON.parse(preRegDataJSON);
        const { exporterId, companyName, tin, capitalETB, licenseNumber } = preRegData;

        // Validate required fields
        if (!exporterId || !companyName || !tin) {
            throw new Error('Missing required fields: exporterId, companyName, tin');
        }

        // Check if exporter already exists
        const existingData = await ctx.stub.getState(exporterId);
        if (existingData && existingData.length > 0) {
            throw new Error(`Exporter ${exporterId} already exists`);
        }

        // Use deterministic timestamp from transaction context
        const txTimestamp = ctx.stub.getTxTimestamp();
        const timestamp = new Date(txTimestamp.seconds.toNumber() * 1000).toISOString();

        const exporter = {
            docType: 'exporter',
            exporterId,
            companyName,
            tin,
            capitalETB: capitalETB || 0,
            licenseNumber: licenseNumber || '',
            licenseType: preRegData.licenseType || 'export', // export, commercial_marketing, miller
            licenseIssuedDate: preRegData.licenseIssuedDate || null,
            licenseExpiryDate: preRegData.licenseExpiryDate || null,
            licenseRenewalDue: preRegData.licenseRenewalDue || null,
            status: 'pending_approval',
            // Statutory Documents (Directive No. 1106/2025)
            statutoryDocuments: {
                tradeLicense: {
                    number: preRegData.tradeLicenseNumber || null,
                    issueDate: preRegData.tradeLicenseIssueDate || null,
                    expiryDate: preRegData.tradeLicenseExpiryDate || null,
                    documentHash: null,
                    status: 'pending_verification'
                },
                tinCertificate: {
                    tin: tin,
                    issueDate: preRegData.tinIssueDate || null,
                    status: 'pending_verification'
                },
                vatCertificate: {
                    vatNumber: preRegData.vatNumber || null,
                    issueDate: preRegData.vatIssueDate || null,
                    status: 'pending_verification'
                },
                investmentRegistration: {
                    registrationNumber: preRegData.investmentRegNumber || null,
                    capitalETB: capitalETB || 0,
                    capitalType: preRegData.capitalType || 'company', // individual or company
                    minimumRequired: preRegData.capitalType === 'individual' ? 15000000 : 20000000,
                    status: capitalETB >= (preRegData.capitalType === 'individual' ? 15000000 : 20000000) ? 'adequate' : 'inadequate'
                },
                nbeStatus: {
                    delinquentStatus: 'pending_check',
                    lastChecked: null,
                    outstandingFX: 0,
                    clearanceDate: null
                }
            },
            preRegistrationStatus: {
                profile: { status: 'submitted', submittedAt: timestamp },
                laboratory: { status: 'not_started' },
                taster: { status: 'not_started' },
                competenceCertificate: { status: 'not_started' },
                exportLicense: { status: 'not_started' }
            },
            createdAt: timestamp,
            updatedAt: timestamp
        };

        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        // Emit event without timestamp
        ctx.stub.setEvent('PreRegistrationSubmitted', Buffer.from(JSON.stringify({
            exporterId,
            companyName
        })));

        return JSON.stringify({ success: true, exporterId });
    }

    /**
     * Get exporter profile
     */
    async GetExporterProfile(ctx, exporterId) {
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        return exporterData.toString();
    }

    /**
     * Update exporter profile
     */
    async UpdateExporterProfile(ctx, exporterId, updatesJSON) {
        const updates = JSON.parse(updatesJSON);
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        
        // Update allowed fields
        if (updates.companyName) exporter.companyName = updates.companyName;
        if (updates.capitalETB) exporter.capitalETB = updates.capitalETB;
        if (updates.licenseNumber) exporter.licenseNumber = updates.licenseNumber;
        if (updates.licenseType) exporter.licenseType = updates.licenseType;
        if (updates.licenseIssuedDate) exporter.licenseIssuedDate = updates.licenseIssuedDate;
        if (updates.licenseExpiryDate) exporter.licenseExpiryDate = updates.licenseExpiryDate;
        if (updates.licenseRenewalDue) exporter.licenseRenewalDue = updates.licenseRenewalDue;
        
        // Replace preRegistrationStatus completely if provided
        if (updates.preRegistrationStatus) {
            exporter.preRegistrationStatus = updates.preRegistrationStatus;
        }
        
        if (updates.isQualified !== undefined) exporter.isQualified = updates.isQualified;
        
        // CRITICAL: Use the exact updatedAt from input for determinism across all peers
        // Do NOT generate or modify timestamp - use exactly what was provided
        if (updates.updatedAt) {
            exporter.updatedAt = updates.updatedAt;
        }

        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        // Return only success flag without timestamp to avoid endorsement payload mismatch
        return JSON.stringify({ success: true, exporterId, updated: true });
    }

    /**
     * Check license expiry status
     */
    async CheckLicenseExpiry(ctx, exporterId) {
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        
        if (!exporter.licenseExpiryDate) {
            return JSON.stringify({ 
                status: 'no_expiry_date',
                message: 'License expiry date not set'
            });
        }

        const expiryDate = new Date(exporter.licenseExpiryDate);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));

        let status = 'valid';
        let message = `License valid for ${daysUntilExpiry} days`;

        if (daysUntilExpiry < 0) {
            status = 'expired';
            message = `License expired ${Math.abs(daysUntilExpiry)} days ago`;
        } else if (daysUntilExpiry <= 30) {
            status = 'expiring_soon';
            message = `License expires in ${daysUntilExpiry} days - renewal required`;
        }

        return JSON.stringify({
            status,
            message,
            expiryDate: exporter.licenseExpiryDate,
            daysUntilExpiry,
            renewalDue: exporter.licenseRenewalDue
        });
    }

    /**
     * Renew exporter license
     */
    async RenewLicense(ctx, exporterId, renewalDataJSON) {
        const renewalData = JSON.parse(renewalDataJSON);
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        
        // Update license dates
        exporter.licenseIssuedDate = renewalData.issuedDate || new Date().toISOString();
        exporter.licenseExpiryDate = renewalData.expiryDate;
        exporter.licenseRenewalDue = renewalData.renewalDue || null;
        exporter.updatedAt = new Date().toISOString();

        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        ctx.stub.setEvent('LicenseRenewed', Buffer.from(JSON.stringify({
            exporterId,
            expiryDate: renewalData.expiryDate,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exporterId, expiryDate: renewalData.expiryDate });
    }

    /**
     * Revoke exporter license (ECTA only)
     */
    async RevokeLicense(ctx, exporterId, reasonJSON) {
        const reason = JSON.parse(reasonJSON);
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        
        // Revoke license
        exporter.status = 'revoked';
        exporter.revokedAt = new Date().toISOString();
        exporter.revokedBy = reason.revokedBy || 'ECTA';
        exporter.revocationReason = reason.reason || '';
        exporter.updatedAt = new Date().toISOString();

        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        ctx.stub.setEvent('LicenseRevoked', Buffer.from(JSON.stringify({
            exporterId,
            reason: reason.reason,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exporterId, status: 'revoked' });
    }

    /**
     * Suspend exporter (ECTA only)
     */
    async SuspendExporter(ctx, exporterId, suspensionDataJSON) {
        const suspensionData = JSON.parse(suspensionDataJSON);
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        
        // Suspend exporter
        exporter.status = 'suspended';
        exporter.suspendedAt = new Date().toISOString();
        exporter.suspendedBy = suspensionData.suspendedBy || 'ECTA';
        exporter.suspensionReason = suspensionData.reason || '';
        exporter.suspensionEndDate = suspensionData.endDate || null;
        exporter.updatedAt = new Date().toISOString();

        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        ctx.stub.setEvent('ExporterSuspended', Buffer.from(JSON.stringify({
            exporterId,
            reason: suspensionData.reason,
            endDate: suspensionData.endDate,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exporterId, status: 'suspended' });
    }

    /**
     * Reactivate suspended exporter (ECTA only)
     */
    async ReactivateExporter(ctx, exporterId, reactivationDataJSON) {
        const reactivationData = JSON.parse(reactivationDataJSON);
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        
        if (exporter.status !== 'suspended') {
            throw new Error(`Exporter ${exporterId} is not suspended`);
        }
        
        // Reactivate exporter
        exporter.status = 'active';
        exporter.reactivatedAt = new Date().toISOString();
        exporter.reactivatedBy = reactivationData.reactivatedBy || 'ECTA';
        exporter.reactivationNotes = reactivationData.notes || '';
        exporter.updatedAt = new Date().toISOString();

        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        ctx.stub.setEvent('ExporterReactivated', Buffer.from(JSON.stringify({
            exporterId,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exporterId, status: 'active' });
    }

    /**
     * Approve exporter pre-registration (ECTA only)
     */
    /**
     * Approve or Reject a specific pre-registration stage
     * @param {string} exporterId - The exporter ID
     * @param {string} stage - The stage to approve/reject (profile, laboratory, taster, competenceCertificate, exportLicense)
     * @param {string} action - 'approve' or 'reject'
     * @param {string} commentsJSON - Optional comments/reason (required for rejection)
     */
    async ApprovePreRegistration(ctx, exporterId, stage, action = 'approve', commentsJSON = '{}') {
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        const comments = JSON.parse(commentsJSON);
        const timestamp = new Date().toISOString();
        
        // Validate stage exists
        if (!exporter.preRegistrationStatus || !exporter.preRegistrationStatus[stage]) {
            throw new Error(`Invalid stage: ${stage}`);
        }

        // Validate action
        if (action !== 'approve' && action !== 'reject') {
            throw new Error(`Invalid action: ${action}. Must be 'approve' or 'reject'`);
        }

        // Check if stage is in correct state for approval/rejection
        const currentStatus = exporter.preRegistrationStatus[stage].status;
        if (currentStatus !== 'submitted' && currentStatus !== 'pending_review' && currentStatus !== 'rejected') {
            throw new Error(`Stage ${stage} cannot be ${action}ed. Current status: ${currentStatus}`);
        }

        // Update stage based on action
        if (action === 'approve') {
            exporter.preRegistrationStatus[stage].status = 'approved';
            exporter.preRegistrationStatus[stage].approvedAt = timestamp;
            exporter.preRegistrationStatus[stage].approvedBy = comments.approvedBy || 'ECTA';
            exporter.preRegistrationStatus[stage].approvalComments = comments.comments || '';
            
            // Unlock next stage
            const stageOrder = ['profile', 'laboratory', 'taster', 'competenceCertificate', 'exportLicense'];
            const currentIndex = stageOrder.indexOf(stage);
            if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
                const nextStage = stageOrder[currentIndex + 1];
                if (exporter.preRegistrationStatus[nextStage].status === 'not_started') {
                    exporter.preRegistrationStatus[nextStage].status = 'unlocked';
                    exporter.preRegistrationStatus[nextStage].unlockedAt = timestamp;
                }
            }
        } else {
            // Rejection
            if (!comments.reason) {
                throw new Error('Rejection reason is required');
            }
            exporter.preRegistrationStatus[stage].status = 'rejected';
            exporter.preRegistrationStatus[stage].rejectedAt = timestamp;
            exporter.preRegistrationStatus[stage].rejectedBy = comments.rejectedBy || 'ECTA';
            exporter.preRegistrationStatus[stage].rejectionReason = comments.reason;
        }

        // Check if all stages are approved
        const allApproved = Object.values(exporter.preRegistrationStatus)
            .every(s => s.status === 'approved' || s.status === 'not_applicable');
        
        // Update exporter status based on workflow state
        if (allApproved) {
            // All stages approved - activate exporter
            const oneYearLater = new Date();
            oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
            const oneYearLaterISO = oneYearLater.toISOString();
            
            // Generate license number if not exists
            if (!exporter.licenseNumber) {
                const licenseNumber = `ECTA-${Date.now()}-${exporterId.substring(0, 8).toUpperCase()}`;
                exporter.licenseNumber = licenseNumber;
                exporter.licenseIssuedDate = timestamp;
                exporter.licenseExpiryDate = oneYearLaterISO;
            }
            
            // Fully activate exporter
            exporter.status = 'active';
            exporter.qualifiedAt = timestamp;
            exporter.fullyQualified = true;
            exporter.autoQualificationLevel = 'MANUAL_APPROVAL';
            
            // Ensure all required profile fields exist
            if (!exporter.companyName) exporter.companyName = '';
            if (!exporter.tin) exporter.tin = '';
            if (!exporter.capitalETB) exporter.capitalETB = 0;
            if (!exporter.businessType) exporter.businessType = 'PRIVATE_EXPORTER';
            if (!exporter.address) exporter.address = '';
            if (!exporter.contactPerson) exporter.contactPerson = '';
            if (!exporter.phone) exporter.phone = '';
            if (!exporter.email) exporter.email = '';
            if (!exporter.docType) exporter.docType = 'exporter';
            if (!exporter.exporterId) exporter.exporterId = exporterId;
            if (!exporter.createdAt) exporter.createdAt = timestamp;
        } else if (stage === 'profile' && action === 'approve' && exporter.status === 'pending_approval') {
            // First stage (profile) approved - change status to 'approved'
            // This allows user to login and continue with other stages
            exporter.status = 'approved';
            exporter.profileApprovedAt = timestamp;
        }

        exporter.updatedAt = timestamp;

        // Update USER record status as well
        const userKey = `USER_${exporterId}`;
        const userData = await ctx.stub.getState(userKey);
        if (userData && userData.length > 0) {
            const user = JSON.parse(userData.toString());
            user.status = exporter.status;
            user.updatedAt = timestamp;
            await ctx.stub.putState(userKey, Buffer.from(JSON.stringify(user)));
        }

        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        ctx.stub.setEvent('PreRegistrationStageUpdated', Buffer.from(JSON.stringify({
            exporterId,
            stage,
            action,
            newStatus: exporter.preRegistrationStatus[stage].status,
            exporterStatus: exporter.status,
            allStagesComplete: allApproved,
            timestamp
        })));

        return JSON.stringify({ 
            success: true, 
            exporterId, 
            stage,
            action,
            stageStatus: exporter.preRegistrationStatus[stage].status,
            exporterStatus: exporter.status,
            allStagesComplete: allApproved 
        });
    }

    /**
     * Reject a specific pre-registration stage (convenience method)
     */
    async RejectPreRegistration(ctx, exporterId, stage, reasonJSON) {
        return await this.ApprovePreRegistration(ctx, exporterId, stage, 'reject', reasonJSON);
    }

    /**
     * Submit a stage for review by exporter
     * @param {string} exporterId - The exporter ID
     * @param {string} stage - The stage to submit
     * @param {string} dataJSON - Stage-specific data
     */
    async SubmitPreRegistrationStage(ctx, exporterId, stage, dataJSON) {
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        const data = JSON.parse(dataJSON);
        
        // Use deterministic timestamp from transaction context
        const txTimestamp = ctx.stub.getTxTimestamp();
        const timestamp = new Date(txTimestamp.seconds.toNumber() * 1000).toISOString();
        
        // Validate stage exists
        if (!exporter.preRegistrationStatus || !exporter.preRegistrationStatus[stage]) {
            throw new Error(`Invalid stage: ${stage}`);
        }

        // Check if stage is unlocked or can be submitted
        const currentStatus = exporter.preRegistrationStatus[stage].status;
        if (currentStatus !== 'unlocked' && currentStatus !== 'not_started' && currentStatus !== 'rejected') {
            throw new Error(`Stage ${stage} cannot be submitted. Current status: ${currentStatus}. Must be 'unlocked', 'not_started', or 'rejected'`);
        }

        // SMART CONTRACT VALIDATION
        let validationResult = this._validateStageSubmission(stage, data);
        
        // Update stage based on validation
        exporter.preRegistrationStatus[stage].submittedAt = timestamp;
        exporter.preRegistrationStatus[stage].submissionData = data;
        
        if (validationResult.autoApprove) {
            // Auto-approve if validation passes
            exporter.preRegistrationStatus[stage].status = 'approved';
            exporter.preRegistrationStatus[stage].approvedAt = timestamp;
            exporter.preRegistrationStatus[stage].approvedBy = 'SMART_CONTRACT';
            exporter.preRegistrationStatus[stage].autoApprovalReason = validationResult.reason;
            
            // Copy certificate data if provided
            if (data.certificateNumber) exporter.preRegistrationStatus[stage].certificateNumber = data.certificateNumber;
            if (data.validUntil) exporter.preRegistrationStatus[stage].validUntil = data.validUntil;
            if (data.issuedBy) exporter.preRegistrationStatus[stage].issuedBy = data.issuedBy;
            
            // Unlock next stage
            const stageOrder = ['profile', 'laboratory', 'taster', 'competenceCertificate', 'exportLicense'];
            const currentIndex = stageOrder.indexOf(stage);
            if (currentIndex >= 0 && currentIndex < stageOrder.length - 1) {
                const nextStage = stageOrder[currentIndex + 1];
                if (exporter.preRegistrationStatus[nextStage].status === 'not_started') {
                    exporter.preRegistrationStatus[nextStage].status = 'unlocked';
                    exporter.preRegistrationStatus[nextStage].unlockedAt = timestamp;
                }
            }
            
            // Check if all stages are approved
            const allApproved = Object.values(exporter.preRegistrationStatus)
                .every(s => s.status === 'approved' || s.status === 'issued' || s.status === 'not_applicable');
            
            if (allApproved) {
                // Issue license and activate exporter
                const txDate = new Date(txTimestamp.seconds.toNumber() * 1000);
                const year = txDate.getFullYear();
                const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
                const licenseNumber = `LIC-${year}-${random}`;
                const oneYearLater = new Date(txDate);
                oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
                
                exporter.status = 'active';
                exporter.fullyQualified = true;
                exporter.licenseNumber = licenseNumber;
                exporter.licenseIssuedDate = timestamp;
                exporter.licenseExpiryDate = oneYearLater.toISOString();
                
                exporter.preRegistrationStatus.exportLicense.status = 'issued';
                exporter.preRegistrationStatus.exportLicense.licenseNumber = licenseNumber;
                exporter.preRegistrationStatus.exportLicense.issuedAt = timestamp;
                exporter.preRegistrationStatus.exportLicense.expiryDate = oneYearLater.toISOString();
            }
        } else if (validationResult.autoReject) {
            // Auto-reject if validation fails
            exporter.preRegistrationStatus[stage].status = 'rejected';
            exporter.preRegistrationStatus[stage].rejectedAt = timestamp;
            exporter.preRegistrationStatus[stage].rejectedBy = 'SMART_CONTRACT';
            exporter.preRegistrationStatus[stage].rejectionReason = validationResult.reason;
        } else {
            // Requires manual ECTA review
            exporter.preRegistrationStatus[stage].status = 'submitted';
        }

        exporter.updatedAt = timestamp;

        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        ctx.stub.setEvent('PreRegistrationStageSubmitted', Buffer.from(JSON.stringify({
            exporterId,
            stage,
            status: exporter.preRegistrationStatus[stage].status,
            autoProcessed: validationResult.autoApprove || validationResult.autoReject,
            timestamp
        })));

        return JSON.stringify({ 
            success: true, 
            exporterId, 
            stage,
            status: exporter.preRegistrationStatus[stage].status,
            autoProcessed: validationResult.autoApprove || validationResult.autoReject,
            message: validationResult.autoApprove 
                ? `Stage ${stage} auto-approved by smart contract` 
                : validationResult.autoReject
                ? `Stage ${stage} rejected: ${validationResult.reason}`
                : `Stage ${stage} submitted successfully and is now pending ECTA review`
        });
    }
    
    /**
     * Validate stage submission data
     * Returns: { autoApprove: boolean, autoReject: boolean, reason: string }
     */
    _validateStageSubmission(stage, data) {
        const currentDate = new Date();
        
        switch(stage) {
            case 'laboratory':
                // Validate laboratory certificate
                if (!data.certificateNumber || data.certificateNumber.length < 5) {
                    return { autoReject: true, reason: 'Invalid certificate number' };
                }
                if (!data.validUntil) {
                    return { autoReject: true, reason: 'Certificate expiry date required' };
                }
                const labExpiry = new Date(data.validUntil);
                if (labExpiry <= currentDate) {
                    return { autoReject: true, reason: 'Certificate has expired' };
                }
                // Auto-approve if valid
                return { autoApprove: true, reason: 'Laboratory certificate validated successfully' };
                
            case 'taster':
                // Validate taster certificate
                if (!data.certificateNumber || data.certificateNumber.length < 5) {
                    return { autoReject: true, reason: 'Invalid taster certificate number' };
                }
                if (!data.validUntil) {
                    return { autoReject: true, reason: 'Taster certificate expiry date required' };
                }
                const tasterExpiry = new Date(data.validUntil);
                if (tasterExpiry <= currentDate) {
                    return { autoReject: true, reason: 'Taster certificate has expired' };
                }
                // Auto-approve if valid
                return { autoApprove: true, reason: 'Taster certificate validated successfully' };
                
            case 'competenceCertificate':
                // Validate competence certificate
                if (!data.certificateNumber || data.certificateNumber.length < 5) {
                    return { autoReject: true, reason: 'Invalid competence certificate number' };
                }
                if (!data.validUntil) {
                    return { autoReject: true, reason: 'Competence certificate expiry date required' };
                }
                const compExpiry = new Date(data.validUntil);
                if (compExpiry <= currentDate) {
                    return { autoReject: true, reason: 'Competence certificate has expired' };
                }
                // Auto-approve if valid
                return { autoApprove: true, reason: 'Competence certificate validated successfully' };
                
            case 'exportLicense':
                // Export license requires manual ECTA review
                return { autoApprove: false, autoReject: false, reason: 'Requires ECTA review' };
                
            default:
                // Unknown stage - require manual review
                return { autoApprove: false, autoReject: false, reason: 'Requires ECTA review' };
        }
    }

    // ============================================================================
    // EXPORT REQUEST MANAGEMENT
    // ============================================================================

    /**
     * Create export request
     */
    async CreateExportRequest(ctx, exportRequestJSON) {
        const exportRequest = JSON.parse(exportRequestJSON);
        const { exportId, exporterId, coffeeType, quantity, destinationCountry, estimatedValue } = exportRequest;

        // Validate required fields
        if (!exportId || !exporterId || !coffeeType || !quantity) {
            throw new Error('Missing required fields');
        }

        // Verify exporter exists and is active
        const exporterData = await ctx.stub.getState(exporterId);
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        if (exporter.status !== 'active') {
            throw new Error(`Exporter ${exporterId} is not active`);
        }

        // Check if export ID already exists
        const existingExport = await ctx.stub.getState(exportId);
        if (existingExport && existingExport.length > 0) {
            throw new Error(`Export ${exportId} already exists`);
        }

        const exportDoc = {
            docType: 'export',
            exportId,
            exporterId,
            exporterName: exporter.companyName,
            coffeeType,
            quantity,
            destinationCountry,
            estimatedValue: estimatedValue || 0,
            // Enhanced contract fields
            buyerCompanyName: exportRequest.buyerCompanyName || '',
            buyerCountry: exportRequest.buyerCountry || destinationCountry,
            paymentTerms: exportRequest.paymentTerms || '', // LC, TT, CAD, etc.
            deliveryTerms: exportRequest.deliveryTerms || '', // FOB, CIF, CFR, etc.
            ecxAuctionReference: exportRequest.ecxAuctionReference || null,
            geographicalDesignation: exportRequest.geographicalDesignation || '', // Sidamo, Yirgacheffe, etc.
            // Banking fields
            lcNumber: exportRequest.lcNumber || null,
            lcIssuingBank: exportRequest.lcIssuingBank || '',
            lcAmount: exportRequest.lcAmount || null,
            lcCurrency: exportRequest.lcCurrency || 'USD',
            // Customs fields
            sadNumber: exportRequest.sadNumber || null,
            customsDeclarationNumber: exportRequest.customsDeclarationNumber || null,
            dutyAmount: exportRequest.dutyAmount || 0,
            taxClearanceReference: exportRequest.taxClearanceReference || null,
            // Shipping fields
            billOfLadingNumber: exportRequest.billOfLadingNumber || null,
            containerNumber: exportRequest.containerNumber || null,
            vesselName: exportRequest.vesselName || '',
            portOfLoading: exportRequest.portOfLoading || 'Djibouti',
            portOfDischarge: exportRequest.portOfDischarge || '',
            estimatedDepartureDate: exportRequest.estimatedDepartureDate || null,
            estimatedArrivalDate: exportRequest.estimatedArrivalDate || null,
            status: 'created',
            workflow: {
                created: { status: 'completed', timestamp: new Date().toISOString() },
                ectaContract: { status: 'pending' },
                ectaQuality: { status: 'pending' },
                ecxVerification: { status: 'pending' },
                bankingDocuments: { status: 'pending' },
                nbeFXApproval: { status: 'pending' },
                customsClearance: { status: 'pending' },
                shipmentSchedule: { status: 'pending' }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await ctx.stub.putState(exportId, Buffer.from(JSON.stringify(exportDoc)));
        
        ctx.stub.setEvent('ExportRequestCreated', Buffer.from(JSON.stringify({
            exportId,
            exporterId,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exportId });
    }

    /**
     * Get export request details
     */
    async GetExportRequest(ctx, exportId) {
        const exportData = await ctx.stub.getState(exportId);
        
        if (!exportData || exportData.length === 0) {
            throw new Error(`Export ${exportId} does not exist`);
        }

        return exportData.toString();
    }

    /**
     * Update export workflow stage
     */
    async UpdateExportWorkflow(ctx, exportId, stage, statusJSON) {
        const statusData = JSON.parse(statusJSON);
        const exportData = await ctx.stub.getState(exportId);
        
        if (!exportData || exportData.length === 0) {
            throw new Error(`Export ${exportId} does not exist`);
        }

        const exportDoc = JSON.parse(exportData.toString());
        
        // Update workflow stage
        if (exportDoc.workflow[stage]) {
            exportDoc.workflow[stage] = {
                ...exportDoc.workflow[stage],
                ...statusData,
                timestamp: new Date().toISOString()
            };
        }

        // Update overall status based on workflow
        if (statusData.status === 'approved' || statusData.status === 'completed') {
            exportDoc.status = this._calculateExportStatus(exportDoc.workflow);
        } else if (statusData.status === 'rejected') {
            exportDoc.status = 'rejected';
            exportDoc.rejectionStage = stage;
            exportDoc.rejectionReason = statusData.reason;
        }

        exportDoc.updatedAt = new Date().toISOString();

        await ctx.stub.putState(exportId, Buffer.from(JSON.stringify(exportDoc)));
        
        ctx.stub.setEvent('ExportWorkflowUpdated', Buffer.from(JSON.stringify({
            exportId,
            stage,
            status: statusData.status,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exportId, stage });
    }

    /**
     * Update export contract details
     */
    async UpdateExportContract(ctx, exportId, contractUpdatesJSON) {
        const updates = JSON.parse(contractUpdatesJSON);
        const exportData = await ctx.stub.getState(exportId);
        
        if (!exportData || exportData.length === 0) {
            throw new Error(`Export ${exportId} does not exist`);
        }

        const exportDoc = JSON.parse(exportData.toString());
        
        // Update contract fields
        if (updates.buyerCompanyName) exportDoc.buyerCompanyName = updates.buyerCompanyName;
        if (updates.buyerCountry) exportDoc.buyerCountry = updates.buyerCountry;
        if (updates.paymentTerms) exportDoc.paymentTerms = updates.paymentTerms;
        if (updates.deliveryTerms) exportDoc.deliveryTerms = updates.deliveryTerms;
        if (updates.ecxAuctionReference) exportDoc.ecxAuctionReference = updates.ecxAuctionReference;
        if (updates.geographicalDesignation) exportDoc.geographicalDesignation = updates.geographicalDesignation;
        
        exportDoc.updatedAt = new Date().toISOString();

        await ctx.stub.putState(exportId, Buffer.from(JSON.stringify(exportDoc)));
        
        return JSON.stringify({ success: true, exportId });
    }

    /**
     * Update banking details
     */
    async UpdateBankingDetails(ctx, exportId, bankingDetailsJSON) {
        const details = JSON.parse(bankingDetailsJSON);
        const exportData = await ctx.stub.getState(exportId);
        
        if (!exportData || exportData.length === 0) {
            throw new Error(`Export ${exportId} does not exist`);
        }

        const exportDoc = JSON.parse(exportData.toString());
        
        // Update banking fields
        if (details.lcNumber) exportDoc.lcNumber = details.lcNumber;
        if (details.lcIssuingBank) exportDoc.lcIssuingBank = details.lcIssuingBank;
        if (details.lcAmount) exportDoc.lcAmount = details.lcAmount;
        if (details.lcCurrency) exportDoc.lcCurrency = details.lcCurrency;
        
        exportDoc.updatedAt = new Date().toISOString();

        await ctx.stub.putState(exportId, Buffer.from(JSON.stringify(exportDoc)));
        
        ctx.stub.setEvent('BankingDetailsUpdated', Buffer.from(JSON.stringify({
            exportId,
            lcNumber: details.lcNumber,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exportId });
    }

    /**
     * Update customs details
     */
    async UpdateCustomsDetails(ctx, exportId, customsDetailsJSON) {
        const details = JSON.parse(customsDetailsJSON);
        const exportData = await ctx.stub.getState(exportId);
        
        if (!exportData || exportData.length === 0) {
            throw new Error(`Export ${exportId} does not exist`);
        }

        const exportDoc = JSON.parse(exportData.toString());
        
        // Update customs fields
        if (details.sadNumber) exportDoc.sadNumber = details.sadNumber;
        if (details.customsDeclarationNumber) exportDoc.customsDeclarationNumber = details.customsDeclarationNumber;
        if (details.dutyAmount !== undefined) exportDoc.dutyAmount = details.dutyAmount;
        if (details.taxClearanceReference) exportDoc.taxClearanceReference = details.taxClearanceReference;
        
        exportDoc.updatedAt = new Date().toISOString();

        await ctx.stub.putState(exportId, Buffer.from(JSON.stringify(exportDoc)));
        
        ctx.stub.setEvent('CustomsDetailsUpdated', Buffer.from(JSON.stringify({
            exportId,
            sadNumber: details.sadNumber,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exportId });
    }

    /**
     * Update shipping details
     */
    async UpdateShippingDetails(ctx, exportId, shippingDetailsJSON) {
        const details = JSON.parse(shippingDetailsJSON);
        const exportData = await ctx.stub.getState(exportId);
        
        if (!exportData || exportData.length === 0) {
            throw new Error(`Export ${exportId} does not exist`);
        }

        const exportDoc = JSON.parse(exportData.toString());
        
        // Update shipping fields
        if (details.billOfLadingNumber) exportDoc.billOfLadingNumber = details.billOfLadingNumber;
        if (details.containerNumber) exportDoc.containerNumber = details.containerNumber;
        if (details.vesselName) exportDoc.vesselName = details.vesselName;
        if (details.portOfLoading) exportDoc.portOfLoading = details.portOfLoading;
        if (details.portOfDischarge) exportDoc.portOfDischarge = details.portOfDischarge;
        if (details.estimatedDepartureDate) exportDoc.estimatedDepartureDate = details.estimatedDepartureDate;
        if (details.estimatedArrivalDate) exportDoc.estimatedArrivalDate = details.estimatedArrivalDate;
        
        exportDoc.updatedAt = new Date().toISOString();

        await ctx.stub.putState(exportId, Buffer.from(JSON.stringify(exportDoc)));
        
        ctx.stub.setEvent('ShippingDetailsUpdated', Buffer.from(JSON.stringify({
            exportId,
            billOfLadingNumber: details.billOfLadingNumber,
            vesselName: details.vesselName,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exportId });
    }

    /**
     * Helper: Calculate export status based on workflow
     */
    _calculateExportStatus(workflow) {
        const stages = ['ectaContract', 'ectaQuality', 'ecxVerification', 'bankingDocuments', 
                       'nbeFXApproval', 'customsClearance', 'shipmentSchedule'];
        
        for (const stage of stages) {
            if (workflow[stage].status === 'pending') {
                return stage.replace(/([A-Z])/g, '_$1').toLowerCase();
            }
        }
        
        return 'completed';
    }

    // ============================================================================
    // CERTIFICATES & DOCUMENTS
    // ============================================================================

    /**
     * Issue quality certificate
     */
    async IssueQualityCertificate(ctx, certificateJSON) {
        const certificate = JSON.parse(certificateJSON);
        const { certificateId, exportId, grade, cupScore, issuedBy } = certificate;

        if (!certificateId || !exportId) {
            throw new Error('Missing required fields');
        }

        const certDoc = {
            docType: 'certificate',
            certificateId,
            exportId,
            type: certificate.type || 'quality', // quality, origin, phytosanitary, weight
            certificateType: certificate.certificateType || 'quality', // For classification
            grade,
            cupScore,
            geographicalDesignation: certificate.geographicalDesignation || '',
            labTestResults: certificate.labTestResults || {},
            issuedBy,
            issuedAt: new Date().toISOString(),
            expiryDate: certificate.expiryDate || null,
            status: 'active'
        };

        await ctx.stub.putState(certificateId, Buffer.from(JSON.stringify(certDoc)));
        
        ctx.stub.setEvent('CertificateIssued', Buffer.from(JSON.stringify({
            certificateId,
            exportId,
            type: 'quality',
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, certificateId });
    }

    /**
     * Verify certificate
     */
    async VerifyCertificate(ctx, certificateId) {
        const certData = await ctx.stub.getState(certificateId);
        
        if (!certData || certData.length === 0) {
            return JSON.stringify({ valid: false, message: 'Certificate not found' });
        }

        const certificate = JSON.parse(certData.toString());
        
        return JSON.stringify({
            valid: certificate.status === 'active',
            certificate
        });
    }

    // ============================================================================
    // ESW (ELECTRONIC SINGLE WINDOW) MANAGEMENT
    // ============================================================================

    /**
     * Submit ESW request
     */
    async SubmitESWRequest(ctx, eswRequestJSON) {
        const eswRequest = JSON.parse(eswRequestJSON);
        const { requestId, exportId, exporterId, documents } = eswRequest;

        if (!requestId || !exportId || !exporterId) {
            throw new Error('Missing required fields');
        }

        const eswDoc = {
            docType: 'esw_request',
            requestId,
            exportId,
            exporterId,
            documents: documents || [],
            agencyApprovals: [],
            status: 'pending',
            submittedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await ctx.stub.putState(requestId, Buffer.from(JSON.stringify(eswDoc)));
        
        ctx.stub.setEvent('ESWRequestSubmitted', Buffer.from(JSON.stringify({
            requestId,
            exportId,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, requestId });
    }

    /**
     * Add agency approval to ESW request
     */
    async AddESWAgencyApproval(ctx, requestId, approvalJSON) {
        const approval = JSON.parse(approvalJSON);
        const eswData = await ctx.stub.getState(requestId);
        
        if (!eswData || eswData.length === 0) {
            throw new Error(`ESW request ${requestId} does not exist`);
        }

        const eswDoc = JSON.parse(eswData.toString());
        
        eswDoc.agencyApprovals.push({
            ...approval,
            timestamp: new Date().toISOString()
        });

        // Check if all required agencies have approved
        const allApproved = eswDoc.agencyApprovals.every(a => a.status === 'approved');
        if (allApproved && eswDoc.agencyApprovals.length >= 5) { // Minimum 5 agencies
            eswDoc.status = 'approved';
            eswDoc.approvedAt = new Date().toISOString();
        }

        eswDoc.updatedAt = new Date().toISOString();

        await ctx.stub.putState(requestId, Buffer.from(JSON.stringify(eswDoc)));
        
        return JSON.stringify({ success: true, requestId });
    }

    /**
     * Get ESW request
     */
    async GetESWRequest(ctx, requestId) {
        const eswData = await ctx.stub.getState(requestId);
        
        if (!eswData || eswData.length === 0) {
            throw new Error(`ESW request ${requestId} does not exist`);
        }

        return eswData.toString();
    }

    // ============================================================================
    // QUERY FUNCTIONS
    // ============================================================================

    /**
     * Get all exports for an exporter
     */
    async GetExporterExports(ctx, exporterId) {
        const queryString = {
            selector: {
                docType: 'export',
                exporterId: exporterId
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    /**
     * Get exports by status
     */
    async GetExportsByStatus(ctx, status) {
        const queryString = {
            selector: {
                docType: 'export',
                status: status
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    /**
     * Get all pending approvals for an organization
     */
    async GetPendingApprovals(ctx, orgType) {
        const stageMap = {
            'ecta': ['ectaContract', 'ectaQuality'],
            'ecx': ['ecxVerification'],
            'bank': ['bankingDocuments'],
            'nbe': ['nbeFXApproval'],
            'customs': ['customsClearance'],
            'shipping': ['shipmentSchedule']
        };

        const stages = stageMap[orgType] || [];
        const results = [];

        for (const stage of stages) {
            const queryString = {
                selector: {
                    docType: 'export',
                    [`workflow.${stage}.status`]: 'pending'
                }
            };

            const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
            const stageResults = await this._getAllResults(iterator);
            results.push(...stageResults);
        }

        return JSON.stringify(results);
    }

    /**
     * Get exporters with expiring licenses
     */
    async GetExpiringLicenses(ctx, daysThreshold) {
        const threshold = parseInt(daysThreshold) || 30;
        const queryString = {
            selector: {
                docType: 'exporter',
                status: 'active'
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const allExporters = await this._getAllResults(iterator);
        
        const expiringLicenses = [];
        const today = new Date();

        for (const item of allExporters) {
            const exporter = item.record;
            if (exporter.licenseExpiryDate) {
                const expiryDate = new Date(exporter.licenseExpiryDate);
                const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
                
                if (daysUntilExpiry <= threshold && daysUntilExpiry >= 0) {
                    expiringLicenses.push({
                        ...item,
                        daysUntilExpiry
                    });
                }
            }
        }

        return JSON.stringify(expiringLicenses);
    }

    /**
     * Helper: Get all results from iterator
     */
    async _getAllResults(iterator) {
        const allResults = [];
        let result = await iterator.next();
        
        while (!result.done) {
            const record = {
                key: result.value.key,
                record: JSON.parse(result.value.value.toString('utf8'))
            };
            allResults.push(record);
            result = await iterator.next();
        }
        
        await iterator.close();
        return allResults;
    }

    /**
     * Submit qualification document (laboratory, taster, competence)
     */
    async SubmitQualificationDocument(ctx, qualificationDataJSON) {
        const qualificationData = JSON.parse(qualificationDataJSON);
        const { exporterId, stage } = qualificationData;

        if (!exporterId || !stage) {
            throw new Error('Missing required fields: exporterId, stage');
        }

        const exporterData = await ctx.stub.getState(exporterId);
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());

        // Get deterministic timestamp from transaction context
        const txTimestamp = ctx.stub.getTxTimestamp();
        const timestamp = new Date(txTimestamp.seconds.toNumber() * 1000).toISOString();

        // Update qualification stage
        if (exporter.preRegistrationStatus[stage]) {
            exporter.preRegistrationStatus[stage] = {
                status: 'submitted',
                submittedAt: qualificationData.submittedAt || timestamp,
                data: qualificationData
            };
        }

        exporter.updatedAt = timestamp;

        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));

        ctx.stub.setEvent('QualificationDocumentSubmitted', Buffer.from(JSON.stringify({
            exporterId,
            stage,
            timestamp
        })));

        return JSON.stringify({ success: true, exporterId, stage });
    }

    /**
     * Get transaction history for an asset
     */
    async GetAssetHistory(ctx, assetId) {
        const iterator = await ctx.stub.getHistoryForKey(assetId);
        const history = [];

        let result = await iterator.next();
        while (!result.done) {
            const record = {
                txId: result.value.txId,
                timestamp: result.value.timestamp,
                isDelete: result.value.isDelete,
                value: result.value.value.toString('utf8')
            };
            history.push(record);
            result = await iterator.next();
        }

        await iterator.close();
        return JSON.stringify(history);
    }

    /**
     * Get pending qualification documents by stage
     * Stages: laboratory, taster, competenceCertificate, license
     */
    async GetPendingQualifications(ctx, stage) {
        if (!stage) {
            throw new Error('Stage is required');
        }

        const queryString = {
            selector: {
                docType: 'exporter'
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const pending = [];

        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value).toString('utf8');
            const exporter = JSON.parse(strValue);

            // Check if this stage is submitted but not approved
            if (exporter.preRegistrationStatus && 
                exporter.preRegistrationStatus[stage] &&
                exporter.preRegistrationStatus[stage].status === 'submitted') {
                
                pending.push({
                    exporterId: exporter.exporterId,
                    businessName: exporter.companyName,
                    stage: stage,
                    submittedAt: exporter.preRegistrationStatus[stage].submittedAt,
                    data: exporter.preRegistrationStatus[stage].data
                });
            }

            result = await iterator.next();
        }

        await iterator.close();
        return JSON.stringify(pending);
    }

    // ============================================================================
    // STATUTORY DOCUMENTS MANAGEMENT (Directive No. 1106/2025)
    // ============================================================================

    /**
     * Upload/Update statutory document
     */
    async UploadStatutoryDocument(ctx, exporterId, documentType, documentDataJSON) {
        const documentData = JSON.parse(documentDataJSON);
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        
        if (!exporter.statutoryDocuments) {
            exporter.statutoryDocuments = {};
        }

        // Update document based on type
        switch (documentType) {
            case 'tradeLicense':
                exporter.statutoryDocuments.tradeLicense = {
                    number: documentData.number,
                    issueDate: documentData.issueDate,
                    expiryDate: documentData.expiryDate,
                    documentHash: documentData.documentHash || null,
                    uploadedAt: new Date().toISOString(),
                    status: 'pending_verification'
                };
                break;
            
            case 'tinCertificate':
                exporter.statutoryDocuments.tinCertificate = {
                    tin: documentData.tin || exporter.tin,
                    issueDate: documentData.issueDate,
                    documentHash: documentData.documentHash || null,
                    uploadedAt: new Date().toISOString(),
                    status: 'pending_verification'
                };
                break;
            
            case 'vatCertificate':
                exporter.statutoryDocuments.vatCertificate = {
                    vatNumber: documentData.vatNumber,
                    issueDate: documentData.issueDate,
                    documentHash: documentData.documentHash || null,
                    uploadedAt: new Date().toISOString(),
                    status: 'pending_verification'
                };
                break;
            
            case 'investmentRegistration':
                exporter.statutoryDocuments.investmentRegistration = {
                    registrationNumber: documentData.registrationNumber,
                    capitalETB: documentData.capitalETB || exporter.capitalETB,
                    capitalType: documentData.capitalType || 'company',
                    minimumRequired: documentData.capitalType === 'individual' ? 15000000 : 20000000,
                    documentHash: documentData.documentHash || null,
                    uploadedAt: new Date().toISOString(),
                    status: documentData.capitalETB >= (documentData.capitalType === 'individual' ? 15000000 : 20000000) 
                        ? 'adequate' : 'inadequate'
                };
                // Update exporter capital
                if (documentData.capitalETB) {
                    exporter.capitalETB = documentData.capitalETB;
                }
                break;
            
            default:
                throw new Error(`Invalid document type: ${documentType}`);
        }

        exporter.updatedAt = new Date().toISOString();
        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        ctx.stub.setEvent('StatutoryDocumentUploaded', Buffer.from(JSON.stringify({
            exporterId,
            documentType,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exporterId, documentType });
    }

    /**
     * Upload/Update statutory document
     */
    async UploadStatutoryDocument(ctx, exporterId, documentType, documentDataJSON) {
        const documentData = JSON.parse(documentDataJSON);
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        
        if (!exporter.statutoryDocuments) {
            exporter.statutoryDocuments = {};
        }

        // Update document based on type
        switch (documentType) {
            case 'tradeLicense':
                exporter.statutoryDocuments.tradeLicense = {
                    number: documentData.number,
                    issueDate: documentData.issueDate,
                    expiryDate: documentData.expiryDate,
                    documentHash: documentData.documentHash || null,
                    uploadedAt: new Date().toISOString(),
                    status: 'pending_verification'
                };
                break;
            
            case 'tinCertificate':
                exporter.statutoryDocuments.tinCertificate = {
                    tin: documentData.tin || exporter.tin,
                    issueDate: documentData.issueDate,
                    documentHash: documentData.documentHash || null,
                    uploadedAt: new Date().toISOString(),
                    status: 'pending_verification'
                };
                break;
            
            case 'vatCertificate':
                exporter.statutoryDocuments.vatCertificate = {
                    vatNumber: documentData.vatNumber,
                    issueDate: documentData.issueDate,
                    documentHash: documentData.documentHash || null,
                    uploadedAt: new Date().toISOString(),
                    status: 'pending_verification'
                };
                break;
            
            case 'investmentRegistration':
                exporter.statutoryDocuments.investmentRegistration = {
                    registrationNumber: documentData.registrationNumber,
                    capitalETB: documentData.capitalETB || exporter.capitalETB,
                    capitalType: documentData.capitalType || 'company',
                    minimumRequired: documentData.capitalType === 'individual' ? 15000000 : 20000000,
                    documentHash: documentData.documentHash || null,
                    uploadedAt: new Date().toISOString(),
                    status: documentData.capitalETB >= (documentData.capitalType === 'individual' ? 15000000 : 20000000) 
                        ? 'adequate' : 'inadequate'
                };
                // Update exporter capital
                if (documentData.capitalETB) {
                    exporter.capitalETB = documentData.capitalETB;
                }
                break;
            
            default:
                throw new Error(`Invalid document type: ${documentType}`);
        }

        exporter.updatedAt = new Date().toISOString();
        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        ctx.stub.setEvent('StatutoryDocumentUploaded', Buffer.from(JSON.stringify({
            exporterId,
            documentType,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exporterId, documentType });
    }

    /**
     * Verify statutory document (ECTA only)
     */
    async VerifyStatutoryDocument(ctx, exporterId, documentType, verificationDataJSON) {
        const verificationData = JSON.parse(verificationDataJSON);
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        
        if (!exporter.statutoryDocuments || !exporter.statutoryDocuments[documentType]) {
            throw new Error(`Document ${documentType} not found for exporter ${exporterId}`);
        }

        const document = exporter.statutoryDocuments[documentType];
        document.status = verificationData.approved ? 'verified' : 'rejected';
        document.verifiedAt = new Date().toISOString();
        document.verifiedBy = verificationData.verifiedBy || 'ECTA';
        document.verificationNotes = verificationData.notes || '';

        if (!verificationData.approved) {
            document.rejectionReason = verificationData.reason || '';
        }

        exporter.updatedAt = new Date().toISOString();
        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        ctx.stub.setEvent('StatutoryDocumentVerified', Buffer.from(JSON.stringify({
            exporterId,
            documentType,
            approved: verificationData.approved,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exporterId, documentType, status: document.status });
    }

    /**
     * Update NBE delinquent status
     */
    async UpdateNBEStatus(ctx, exporterId, nbeStatusJSON) {
        const nbeStatus = JSON.parse(nbeStatusJSON);
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        
        if (!exporter.statutoryDocuments) {
            exporter.statutoryDocuments = {};
        }

        exporter.statutoryDocuments.nbeStatus = {
            delinquentStatus: nbeStatus.delinquentStatus, // 'clear' or 'delinquent'
            lastChecked: new Date().toISOString(),
            outstandingFX: nbeStatus.outstandingFX || 0,
            clearanceDate: nbeStatus.clearanceDate || null,
            clearanceCertificate: nbeStatus.clearanceCertificate || null,
            checkedBy: nbeStatus.checkedBy || 'NBE'
        };

        exporter.updatedAt = new Date().toISOString();
        await ctx.stub.putState(exporterId, Buffer.from(JSON.stringify(exporter)));
        
        ctx.stub.setEvent('NBEStatusUpdated', Buffer.from(JSON.stringify({
            exporterId,
            delinquentStatus: nbeStatus.delinquentStatus,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, exporterId, delinquentStatus: nbeStatus.delinquentStatus });
    }

    /**
     * Get exporters with pending document verification
     */
    async GetPendingDocumentVerifications(ctx) {
        const queryString = {
            selector: {
                docType: 'exporter'
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const pending = [];

        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value).toString('utf8');
            const exporter = JSON.parse(strValue);

            if (exporter.statutoryDocuments) {
                const pendingDocs = [];
                
                // Check each document type
                for (const [docType, docData] of Object.entries(exporter.statutoryDocuments)) {
                    if (docData.status === 'pending_verification') {
                        pendingDocs.push({
                            documentType: docType,
                            uploadedAt: docData.uploadedAt,
                            ...docData
                        });
                    }
                }

                if (pendingDocs.length > 0) {
                    pending.push({
                        exporterId: exporter.exporterId,
                        companyName: exporter.companyName,
                        pendingDocuments: pendingDocs
                    });
                }
            }

            result = await iterator.next();
        }

        await iterator.close();
        return JSON.stringify(pending);
    }

    /**
     * Check if exporter meets all statutory requirements
     */
    async CheckStatutoryCompliance(ctx, exporterId) {
        const exporterData = await ctx.stub.getState(exporterId);
        
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        const compliance = {
            exporterId,
            companyName: exporter.companyName,
            overallCompliant: false,
            checks: {
                tradeLicense: false,
                tinCertificate: false,
                vatCertificate: false,
                capitalAdequacy: false,
                nbeStatus: false
            },
            details: {}
        };

        if (!exporter.statutoryDocuments) {
            return JSON.stringify(compliance);
        }

        const docs = exporter.statutoryDocuments;

        // Check Trade License
        if (docs.tradeLicense && docs.tradeLicense.status === 'verified') {
            const expiryDate = new Date(docs.tradeLicense.expiryDate);
            const today = new Date();
            compliance.checks.tradeLicense = expiryDate > today;
            compliance.details.tradeLicense = {
                status: docs.tradeLicense.status,
                expiryDate: docs.tradeLicense.expiryDate,
                expired: expiryDate <= today
            };
        }

        // Check TIN Certificate
        if (docs.tinCertificate && docs.tinCertificate.status === 'verified') {
            compliance.checks.tinCertificate = true;
            compliance.details.tinCertificate = {
                status: docs.tinCertificate.status,
                tin: docs.tinCertificate.tin
            };
        }

        // Check VAT Certificate
        if (docs.vatCertificate && docs.vatCertificate.status === 'verified') {
            compliance.checks.vatCertificate = true;
            compliance.details.vatCertificate = {
                status: docs.vatCertificate.status,
                vatNumber: docs.vatCertificate.vatNumber
            };
        }

        // Check Capital Adequacy
        if (docs.investmentRegistration) {
            compliance.checks.capitalAdequacy = docs.investmentRegistration.status === 'adequate';
            compliance.details.capitalAdequacy = {
                capitalETB: docs.investmentRegistration.capitalETB,
                minimumRequired: docs.investmentRegistration.minimumRequired,
                capitalType: docs.investmentRegistration.capitalType,
                status: docs.investmentRegistration.status
            };
        }

        // Check NBE Status
        if (docs.nbeStatus) {
            compliance.checks.nbeStatus = docs.nbeStatus.delinquentStatus === 'clear';
            compliance.details.nbeStatus = {
                delinquentStatus: docs.nbeStatus.delinquentStatus,
                lastChecked: docs.nbeStatus.lastChecked,
                outstandingFX: docs.nbeStatus.outstandingFX
            };
        }

        // Overall compliance
        compliance.overallCompliant = Object.values(compliance.checks).every(check => check === true);

        return JSON.stringify(compliance);
    }

    // ============================================================================
    // SHIPMENT MANAGEMENT (Phase 2: Per-Shipment Workflow)
    // ============================================================================

    /**
     * Create shipment with sales contract
     */
    async CreateShipment(ctx, shipmentDataJSON) {
        const shipmentData = JSON.parse(shipmentDataJSON);
        const { shipmentId, exporterId } = shipmentData;

        if (!shipmentId || !exporterId) {
            throw new Error('Missing required fields: shipmentId, exporterId');
        }

        // Verify exporter exists and is qualified
        const exporterData = await ctx.stub.getState(exporterId);
        if (!exporterData || exporterData.length === 0) {
            throw new Error(`Exporter ${exporterId} does not exist`);
        }

        const exporter = JSON.parse(exporterData.toString());
        if (exporter.status !== 'active' && exporter.status !== 'approved') {
            throw new Error(`Exporter ${exporterId} is not active. Current status: ${exporter.status}`);
        }

        // Check if shipment already exists
        const existingShipment = await ctx.stub.getState(shipmentId);
        if (existingShipment && existingShipment.length > 0) {
            throw new Error(`Shipment ${shipmentId} already exists`);
        }

        // Validate required sales contract fields (Property 1: Sales Contract Completeness)
        if (!shipmentData.buyerCompanyName || shipmentData.buyerCompanyName.trim().length === 0) {
            throw new Error('Buyer company name is required and cannot be empty or whitespace');
        }
        if (!shipmentData.buyerCountry || shipmentData.buyerCountry.trim().length === 0) {
            throw new Error('Buyer country is required and cannot be empty or whitespace');
        }
        if (!shipmentData.buyerContact || typeof shipmentData.buyerContact !== 'object') {
            throw new Error('Buyer contact information is required');
        }
        if (!shipmentData.buyerContact.name || shipmentData.buyerContact.name.trim().length === 0) {
            throw new Error('Buyer contact name is required and cannot be empty or whitespace');
        }
        if (!shipmentData.buyerContact.email || shipmentData.buyerContact.email.trim().length === 0) {
            throw new Error('Buyer contact email is required and cannot be empty or whitespace');
        }
        if (!shipmentData.paymentTerms || !['LC', 'CAD', 'TT'].includes(shipmentData.paymentTerms)) {
            throw new Error('Payment terms must be one of: LC, CAD, TT');
        }
        if (!shipmentData.deliveryTerms || !['FOB', 'CIF', 'CFR'].includes(shipmentData.deliveryTerms)) {
            throw new Error('Delivery terms must be one of: FOB, CIF, CFR');
        }

        const shipment = {
            docType: 'shipment',
            shipmentId,
            exporterId,
            exporterName: exporter.companyName,
            exportLicenseNumber: exporter.licenseNumber,
            
            // Sales Contract
            salesContract: {
                contractNumber: shipmentData.contractNumber || `SC-${shipmentId}`,
                registeredWithECTA: false,
                registrationDate: null,
                buyerCompanyName: shipmentData.buyerCompanyName || '',
                buyerCountry: shipmentData.buyerCountry || '',
                buyerContact: shipmentData.buyerContact || {},
                contractDate: shipmentData.contractDate || new Date().toISOString(),
                deliveryTerms: shipmentData.deliveryTerms || 'FOB', // FOB, CIF, CFR
                paymentTerms: shipmentData.paymentTerms || 'LC', // LC, CAD, TT
                ecxAuctionReference: shipmentData.ecxAuctionReference || null,
                status: 'draft'
            },
            
            // Coffee Details
            coffeeDetails: {
                type: shipmentData.coffeeType || '',
                grade: shipmentData.grade || '',
                quantity: shipmentData.quantity || 0, // in kg
                numberOfBags: Math.ceil((shipmentData.quantity || 0) / 60), // standard 60kg bags
                bagWeight: 60,
                geographicalDesignation: shipmentData.geographicalDesignation || '',
                processingMethod: shipmentData.processingMethod || ''
            },
            
            // Pricing
            pricing: {
                unitPrice: shipmentData.unitPrice || 0,
                currency: shipmentData.currency || 'USD',
                totalValue: (shipmentData.unitPrice || 0) * (shipmentData.quantity || 0),
                minimumExportPrice: null,
                priceValidationDate: null,
                priceApproved: false
            },
            
            // Payment
            payment: {
                method: shipmentData.paymentTerms || 'LC',
                lcNumber: null,
                lcIssuingBank: null,
                lcAmount: null,
                lcCurrency: null,
                lcExpiryDate: null,
                cadCommitmentDate: null,
                cadSettlementDue: null,
                bankVerified: false
            },
            
            // Commercial Invoice
            commercialInvoice: {
                invoiceNumber: null,
                invoiceDate: null,
                invoiceAmount: null,
                invoiceCurrency: null,
                generatedAt: null,
                pdfUrl: null
            },
            
            // Packing List
            packingList: {
                totalBags: Math.ceil((shipmentData.quantity || 0) / 60),
                bagMarks: shipmentData.bagMarks || '',
                grossWeight: null,
                netWeight: shipmentData.quantity || 0,
                tareWeight: null,
                containerNumber: null,
                sealNumber: null
            },
            
            status: 'draft',
            workflow: {
                created: { status: 'completed', timestamp: new Date().toISOString() },
                contractRegistration: { status: 'pending' },
                priceValidation: { status: 'pending' },
                contractApproval: { status: 'pending' },
                invoiceGeneration: { status: 'pending' },
                paymentVerification: { status: 'pending' }
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        
        ctx.stub.setEvent('ShipmentCreated', Buffer.from(JSON.stringify({
            shipmentId,
            exporterId,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, shipmentId });
    }

    /**
     * Register sales contract with ECTA
     */
    async RegisterSalesContract(ctx, shipmentId) {
        const shipmentData = await ctx.stub.getState(shipmentId);
        
        if (!shipmentData || shipmentData.length === 0) {
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentData.toString());
        
        shipment.salesContract.registeredWithECTA = true;
        shipment.salesContract.registrationDate = new Date().toISOString();
        shipment.salesContract.status = 'registered';
        shipment.workflow.contractRegistration = {
            status: 'completed',
            timestamp: new Date().toISOString()
        };
        shipment.updatedAt = new Date().toISOString();

        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        
        ctx.stub.setEvent('ContractRegistered', Buffer.from(JSON.stringify({
            shipmentId,
            contractNumber: shipment.salesContract.contractNumber,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, shipmentId });
    }

    /**
     * Validate minimum export price
     */
    async ValidateMinimumPrice(ctx, shipmentId, minimumPriceJSON) {
        const minimumPriceData = JSON.parse(minimumPriceJSON);
        const shipmentData = await ctx.stub.getState(shipmentId);
        
        if (!shipmentData || shipmentData.length === 0) {
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentData.toString());
        
        const minimumPrice = minimumPriceData.minimumPrice;
        const unitPrice = shipment.pricing.unitPrice;
        
        shipment.pricing.minimumExportPrice = minimumPrice;
        shipment.pricing.priceValidationDate = new Date().toISOString();
        shipment.pricing.priceApproved = unitPrice >= minimumPrice;
        
        shipment.workflow.priceValidation = {
            status: unitPrice >= minimumPrice ? 'approved' : 'rejected',
            minimumPrice,
            unitPrice,
            validatedBy: minimumPriceData.validatedBy || 'ECTA',
            timestamp: new Date().toISOString()
        };
        
        if (unitPrice < minimumPrice) {
            shipment.status = 'price_rejected';
            shipment.rejectionReason = `Unit price ${unitPrice} ${shipment.pricing.currency} is below minimum export price ${minimumPrice} ${shipment.pricing.currency}`;
        }
        
        shipment.updatedAt = new Date().toISOString();

        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        
        ctx.stub.setEvent('PriceValidated', Buffer.from(JSON.stringify({
            shipmentId,
            approved: unitPrice >= minimumPrice,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ 
            success: true, 
            shipmentId, 
            priceApproved: unitPrice >= minimumPrice,
            unitPrice,
            minimumPrice
        });
    }

    /**
     * Approve sales contract (ECTA only)
     */
    async ApproveSalesContract(ctx, shipmentId, approvalDataJSON) {
        const approvalData = JSON.parse(approvalDataJSON);
        const shipmentData = await ctx.stub.getState(shipmentId);
        
        if (!shipmentData || shipmentData.length === 0) {
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentData.toString());
        
        if (!shipment.pricing.priceApproved) {
            throw new Error('Cannot approve contract: price validation failed');
        }
        
        shipment.salesContract.status = 'approved';
        shipment.workflow.contractApproval = {
            status: 'approved',
            approvedBy: approvalData.approvedBy || 'ECTA',
            comments: approvalData.comments || '',
            timestamp: new Date().toISOString()
        };
        shipment.status = 'contract_approved';
        shipment.updatedAt = new Date().toISOString();

        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        
        ctx.stub.setEvent('ContractApproved', Buffer.from(JSON.stringify({
            shipmentId,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, shipmentId });
    }

    /**
     * Generate commercial invoice
     */
    async GenerateCommercialInvoice(ctx, shipmentId) {
        const shipmentData = await ctx.stub.getState(shipmentId);
        
        if (!shipmentData || shipmentData.length === 0) {
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentData.toString());
        
        if (shipment.salesContract.status !== 'approved') {
            throw new Error('Cannot generate invoice: contract not approved');
        }
        
        const invoiceNumber = `INV-${shipmentId}-${Date.now()}`;
        
        shipment.commercialInvoice = {
            invoiceNumber,
            invoiceDate: new Date().toISOString(),
            invoiceAmount: shipment.pricing.totalValue,
            invoiceCurrency: shipment.pricing.currency,
            generatedAt: new Date().toISOString(),
            pdfUrl: `/invoices/${invoiceNumber}.pdf` // Placeholder
        };
        
        shipment.workflow.invoiceGeneration = {
            status: 'completed',
            timestamp: new Date().toISOString()
        };
        shipment.status = 'invoice_generated';
        shipment.updatedAt = new Date().toISOString();

        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        
        ctx.stub.setEvent('InvoiceGenerated', Buffer.from(JSON.stringify({
            shipmentId,
            invoiceNumber,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ 
            success: true, 
            shipmentId, 
            invoiceNumber,
            invoiceAmount: shipment.pricing.totalValue
        });
    }

    /**
     * Update payment details (L/C or CAD)
     */
    async UpdatePaymentDetails(ctx, shipmentId, paymentDataJSON) {
        const paymentData = JSON.parse(paymentDataJSON);
        const shipmentData = await ctx.stub.getState(shipmentId);
        
        if (!shipmentData || shipmentData.length === 0) {
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentData.toString());
        
        if (paymentData.method === 'LC') {
            shipment.payment.lcNumber = paymentData.lcNumber;
            shipment.payment.lcIssuingBank = paymentData.lcIssuingBank;
            shipment.payment.lcAmount = paymentData.lcAmount;
            shipment.payment.lcCurrency = paymentData.lcCurrency || 'USD';
            shipment.payment.lcExpiryDate = paymentData.lcExpiryDate;
        } else if (paymentData.method === 'CAD') {
            shipment.payment.cadCommitmentDate = new Date().toISOString();
            // CAD: 90 days settlement period
            const settlementDate = new Date();
            settlementDate.setDate(settlementDate.getDate() + 90);
            shipment.payment.cadSettlementDue = settlementDate.toISOString();
        }
        
        shipment.updatedAt = new Date().toISOString();

        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        
        ctx.stub.setEvent('PaymentDetailsUpdated', Buffer.from(JSON.stringify({
            shipmentId,
            method: paymentData.method,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, shipmentId });
    }

    /**
     * Verify payment (Bank only)
     */
    async VerifyPayment(ctx, shipmentId, verificationDataJSON) {
        const verificationData = JSON.parse(verificationDataJSON);
        const shipmentData = await ctx.stub.getState(shipmentId);
        
        if (!shipmentData || shipmentData.length === 0) {
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentData.toString());
        
        shipment.payment.bankVerified = verificationData.verified;
        shipment.workflow.paymentVerification = {
            status: verificationData.verified ? 'approved' : 'rejected',
            verifiedBy: verificationData.verifiedBy || 'Bank',
            comments: verificationData.comments || '',
            timestamp: new Date().toISOString()
        };
        
        if (verificationData.verified) {
            shipment.status = 'payment_verified';
        } else {
            shipment.status = 'payment_rejected';
            shipment.rejectionReason = verificationData.reason || 'Payment verification failed';
        }
        
        shipment.updatedAt = new Date().toISOString();

        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        
        ctx.stub.setEvent('PaymentVerified', Buffer.from(JSON.stringify({
            shipmentId,
            verified: verificationData.verified,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, shipmentId, verified: verificationData.verified });
    }

    /**
     * Update packing list
     */
    async UpdatePackingList(ctx, shipmentId, packingDataJSON) {
        const packingData = JSON.parse(packingDataJSON);
        const shipmentData = await ctx.stub.getState(shipmentId);
        
        if (!shipmentData || shipmentData.length === 0) {
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentData.toString());
        
        shipment.packingList = {
            ...shipment.packingList,
            ...packingData,
            updatedAt: new Date().toISOString()
        };
        
        shipment.updatedAt = new Date().toISOString();

        await ctx.stub.putState(shipmentId, Buffer.from(JSON.stringify(shipment)));
        
        ctx.stub.setEvent('PackingListUpdated', Buffer.from(JSON.stringify({
            shipmentId,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, shipmentId });
    }

    /**
     * Get shipment details
     */
    async GetShipment(ctx, shipmentId) {
        const shipmentData = await ctx.stub.getState(shipmentId);
        
        if (!shipmentData || shipmentData.length === 0) {
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        return shipmentData.toString();
    }

    /**
     * Get shipments by exporter
     */
    async GetShipmentsByExporter(ctx, exporterId) {
        const queryString = {
            selector: {
                docType: 'shipment',
                exporterId: exporterId
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    /**
     * Get pending contract approvals (ECTA)
     */
    async GetPendingContractApprovals(ctx) {
        const queryString = {
            selector: {
                docType: 'shipment',
                'salesContract.status': 'registered',
                'pricing.priceApproved': true
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    /**
     * Get pending payment verifications (Bank)
     */
    async GetPendingPaymentVerifications(ctx) {
        const queryString = {
            selector: {
                docType: 'shipment',
                status: 'invoice_generated',
                'payment.bankVerified': false
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    // ============================================================================
    // MINIMUM PRICE MANAGEMENT (ECTA only)
    // ============================================================================

    /**
     * Set minimum export price for a coffee grade and type (ECTA only)
     */
    async SetMinimumPrice(ctx, priceDataJSON) {
        const priceData = JSON.parse(priceDataJSON);
        const { grade, coffeeType, minimumPrice, currency } = priceData;

        if (!grade || !coffeeType || !minimumPrice) {
            throw new Error('Missing required fields: grade, coffeeType, minimumPrice');
        }

        // Calculate week number and year
        const effectiveDate = priceData.effectiveDate ? new Date(priceData.effectiveDate) : new Date();
        const year = effectiveDate.getFullYear();
        const weekNumber = this._getWeekNumber(effectiveDate);

        // Create price ID
        const priceId = `MP-${grade.replace(/\s+/g, '')}-${coffeeType.replace(/\s+/g, '')}-${year}-W${weekNumber.toString().padStart(2, '0')}`;

        const minimumPriceDoc = {
            docType: 'minimum_price',
            priceId,
            grade,
            coffeeType,
            minimumPrice: parseFloat(minimumPrice),
            currency: currency || 'USD',
            effectiveDate: effectiveDate.toISOString(),
            weekNumber,
            year,
            setBy: priceData.setBy || 'ECTA',
            setAt: new Date().toISOString()
        };

        await ctx.stub.putState(priceId, Buffer.from(JSON.stringify(minimumPriceDoc)));
        
        ctx.stub.setEvent('MinimumPriceSet', Buffer.from(JSON.stringify({
            priceId,
            grade,
            coffeeType,
            minimumPrice,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, priceId, minimumPrice });
    }

    /**
     * Get current minimum price for a coffee grade and type
     */
    async GetMinimumPrice(ctx, grade, coffeeType) {
        if (!grade || !coffeeType) {
            throw new Error('Missing required fields: grade, coffeeType');
        }

        // Query for prices matching grade and type, sorted by effective date descending
        const queryString = {
            selector: {
                docType: 'minimum_price',
                grade: grade,
                coffeeType: coffeeType
            },
            sort: [
                { effectiveDate: 'desc' }
            ],
            limit: 1
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        if (results.length === 0) {
            throw new Error(`No minimum price found for grade: ${grade}, type: ${coffeeType}`);
        }

        return JSON.stringify(results[0].record);
    }

    /**
     * Get price history for a coffee grade and type
     */
    async GetPriceHistory(ctx, grade, coffeeType) {
        if (!grade || !coffeeType) {
            throw new Error('Missing required fields: grade, coffeeType');
        }

        const queryString = {
            selector: {
                docType: 'minimum_price',
                grade: grade,
                coffeeType: coffeeType
            },
            sort: [
                { effectiveDate: 'desc' }
            ]
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    // ============================================================================
    // PHASE 3: QUALITY & COMPLIANCE CERTIFICATES
    // ============================================================================

    /**
     * Request a certificate for a shipment
     */
    async RequestCertificate(ctx, certificateRequestJSON) {
        const certRequest = JSON.parse(certificateRequestJSON);
        const { shipmentId, certificateType, exporterId } = certRequest;

        if (!shipmentId || !certificateType || !exporterId) {
            throw new Error('Missing required fields: shipmentId, certificateType, exporterId');
        }

        // Validate certificate type
        const validTypes = ['CQIC', 'PHYTO', 'ORIGIN', 'EUDR', 'ICO'];
        if (!validTypes.includes(certificateType)) {
            throw new Error(`Invalid certificate type. Must be one of: ${validTypes.join(', ')}`);
        }

        // Verify shipment exists
        const shipmentData = await ctx.stub.getState(shipmentId);
        if (!shipmentData || shipmentData.length === 0) {
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }

        const shipment = JSON.parse(shipmentData.toString());
        
        // Verify exporter owns the shipment
        if (shipment.exporterId !== exporterId) {
            throw new Error('Exporter does not own this shipment');
        }

        // For most certificates, shipment must have approved contract
        if (certificateType !== 'CQIC' && shipment.workflow.contractApproval.status !== 'approved') {
            throw new Error('Shipment contract must be approved before requesting this certificate');
        }

        // Generate certificate ID
        const certificateId = `CERT-${certificateType}-${Date.now()}`;

        const certificate = {
            docType: 'certificate',
            certificateId,
            certificateType,
            shipmentId,
            exporterId,
            exporterName: shipment.exporterName,
            
            status: 'pending',
            requestedAt: new Date().toISOString(),
            reviewedAt: null,
            issuedAt: null,
            expiryDate: null,
            
            issuedBy: null,
            issuingAgency: this._getIssuingAgency(certificateType),
            certificateNumber: null,
            
            certificateData: certRequest.certificateData || {},
            
            pdfUrl: null,
            pdfHash: null,
            qrCode: null,
            digitalSignature: null,
            
            verificationCount: 0,
            lastVerifiedAt: null,
            
            history: [{
                action: 'requested',
                performedBy: exporterId,
                timestamp: new Date().toISOString(),
                comments: certRequest.comments || ''
            }],
            
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await ctx.stub.putState(certificateId, Buffer.from(JSON.stringify(certificate)));
        
        ctx.stub.setEvent('CertificateRequested', Buffer.from(JSON.stringify({
            certificateId,
            certificateType,
            shipmentId,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, certificateId, status: 'pending' });
    }

    /**
     * Issue CQIC Export Authorization
     */
    async IssueCQICAuthorization(ctx, certificateId, authorizationDataJSON) {
        const authData = JSON.parse(authorizationDataJSON);
        const certificateData = await ctx.stub.getState(certificateId);
        
        if (!certificateData || certificateData.length === 0) {
            throw new Error(`Certificate ${certificateId} does not exist`);
        }

        const certificate = JSON.parse(certificateData.toString());
        
        if (certificate.certificateType !== 'CQIC') {
            throw new Error('This certificate is not a CQIC authorization');
        }
        
        if (certificate.status !== 'pending') {
            throw new Error(`Certificate status is ${certificate.status}, cannot issue`);
        }

        // Generate authorization number
        const authNumber = `CQIC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Set expiry date (30 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 30);

        certificate.status = 'issued';
        certificate.issuedAt = new Date().toISOString();
        certificate.issuedBy = authData.issuedBy || 'CQIC';
        certificate.expiryDate = expiryDate.toISOString();
        certificate.certificateNumber = authNumber;
        certificate.reviewedAt = new Date().toISOString();
        
        certificate.certificateData = {
            ...certificate.certificateData,
            qualityGrade: authData.qualityGrade,
            cuppingScore: authData.cuppingScore,
            defectCount: authData.defectCount,
            moistureContent: authData.moistureContent,
            screenSize: authData.screenSize,
            laboratoryName: authData.laboratoryName,
            laboratoryAccreditation: authData.laboratoryAccreditation,
            testDate: authData.testDate,
            authorizationNumber: authNumber
        };
        
        certificate.history.push({
            action: 'issued',
            performedBy: authData.issuedBy || 'CQIC',
            timestamp: new Date().toISOString(),
            comments: authData.comments || 'CQIC authorization issued'
        });
        
        certificate.updatedAt = new Date().toISOString();

        await ctx.stub.putState(certificateId, Buffer.from(JSON.stringify(certificate)));
        
        ctx.stub.setEvent('CQICAuthorizationIssued', Buffer.from(JSON.stringify({
            certificateId,
            authorizationNumber: authNumber,
            expiryDate: expiryDate.toISOString(),
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, certificateId, certificateNumber: authNumber });
    }

    /**
     * Issue Phytosanitary Certificate
     */
    async IssuePhytosanitaryCertificate(ctx, certificateId, inspectionDataJSON) {
        const inspectionData = JSON.parse(inspectionDataJSON);
        const certificateData = await ctx.stub.getState(certificateId);
        
        if (!certificateData || certificateData.length === 0) {
            throw new Error(`Certificate ${certificateId} does not exist`);
        }

        const certificate = JSON.parse(certificateData.toString());
        
        if (certificate.certificateType !== 'PHYTO') {
            throw new Error('This certificate is not a phytosanitary certificate');
        }
        
        if (certificate.status !== 'pending') {
            throw new Error(`Certificate status is ${certificate.status}, cannot issue`);
        }

        // Generate IPPC number
        const ippcNumber = `ET-PHYTO-${Date.now()}`;
        
        // Set expiry date (14 days from now)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 14);

        certificate.status = 'issued';
        certificate.issuedAt = new Date().toISOString();
        certificate.issuedBy = inspectionData.inspectorName || 'MOA';
        certificate.expiryDate = expiryDate.toISOString();
        certificate.certificateNumber = ippcNumber;
        certificate.reviewedAt = new Date().toISOString();
        
        certificate.certificateData = {
            ...certificate.certificateData,
            ippcNumber,
            botanicalName: 'Coffea arabica',
            inspectionDate: inspectionData.inspectionDate || new Date().toISOString(),
            inspectorName: inspectionData.inspectorName,
            pestStatus: inspectionData.pestStatus || 'pest-free',
            treatmentDetails: inspectionData.treatmentDetails || 'none',
            treatmentDate: inspectionData.treatmentDate || null
        };
        
        certificate.history.push({
            action: 'issued',
            performedBy: inspectionData.inspectorName || 'MOA',
            timestamp: new Date().toISOString(),
            comments: inspectionData.comments || 'Phytosanitary certificate issued'
        });
        
        certificate.updatedAt = new Date().toISOString();

        await ctx.stub.putState(certificateId, Buffer.from(JSON.stringify(certificate)));
        
        ctx.stub.setEvent('PhytosanitaryCertificateIssued', Buffer.from(JSON.stringify({
            certificateId,
            ippcNumber,
            expiryDate: expiryDate.toISOString(),
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, certificateId, certificateNumber: ippcNumber });
    }

    /**
     * Issue Certificate of Origin
     */
    async IssueCertificateOfOrigin(ctx, certificateId, originDataJSON) {
        const originData = JSON.parse(originDataJSON);
        const certificateData = await ctx.stub.getState(certificateId);
        
        if (!certificateData || certificateData.length === 0) {
            throw new Error(`Certificate ${certificateId} does not exist`);
        }

        const certificate = JSON.parse(certificateData.toString());
        
        if (certificate.certificateType !== 'ORIGIN') {
            throw new Error('This certificate is not a certificate of origin');
        }
        
        if (certificate.status !== 'pending') {
            throw new Error(`Certificate status is ${certificate.status}, cannot issue`);
        }

        // Generate certificate number
        const certNumber = `ET-ORIGIN-${Date.now()}`;

        certificate.status = 'issued';
        certificate.issuedAt = new Date().toISOString();
        certificate.issuedBy = originData.issuedBy || 'ECTA';
        certificate.expiryDate = null; // No expiry for origin certificates
        certificate.certificateNumber = certNumber;
        certificate.reviewedAt = new Date().toISOString();
        
        certificate.certificateData = {
            ...certificate.certificateData,
            geographicalDesignation: originData.geographicalDesignation,
            originVerificationMethod: originData.originVerificationMethod || 'supply_chain',
            ecxAuctionReference: originData.ecxAuctionReference || null,
            destinationCountry: originData.destinationCountry,
            buyerName: originData.buyerName
        };
        
        certificate.history.push({
            action: 'issued',
            performedBy: originData.issuedBy || 'ECTA',
            timestamp: new Date().toISOString(),
            comments: originData.comments || 'Certificate of origin issued'
        });
        
        certificate.updatedAt = new Date().toISOString();

        await ctx.stub.putState(certificateId, Buffer.from(JSON.stringify(certificate)));
        
        ctx.stub.setEvent('OriginCertificateIssued', Buffer.from(JSON.stringify({
            certificateId,
            certificateNumber: certNumber,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, certificateId, certificateNumber: certNumber });
    }

    /**
     * Issue EUDR Compliance Certificate
     */
    async IssueEUDRCompliance(ctx, certificateId, eudrDataJSON) {
        const eudrData = JSON.parse(eudrDataJSON);
        const certificateData = await ctx.stub.getState(certificateId);
        
        if (!certificateData || certificateData.length === 0) {
            throw new Error(`Certificate ${certificateId} does not exist`);
        }

        const certificate = JSON.parse(certificateData.toString());
        
        if (certificate.certificateType !== 'EUDR') {
            throw new Error('This certificate is not an EUDR compliance certificate');
        }
        
        if (certificate.status !== 'pending') {
            throw new Error(`Certificate status is ${certificate.status}, cannot issue`);
        }

        // Validate GPS data exists
        if (!eudrData.gpsPlotIds || eudrData.gpsPlotIds.length === 0) {
            throw new Error('GPS plot data is required for EUDR compliance');
        }

        // Generate certificate number
        const certNumber = `ET-EUDR-${Date.now()}`;

        certificate.status = 'issued';
        certificate.issuedAt = new Date().toISOString();
        certificate.issuedBy = eudrData.issuedBy || 'ECTA';
        certificate.expiryDate = null; // No expiry for EUDR certificates
        certificate.certificateNumber = certNumber;
        certificate.reviewedAt = new Date().toISOString();
        
        certificate.certificateData = {
            ...certificate.certificateData,
            gpsPlotIds: eudrData.gpsPlotIds,
            deforestationStatus: eudrData.deforestationStatus || 'clear',
            riskAssessment: eudrData.riskAssessment || 'low',
            traceabilityScore: eudrData.traceabilityScore || 100
        };
        
        certificate.history.push({
            action: 'issued',
            performedBy: eudrData.issuedBy || 'ECTA',
            timestamp: new Date().toISOString(),
            comments: eudrData.comments || 'EUDR compliance certificate issued'
        });
        
        certificate.updatedAt = new Date().toISOString();

        await ctx.stub.putState(certificateId, Buffer.from(JSON.stringify(certificate)));
        
        ctx.stub.setEvent('EUDRComplianceIssued', Buffer.from(JSON.stringify({
            certificateId,
            certificateNumber: certNumber,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, certificateId, certificateNumber: certNumber });
    }

    /**
     * Issue ICO Certificate
     */
    async IssueICOCertificate(ctx, certificateId, icoDataJSON) {
        const icoData = JSON.parse(icoDataJSON);
        const certificateData = await ctx.stub.getState(certificateId);
        
        if (!certificateData || certificateData.length === 0) {
            throw new Error(`Certificate ${certificateId} does not exist`);
        }

        const certificate = JSON.parse(certificateData.toString());
        
        if (certificate.certificateType !== 'ICO') {
            throw new Error('This certificate is not an ICO certificate');
        }
        
        if (certificate.status !== 'pending') {
            throw new Error(`Certificate status is ${certificate.status}, cannot issue`);
        }

        // Generate ICO certificate number
        const certNumber = `ET-ICO-${Date.now()}`;

        certificate.status = 'issued';
        certificate.issuedAt = new Date().toISOString();
        certificate.issuedBy = icoData.issuedBy || 'ICO';
        certificate.expiryDate = null; // No expiry for ICO certificates
        certificate.certificateNumber = certNumber;
        certificate.reviewedAt = new Date().toISOString();
        
        certificate.certificateData = {
            ...certificate.certificateData,
            icoMemberCode: 'ET', // Ethiopia
            quotaAllocation: icoData.quotaAllocation || 0,
            quotaUsed: icoData.quotaUsed || 0,
            exportType: icoData.exportType || 'commercial'
        };
        
        certificate.history.push({
            action: 'issued',
            performedBy: icoData.issuedBy || 'ICO',
            timestamp: new Date().toISOString(),
            comments: icoData.comments || 'ICO certificate issued'
        });
        
        certificate.updatedAt = new Date().toISOString();

        await ctx.stub.putState(certificateId, Buffer.from(JSON.stringify(certificate)));
        
        ctx.stub.setEvent('ICOCertificateIssued', Buffer.from(JSON.stringify({
            certificateId,
            certificateNumber: certNumber,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, certificateId, certificateNumber: certNumber });
    }

    /**
     * Get certificate by ID
     */
    async GetCertificate(ctx, certificateId) {
        const certificateData = await ctx.stub.getState(certificateId);
        
        if (!certificateData || certificateData.length === 0) {
            throw new Error(`Certificate ${certificateId} does not exist`);
        }

        return certificateData.toString();
    }

    /**
     * Get all certificates for a shipment
     */
    async GetCertificatesByShipment(ctx, shipmentId) {
        const queryString = {
            selector: {
                docType: 'certificate',
                shipmentId: shipmentId
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    /**
     * Get pending certificates by type and agency
     */
    async GetPendingCertificates(ctx, certificateType, agency) {
        const queryString = {
            selector: {
                docType: 'certificate',
                status: 'pending'
            }
        };

        if (certificateType) {
            queryString.selector.certificateType = certificateType;
        }

        if (agency) {
            queryString.selector.issuingAgency = agency;
        }

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    /**
     * Revoke a certificate
     */
    async RevokeCertificate(ctx, certificateId, revocationDataJSON) {
        const revocationData = JSON.parse(revocationDataJSON);
        const certificateData = await ctx.stub.getState(certificateId);
        
        if (!certificateData || certificateData.length === 0) {
            throw new Error(`Certificate ${certificateId} does not exist`);
        }

        const certificate = JSON.parse(certificateData.toString());
        
        if (certificate.status === 'revoked') {
            throw new Error('Certificate is already revoked');
        }

        certificate.status = 'revoked';
        certificate.history.push({
            action: 'revoked',
            performedBy: revocationData.revokedBy,
            timestamp: new Date().toISOString(),
            comments: revocationData.reason || 'Certificate revoked'
        });
        certificate.updatedAt = new Date().toISOString();

        await ctx.stub.putState(certificateId, Buffer.from(JSON.stringify(certificate)));
        
        ctx.stub.setEvent('CertificateRevoked', Buffer.from(JSON.stringify({
            certificateId,
            reason: revocationData.reason,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, certificateId, status: 'revoked' });
    }

    /**
     * Verify a certificate by certificate number
     */
    async VerifyCertificate(ctx, certificateNumber) {
        const queryString = {
            selector: {
                docType: 'certificate',
                certificateNumber: certificateNumber
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        if (results.length === 0) {
            throw new Error(`Certificate ${certificateNumber} not found`);
        }

        const certificate = results[0];
        
        // Increment verification count
        certificate.verificationCount = (certificate.verificationCount || 0) + 1;
        certificate.lastVerifiedAt = new Date().toISOString();
        
        await ctx.stub.putState(certificate.certificateId, Buffer.from(JSON.stringify(certificate)));
        
        return JSON.stringify({
            valid: certificate.status === 'issued',
            certificate: certificate,
            verifiedAt: new Date().toISOString()
        });
    }

    /**
     * Helper: Get issuing agency for certificate type
     */
    _getIssuingAgency(certificateType) {
        const agencies = {
            'CQIC': 'CQIC',
            'PHYTO': 'MOA',
            'ORIGIN': 'ECTA',
            'EUDR': 'ECTA',
            'ICO': 'ICO'
        };
        return agencies[certificateType] || 'ECTA';
    }

    // ============================================================================
    // GPS TRACKING FOR EUDR COMPLIANCE
    // ============================================================================

    /**
     * Record GPS plot data for coffee origin
     */
    async RecordGPSPlot(ctx, gpsPlotDataJSON) {
        const plotData = JSON.parse(gpsPlotDataJSON);
        const { shipmentId, exporterId, farmerId, farmerName, coordinates, plotSize } = plotData;

        if (!shipmentId || !exporterId || !coordinates) {
            throw new Error('Missing required fields: shipmentId, exporterId, coordinates');
        }

        // Validate coordinates
        if (!coordinates.latitude || !coordinates.longitude) {
            throw new Error('GPS coordinates must include latitude and longitude');
        }

        // Validate coordinate ranges
        if (coordinates.latitude < -90 || coordinates.latitude > 90) {
            throw new Error('Latitude must be between -90 and 90');
        }
        if (coordinates.longitude < -180 || coordinates.longitude > 180) {
            throw new Error('Longitude must be between -180 and 180');
        }

        // Generate plot ID
        const plotId = `GPS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const gpsPlot = {
            docType: 'gpsPlot',
            plotId,
            shipmentId,
            exporterId,
            farmerId: farmerId || null,
            farmerName: farmerName || 'Unknown',
            
            coordinates: {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                altitude: coordinates.altitude || null,
                accuracy: coordinates.accuracy || null
            },
            
            plotSize: plotSize || null,
            coffeeVariety: plotData.coffeeVariety || null,
            plantingDate: plotData.plantingDate || null,
            harvestDate: plotData.harvestDate || null,
            
            region: plotData.region || null,
            zone: plotData.zone || null,
            woreda: plotData.woreda || null,
            kebele: plotData.kebele || null,
            
            deforestationCheck: {
                status: 'pending',
                checkedDate: null,
                checkMethod: null,
                riskLevel: null,
                forestCoverDate: '2020-12-31',
                forestCoverStatus: null,
                notes: null
            },
            
            verified: false,
            verifiedBy: null,
            verifiedDate: null,
            verificationMethod: null,
            
            collectionPoint: plotData.collectionPoint || null,
            processingFacility: plotData.processingFacility || null,
            warehouse: plotData.warehouse || null,
            
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await ctx.stub.putState(plotId, Buffer.from(JSON.stringify(gpsPlot)));
        
        ctx.stub.setEvent('GPSPlotRecorded', Buffer.from(JSON.stringify({
            plotId,
            shipmentId,
            coordinates: gpsPlot.coordinates,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, plotId });
    }

    /**
     * Update deforestation check results for a GPS plot
     */
    async UpdateDeforestationCheck(ctx, plotId, checkDataJSON) {
        const checkData = JSON.parse(checkDataJSON);
        const plotData = await ctx.stub.getState(plotId);
        
        if (!plotData || plotData.length === 0) {
            throw new Error(`GPS plot ${plotId} does not exist`);
        }

        const plot = JSON.parse(plotData.toString());
        
        plot.deforestationCheck = {
            status: checkData.status || 'clear',
            checkedDate: new Date().toISOString(),
            checkMethod: checkData.checkMethod || 'manual',
            riskLevel: checkData.riskLevel || 'low',
            forestCoverDate: '2020-12-31',
            forestCoverStatus: checkData.forestCoverStatus || 'no_deforestation',
            notes: checkData.notes || ''
        };
        
        plot.updatedAt = new Date().toISOString();

        await ctx.stub.putState(plotId, Buffer.from(JSON.stringify(plot)));
        
        ctx.stub.setEvent('DeforestationCheckUpdated', Buffer.from(JSON.stringify({
            plotId,
            status: plot.deforestationCheck.status,
            riskLevel: plot.deforestationCheck.riskLevel,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, plotId, deforestationCheck: plot.deforestationCheck });
    }

    /**
     * Get all GPS plots for a shipment
     */
    async GetGPSPlotsByShipment(ctx, shipmentId) {
        const queryString = {
            selector: {
                docType: 'gpsPlot',
                shipmentId: shipmentId
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const results = await this._getAllResults(iterator);
        
        return JSON.stringify(results);
    }

    /**
     * Verify a GPS plot
     */
    async VerifyGPSPlot(ctx, plotId, verificationDataJSON) {
        const verificationData = JSON.parse(verificationDataJSON);
        const plotData = await ctx.stub.getState(plotId);
        
        if (!plotData || plotData.length === 0) {
            throw new Error(`GPS plot ${plotId} does not exist`);
        }

        const plot = JSON.parse(plotData.toString());
        
        plot.verified = true;
        plot.verifiedBy = verificationData.verifiedBy;
        plot.verifiedDate = new Date().toISOString();
        plot.verificationMethod = verificationData.verificationMethod || 'document';
        plot.updatedAt = new Date().toISOString();

        await ctx.stub.putState(plotId, Buffer.from(JSON.stringify(plot)));
        
        ctx.stub.setEvent('GPSPlotVerified', Buffer.from(JSON.stringify({
            plotId,
            verifiedBy: plot.verifiedBy,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, plotId, verified: true });
    }

    // ============================================================================
    // CERTIFICATE BUNDLE MANAGEMENT
    // ============================================================================

    /**
     * Generate certificate bundle for a shipment
     */
    async GenerateCertificateBundle(ctx, shipmentId) {
        // Get all certificates for the shipment
        const queryString = {
            selector: {
                docType: 'certificate',
                shipmentId: shipmentId
            }
        };

        const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
        const certificates = await this._getAllResults(iterator);
        
        if (certificates.length === 0) {
            throw new Error(`No certificates found for shipment ${shipmentId}`);
        }

        // Get shipment details
        const shipmentData = await ctx.stub.getState(shipmentId);
        if (!shipmentData || shipmentData.length === 0) {
            throw new Error(`Shipment ${shipmentId} does not exist`);
        }
        const shipment = JSON.parse(shipmentData.toString());

        // Generate bundle ID
        const bundleId = `BUNDLE-${shipmentId}-${Date.now()}`;

        // Map certificates to bundle format
        const certificateSummaries = certificates.map(cert => ({
            certificateId: cert.certificateId,
            certificateType: cert.certificateType,
            certificateNumber: cert.certificateNumber,
            status: cert.status,
            issuedDate: cert.issuedAt,
            expiryDate: cert.expiryDate
        }));

        // Determine bundle status
        const allIssued = certificates.every(cert => cert.status === 'issued');
        const anyExpired = certificates.some(cert => {
            if (!cert.expiryDate) return false;
            return new Date(cert.expiryDate) < new Date();
        });

        let bundleStatus = 'incomplete';
        if (allIssued && !anyExpired) {
            bundleStatus = 'complete';
        } else if (anyExpired) {
            bundleStatus = 'expired';
        }

        const bundle = {
            docType: 'certificateBundle',
            bundleId,
            shipmentId,
            exporterId: shipment.exporterId,
            
            certificates: certificateSummaries,
            
            bundleStatus,
            completedAt: bundleStatus === 'complete' ? new Date().toISOString() : null,
            
            pdfUrl: null,
            pdfHash: null,
            
            downloadCount: 0,
            lastDownloadedAt: null,
            
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        await ctx.stub.putState(bundleId, Buffer.from(JSON.stringify(bundle)));
        
        ctx.stub.setEvent('CertificateBundleGenerated', Buffer.from(JSON.stringify({
            bundleId,
            shipmentId,
            certificateCount: certificates.length,
            bundleStatus,
            timestamp: new Date().toISOString()
        })));

        return JSON.stringify({ success: true, bundleId, bundleStatus, certificateCount: certificates.length });
    }

    /**
     * Get certificate bundle by ID
     */
    async GetCertificateBundle(ctx, bundleId) {
        const bundleData = await ctx.stub.getState(bundleId);
        
        if (!bundleData || bundleData.length === 0) {
            throw new Error(`Certificate bundle ${bundleId} does not exist`);
        }

        const bundle = JSON.parse(bundleData.toString());
        
        // Increment download count
        bundle.downloadCount = (bundle.downloadCount || 0) + 1;
        bundle.lastDownloadedAt = new Date().toISOString();
        
        await ctx.stub.putState(bundleId, Buffer.from(JSON.stringify(bundle)));

        return JSON.stringify(bundle);
    }

    // ============================================================================
    // PHASE 4: CUSTOMS & LOGISTICS (21 functions)
    // ============================================================================

    // Customs Management (5 functions)
    async CreateCustomsDeclaration(ctx, declarationDataJSON) {
        return await customsLogistics.CreateCustomsDeclaration(ctx, declarationDataJSON);
    }

    async SubmitCustomsDeclaration(ctx, declarationId) {
        return await customsLogistics.SubmitCustomsDeclaration(ctx, declarationId);
    }

    async ReviewCustomsDeclaration(ctx, declarationId, reviewDataJSON) {
        return await customsLogistics.ReviewCustomsDeclaration(ctx, declarationId, reviewDataJSON);
    }

    async ClearCustoms(ctx, declarationId, clearanceDataJSON) {
        return await customsLogistics.ClearCustoms(ctx, declarationId, clearanceDataJSON);
    }

    async GetCustomsDeclaration(ctx, declarationId) {
        return await customsLogistics.GetCustomsDeclaration(ctx, declarationId);
    }

    // Fumigation Management (3 functions)
    async RequestFumigation(ctx, fumigationRequestJSON) {
        return await customsLogistics.RequestFumigation(ctx, fumigationRequestJSON);
    }

    async IssueFumigationCertificate(ctx, fumigationId, certificateDataJSON) {
        return await customsLogistics.IssueFumigationCertificate(ctx, fumigationId, certificateDataJSON);
    }

    async GetFumigationCertificate(ctx, fumigationId) {
        return await customsLogistics.GetFumigationCertificate(ctx, fumigationId);
    }

    // Shipping Documentation (4 functions)
    async CreateShippingInstructions(ctx, instructionsJSON) {
        return await customsLogistics.CreateShippingInstructions(ctx, instructionsJSON);
    }

    async ConfirmShippingInstructions(ctx, instructionId, confirmationDataJSON) {
        return await customsLogistics.ConfirmShippingInstructions(ctx, instructionId, confirmationDataJSON);
    }

    async GenerateBillOfLading(ctx, blDataJSON) {
        return await customsLogistics.GenerateBillOfLading(ctx, blDataJSON);
    }

    async GetBillOfLading(ctx, blNumber) {
        return await customsLogistics.GetBillOfLading(ctx, blNumber);
    }

    // Container Management (5 functions)
    async AssignContainer(ctx, containerDataJSON) {
        return await customsLogistics.AssignContainer(ctx, containerDataJSON);
    }

    async UpdateContainerStatus(ctx, containerId, statusUpdateJSON) {
        return await customsLogistics.UpdateContainerStatus(ctx, containerId, statusUpdateJSON);
    }

    async SealContainer(ctx, containerId, sealDataJSON) {
        return await customsLogistics.SealContainer(ctx, containerId, sealDataJSON);
    }

    async GetContainer(ctx, containerId) {
        return await customsLogistics.GetContainer(ctx, containerId);
    }

    async GetContainersByShipment(ctx, shipmentId) {
        return await customsLogistics.GetContainersByShipment(ctx, shipmentId);
    }

    // Vessel Management (4 functions)
    async CreateVessel(ctx, vesselDataJSON) {
        return await customsLogistics.CreateVessel(ctx, vesselDataJSON);
    }

    async UpdateVesselLocation(ctx, vesselId, locationDataJSON) {
        return await customsLogistics.UpdateVesselLocation(ctx, vesselId, locationDataJSON);
    }

    async UpdateVesselStatus(ctx, vesselId, statusUpdateJSON) {
        return await customsLogistics.UpdateVesselStatus(ctx, vesselId, statusUpdateJSON);
    }

    async GetVessel(ctx, vesselId) {
        return await customsLogistics.GetVessel(ctx, vesselId);
    }

    /**
     * Helper: Calculate ISO week number
     */
    _getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // ============================================================================
    // SALES CONTRACT ENHANCEMENTS (International Trade Support)
    // ============================================================================

    /**
     * Validate Incoterms 2020 - All 11 terms
     */
    async ValidateIncoterms(ctx, incoterm) {
        const INCOTERMS_2020 = {
            // Any mode of transport
            'EXW': 'Ex Works',
            'FCA': 'Free Carrier',
            'CPT': 'Carriage Paid To',
            'CIP': 'Carriage and Insurance Paid To',
            'DAP': 'Delivered At Place',
            'DPU': 'Delivered at Place Unloaded',
            'DDP': 'Delivered Duty Paid',
            
            // Sea and inland waterway only
            'FAS': 'Free Alongside Ship',
            'FOB': 'Free On Board',
            'CFR': 'Cost and Freight',
            'CIF': 'Cost, Insurance and Freight'
        };

        if (!INCOTERMS_2020[incoterm]) {
            throw new Error(`Invalid Incoterm. Must be one of: ${Object.keys(INCOTERMS_2020).join(', ')}`);
        }
        
        return JSON.stringify({ 
            valid: true, 
            incoterm: incoterm,
            description: INCOTERMS_2020[incoterm] 
        });
    }

    /**
     * Record legal framework for a contract
     */
    async RecordLegalFramework(ctx, contractId, legalFrameworkJSON) {
        const legalFrameworkData = JSON.parse(legalFrameworkJSON);
        const contractData = await ctx.stub.getState(contractId);
        
        if (!contractData || contractData.length === 0) {
            throw new Error(`Contract ${contractId} does not exist`);
        }

        const contract = JSON.parse(contractData.toString());
        
        contract.legalFramework = {
            governingLaw: legalFrameworkData.governingLaw, // CISG, ETHIOPIAN_LAW, etc.
            arbitrationLocation: legalFrameworkData.arbitrationLocation,
            arbitrationRules: legalFrameworkData.arbitrationRules, // ICC, UNCITRAL, etc.
            contractLanguage: legalFrameworkData.contractLanguage || 'English',
            recordedAt: new Date().toISOString()
        };
        
        contract.updatedAt = new Date().toISOString();
        await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
        
        ctx.stub.setEvent('LegalFrameworkRecorded', Buffer.from(JSON.stringify({
            contractId,
            governingLaw: legalFrameworkData.governingLaw,
            timestamp: new Date().toISOString()
        })));
        
        return JSON.stringify({ success: true, contractId });
    }

    /**
     * Register force majeure event
     */
    async RegisterForceMajeureEvent(ctx, contractId, eventDataJSON) {
        const eventData = JSON.parse(eventDataJSON);
        const contractData = await ctx.stub.getState(contractId);
        
        if (!contractData || contractData.length === 0) {
            throw new Error(`Contract ${contractId} does not exist`);
        }

        const contract = JSON.parse(contractData.toString());
        
        contract.forceMajeure = {
            eventType: eventData.eventType, // PANDEMIC, WAR, NATURAL_DISASTER, etc.
            description: eventData.description,
            declaredBy: eventData.declaredBy,
            declaredAt: new Date().toISOString(),
            notificationDate: eventData.notificationDate,
            expectedDuration: eventData.expectedDuration,
            status: 'ACTIVE'
        };
        
        contract.updatedAt = new Date().toISOString();
        await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
        
        ctx.stub.setEvent('ForceMajeureRegistered', Buffer.from(JSON.stringify({
            contractId,
            eventType: eventData.eventType,
            timestamp: new Date().toISOString()
        })));
        
        return JSON.stringify({ success: true, contractId, eventType: eventData.eventType });
    }

    /**
     * Suspend contract due to force majeure
     */
    async SuspendContract(ctx, contractId, suspensionDataJSON) {
        const suspensionData = JSON.parse(suspensionDataJSON);
        const contractData = await ctx.stub.getState(contractId);
        
        if (!contractData || contractData.length === 0) {
            throw new Error(`Contract ${contractId} does not exist`);
        }

        const contract = JSON.parse(contractData.toString());
        
        if (!contract.forceMajeure || contract.forceMajeure.status !== 'ACTIVE') {
            throw new Error('Cannot suspend: No active force majeure event');
        }
        
        contract.status = 'SUSPENDED';
        contract.suspendedAt = new Date().toISOString();
        contract.suspensionReason = suspensionData.reason;
        contract.updatedAt = new Date().toISOString();
        
        await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
        
        ctx.stub.setEvent('ContractSuspended', Buffer.from(JSON.stringify({
            contractId,
            reason: suspensionData.reason,
            timestamp: new Date().toISOString()
        })));
        
        return JSON.stringify({ success: true, contractId, status: 'SUSPENDED' });
    }

    /**
     * Resume suspended contract
     */
    async ResumeContract(ctx, contractId, resumptionDataJSON) {
        const resumptionData = JSON.parse(resumptionDataJSON);
        const contractData = await ctx.stub.getState(contractId);
        
        if (!contractData || contractData.length === 0) {
            throw new Error(`Contract ${contractId} does not exist`);
        }

        const contract = JSON.parse(contractData.toString());
        
        if (contract.status !== 'SUSPENDED') {
            throw new Error('Contract is not suspended');
        }
        
        contract.status = 'ACTIVE';
        contract.resumedAt = new Date().toISOString();
        contract.forceMajeure.status = 'RESOLVED';
        contract.forceMajeure.resolvedAt = new Date().toISOString();
        contract.updatedAt = new Date().toISOString();
        
        await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
        
        ctx.stub.setEvent('ContractResumed', Buffer.from(JSON.stringify({
            contractId,
            timestamp: new Date().toISOString()
        })));
        
        return JSON.stringify({ success: true, contractId, status: 'ACTIVE' });
    }

    /**
     * Record dispute
     */
    async RecordDispute(ctx, contractId, disputeDataJSON) {
        const disputeData = JSON.parse(disputeDataJSON);
        const disputeId = `DISPUTE-${Date.now()}`;
        
        const dispute = {
            docType: 'dispute',
            disputeId,
            contractId,
            raisedBy: disputeData.raisedBy,
            raisedByType: disputeData.raisedByType, // EXPORTER, BUYER
            raisedAgainst: disputeData.raisedAgainst,
            disputeType: disputeData.disputeType, // QUALITY, PAYMENT, DELIVERY, etc.
            severity: disputeData.severity, // LOW, MEDIUM, HIGH, CRITICAL
            description: disputeData.description,
            claimedAmount: disputeData.claimedAmount || 0,
            currency: disputeData.currency || 'USD',
            evidenceDocuments: disputeData.evidenceDocuments || [],
            status: 'OPEN',
            createdAt: new Date().toISOString()
        };
        
        await ctx.stub.putState(disputeId, Buffer.from(JSON.stringify(dispute)));
        
        ctx.stub.setEvent('DisputeRecorded', Buffer.from(JSON.stringify({
            disputeId,
            contractId,
            disputeType: disputeData.disputeType,
            timestamp: new Date().toISOString()
        })));
        
        return JSON.stringify({ success: true, disputeId, contractId });
    }

    /**
     * Resolve dispute
     */
    async ResolveDispute(ctx, disputeId, resolutionDataJSON) {
        const resolutionData = JSON.parse(resolutionDataJSON);
        const disputeData = await ctx.stub.getState(disputeId);
        
        if (!disputeData || disputeData.length === 0) {
            throw new Error(`Dispute ${disputeId} not found`);
        }
        
        const dispute = JSON.parse(disputeData.toString());
        
        dispute.status = 'RESOLVED';
        dispute.resolutionMethod = resolutionData.resolutionMethod; // NEGOTIATION, MEDIATION, ARBITRATION
        dispute.resolutionNotes = resolutionData.resolutionNotes;
        dispute.awardedAmount = resolutionData.awardedAmount || 0;
        dispute.awardedTo = resolutionData.awardedTo;
        dispute.resolvedAt = new Date().toISOString();
        
        await ctx.stub.putState(disputeId, Buffer.from(JSON.stringify(dispute)));
        
        ctx.stub.setEvent('DisputeResolved', Buffer.from(JSON.stringify({
            disputeId,
            resolutionMethod: resolutionData.resolutionMethod,
            timestamp: new Date().toISOString()
        })));
        
        return JSON.stringify({ success: true, disputeId, status: 'RESOLVED' });
    }

    /**
     * Record exchange rate
     */
    async RecordExchangeRate(ctx, fromCurrency, toCurrency, rate, effectiveDate) {
        const rateId = `RATE-${fromCurrency}-${toCurrency}-${Date.now()}`;
        
        const exchangeRate = {
            docType: 'exchangeRate',
            rateId,
            fromCurrency,
            toCurrency,
            rate: parseFloat(rate),
            effectiveDate: effectiveDate || new Date().toISOString(),
            recordedAt: new Date().toISOString()
        };
        
        await ctx.stub.putState(rateId, Buffer.from(JSON.stringify(exchangeRate)));
        
        ctx.stub.setEvent('ExchangeRateRecorded', Buffer.from(JSON.stringify({
            rateId,
            fromCurrency,
            toCurrency,
            rate: parseFloat(rate),
            timestamp: new Date().toISOString()
        })));
        
        return JSON.stringify({ success: true, rateId });
    }

    /**
     * Get exchange rate
     */
    async GetExchangeRate(ctx, fromCurrency, toCurrency) {
        const query = {
            selector: {
                docType: 'exchangeRate',
                fromCurrency,
                toCurrency
            },
            sort: [{ effectiveDate: 'desc' }],
            limit: 1
        };
        
        const iterator = await ctx.stub.getQueryResult(JSON.stringify(query));
        const result = await this._getAllResults(iterator);
        
        if (result.length === 0) {
            throw new Error(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
        }
        
        return JSON.stringify(result[0]);
    }

    /**
     * Amend contract
     */
    async AmendContract(ctx, contractId, amendmentDataJSON) {
        const amendmentData = JSON.parse(amendmentDataJSON);
        const contractData = await ctx.stub.getState(contractId);
        
        if (!contractData || contractData.length === 0) {
            throw new Error(`Contract ${contractId} does not exist`);
        }

        const contract = JSON.parse(contractData.toString());
        
        if (contract.status !== 'ACTIVE') {
            throw new Error('Can only amend active contracts');
        }
        
        const amendmentId = `AMENDMENT-${Date.now()}`;
        
        const amendment = {
            amendmentId,
            contractId,
            amendmentType: amendmentData.amendmentType, // PRICE, QUANTITY, DELIVERY, etc.
            previousValues: amendmentData.previousValues,
            newValues: amendmentData.newValues,
            reason: amendmentData.reason,
            approvedBy: amendmentData.approvedBy,
            approvedAt: new Date().toISOString()
        };
        
        // Store amendment history
        if (!contract.amendments) {
            contract.amendments = [];
        }
        contract.amendments.push(amendment);
        
        // Apply changes
        Object.assign(contract, amendmentData.newValues);
        contract.updatedAt = new Date().toISOString();
        
        await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
        
        ctx.stub.setEvent('ContractAmended', Buffer.from(JSON.stringify({
            contractId,
            amendmentId,
            amendmentType: amendmentData.amendmentType,
            timestamp: new Date().toISOString()
        })));
        
        return JSON.stringify({ success: true, contractId, amendmentId });
    }

    /**
     * Finalize contract from draft (connects off-chain draft to on-chain contract)
     */
    async FinalizeContractFromDraft(ctx, draftId, finalContractDataJSON) {
        const finalContractData = JSON.parse(finalContractDataJSON);
        const contractId = `CONTRACT-${Date.now()}`;
        
        const contract = {
            docType: 'finalizedContract',
            contractId,
            draftId, // Reference to off-chain draft
            
            // Parties
            exporterId: finalContractData.exporterId,
            buyerId: finalContractData.buyerId,
            
            // Contract terms from draft
            coffeeType: finalContractData.coffeeType,
            quantity: finalContractData.quantity,
            unitPrice: finalContractData.unitPrice,
            totalValue: finalContractData.totalValue,
            currency: finalContractData.currency,
            
            // Payment & Delivery
            paymentTerms: finalContractData.paymentTerms,
            paymentMethod: finalContractData.paymentMethod,
            incoterms: finalContractData.incoterms,
            deliveryDate: finalContractData.deliveryDate,
            
            // Legal framework
            governingLaw: finalContractData.governingLaw,
            arbitrationLocation: finalContractData.arbitrationLocation,
            arbitrationRules: finalContractData.arbitrationRules,
            forceMajeureClause: finalContractData.forceMajeureClause,
            
            // Status
            status: 'ACTIVE',
            finalizedAt: new Date().toISOString(),
            createdAt: new Date().toISOString()
        };
        
        await ctx.stub.putState(contractId, Buffer.from(JSON.stringify(contract)));
        
        ctx.stub.setEvent('ContractFinalized', Buffer.from(JSON.stringify({
            contractId,
            draftId,
            exporterId: finalContractData.exporterId,
            buyerId: finalContractData.buyerId,
            timestamp: new Date().toISOString()
        })));
        
        return JSON.stringify({ success: true, contractId, draftId });
    }

}

module.exports = CoffeeExportContract;