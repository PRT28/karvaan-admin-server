import { Request, Response } from 'express';
import Vendor from '../models/Vendors';
import Quotation from '../models/Quotation';
import { uploadMultipleToS3, UploadedDocument } from '../utils/s3';
import { BulkUploadResult, parseCSVData, parseXLSXData } from '../utils/files';
import * as XLSX from 'xlsx';

export const createVendor = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessId || req.user?._id;

    // Handle document uploads if files are present
    let uploadedDocuments: UploadedDocument[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      if (req.files.length > 3) {
        res.status(400).json({
          success: false,
          message: 'Maximum 3 documents are allowed per vendor'
        });
        return;
      }
      uploadedDocuments = await uploadMultipleToS3(
        req.files as Express.Multer.File[],
        `vendors/${businessId}`
      );
    }

    const vendorData = {
      ...req.body,
      businessId,
      documents: uploadedDocuments
    };

    const vendor = await Vendor.create(vendorData);
    res.status(201).json({ vendor });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create vendor', message: errorMessage });
  }
};

export const getVendors = async (req: Request, res: Response) => {
  try {

    const { isDeleted } = req.query;

    // Filter by business for business users, show all for super admin
    const filter = req.user?.userType === 'super_admin' ? {} : { businessId: req.user?.businessId };

    let vendors;

    if (isDeleted) {
      vendors = await Vendor.find({...filter, isDeleted: isDeleted === 'true' ? true : false})
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });
    } else {
      vendors = await Vendor.find({...filter})
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });
    }

    // Add isDeletable field to each vendor
    const vendorsWithDeletable = await Promise.all(
      vendors.map(async (vendor) => {
        // Check if vendor is referenced in any quotations
        const quotationCount = await Quotation.countDocuments({
          vendorId: vendor._id,
          businessId: vendor.businessId
        });

        return {
          ...vendor.toObject(),
          isDeletable: quotationCount === 0
        };
      })
    );

    res.status(200).json({ vendors: vendorsWithDeletable });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch vendors', message: errorMessage });
  }
};

export const getVendorById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const vendor = await Vendor.findOne(filter)
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    res.status(200).json({ vendor });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch vendor by ID', message: errorMessage });
  }
};

export const updateVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };
    delete updateData.businessId;

    const vendor = await Vendor.findOneAndUpdate(filter, updateData, { new: true })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

     if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    res.status(200).json({ vendor });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to update vendor', message: errorMessage });
  }
};

export const deleteVendor = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    const vendor = await Vendor.findByIdAndUpdate(id, { isDeleted: true }, { new: true, runValidators: true });
     if (!vendor) {
      res.status(404).json({ message: 'Vendor not found' });
      return;
    }
    res.status(200).json({ message: 'Vendor deleted' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to delete vendor', message: errorMessage });
  }
};


export const mergeVendors = async (req: Request, res: Response): Promise<void> => {
  try {
    const { primaryVendorId, secondaryVendorsId } = req.body;

    // Validate customer IDs
    if (!primaryVendorId || secondaryVendorsId.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Both primary and secondary customer IDs are required'
      });
      return;
    }

    // Validate that IDs are not the same
    if (secondaryVendorsId.includes(primaryVendorId)) {
      res.status(400).json({
        success: false,
        message: 'Primary and secondary customer IDs cannot be the same'
      });
      return;
    }

    const primaryVendor = await Vendor.findById(primaryVendorId);

    if (!primaryVendor) {
      res.status(404).json({
        success: false,
        message: 'Primary customer not found'
      });
      return;
    }

    for (const id of secondaryVendorsId) {
      if (id === primaryVendorId) {
        res.status(400).json({
          success: false,
          message: 'Primary and secondary customer IDs cannot be the same'
        });
        return;
      }

      const secondaryCustomer = await Vendor.findById(id);

      if (!secondaryCustomer) {
        res.status(404).json({
          success: false,
          message: `Secondary customer with ID ${id} not found`
        });
        return;
      }
      
    }

    const quotationUpdate = await Quotation.updateMany(
      {
        vendorId: { $in: secondaryVendorsId }
      },
      {
        $set: { vendorId: primaryVendorId }
      }
    );

    await Vendor.deleteMany({ _id: { $in: secondaryVendorsId } });

    res.status(200).json({
      success: true,
      message: 'Vendors merged successfully',
      quotationUpdate
    });

  } catch (error) {
    console.error('Merge vendors error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during customer merge',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}


// Helper function to validate vendors data
const validateVendorData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields validation
  if (!data.companyName || typeof data.companyName !== 'string' || data.companyName.trim() === '') {
    errors.push('Company Name is required and must be a non-empty string');
  }

  if (!data.contactPerson || typeof data.contactPerson !== 'string' || data.contactPerson.trim() === '') {
    errors.push('Contact Person is required and must be a non-empty string');
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


export const bulkUploadVendors = async (req: Request, res: Response): Promise<void> => {
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
        const validation = validateVendorData(rowData);

        if (!validation.isValid) {
          result.errors.push({
            row: rowIndex,
            data: rowData,
            error: validation.errors.join(', ')
          });
          result.failedRecords++;
          continue;
        }

        // Prepare customer data
        const vendorData = {
          companyName: rowData.companyName.trim(),
          contactPerson: rowData.contactPerson.trim(),
          alias: rowData.alias ? rowData.alias.trim() : undefined,
          dateOfBirth: rowData.dateOfBirth ? new Date(rowData.dateOfBirth) : undefined,
          openingBalance: rowData.openingBalance ? Number(rowData.openingBalance) : undefined,
          balanceType: rowData.balanceType || undefined,
          email: rowData.email.trim().toLowerCase(),
          phone: rowData.phone.trim(),
          GSTIN: rowData.GSTIN || undefined,
          address: rowData.address || undefined,
          businessId: businessId,
          tier: rowData.tier || undefined,
          isDeleted: false,
        };

        // Create customer
        const vendor = await Vendor.create(vendorData);
        result.createdCustomers.push(vendor);
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
      message: `Bulk upload completed. ${result.successfulRecords} vendors created successfully, ${result.failedRecords} failed.`
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


const getTemplateData = () => {
  return [
    {
      companyName: "Acme Supplies Pvt Ltd",
      contactPerson: "Rohit Sharma",
      alias: "Acme",
      dateOfBirth: "1985-07-20",
      openingBalance: 5000,
      balanceType: "credit",
      email: "contact@acmesupplies.com",
      phone: "+919876543210",
      GSTIN: "27ABCDE1234F1Z5",
      address: "Plot 42, Industrial Area, Pune, Maharashtra",
      tier: "tier1"
    },
    {
      companyName: "Global Traders",
      contactPerson: "Anita Verma",
      alias: "",
      dateOfBirth: "",
      openingBalance: 12000,
      balanceType: "debit",
      email: "sales@globaltraders.in",
      phone: "+919812345678",
      GSTIN: "",
      address: "12/5 Market Lane, Delhi",
      tier: "tier2"
    },
    {
      companyName: "Metro Wholesale",
      contactPerson: "Sandeep Kumar",
      alias: "MetroW",
      dateOfBirth: "1992-11-05",
      openingBalance: 0,
      balanceType: "credit",
      email: "metro@wholesale.com",
      phone: "+918765432198",
      GSTIN: "29FGHIJ5678K2Z6",
      address: "Block C, Sector 21, Bengaluru, Karnataka",
      tier: "tier3"
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
        "companyName",
        "contactPerson",
        "alias",
        "dateOfBirth",
        "openingBalance",
        "balanceType",
        "email",
        "phone",
        "GSTIN",
        "address",
        "tier"
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
        { wch: 25 }, // companyName
        { wch: 20 }, // contactPerson
        { wch: 12 }, // alias
        { wch: 15 }, // dateOfBirth
        { wch: 15 }, // openingBalance
        { wch: 12 }, // balanceType
        { wch: 25 }, // email
        { wch: 15 }, // phone
        { wch: 18 }, // GSTIN
        { wch: 35 }, // address
        { wch: 10 }  // tier
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
