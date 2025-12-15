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
        url: 'https://api.karvaann.com',
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
          required: ['name', 'email', 'mobile', 'phoneCode', 'roleId', 'password', 'designation'],
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
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Date of birth',
              example: '1990-01-15',
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              description: 'Gender',
              example: 'male',
            },
            emergencyContact: {
              type: 'string',
              description: 'Emergency contact number',
              example: '+91-9876543210',
            },
            alias: {
              type: 'string',
              description: 'User alias or nickname',
              example: 'JD',
            },
            mobile: {
              type: 'string',
              description: 'User mobile number',
              example: '+91-9876543210',
            },
            designation: {
              type: 'string',
              description: 'Job designation',
              example: 'Travel Consultant',
            },
            dateOfJoining: {
              type: 'string',
              format: 'date',
              description: 'Date of joining',
              example: '2024-01-01',
            },
            dateOfLeaving: {
              type: 'string',
              format: 'date',
              description: 'Date of leaving (if applicable)',
              example: '2024-12-31',
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
              example: 91,
            },
            roleId: {
              type: 'string',
              description: 'Reference to Role document',
              example: '507f1f77bcf86cd799439012',
            },
            businessId: {
              type: 'string',
              description: 'Reference to Business (null for super admin)',
              example: '507f1f77bcf86cd799439020',
              nullable: true,
            },
            userType: {
              type: 'string',
              enum: ['super_admin', 'business_admin', 'business_user'],
              description: 'User type in the system',
              example: 'business_user',
            },
            isActive: {
              type: 'boolean',
              description: 'User active status',
              example: true,
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
            },
            superAdmin: {
              type: 'boolean',
              description: 'Whether user is a super admin',
              default: false,
            },
            profileImage: {
              $ref: '#/components/schemas/UploadedDocument',
              description: 'User profile image',
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
          required: ['name', 'email', 'phone', 'businessId', 'ownerId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Customer ID',
              example: '507f1f77bcf86cd799439013',
            },
            customId: {
              type: 'string',
              description: '5-character ID unique within the business',
              example: 'AB12C',
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
              example: '+91-9876543210',
            },
            alias: {
              type: 'string',
              description: 'Customer alias or nickname',
              example: 'JS',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Date of birth',
              example: '1985-03-20',
            },
            gstin: {
              type: 'string',
              description: 'GST Identification Number',
              example: '22AAAAA0000A1Z5',
            },
            companyName: {
              type: 'string',
              description: 'Company name if business customer',
              example: 'Smith Enterprises',
            },
            openingBalance: {
              type: 'number',
              description: 'Opening balance amount',
              example: 5000.00,
            },
            balanceType: {
              type: 'string',
              enum: ['credit', 'debit'],
              description: 'Type of opening balance',
              example: 'credit',
            },
            address: {
              type: 'string',
              description: 'Customer address',
              example: '123 Main St, Mumbai, Maharashtra, India',
            },
            businessId: {
              type: 'string',
              description: 'Reference to Business',
              example: '507f1f77bcf86cd799439020',
            },
            ownerId: {
              type: 'string',
              description: 'Reference to Team member who owns this customer',
              example: '507f1f77bcf86cd799439016',
            },
            tier: {
              type: 'string',
              enum: ['tier1', 'tier2', 'tier3', 'tier4', 'tier5'],
              description: 'Customer tier level',
              example: 'tier1',
            },
            isDeleted: {
              type: 'boolean',
              description: 'Soft deletion flag',
              example: false,
            },
            isDeletable: {
              type: 'boolean',
              description: 'Whether customer can be deleted',
              example: true,
            },
            documents: {
              type: 'array',
              description: 'Uploaded documents (max 3)',
              items: {
                $ref: '#/components/schemas/UploadedDocument',
              },
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
          required: ['companyName', 'contactPerson', 'email', 'phone', 'businessId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Vendor ID',
              example: '507f1f77bcf86cd799439015',
            },
            customId: {
              type: 'string',
              description: '5-character ID unique within the business',
              example: 'CD34E',
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
            alias: {
              type: 'string',
              description: 'Vendor alias or short name',
              example: 'ATS',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Contact person date of birth',
              example: '1980-07-10',
            },
            openingBalance: {
              type: 'number',
              description: 'Opening balance amount',
              example: 10000.00,
            },
            balanceType: {
              type: 'string',
              enum: ['credit', 'debit'],
              description: 'Type of opening balance',
              example: 'debit',
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
              example: '+91-9876543210',
            },
            GSTIN: {
              type: 'string',
              description: 'GST Identification Number',
              example: '22AAAAA0000A1Z5',
            },
            address: {
              type: 'string',
              description: 'Vendor address',
              example: '456 Business Park, Delhi, India',
            },
            businessId: {
              type: 'string',
              description: 'Reference to Business',
              example: '507f1f77bcf86cd799439020',
            },
            tier: {
              type: 'string',
              enum: ['tier1', 'tier2', 'tier3', 'tier4', 'tier5'],
              description: 'Vendor tier level',
              example: 'tier2',
            },
            isDeleted: {
              type: 'boolean',
              description: 'Soft deletion flag',
              example: false,
            },
            documents: {
              type: 'array',
              description: 'Uploaded documents (max 3)',
              items: {
                $ref: '#/components/schemas/UploadedDocument',
              },
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
          required: ['name', 'email', 'phone', 'businessId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Team member ID',
              example: '507f1f77bcf86cd799439016',
            },
            customId: {
              type: 'string',
              description: '5-character ID unique within the business',
              example: 'EF56G',
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
              example: '+91-9876543210',
            },
            alias: {
              type: 'string',
              description: 'Alias or nickname',
            },
            designation: {
              type: 'string',
              description: 'Job designation',
              example: 'Travel Consultant',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Date of birth',
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
            },
            emergencyContact: {
              type: 'string',
              description: 'Emergency contact number',
            },
            dateOfJoining: {
              type: 'string',
              format: 'date',
              description: 'Joining date',
            },
            dateOfLeaving: {
              type: 'string',
              format: 'date',
              description: 'Leaving date',
            },
            businessId: {
              type: 'string',
              description: 'Reference to Business',
              example: '507f1f77bcf86cd799439020',
            },
            isDeleted: {
              type: 'boolean',
              description: 'Soft deletion flag',
              example: false,
            },
            documents: {
              type: 'array',
              description: 'Uploaded documents (max 3)',
              items: {
                $ref: '#/components/schemas/UploadedDocument',
              },
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },

        // Business Schema
        Business: {
          type: 'object',
          required: ['businessName', 'businessType', 'email', 'phone', 'address'],
          properties: {
            _id: {
              type: 'string',
              description: 'Business ID',
              example: '507f1f77bcf86cd799439020',
            },
            businessName: {
              type: 'string',
              description: 'Name of the business',
              example: 'Karvaan Experiences',
            },
            businessType: {
              type: 'string',
              enum: ['travel_agency', 'tour_operator', 'hotel', 'restaurant', 'transport', 'event_management', 'consulting', 'other'],
              description: 'Type of business',
              example: 'travel_agency',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Business email address',
              example: 'info@karvaanexperiences.com',
            },
            phone: {
              type: 'string',
              description: 'Business phone number',
              example: '+91-9876543210',
            },
            address: {
              type: 'object',
              required: ['street', 'city', 'state', 'country', 'zipCode'],
              properties: {
                street: {
                  type: 'string',
                  example: '123 Business Street',
                },
                city: {
                  type: 'string',
                  example: 'Mumbai',
                },
                state: {
                  type: 'string',
                  example: 'Maharashtra',
                },
                country: {
                  type: 'string',
                  example: 'India',
                },
                zipCode: {
                  type: 'string',
                  example: '400001',
                },
              },
            },
            website: {
              type: 'string',
              description: 'Business website URL',
              example: 'https://karvaanexperiences.com',
            },
            description: {
              type: 'string',
              description: 'Business description',
              example: 'Premium travel and tour operator',
            },
            logo: {
              type: 'string',
              description: 'Business logo URL',
              example: 'https://example.com/logo.png',
            },
            gstin: {
              type: 'string',
              description: 'GST Identification Number',
              example: '22AAAAA0000A1Z5',
            },
            panNumber: {
              type: 'string',
              description: 'PAN Number',
              example: 'ABCDE1234F',
            },
            registrationNumber: {
              type: 'string',
              description: 'Business registration number',
              example: 'REG123456789',
            },
            isActive: {
              type: 'boolean',
              description: 'Business active status',
              example: true,
            },
            subscriptionPlan: {
              type: 'string',
              enum: ['basic', 'premium', 'enterprise'],
              description: 'Subscription plan',
              example: 'premium',
            },
            subscriptionExpiry: {
              type: 'string',
              format: 'date-time',
              description: 'Subscription expiry date',
            },
            adminUserId: {
              type: 'string',
              description: 'Reference to admin user',
              example: '507f1f77bcf86cd799439021',
            },
            settings: {
              type: 'object',
              properties: {
                allowUserRegistration: {
                  type: 'boolean',
                  example: true,
                },
                maxUsers: {
                  type: 'integer',
                  example: 10,
                },
                features: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  example: ['quotations', 'customers', 'vendors'],
                },
              },
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

        // Traveller Schema
        Traveller: {
          type: 'object',
          required: ['name', 'businessId', 'ownerId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Traveller ID',
              example: '507f1f77bcf86cd799439022',
            },
            customId: {
              type: 'string',
              description: '5-character ID unique within the business',
              example: 'IJ90K',
            },
            name: {
              type: 'string',
              description: 'Traveller full name',
              example: 'John Smith',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Traveller email address',
              example: 'john.smith@example.com',
            },
            phone: {
              type: 'string',
              description: 'Traveller phone number',
              example: '+91-9876543210',
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Date of birth',
              example: '1990-05-15',
            },
            businessId: {
              type: 'string',
              description: 'Reference to Business',
              example: '507f1f77bcf86cd799439020',
            },
            ownerId: {
              type: 'string',
              description: 'Reference to Team member who owns this traveller',
              example: '507f1f77bcf86cd799439016',
            },
            isDeleted: {
              type: 'boolean',
              description: 'Soft deletion flag',
              example: false,
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

        // Quotation Schema
        Quotation: {
          type: 'object',
          required: ['quotationType', 'channel', 'formFields', 'totalAmount', 'businessId', 'owner', 'travelDate'],
          properties: {
            _id: {
              type: 'string',
              description: 'Quotation ID',
              example: '507f1f77bcf86cd799439017',
            },
            customId: {
              type: 'string',
              description: '5-character ID unique within the business',
              example: 'LM12N',
            },
            quotationType: {
              type: 'string',
              enum: ['flight', 'train', 'hotel', 'activity', 'travel', 'transport-land', 'transport-maritime', 'tickets', 'travel insurance', 'visas', 'others'],
              description: 'Type of quotation',
              example: 'flight',
            },
            channel: {
              type: 'string',
              enum: ['B2B', 'B2C'],
              description: 'Sales channel',
              example: 'B2C',
            },
            businessId: {
              type: 'string',
              description: 'Reference to Business',
              example: '507f1f77bcf86cd799439020',
            },
            customerId: {
              type: 'string',
              description: 'Reference to Customer',
              example: '507f1f77bcf86cd799439013',
            },
            vendorId: {
              type: 'string',
              description: 'Reference to Vendor',
              example: '507f1f77bcf86cd799439015',
            },
            travelers: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of Traveller IDs',
              example: ['507f1f77bcf86cd799439022'],
            },
            formFields: {
              type: 'object',
              description: 'Dynamic form fields based on quotation type',
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
              enum: ['pending', 'confirmed', 'cancelled'],
              description: 'Quotation status',
              example: 'confirmed',
            },
            owner: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of Team member IDs who own this quotation',
              example: ['507f1f77bcf86cd799439016'],
            },
            travelDate: {
              type: 'string',
              format: 'date',
              description: 'Travel date',
              example: '2024-06-15',
            },
            adultTravlers: {
              type: 'integer',
              description: 'Number of adult travellers',
              example: 2,
            },
            childTravlers: {
              type: 'integer',
              description: 'Number of child travellers',
              example: 1,
            },
            remarks: {
              type: 'string',
              description: 'Additional remarks or notes',
              example: 'Business trip with special requirements',
            },
            isDeleted: {
              type: 'boolean',
              description: 'Soft delete flag',
              example: false,
            },
            documents: {
              type: 'array',
              description: 'Array of uploaded documents (max 3)',
              items: {
                type: 'object',
                properties: {
                  originalName: {
                    type: 'string',
                    description: 'Original file name',
                    example: 'contract.pdf',
                  },
                  fileName: {
                    type: 'string',
                    description: 'Stored file name (UUID)',
                    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf',
                  },
                  url: {
                    type: 'string',
                    description: 'Public S3 URL',
                    example: 'https://karvaan-quotation-documents.s3.ap-south-1.amazonaws.com/quotations/businessId/a1b2c3d4.pdf',
                  },
                  key: {
                    type: 'string',
                    description: 'S3 object key',
                    example: 'quotations/businessId/a1b2c3d4.pdf',
                  },
                  size: {
                    type: 'number',
                    description: 'File size in bytes',
                    example: 102400,
                  },
                  mimeType: {
                    type: 'string',
                    description: 'File MIME type',
                    example: 'application/pdf',
                  },
                  uploadedAt: {
                    type: 'string',
                    format: 'date-time',
                    description: 'Upload timestamp',
                  },
                },
              },
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
          required: ['activity', 'userId', 'assignedBy', 'businessId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Log ID',
              example: '507f1f77bcf86cd799439018',
            },
            customId: {
              type: 'string',
              description: '5-character ID unique within the business',
              example: 'OP34Q',
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
            businessId: {
              type: 'string',
              description: 'Reference to Business',
              example: '507f1f77bcf86cd799439020',
            },
            bookingId: {
              type: 'string',
              description: 'Reference to Quotation/Booking',
              example: '507f1f77bcf86cd799439017',
            },
            priority: {
              type: 'string',
              enum: ['Low', 'Medium', 'High', 'Urgent'],
              description: 'Task priority level',
              example: 'Medium',
            },
            description: {
              type: 'string',
              description: 'Detailed task description',
              example: 'Follow up with customer regarding travel preferences',
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

        // Uploaded Document Schema
        UploadedDocument: {
          type: 'object',
          properties: {
            originalName: {
              type: 'string',
              description: 'Original file name',
              example: 'passport.pdf',
            },
            fileName: {
              type: 'string',
              description: 'Generated unique file name',
              example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf',
            },
            url: {
              type: 'string',
              description: 'Public S3 URL to access the file',
              example: 'https://bucket-name.s3.region.amazonaws.com/path/to/file.pdf',
            },
            key: {
              type: 'string',
              description: 'S3 object key',
              example: 'customers/businessId/a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf',
            },
            size: {
              type: 'number',
              description: 'File size in bytes',
              example: 102400,
            },
            mimeType: {
              type: 'string',
              description: 'MIME type of the file',
              example: 'application/pdf',
            },
            uploadedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Upload timestamp',
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

        // Booking History Response Schema
        BookingHistoryResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                quotations: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Quotation',
                  },
                },
                pagination: {
                  $ref: '#/components/schemas/Pagination',
                },
                customer: {
                  $ref: '#/components/schemas/Customer',
                },
                vendor: {
                  $ref: '#/components/schemas/Vendor',
                },
                traveller: {
                  $ref: '#/components/schemas/Traveller',
                },
              },
            },
          },
        },

        // List Response Schema (Generic)
        ListResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
            count: {
              type: 'integer',
              example: 25,
            },
            pagination: {
              $ref: '#/components/schemas/Pagination',
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

        // Pagination Schema
        Pagination: {
          type: 'object',
          properties: {
            currentPage: {
              type: 'integer',
              example: 1,
            },
            totalPages: {
              type: 'integer',
              example: 5,
            },
            totalCount: {
              type: 'integer',
              example: 47,
            },
            hasNextPage: {
              type: 'boolean',
              example: true,
            },
            hasPrevPage: {
              type: 'boolean',
              example: false,
            },
          },
        },

        // Bulk Upload Response Schema
        BulkUploadResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            message: {
              type: 'string',
              example: 'Bulk upload completed',
            },
            summary: {
              type: 'object',
              properties: {
                totalRecords: {
                  type: 'integer',
                  example: 10,
                },
                successfulRecords: {
                  type: 'integer',
                  example: 8,
                },
                failedRecords: {
                  type: 'integer',
                  example: 2,
                },
                successRate: {
                  type: 'string',
                  example: '80%',
                },
              },
            },
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  row: {
                    type: 'integer',
                    example: 1,
                  },
                  success: {
                    type: 'boolean',
                    example: true,
                  },
                  data: {
                    type: 'object',
                    description: 'Created record data if successful',
                  },
                  errors: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                    description: 'Error messages if failed',
                  },
                },
              },
            },
          },
        },

        // Dashboard Response Schema
        DashboardResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true,
            },
            data: {
              type: 'object',
              properties: {
                taskOverDue: {
                  type: 'integer',
                  example: 5,
                },
                taskDueToday: {
                  type: 'integer',
                  example: 3,
                },
                upcomingTasks: {
                  type: 'integer',
                  example: 12,
                },
                totalTasks: {
                  type: 'integer',
                  example: 20,
                },
                tasksByPriority: {
                  type: 'object',
                  properties: {
                    High: {
                      type: 'integer',
                      example: 2,
                    },
                    Medium: {
                      type: 'integer',
                      example: 8,
                    },
                    Low: {
                      type: 'integer',
                      example: 10,
                    },
                  },
                },
                tasksByStatus: {
                  type: 'object',
                  properties: {
                    Pending: {
                      type: 'integer',
                      example: 10,
                    },
                    'In Progress': {
                      type: 'integer',
                      example: 5,
                    },
                    Completed: {
                      type: 'integer',
                      example: 3,
                    },
                    'On Hold': {
                      type: 'integer',
                      example: 2,
                    },
                  },
                },
              },
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
