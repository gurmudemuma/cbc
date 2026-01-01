/**
 * OpenAPI/Swagger Configuration
 * Auto-generates API documentation
 */

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Coffee Export Consortium API',
    version: '1.0.0',
    description: 'Commercial Bank API',
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      ExportRequest: {
        type: 'object',
        properties: {
          exportId: {
            type: 'string',
            description: 'Unique export identifier',
          },
          commercialBankId: {
            type: 'string',
            description: 'Commercial Bank identifier',
          },
          exporterName: {
            type: 'string',
            description: 'Name of the exporter',
          },
          coffeeType: {
            type: 'string',
            description: 'Type of coffee being exported',
          },
          quantity: {
            type: 'number',
            description: 'Quantity in kilograms',
          },
          destinationCountry: {
            type: 'string',
            description: 'Destination country',
          },
          estimatedValue: {
            type: 'number',
            description: 'Estimated value in USD',
          },
          status: {
            type: 'string',
            description: 'Current export status',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
        required: [
          'exportId',
          'commercialBankId',
          'exporterName',
          'coffeeType',
          'quantity',
          'destinationCountry',
          'estimatedValue',
          'status',
          'createdAt',
          'updatedAt',
        ],
      },
      CreateExportRequest: {
        type: 'object',
        properties: {
          exporterName: {
            type: 'string',
            description: 'Name of the exporter',
          },
          coffeeType: {
            type: 'string',
            description: 'Type of coffee being exported',
          },
          quantity: {
            type: 'number',
            description: 'Quantity in kilograms',
          },
          destinationCountry: {
            type: 'string',
            description: 'Destination country',
          },
          estimatedValue: {
            type: 'number',
            description: 'Estimated value in USD',
          },
          exportLicenseNumber: {
            type: 'string',
            description: 'Export license number',
          },
          ecxLotNumber: {
            type: 'string',
            description: 'ECX lot number',
          },
          warehouseLocation: {
            type: 'string',
            description: 'Warehouse location',
          },
        },
        required: [
          'exporterName',
          'coffeeType',
          'quantity',
          'destinationCountry',
          'estimatedValue',
        ],
      },
    },
  },
};

export const swaggerOptions = {
  swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
