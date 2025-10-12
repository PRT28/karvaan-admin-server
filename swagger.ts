import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Application } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Cooncierge Admin API',
      version: '1.0.0',
      description: 'Comprehensive API documentation for Cooncierge Admin Server',
      contact: {
        name: 'API Support',
        email: 'mfa@cooncierge.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server',
      },
      {
        url: 'https://api.cooncierge.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login/verify-2fa endpoints',
        },
        karvaanToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-access-token',
          description: 'Karvaan token for authenticated requests',
        },
      },
      schemas: {
        // User Schema
        User: {
          type: 'object',
          required: ['name', 'email', 'mobile', 'phoneCode', 'roleId', 'password'],
          properties: {
            _id: {
              type: 'string',
              description: 'User ID',
              example: '507f1f77bcf86cd799439011',
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'john.doe@example.com',
            },
            mobile: {
              type: 'string',
              description: 'User mobile number',
              example: '+1234567890',
            },
            agentId: {
              type: 'string',
              nullable: true,
              description: 'Agent ID if user is an agent',
              example: 'AGENT001',
            },
            phoneCode: {
              type: 'number',
              description: 'Country phone code',
              example: 1,
            },
            roleId: {
              type: 'string',
              description: 'Reference to Role document',
              example: '507f1f77bcf86cd799439012',
            },
            superAdmin: {
              type: 'boolean',
              description: 'Whether user is a super admin',
              default: false,
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'User last update timestamp',
            },
          },
        },
        
        // Role Schema
        Role: {
          type: 'object',
          required: ['roleName', 'permission'],
          properties: {
            _id: {
              type: 'string',
              description: 'Role ID',
              example: '507f1f77bcf86cd799439012',
            },
            roleName: {
              type: 'string',
              description: 'Role name',
              example: 'Admin',
            },
            permission: {
              $ref: '#/components/schemas/Permissions',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // Permissions Schema
        Permissions: {
          type: 'object',
          required: ['sales', 'operateions', 'userAccess'],
          properties: {
            sales: {
              $ref: '#/components/schemas/CRUDPermissions',
            },
            operateions: {
              type: 'object',
              properties: {
                voucher: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                content: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
              },
            },
            userAccess: {
              type: 'object',
              properties: {
                roles: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                user: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
              },
            },
          },
        },

        // CRUD Permissions Schema
        CRUDPermissions: {
          type: 'object',
          required: ['create', 'read', 'update', 'delete'],
          properties: {
            create: {
              type: 'boolean',
              description: 'Create permission',
            },
            read: {
              type: 'boolean',
              description: 'Read permission',
            },
            update: {
              type: 'boolean',
              description: 'Update permission',
            },
            delete: {
              type: 'boolean',
              description: 'Delete permission',
            },
          },
        },

        // Customer Schema
        Customer: {
          type: 'object',
          required: ['name', 'email', 'phone', 'ownerId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Customer ID',
              example: '507f1f77bcf86cd799439013',
            },
            name: {
              type: 'string',
              description: 'Customer name',
              example: 'Jane Smith',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Customer email',
              example: 'jane.smith@example.com',
            },
            phone: {
              type: 'string',
              description: 'Customer phone number',
              example: '+1234567890',
            },
            address: {
              type: 'string',
              description: 'Customer address',
              example: '123 Main St, City, State',
            },
            ownerId: {
              type: 'string',
              description: 'Reference to Team member who owns this customer',
              example: '507f1f77bcf86cd799439014',
            },
            tier: {
              type: 'string',
              enum: ['tier1', 'tier2', 'tier3'],
              description: 'Customer tier level',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // Vendor Schema
        Vendor: {
          type: 'object',
          required: ['companyName', 'contactPerson', 'email', 'phone'],
          properties: {
            _id: {
              type: 'string',
              description: 'Vendor ID',
              example: '507f1f77bcf86cd799439015',
            },
            companyName: {
              type: 'string',
              description: 'Vendor company name',
              example: 'ABC Travel Services',
            },
            contactPerson: {
              type: 'string',
              description: 'Contact person name',
              example: 'Bob Johnson',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Vendor email',
              example: 'contact@abctravel.com',
            },
            phone: {
              type: 'string',
              description: 'Vendor phone number',
              example: '+1234567890',
            },
            GSTIN: {
              type: 'string',
              description: 'GST Identification Number',
              example: '22AAAAA0000A1Z5',
            },
            address: {
              type: 'string',
              description: 'Vendor address',
              example: '456 Business Ave, City, State',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // Team Schema
        Team: {
          type: 'object',
          required: ['name', 'email', 'phone', 'roleId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Team member ID',
              example: '507f1f77bcf86cd799439016',
            },
            name: {
              type: 'string',
              description: 'Team member name',
              example: 'Alice Brown',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Team member email',
              example: 'alice.brown@cooncierge.com',
            },
            phone: {
              type: 'string',
              description: 'Team member phone',
              example: '+1234567890',
            },
            address: {
              type: 'string',
              description: 'Team member address',
              example: '789 Office St, City, State',
            },
            roleId: {
              type: 'string',
              description: 'Reference to Role document',
              example: '507f1f77bcf86cd799439012',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // Quotation Schema
        Quotation: {
          type: 'object',
          required: ['quotationType', 'channel', 'partyId', 'formFields', 'totalAmount'],
          properties: {
            _id: {
              type: 'string',
              description: 'Quotation ID',
              example: '507f1f77bcf86cd799439017',
            },
            quotationType: {
              type: 'string',
              enum: ['flight', 'train', 'hotel', 'activity'],
              description: 'Type of quotation',
              example: 'flight',
            },
            channel: {
              type: 'string',
              enum: ['B2B', 'B2C'],
              description: 'Sales channel',
              example: 'B2C',
            },
            partyId: {
              type: 'string',
              description: 'Reference to Customer or Vendor based on channel',
              example: '507f1f77bcf86cd799439013',
            },
            formFields: {
              type: 'object',
              description: 'Dynamic form fields for quotation details',
              additionalProperties: true,
              example: {
                departure: 'New York',
                destination: 'London',
                date: '2024-12-25',
                passengers: 2,
              },
            },
            totalAmount: {
              type: 'number',
              description: 'Total quotation amount',
              example: 1500.00,
            },
            status: {
              type: 'string',
              enum: ['draft', 'confirmed', 'cancelled'],
              description: 'Quotation status',
              default: 'draft',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // Logs Schema
        Logs: {
          type: 'object',
          required: ['activity', 'userId', 'assignedBy'],
          properties: {
            _id: {
              type: 'string',
              description: 'Log ID',
              example: '507f1f77bcf86cd799439018',
            },
            activity: {
              type: 'string',
              description: 'Activity description',
              example: 'Complete customer onboarding',
            },
            userId: {
              type: 'string',
              description: 'Reference to Team member assigned to this task',
              example: '507f1f77bcf86cd799439016',
            },
            dateTime: {
              type: 'string',
              format: 'date-time',
              description: 'Task date and time',
            },
            status: {
              type: 'string',
              enum: ['Pending', 'Completed', 'On Hold', 'In Progress'],
              description: 'Task status',
              default: 'Pending',
            },
            assignedBy: {
              type: 'string',
              description: 'Reference to Team member who assigned this task',
              example: '507f1f77bcf86cd799439016',
            },
          },
        },

        // Common Response Schemas
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully',
            },
          },
        },

        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              example: 'An error occurred',
            },
            error: {
              type: 'string',
              description: 'Detailed error message',
            },
          },
        },

        // Authentication Schemas
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              description: 'User password',
              example: 'securePassword123',
            },
          },
        },

        LoginResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: '2FA code sent to your email',
            },
            success: {
              type: 'boolean',
              example: true,
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
          },
        },

        Verify2FARequest: {
          type: 'object',
          required: ['email', 'twoFACode'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com',
            },
            twoFACode: {
              type: 'string',
              description: '6-digit 2FA code',
              example: '123456',
            },
          },
        },

        AuthResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: '2FA verified successfully. Login successful.',
            },
            success: {
              type: 'boolean',
              example: true,
            },
            user: {
              $ref: '#/components/schemas/User',
            },
            token: {
              type: 'string',
              description: 'JWT authentication token',
              example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            },
          },
        },
      },
    },
  },
  apis: [
    './routes/*.ts',
    './controllers/*.ts',
    './models/*.ts',
  ],
};

const specs = swaggerJsdoc(options);

export const setupSwagger = (app: Application): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Cooncierge Admin API Documentation',
  }));
};

export default specs;
