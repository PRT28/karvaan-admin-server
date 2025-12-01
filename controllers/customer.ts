import { Request, Response } from 'express';
import Customer from '../models/Customer';
import Quotation from '../models/Quotation';
import Team from '../models/Team';
import mongoose from 'mongoose';
import * as XLSX from 'xlsx';
import csv from 'csv-parser';
import { Readable } from 'stream';

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const customerData = {
      ...req.body,
      businessId: req.user?.businessId || req.user?._id
    };

    const customer = await Customer.create(customerData);
    res.status(201).json({ customer });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create customer', message: errorMessage });
  }
};

export const getCustomers = async (req: Request, res: Response) => {
  try {

    const { isDeleted } = req.query;

    // Filter by business for business users, show all for super admin
    const filter = req.user?.userType === 'super_admin' ? {} : { businessId: req.user?.businessId };

    let customers;

    if (isDeleted) {
      customers = await Customer.find({...filter, isDeleted: isDeleted === 'true' ? true : false})
      .populate({
        path: 'ownerId',
        select: 'name email phone',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });
    } else {
      customers = await Customer.find({...filter})
      .populate({
        path: 'ownerId',
        select: 'name email phone',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });
    }   
    res.status(200).json({ customers });
  } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
        res.status(500).json({ error: 'Failed to fetch customer', message: errorMessage });
    }
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Fetching customer by ID:', req.params);

    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const customer = await Customer.findOne(filter)
      .populate({
        path: 'ownerId',
        select: 'name email phone',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.status(200).json({ customer });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to get customer', message: errorMessage });
}
};

export const updateCustomer = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };
    delete updateData.businessId;

    const customer = await Customer.findOneAndUpdate(filter, updateData, { new: true })
      .populate({
        path: 'ownerId',
        select: 'name email phone',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.status(200).json({ customer });
  }catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to update customer', message: errorMessage });
    }
};

export const deleteCustomer = async (req: Request, res: Response): Promise<void> => {
  try {

    const id = req.params.id

    console.log("Deleting customer:", id);

    const customer = await Customer.findByIdAndUpdate(id, { isDeleted: true }, { new: true, runValidators: true });
    if (!customer) {
      res.status(404).json({ message: 'Customer not found' });
      return;
    }
    res.status(200).json({ message: 'Customer deleted', customer });
  }catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to delete customer', message: errorMessage });
  }
};

// Interface for bulk upload result
interface BulkUploadResult {
  success: boolean;
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  errors: Array<{
    row: number;
    data: any;
    error: string;
  }>;
  createdCustomers: any[];
}

// Helper function to validate customer data
const validateCustomerData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!data.email || typeof data.email !== 'string' || data.email.trim() === '') {
    errors.push('Email is required and must be a non-empty string');
  } else {
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      errors.push('Email must be in valid format');
    }
  }

  if (!data.phone || typeof data.phone !== 'string' || data.phone.trim() === '') {
    errors.push('Phone is required and must be a non-empty string');
  }

  if (!data.ownerId || typeof data.ownerId !== 'string' || data.ownerId.trim() === '') {
    errors.push('OwnerId is required and must be a non-empty string');
  } else {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(data.ownerId)) {
      errors.push('OwnerId must be a valid ObjectId');
    }
  }

  // Optional fields validation
  if (data.tier && !['tier1', 'tier2', 'tier3', 'tier4', 'tier5'].includes(data.tier)) {
    errors.push('Tier must be one of: tier1, tier2, tier3, tier4, tier5');
  }

  if (data.balanceType && !['credit', 'debit'].includes(data.balanceType)) {
    errors.push('BalanceType must be either credit or debit');
  }

  if (data.openingBalance && isNaN(Number(data.openingBalance))) {
    errors.push('OpeningBalance must be a valid number');
  }

  if (data.dateOfBirth && isNaN(Date.parse(data.dateOfBirth))) {
    errors.push('DateOfBirth must be a valid date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Helper function to parse CSV data
const parseCSVData = (buffer: Buffer): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const results: any[] = [];
    const stream = Readable.from(buffer.toString());

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Helper function to parse XLSX data
const parseXLSXData = (buffer: Buffer): any[] => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(worksheet);
};

export const bulkUploadCustomers = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded. Please upload a CSV or XLSX file.'
      });
      return;
    }

    const file = req.file;
    const businessId = req.user?.businessId;

    if (!businessId) {
      res.status(400).json({
        success: false,
        message: 'Business ID is required'
      });
      return;
    }

    // Check file type
    const allowedMimeTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'Invalid file type. Please upload a CSV or XLSX file.'
      });
      return;
    }

    let parsedData: any[] = [];

    try {
      // Parse file based on type
      if (file.mimetype === 'text/csv') {
        parsedData = await parseCSVData(file.buffer);
      } else {
        parsedData = parseXLSXData(file.buffer);
      }
    } catch (parseError) {
      res.status(400).json({
        success: false,
        message: 'Failed to parse file. Please check file format and try again.',
        error: parseError instanceof Error ? parseError.message : 'Unknown parsing error'
      });
      return;
    }

    if (parsedData.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No data found in the uploaded file.'
      });
      return;
    }

    const result: BulkUploadResult = {
      success: false,
      totalRecords: parsedData.length,
      successfulRecords: 0,
      failedRecords: 0,
      errors: [],
      createdCustomers: []
    };

    // Process each record
    for (let i = 0; i < parsedData.length; i++) {
      const rowData = parsedData[i];
      const rowIndex = i + 1; // 1-based indexing for user-friendly error messages

      try {
        // Validate data
        const validation = validateCustomerData(rowData);

        if (!validation.isValid) {
          result.errors.push({
            row: rowIndex,
            data: rowData,
            error: validation.errors.join(', ')
          });
          result.failedRecords++;
          continue;
        }

        // Verify that ownerId exists and belongs to the same business
        const owner = await Team.findOne({
          _id: rowData.ownerId,
          businessId: businessId
        });

        if (!owner) {
          result.errors.push({
            row: rowIndex,
            data: rowData,
            error: 'OwnerId does not exist or does not belong to your business'
          });
          result.failedRecords++;
          continue;
        }

        // Prepare customer data
        const customerData = {
          name: rowData.name.trim(),
          email: rowData.email.trim().toLowerCase(),
          phone: rowData.phone.trim(),
          alias: rowData.alias ? rowData.alias.trim() : undefined,
          dateOfBirth: rowData.dateOfBirth ? new Date(rowData.dateOfBirth) : undefined,
          gstin: rowData.gstin ? rowData.gstin.trim() : undefined,
          companyName: rowData.companyName ? rowData.companyName.trim() : undefined,
          openingBalance: rowData.openingBalance ? Number(rowData.openingBalance) : undefined,
          balanceType: rowData.balanceType || undefined,
          address: rowData.address ? rowData.address.trim() : undefined,
          tier: rowData.tier || undefined,
          businessId: businessId,
          ownerId: rowData.ownerId,
          isDeleted: false,
          isDeletable: true
        };

        // Create customer
        const customer = await Customer.create(customerData);
        result.createdCustomers.push(customer);
        result.successfulRecords++;

      } catch (error) {
        let errorMessage = 'Unknown error occurred';

        if (error instanceof Error) {
          errorMessage = error.message;

          // Handle duplicate key error
          if (error.message.includes('E11000') && error.message.includes('email')) {
            errorMessage = 'Email already exists for this business';
          }
        }

        result.errors.push({
          row: rowIndex,
          data: rowData,
          error: errorMessage
        });
        result.failedRecords++;
      }
    }

    // Determine overall success
    result.success = result.successfulRecords > 0;

    // Send response
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json({
      ...result,
      message: `Bulk upload completed. ${result.successfulRecords} customers created successfully, ${result.failedRecords} failed.`
    });

  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during bulk upload',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Template data structure for bulk upload
const getTemplateData = () => {
  return [
    {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      ownerId: '507f1f77bcf86cd799439011',
      alias: 'Johnny',
      dateOfBirth: '1990-05-15',
      gstin: '22AAAAA0000A1Z5',
      companyName: 'Doe Enterprises',
      openingBalance: 1000,
      balanceType: 'credit',
      address: '123 Main St, City, State',
      tier: 'tier1'
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '+1234567891',
      ownerId: '507f1f77bcf86cd799439012',
      alias: '',
      dateOfBirth: '',
      gstin: '',
      companyName: 'Smith Corp',
      openingBalance: 2500,
      balanceType: 'debit',
      address: '456 Oak Ave, Town, State',
      tier: 'tier2'
    }
  ];
};

export const downloadBulkUploadTemplate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { format } = req.params;

    // Validate format parameter
    if (!format || !['csv', 'xlsx'].includes(format.toLowerCase())) {
      res.status(400).json({
        success: false,
        message: 'Invalid format. Supported formats are: csv, xlsx'
      });
      return;
    }

    const templateData = getTemplateData();
    const fileName = `customer-bulk-upload-template.${format.toLowerCase()}`;

    if (format.toLowerCase() === 'csv') {
      // Generate CSV template
      const headers = [
        'name', 'email', 'phone', 'ownerId', 'alias', 'dateOfBirth',
        'gstin', 'companyName', 'openingBalance', 'balanceType', 'address', 'tier'
      ];

      // Create CSV header row
      let csvContent = headers.join(',') + '\n';

      // Add sample data rows
      templateData.forEach(row => {
        const csvRow = headers.map(header => {
          const value = (row as any)[header] || '';
          // Escape values that contain commas or quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',');
        csvContent += csvRow + '\n';
      });

      // Set response headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');

      res.status(200).send(csvContent);

    } else if (format.toLowerCase() === 'xlsx') {
      // Generate XLSX template
      const worksheet = XLSX.utils.json_to_sheet(templateData);

      // Set column widths for better readability
      const columnWidths = [
        { wch: 15 }, // name
        { wch: 25 }, // email
        { wch: 15 }, // phone
        { wch: 25 }, // ownerId
        { wch: 10 }, // alias
        { wch: 12 }, // dateOfBirth
        { wch: 15 }, // gstin
        { wch: 20 }, // companyName
        { wch: 15 }, // openingBalance
        { wch: 12 }, // balanceType
        { wch: 30 }, // address
        { wch: 8 }   // tier
      ];
      worksheet['!cols'] = columnWidths;

      // Create workbook and add worksheet
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Customer Template');

      // Generate buffer
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      // Set response headers for XLSX download
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Content-Length', buffer.length.toString());

      res.status(200).send(buffer);
    }

  } catch (error) {
    console.error('Template download error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during template download',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
