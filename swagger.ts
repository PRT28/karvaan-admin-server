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
          description: 'Pass the JWT token in the x-access-token header (or Authorization: Bearer <token>). Required for endpoints protected by checkKarvaanToken.',
        },
      },
      schemas: {
        // User Schema
        User: {
          type: 'object',
          required: ['name', 'email', 'mobile', 'phoneCode', 'roleId', 'userType', 'isActive', 'superAdmin', 'resetPasswordRequired'],
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
              example: '+91-9876543210',
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
              default: 'business_user',
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
            resetPasswordRequired: {
              type: 'boolean',
              description: 'Whether user must reset password on next login',
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
          required: ['roleName', 'permission', 'businessId'],
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
            businessId: {
              type: 'string',
              description: 'Reference to Business',
              example: '507f1f77bcf86cd799439020',
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
          required: ['cooncierce', 'settings', 'bookings'],
          properties: {
            cooncierce: {
              type: 'object',
              properties: {
                bookings: {
                  type: 'object',
                  properties: {
                    limitless: {
                      type: 'boolean',
                    },
                    os: {
                      type: 'boolean',
                    },
                  },
                },
                directory: {
                  type: 'object',
                  properties: {
                    customer: {
                      type: 'boolean',
                    },
                    vendor: {
                      type: 'boolean',
                    },
                    team: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
            settings: {
              type: 'object',
              properties: {
                companyDetails: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                billing: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                users: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                roles: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                approval: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                deleteAfterApproval: {
                  type: 'boolean',
                },
                noEditAfterTravelDate: {
                  type: 'boolean',
                },
                osPrimary: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                osSecondary: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                limitlessPrimary: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                limitlessSecondary: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
              },
            },
            bookings: {
              type: 'object',
              properties: {
                deleteAfterApproval: {
                  type: 'boolean',
                },
                noEditAfterTravelDate: {
                  type: 'boolean',
                },
                osPrimary: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                osSecondary: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                limitlessPrimary: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
                limitlessSecondary: {
                  $ref: '#/components/schemas/CRUDPermissions',
                },
              },
            },
          },
        },

        // CRUD Permissions Schema
        CRUDPermissions: {
          type: 'object',
          required: ['view', 'add', 'edit', 'delete'],
          properties: {
            view: {
              type: 'boolean',
              description: 'View permission',
            },
            add: {
              type: 'boolean',
              description: 'Add permission',
            },
            edit: {
              type: 'boolean',
              description: 'Edit permission',
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

        // Maker Checker Group Schema
        MakerCheckerGroup: {
          type: 'object',
          required: ['name', 'makers', 'checkers', 'type', 'businessId'],
          properties: {
            _id: {
              type: 'string',
              description: 'Maker checker group ID',
              example: '507f1f77bcf86cd799439099',
            },
            name: {
              type: 'string',
              description: 'Group name',
              example: 'Booking Approval Group',
            },
            description: {
              type: 'string',
              description: 'Group description',
            },
            makers: {
              type: 'array',
              description: 'User IDs or populated maker users',
              items: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'User ID',
                    example: '507f1f77bcf86cd799439012',
                  },
                  {
                    $ref: '#/components/schemas/User',
                  },
                ],
              },
            },
            checkers: {
              type: 'array',
              description: 'User IDs or populated checker users',
              items: {
                oneOf: [
                  {
                    type: 'string',
                    description: 'User ID',
                    example: '507f1f77bcf86cd799439012',
                  },
                  {
                    $ref: '#/components/schemas/User',
                  },
                ],
              },
            },
            type: {
              type: 'string',
              enum: ['booking', 'finance'],
              description: 'Group type',
              example: 'booking',
            },
            businessId: {
              description: 'Reference to Business or populated business',
              oneOf: [
                {
                  type: 'string',
                  example: '507f1f77bcf86cd799439020',
                },
                {
                  $ref: '#/components/schemas/Business',
                },
              ],
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
            profileImage: {
              $ref: '#/components/schemas/UploadedDocument',
              description: 'Business profile image/logo',
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

        // Bank Schema
        Bank: {
          type: 'object',
          required: ['name', 'accountNumber', 'businessId', 'ifscCode', 'accountType'],
          properties: {
            _id: {
              type: 'string',
              description: 'Bank ID',
              example: '507f1f77bcf86cd799439030',
            },
            name: {
              type: 'string',
              description: 'Bank name',
              example: 'HDFC Bank',
            },
            accountNumber: {
              type: 'string',
              description: 'Bank account number',
              example: '1234567890',
            },
            businessId: {
              type: 'string',
              description: 'Reference to Business',
              example: '507f1f77bcf86cd799439020',
            },
            ifscCode: {
              type: 'string',
              description: 'IFSC code',
              example: 'HDFC0000123',
            },
            accountType: {
              type: 'string',
              enum: ['savings', 'current'],
              description: 'Account type',
              example: 'current',
            },
            isDeleted: {
              type: 'boolean',
              description: 'Soft delete flag',
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
              enum: ['flight', 'accomodation', 'transportation', 'ticket', 'activity', 'travel insurance', 'visa', 'others'],
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
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of customer IDs',
              example: ['507f1f77bcf86cd799439013', '507f1f77bcf86cd799439099'],
            },
            customerPricing: {
              type: 'array',
              description: 'Per-customer selling prices',
              items: {
                type: 'object',
                properties: {
                  customerId: {
                    type: 'string',
                    description: 'Customer ID',
                    example: '507f1f77bcf86cd799439013',
                  },
                  sellingPrice: {
                    type: 'number',
                    description: 'Selling price for this customer',
                    example: 12000,
                  },
                },
              },
            },
            vendorId: {
              type: 'string',
              description: 'Reference to Vendor',
              example: '507f1f77bcf86cd799439015',
            },
            adultTravelers: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of adult traveller IDs',
              example: ['507f1f77bcf86cd799439022'],
            },
            childTravelers: {
              type: 'array',
              description: 'Array of child traveller objects',
              items: {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    description: 'Traveller ID',
                    example: '507f1f77bcf86cd799439023',
                  },
                  age: {
                    type: 'number',
                    description: 'Child age',
                    example: 8,
                  },
                },
              },
            },
            formFields: {
              type: 'object',
              description: 'Dynamic form fields based on quotation type. Flight quotations use tripType, optional shared pnr, top-level segments for one way/round trip, and trips with nested segments for multi city.',
              example: {
                pnr: 'AB12CD',
                samePnrForAllSegments: true,
                tripType: 'multi city',
                trips: [
                  {
                    title: 'Trip 1',
                    segments: [
                      {
                        pnr: 'AB12CD',
                        from: 'DEL',
                        to: 'DXB',
                        flightNumber: 'EK51',
                        travelDate: '2026-04-18T00:00:00.000Z',
                        cabinClass: 'Economy',
                        cabinBaggage: {
                          pieces: 1,
                          weight: 7,
                        },
                        checkInBaggage: {
                          pieces: 1,
                          weight: 20,
                        },
                        preview: {
                          airline: 'Emirates',
                          airlineLogo: 'https://cdn.example.com/emirates.png',
                          flightNumber: 'EK51',
                          originAirportCode: 'DEL',
                          destinationAirportCode: 'DXB',
                          originCity: 'Delhi',
                          destinationCity: 'Dubai',
                          std: '09:45',
                          sta: '12:30',
                          duration: '03 h 45 m',
                        },
                      },
                      {
                        pnr: 'AB12CD',
                        from: 'DXB',
                        to: 'JFK',
                        flightNumber: 'EK203',
                        travelDate: '2026-04-19T00:00:00.000Z',
                        cabinClass: 'Economy',
                      },
                    ],
                  },
                ],
                rulesAndConditions: 'Standard fare rules apply.',
                rulesTemplateId: '65f1b6f8d1a1111111111111',
                internalNotes: 'Customer requested aisle seat.',
              },
            },
            priceInfo: {
              type: 'object',
              description: 'Pricing details where each monetary field is stored as a currency-aware value object',
              properties: {
                advancedPricing: {
                  type: 'boolean',
                  example: true,
                },
                sellingPrice: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 21000 },
                    currency: { type: 'string', example: 'USD' },
                    exchangeRate: { type: 'number', example: 83.1 },
                    notes: { type: 'string', example: 'Quoted in customer currency' },
                  },
                },
                costPrice: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 17000 },
                    currency: { type: 'string', example: 'AED' },
                    exchangeRate: { type: 'number', example: 22.64 },
                    notes: { type: 'string', example: 'Vendor fare in source currency' },
                  },
                },
                vendorInvoiceBase: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 16000 },
                    currency: { type: 'string', example: 'AED' },
                    exchangeRate: { type: 'number', example: 22.64 },
                    notes: { type: 'string', example: 'Base vendor invoice' },
                  },
                },
                additionalVendorInvoiceBase: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 0 },
                    currency: { type: 'string', example: 'AED' },
                    exchangeRate: { type: 'number', example: 22.64 },
                  },
                },
                vendorIncentiveReceived: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 500 },
                    currency: { type: 'string', example: 'AED' },
                    exchangeRate: { type: 'number', example: 22.64 },
                  },
                },
                commissionPayout: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 500 },
                    currency: { type: 'string', example: 'INR' },
                    exchangeRate: { type: 'number', example: 1 },
                  },
                },
                refundReceived: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 0 },
                    currency: { type: 'string', example: 'AED' },
                    exchangeRate: { type: 'number', example: 22.64 },
                  },
                },
                refundPaid: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 0 },
                    currency: { type: 'string', example: 'USD' },
                    exchangeRate: { type: 'number', example: 83.1 },
                  },
                },
                vendorIncentiveChargeback: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 0 },
                    currency: { type: 'string', example: 'AED' },
                    exchangeRate: { type: 'number', example: 22.64 },
                  },
                },
                commissionPayoutChargeback: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 0 },
                    currency: { type: 'string', example: 'INR' },
                    exchangeRate: { type: 'number', example: 1 },
                  },
                },
                additionalCostPrice: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 0 },
                    currency: { type: 'string', example: 'AED' },
                    exchangeRate: { type: 'number', example: 22.64 },
                  },
                },
                additionalSellingPrice: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 1000 },
                    currency: { type: 'string', example: 'USD' },
                    exchangeRate: { type: 'number', example: 83.1 },
                  },
                },
                additionalVendorIncentiveReceived: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 0 },
                    currency: { type: 'string', example: 'AED' },
                    exchangeRate: { type: 'number', example: 22.64 },
                  },
                },
                additionalCommissionPayout: {
                  type: 'object',
                  properties: {
                    amount: { type: 'number', example: 0 },
                    currency: { type: 'string', example: 'INR' },
                    exchangeRate: { type: 'number', example: 1 },
                  },
                },
                notes: {
                  type: 'string',
                  example: 'Issue ticket after passport recheck.',
                },
              },
            },
            totalAmount: {
              type: 'number',
              description: 'Total quotation amount',
              example: 1500.00,
            },
            status: {
              type: 'string',
              enum: ['confirmed', 'cancelled', 'rescheduled'],
              description: 'Quotation status',
              example: 'confirmed',
            },
            serviceStatus: {
              type: 'string',
              enum: ['pending', 'denied', 'draft', 'approved'],
              description: 'Service approval status',
              example: 'approved',
            },
            primaryOwner: {
              type: 'string',
              description: 'Primary owner team member ID',
              example: '507f1f77bcf86cd799439016',
            },
            secondaryOwner: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Array of secondary owner team member IDs',
              example: ['507f1f77bcf86cd799439016'],
            },
            travelDate: {
              type: 'string',
              format: 'date',
              description: 'Travel date',
              example: '2024-06-15',
            },
            adultNumber: {
              type: 'integer',
              description: 'Number of adult travellers',
              example: 2,
            },
            childNumber: {
              type: 'integer',
              description: 'Number of child travellers',
              example: 1,
            },
            remarks: {
              type: 'string',
              description: 'Additional remarks or notes',
              example: 'Business trip with special requirements',
            },
            bookingDate: {
              type: 'string',
              format: 'date-time',
              description: 'Booking date',
              example: '2026-03-05T00:00:00.000Z',
            },
            newBookingDate: {
              type: 'string',
              format: 'date-time',
              description: 'New booking date used when status is rescheduled',
              example: '2026-03-08T00:00:00.000Z',
            },
            newTravelDate: {
              type: 'string',
              format: 'date-time',
              description: 'New travel date used when status is rescheduled',
              example: '2026-04-20T00:00:00.000Z',
            },
            cancellationDate: {
              type: 'string',
              format: 'date-time',
              description: 'Cancellation date used when status is cancelled',
              example: '2026-03-10T00:00:00.000Z',
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
                $ref: '#/components/schemas/UploadedDocument',
              },
            },
            vendorVoucherDocuments: {
              type: 'array',
              description: 'Array of uploaded vendor voucher documents (max 3)',
              items: {
                $ref: '#/components/schemas/UploadedDocument',
              },
            },
            vendorInvoiceDocuments: {
              type: 'array',
              description: 'Array of uploaded vendor invoice documents (max 3)',
              items: {
                $ref: '#/components/schemas/UploadedDocument',
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

        // Limitless Schema
        Limitless: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'Limitless booking ID',
              example: '507f1f77bcf86cd799439017',
            },
            customId: {
              type: 'string',
              description: 'Custom ID unique within the business',
              example: 'LI-1A2B3',
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
            primaryOwner: {
              type: 'string',
              description: 'Primary owner (Team member ID)',
              example: '507f1f77bcf86cd799439016',
            },
            secondaryOwner: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Secondary owners (Team member IDs)',
              example: ['507f1f77bcf86cd799439016'],
            },
            totalAmount: {
              type: 'number',
              description: 'Total amount',
              example: 1500.0,
            },
            roe: {
              type: 'number',
              description: 'Rate of exchange',
              example: 83.25,
            },
            currency: {
              type: 'string',
              description: 'Currency code',
              example: 'USD',
            },
            status: {
              type: 'string',
              enum: ['confirmed', 'cancelled'],
              description: 'Booking status',
              example: 'confirmed',
            },
            serviceStatus: {
              type: 'string',
              enum: ['pending', 'denied', 'draft', 'approved'],
              description: 'Service approval status',
              example: 'approved',
            },
            travelDate: {
              type: 'string',
              format: 'date',
              description: 'Travel date',
              example: '2024-06-15',
            },
            bookingDate: {
              type: 'string',
              format: 'date',
              description: 'Booking date',
              example: '2024-06-01',
            },
            adultTravelers: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Adult traveller IDs',
            },
            childTravelers: {
              type: 'array',
              description: 'Child travellers with ages',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  age: { type: 'number' },
                },
              },
            },
            adultNumber: {
              type: 'number',
              description: 'Number of adults',
              example: 2,
            },
            childNumber: {
              type: 'number',
              description: 'Number of children',
              example: 1,
            },
            limitlessDestinations: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Destinations list',
            },
            limitlessTitle: {
              type: 'string',
              description: 'Limitless title',
              example: 'Europe Summer Getaway',
            },
            description: {
              type: 'string',
              description: 'Description',
              example: 'Multi-city travel plan',
            },
            remarks: {
              type: 'string',
              description: 'Additional remarks',
              example: 'Special requirements noted',
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
                $ref: '#/components/schemas/UploadedDocument',
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
