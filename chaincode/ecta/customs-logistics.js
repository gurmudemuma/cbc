/**
 * Phase 4: Customs & Logistics Chaincode Functions
 * Extends CoffeeExportContract with customs clearance, shipping, container, and vessel tracking
 */

// ============================================================================
// CUSTOMS MANAGEMENT (5 functions)
// ============================================================================

/**
 * Create customs declaration for shipment
 */
async function CreateCustomsDeclaration(ctx, declarationDataJSON) {
    const declarationData = JSON.parse(declarationDataJSON);
    const { shipmentId, exporterId, hsCode, customsValue, currency } = declarationData;

    if (!shipmentId || !exporterId || !hsCode || !customsValue) {
        throw new Error('Missing required fields: shipmentId, exporterId, hsCode, customsValue');
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

    // Generate declaration ID
    const declarationId = `CUSTOMS-${Date.now()}`;

    // Calculate duties and taxes (simplified - 5% duty, 15% VAT)
    const dutyRate = 0.05;
    const taxRate = 0.15;
    const dutyAmount = customsValue * dutyRate;
    const taxAmount = customsValue * taxRate;
    const totalAmount = dutyAmount + taxAmount;

    const declaration = {
        docType: 'customsDeclaration',
        declarationId,
        shipmentId,
        exporterId,
        exporterName: shipment.exporterName,
        
        declarationType: declarationData.declarationType || 'export',
        customsOffice: declarationData.customsOffice || 'Addis Ababa',
        declarationDate: new Date().toISOString(),
        
        hsCode,
        tariffDescription: declarationData.tariffDescription || 'Coffee, not roasted',
        customsValue,
        currency: currency || 'USD',
        dutyRate,
        dutyAmount,
        taxAmount,
        totalAmount,
        
        status: 'draft',
        submittedAt: null,
        reviewedAt: null,
        approvedAt: null,
        clearedAt: null,
        
        reviewedBy: null,
        approvalComments: null,
        rejectionReason: null,
        
        attachedCertificates: declarationData.attachedCertificates || [],
        attachedInvoices: declarationData.attachedInvoices || [],
        
        pdfUrl: null,
        pdfHash: null,
        
        history: [{
            action: 'created',
            performedBy: exporterId,
            timestamp: new Date().toISOString(),
            comments: 'Declaration created'
        }],
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await ctx.stub.putState(declarationId, Buffer.from(JSON.stringify(declaration)));
    
    ctx.stub.setEvent('CustomsDeclarationCreated', Buffer.from(JSON.stringify({
        declarationId,
        shipmentId,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, declarationId, totalAmount });
}

/**
 * Submit customs declaration
 */
async function SubmitCustomsDeclaration(ctx, declarationId) {
    const declarationData = await ctx.stub.getState(declarationId);
    
    if (!declarationData || declarationData.length === 0) {
        throw new Error(`Declaration ${declarationId} does not exist`);
    }

    const declaration = JSON.parse(declarationData.toString());
    
    if (declaration.status !== 'draft') {
        throw new Error(`Declaration status is ${declaration.status}, cannot submit`);
    }

    declaration.status = 'submitted';
    declaration.submittedAt = new Date().toISOString();
    declaration.history.push({
        action: 'submitted',
        performedBy: declaration.exporterId,
        timestamp: new Date().toISOString(),
        comments: 'Declaration submitted to customs'
    });
    declaration.updatedAt = new Date().toISOString();

    await ctx.stub.putState(declarationId, Buffer.from(JSON.stringify(declaration)));
    
    ctx.stub.setEvent('CustomsDeclarationSubmitted', Buffer.from(JSON.stringify({
        declarationId,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, declarationId, status: 'submitted' });
}

/**
 * Review customs declaration (Customs officer only)
 */
async function ReviewCustomsDeclaration(ctx, declarationId, reviewDataJSON) {
    const reviewData = JSON.parse(reviewDataJSON);
    const declarationData = await ctx.stub.getState(declarationId);
    
    if (!declarationData || declarationData.length === 0) {
        throw new Error(`Declaration ${declarationId} does not exist`);
    }

    const declaration = JSON.parse(declarationData.toString());
    
    if (declaration.status !== 'submitted') {
        throw new Error(`Declaration status is ${declaration.status}, cannot review`);
    }

    const approved = reviewData.approved;
    declaration.status = approved ? 'approved' : 'rejected';
    declaration.reviewedAt = new Date().toISOString();
    declaration.reviewedBy = reviewData.reviewedBy || 'Customs';
    
    if (approved) {
        declaration.approvedAt = new Date().toISOString();
        declaration.approvalComments = reviewData.comments || '';
    } else {
        declaration.rejectionReason = reviewData.reason || 'Declaration rejected';
    }
    
    declaration.history.push({
        action: approved ? 'approved' : 'rejected',
        performedBy: declaration.reviewedBy,
        timestamp: new Date().toISOString(),
        comments: approved ? reviewData.comments : reviewData.reason
    });
    declaration.updatedAt = new Date().toISOString();

    await ctx.stub.putState(declarationId, Buffer.from(JSON.stringify(declaration)));
    
    ctx.stub.setEvent('CustomsDeclarationReviewed', Buffer.from(JSON.stringify({
        declarationId,
        approved,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, declarationId, status: declaration.status });
}

/**
 * Clear customs (Customs officer only)
 */
async function ClearCustoms(ctx, declarationId, clearanceDataJSON) {
    const clearanceData = JSON.parse(clearanceDataJSON);
    const declarationData = await ctx.stub.getState(declarationId);
    
    if (!declarationData || declarationData.length === 0) {
        throw new Error(`Declaration ${declarationId} does not exist`);
    }

    const declaration = JSON.parse(declarationData.toString());
    
    if (declaration.status !== 'approved') {
        throw new Error(`Declaration must be approved before clearance`);
    }

    declaration.status = 'cleared';
    declaration.clearedAt = new Date().toISOString();
    declaration.history.push({
        action: 'cleared',
        performedBy: clearanceData.clearedBy || 'Customs',
        timestamp: new Date().toISOString(),
        comments: clearanceData.comments || 'Customs clearance granted'
    });
    declaration.updatedAt = new Date().toISOString();

    await ctx.stub.putState(declarationId, Buffer.from(JSON.stringify(declaration)));
    
    ctx.stub.setEvent('CustomsCleared', Buffer.from(JSON.stringify({
        declarationId,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, declarationId, status: 'cleared' });
}

/**
 * Get customs declaration
 */
async function GetCustomsDeclaration(ctx, declarationId) {
    const declarationData = await ctx.stub.getState(declarationId);
    
    if (!declarationData || declarationData.length === 0) {
        throw new Error(`Declaration ${declarationId} does not exist`);
    }

    return declarationData.toString();
}

// ============================================================================
// FUMIGATION MANAGEMENT (3 functions)
// ============================================================================

/**
 * Request fumigation for container
 */
async function RequestFumigation(ctx, fumigationRequestJSON) {
    const fumigationRequest = JSON.parse(fumigationRequestJSON);
    const { shipmentId, containerId, fumigationType } = fumigationRequest;

    if (!shipmentId || !containerId || !fumigationType) {
        throw new Error('Missing required fields: shipmentId, containerId, fumigationType');
    }

    const fumigationId = `FUMIG-${Date.now()}`;

    const fumigation = {
        docType: 'fumigationCertificate',
        fumigationId,
        shipmentId,
        containerId,
        
        fumigationType,
        chemical: fumigationRequest.chemical || null,
        concentration: fumigationRequest.concentration || null,
        dosage: fumigationRequest.dosage || null,
        treatmentDate: null,
        treatmentDuration: null,
        temperature: null,
        humidity: null,
        
        certificateNumber: null,
        issuedBy: null,
        issuingCompany: fumigationRequest.issuingCompany || null,
        companyLicense: fumigationRequest.companyLicense || null,
        validFrom: null,
        validUntil: null,
        
        ispm15Compliant: false,
        treatmentStandard: fumigationRequest.treatmentStandard || 'ISPM 15',
        
        status: 'scheduled',
        
        pdfUrl: null,
        pdfHash: null,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await ctx.stub.putState(fumigationId, Buffer.from(JSON.stringify(fumigation)));
    
    ctx.stub.setEvent('FumigationRequested', Buffer.from(JSON.stringify({
        fumigationId,
        shipmentId,
        containerId,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, fumigationId });
}

/**
 * Issue fumigation certificate
 */
async function IssueFumigationCertificate(ctx, fumigationId, certificateDataJSON) {
    const certData = JSON.parse(certificateDataJSON);
    const fumigationData = await ctx.stub.getState(fumigationId);
    
    if (!fumigationData || fumigationData.length === 0) {
        throw new Error(`Fumigation ${fumigationId} does not exist`);
    }

    const fumigation = JSON.parse(fumigationData.toString());
    
    const certificateNumber = `FUMIG-CERT-${Date.now()}`;
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 90); // 90 days validity

    fumigation.status = 'certified';
    fumigation.certificateNumber = certificateNumber;
    fumigation.issuedBy = certData.issuedBy || 'Fumigation Company';
    fumigation.treatmentDate = certData.treatmentDate || new Date().toISOString();
    fumigation.treatmentDuration = certData.treatmentDuration || 24;
    fumigation.temperature = certData.temperature || null;
    fumigation.humidity = certData.humidity || null;
    fumigation.validFrom = validFrom.toISOString();
    fumigation.validUntil = validUntil.toISOString();
    fumigation.ispm15Compliant = certData.ispm15Compliant !== false;
    fumigation.updatedAt = new Date().toISOString();

    await ctx.stub.putState(fumigationId, Buffer.from(JSON.stringify(fumigation)));
    
    ctx.stub.setEvent('FumigationCertificateIssued', Buffer.from(JSON.stringify({
        fumigationId,
        certificateNumber,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, fumigationId, certificateNumber });
}

/**
 * Get fumigation certificate
 */
async function GetFumigationCertificate(ctx, fumigationId) {
    const fumigationData = await ctx.stub.getState(fumigationId);
    
    if (!fumigationData || fumigationData.length === 0) {
        throw new Error(`Fumigation ${fumigationId} does not exist`);
    }

    return fumigationData.toString();
}

// ============================================================================
// SHIPPING DOCUMENTATION (4 functions)
// ============================================================================

/**
 * Create shipping instructions
 */
async function CreateShippingInstructions(ctx, instructionsJSON) {
    const instructions = JSON.parse(instructionsJSON);
    const { shipmentId, exporterId, shippingLine, bookingNumber } = instructions;

    if (!shipmentId || !exporterId || !shippingLine) {
        throw new Error('Missing required fields: shipmentId, exporterId, shippingLine');
    }

    const instructionId = `SI-${Date.now()}`;

    const shippingInstructions = {
        docType: 'shippingInstructions',
        instructionId,
        shipmentId,
        exporterId,
        
        shippingLine,
        bookingNumber: bookingNumber || null,
        bookingDate: instructions.bookingDate || new Date().toISOString(),
        
        containerType: instructions.containerType || '40ft',
        containerCount: instructions.containerCount || 1,
        
        portOfLoading: instructions.portOfLoading || 'Djibouti',
        portOfLoadingCode: instructions.portOfLoadingCode || 'DJJIB',
        portOfDischarge: instructions.portOfDischarge || '',
        portOfDischargeCode: instructions.portOfDischargeCode || '',
        finalDestination: instructions.finalDestination || '',
        
        requestedLoadingDate: instructions.requestedLoadingDate || null,
        cutOffDate: instructions.cutOffDate || null,
        estimatedDepartureDate: instructions.estimatedDepartureDate || null,
        
        cargoDescription: instructions.cargoDescription || 'Coffee beans',
        grossWeight: instructions.grossWeight || 0,
        netWeight: instructions.netWeight || 0,
        volume: instructions.volume || 0,
        
        specialInstructions: instructions.specialInstructions || '',
        temperatureControl: instructions.temperatureControl || false,
        temperatureRange: instructions.temperatureRange || null,
        ventilationRequired: instructions.ventilationRequired || false,
        
        status: 'draft',
        confirmedBy: null,
        confirmedAt: null,
        
        pdfUrl: null,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await ctx.stub.putState(instructionId, Buffer.from(JSON.stringify(shippingInstructions)));
    
    ctx.stub.setEvent('ShippingInstructionsCreated', Buffer.from(JSON.stringify({
        instructionId,
        shipmentId,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, instructionId });
}

/**
 * Confirm shipping instructions (Shipping line only)
 */
async function ConfirmShippingInstructions(ctx, instructionId, confirmationDataJSON) {
    const confirmationData = JSON.parse(confirmationDataJSON);
    const instructionData = await ctx.stub.getState(instructionId);
    
    if (!instructionData || instructionData.length === 0) {
        throw new Error(`Shipping instructions ${instructionId} do not exist`);
    }

    const instructions = JSON.parse(instructionData.toString());
    
    instructions.status = 'confirmed';
    instructions.confirmedBy = confirmationData.confirmedBy || 'Shipping Line';
    instructions.confirmedAt = new Date().toISOString();
    instructions.updatedAt = new Date().toISOString();

    await ctx.stub.putState(instructionId, Buffer.from(JSON.stringify(instructions)));
    
    ctx.stub.setEvent('ShippingInstructionsConfirmed', Buffer.from(JSON.stringify({
        instructionId,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, instructionId, status: 'confirmed' });
}

/**
 * Generate Bill of Lading
 */
async function GenerateBillOfLading(ctx, blDataJSON) {
    const blData = JSON.parse(blDataJSON);
    const { shipmentId, instructionId, shipper, consignee } = blData;

    if (!shipmentId || !instructionId || !shipper || !consignee) {
        throw new Error('Missing required fields: shipmentId, instructionId, shipper, consignee');
    }

    const blNumber = `BL-${Date.now()}`;

    const billOfLading = {
        docType: 'billOfLading',
        blNumber,
        shipmentId,
        instructionId,
        
        blType: blData.blType || 'original',
        numberOfOriginals: blData.numberOfOriginals || 3,
        
        shipper,
        consignee,
        notifyParty: blData.notifyParty || consignee,
        
        vesselName: blData.vesselName || '',
        vesselId: blData.vesselId || null,
        voyageNumber: blData.voyageNumber || '',
        
        portOfLoading: blData.portOfLoading || 'Djibouti',
        portOfDischarge: blData.portOfDischarge || '',
        placeOfReceipt: blData.placeOfReceipt || '',
        placeOfDelivery: blData.placeOfDelivery || '',
        
        containers: blData.containers || [],
        
        freightTerms: blData.freightTerms || 'prepaid',
        freightAmount: blData.freightAmount || 0,
        freightCurrency: blData.freightCurrency || 'USD',
        
        dateOfIssue: new Date().toISOString(),
        dateOfShipment: blData.dateOfShipment || null,
        
        status: 'issued',
        issuedBy: blData.issuedBy || 'Shipping Line',
        issuedAt: new Date().toISOString(),
        
        pdfUrl: null,
        pdfHash: null,
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await ctx.stub.putState(blNumber, Buffer.from(JSON.stringify(billOfLading)));
    
    ctx.stub.setEvent('BillOfLadingGenerated', Buffer.from(JSON.stringify({
        blNumber,
        shipmentId,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, blNumber });
}

/**
 * Get Bill of Lading
 */
async function GetBillOfLading(ctx, blNumber) {
    const blData = await ctx.stub.getState(blNumber);
    
    if (!blData || blData.length === 0) {
        throw new Error(`Bill of Lading ${blNumber} does not exist`);
    }

    return blData.toString();
}

// ============================================================================
// CONTAINER MANAGEMENT (5 functions)
// ============================================================================

/**
 * Assign container to shipment
 */
async function AssignContainer(ctx, containerDataJSON) {
    const containerData = JSON.parse(containerDataJSON);
    const { shipmentId, containerNumber, containerType } = containerData;

    if (!shipmentId || !containerNumber || !containerType) {
        throw new Error('Missing required fields: shipmentId, containerNumber, containerType');
    }

    const containerId = `CONT-${Date.now()}`;

    const container = {
        docType: 'container',
        containerId,
        containerNumber,
        shipmentId,
        
        containerType,
        size: containerData.size || '40ft',
        maxGrossWeight: containerData.maxGrossWeight || 30480,
        tareWeight: containerData.tareWeight || 3800,
        maxPayload: containerData.maxPayload || 26680,
        
        sealNumber: null,
        sealType: null,
        sealedBy: null,
        sealedAt: null,
        
        loadedWeight: 0,
        loadedVolume: 0,
        loadedDate: null,
        loadedBy: null,
        
        status: 'assigned',
        currentLocation: containerData.currentLocation || 'Warehouse',
        lastUpdated: new Date().toISOString(),
        
        vesselId: null,
        vesselName: null,
        voyageNumber: null,
        
        temperatureControlled: containerData.temperatureControlled || false,
        setTemperature: containerData.setTemperature || null,
        currentTemperature: null,
        
        locationHistory: [{
            location: containerData.currentLocation || 'Warehouse',
            status: 'assigned',
            timestamp: new Date().toISOString(),
            remarks: 'Container assigned to shipment'
        }],
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await ctx.stub.putState(containerId, Buffer.from(JSON.stringify(container)));
    
    ctx.stub.setEvent('ContainerAssigned', Buffer.from(JSON.stringify({
        containerId,
        containerNumber,
        shipmentId,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, containerId, containerNumber });
}

/**
 * Update container status
 */
async function UpdateContainerStatus(ctx, containerId, statusUpdateJSON) {
    const statusUpdate = JSON.parse(statusUpdateJSON);
    const containerData = await ctx.stub.getState(containerId);
    
    if (!containerData || containerData.length === 0) {
        throw new Error(`Container ${containerId} does not exist`);
    }

    const container = JSON.parse(containerData.toString());
    
    container.status = statusUpdate.status;
    container.currentLocation = statusUpdate.location || container.currentLocation;
    container.lastUpdated = new Date().toISOString();
    
    container.locationHistory.push({
        location: statusUpdate.location || container.currentLocation,
        status: statusUpdate.status,
        timestamp: new Date().toISOString(),
        remarks: statusUpdate.remarks || ''
    });
    
    container.updatedAt = new Date().toISOString();

    await ctx.stub.putState(containerId, Buffer.from(JSON.stringify(container)));
    
    ctx.stub.setEvent('ContainerStatusUpdated', Buffer.from(JSON.stringify({
        containerId,
        status: statusUpdate.status,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, containerId, status: statusUpdate.status });
}

/**
 * Seal container
 */
async function SealContainer(ctx, containerId, sealDataJSON) {
    const sealData = JSON.parse(sealDataJSON);
    const containerData = await ctx.stub.getState(containerId);
    
    if (!containerData || containerData.length === 0) {
        throw new Error(`Container ${containerId} does not exist`);
    }

    const container = JSON.parse(containerData.toString());
    
    container.sealNumber = sealData.sealNumber;
    container.sealType = sealData.sealType || 'bolt';
    container.sealedBy = sealData.sealedBy || 'Customs';
    container.sealedAt = new Date().toISOString();
    container.status = 'sealed';
    container.lastUpdated = new Date().toISOString();
    
    container.locationHistory.push({
        location: container.currentLocation,
        status: 'sealed',
        timestamp: new Date().toISOString(),
        remarks: `Container sealed with seal number ${sealData.sealNumber}`
    });
    
    container.updatedAt = new Date().toISOString();

    await ctx.stub.putState(containerId, Buffer.from(JSON.stringify(container)));
    
    ctx.stub.setEvent('ContainerSealed', Buffer.from(JSON.stringify({
        containerId,
        sealNumber: sealData.sealNumber,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, containerId, sealNumber: sealData.sealNumber });
}

/**
 * Get container details
 */
async function GetContainer(ctx, containerId) {
    const containerData = await ctx.stub.getState(containerId);
    
    if (!containerData || containerData.length === 0) {
        throw new Error(`Container ${containerId} does not exist`);
    }

    return containerData.toString();
}

/**
 * Get containers by shipment
 */
async function GetContainersByShipment(ctx, shipmentId) {
    const queryString = {
        selector: {
            docType: 'container',
            shipmentId: shipmentId
        }
    };

    const iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString));
    const results = [];
    
    let result = await iterator.next();
    while (!result.done) {
        const record = {
            key: result.value.key,
            record: JSON.parse(result.value.value.toString('utf8'))
        };
        results.push(record);
        result = await iterator.next();
    }
    
    await iterator.close();
    return JSON.stringify(results);
}

// ============================================================================
// VESSEL MANAGEMENT (4 functions)
// ============================================================================

/**
 * Create vessel record
 */
async function CreateVessel(ctx, vesselDataJSON) {
    const vesselData = JSON.parse(vesselDataJSON);
    const { vesselName, imoNumber, voyageNumber, shippingLine } = vesselData;

    if (!vesselName || !voyageNumber || !shippingLine) {
        throw new Error('Missing required fields: vesselName, voyageNumber, shippingLine');
    }

    const vesselId = `VESSEL-${Date.now()}`;

    const vessel = {
        docType: 'vessel',
        vesselId,
        vesselName,
        imoNumber: imoNumber || null,
        
        shippingLine,
        vesselType: vesselData.vesselType || 'container_ship',
        flag: vesselData.flag || 'ET',
        callSign: vesselData.callSign || null,
        
        voyageNumber,
        serviceRoute: vesselData.serviceRoute || '',
        
        containers: [],
        totalContainers: 0,
        
        departurePort: vesselData.departurePort || 'Djibouti',
        departurePortCode: vesselData.departurePortCode || 'DJJIB',
        arrivalPort: vesselData.arrivalPort || '',
        arrivalPortCode: vesselData.arrivalPortCode || '',
        
        scheduledDeparture: vesselData.scheduledDeparture || null,
        actualDeparture: null,
        estimatedArrival: vesselData.estimatedArrival || null,
        actualArrival: null,
        
        status: 'scheduled',
        currentLocation: {
            latitude: null,
            longitude: null,
            port: vesselData.departurePort || 'Djibouti',
            timestamp: new Date().toISOString()
        },
        
        locationHistory: [],
        delays: [],
        
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    await ctx.stub.putState(vesselId, Buffer.from(JSON.stringify(vessel)));
    
    ctx.stub.setEvent('VesselCreated', Buffer.from(JSON.stringify({
        vesselId,
        vesselName,
        voyageNumber,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, vesselId });
}

/**
 * Update vessel location
 */
async function UpdateVesselLocation(ctx, vesselId, locationDataJSON) {
    const locationData = JSON.parse(locationDataJSON);
    const vesselData = await ctx.stub.getState(vesselId);
    
    if (!vesselData || vesselData.length === 0) {
        throw new Error(`Vessel ${vesselId} does not exist`);
    }

    const vessel = JSON.parse(vesselData.toString());
    
    vessel.currentLocation = {
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        port: locationData.port || null,
        timestamp: new Date().toISOString()
    };
    
    vessel.locationHistory.push({
        latitude: locationData.latitude || null,
        longitude: locationData.longitude || null,
        port: locationData.port || null,
        timestamp: new Date().toISOString(),
        speed: locationData.speed || null,
        heading: locationData.heading || null
    });
    
    vessel.updatedAt = new Date().toISOString();

    await ctx.stub.putState(vesselId, Buffer.from(JSON.stringify(vessel)));
    
    ctx.stub.setEvent('VesselLocationUpdated', Buffer.from(JSON.stringify({
        vesselId,
        location: vessel.currentLocation,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, vesselId, location: vessel.currentLocation });
}

/**
 * Update vessel status
 */
async function UpdateVesselStatus(ctx, vesselId, statusUpdateJSON) {
    const statusUpdate = JSON.parse(statusUpdateJSON);
    const vesselData = await ctx.stub.getState(vesselId);
    
    if (!vesselData || vesselData.length === 0) {
        throw new Error(`Vessel ${vesselId} does not exist`);
    }

    const vessel = JSON.parse(vesselData.toString());
    
    vessel.status = statusUpdate.status;
    
    // Update timestamps based on status
    if (statusUpdate.status === 'departed' && !vessel.actualDeparture) {
        vessel.actualDeparture = new Date().toISOString();
    } else if (statusUpdate.status === 'arrived' && !vessel.actualArrival) {
        vessel.actualArrival = new Date().toISOString();
    }
    
    // Handle delays
    if (statusUpdate.delay) {
        vessel.delays.push({
            reason: statusUpdate.delay.reason || 'Unspecified',
            delayHours: statusUpdate.delay.delayHours || 0,
            reportedAt: new Date().toISOString(),
            resolvedAt: null
        });
    }
    
    vessel.updatedAt = new Date().toISOString();

    await ctx.stub.putState(vesselId, Buffer.from(JSON.stringify(vessel)));
    
    ctx.stub.setEvent('VesselStatusUpdated', Buffer.from(JSON.stringify({
        vesselId,
        status: statusUpdate.status,
        timestamp: new Date().toISOString()
    })));

    return JSON.stringify({ success: true, vesselId, status: statusUpdate.status });
}

/**
 * Get vessel details
 */
async function GetVessel(ctx, vesselId) {
    const vesselData = await ctx.stub.getState(vesselId);
    
    if (!vesselData || vesselData.length === 0) {
        throw new Error(`Vessel ${vesselId} does not exist`);
    }

    return vesselData.toString();
}

// Export all functions
module.exports = {
    // Customs Management
    CreateCustomsDeclaration,
    SubmitCustomsDeclaration,
    ReviewCustomsDeclaration,
    ClearCustoms,
    GetCustomsDeclaration,
    
    // Fumigation Management
    RequestFumigation,
    IssueFumigationCertificate,
    GetFumigationCertificate,
    
    // Shipping Documentation
    CreateShippingInstructions,
    ConfirmShippingInstructions,
    GenerateBillOfLading,
    GetBillOfLading,
    
    // Container Management
    AssignContainer,
    UpdateContainerStatus,
    SealContainer,
    GetContainer,
    GetContainersByShipment,
    
    // Vessel Management
    CreateVessel,
    UpdateVesselLocation,
    UpdateVesselStatus,
    GetVessel
};
