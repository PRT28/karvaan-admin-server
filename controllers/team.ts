import { Request, Response } from 'express';
import Team from '../models/Team';
import Quotation from '../models/Quotation';
import Logs from '../models/Logs';
import mongoose from 'mongoose';
import { uploadMultipleToS3, UploadedDocument } from '../utils/s3';
import { BulkUploadResult, parseCSVData, parseXLSXData } from '../utils/files';
import * as XLSX from 'xlsx';

export const createTeam = async (req: Request, res: Response) => {
  try {
    const businessId = req.user?.businessInfo?.businessId;

    // Handle document uploads if files are present
    let uploadedDocuments: UploadedDocument[] = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      if (req.files.length > 3) {
        res.status(400).json({
          success: false,
          message: 'Maximum 3 documents are allowed per team member'
        });
        return;
      }
      uploadedDocuments = await uploadMultipleToS3(
        req.files as Express.Multer.File[],
        `teams/${businessId}`
      );
    }

    const teamData = {
      ...req.body,
      businessId,
      documents: uploadedDocuments
    };

    const team = await Team.create(teamData);
    res.status(201).json({ team });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to create team', message: errorMessage });
  }
};

export const getTeams = async (req: Request, res: Response) => {
  try {
    console.log('Fetching all teams');

    // Filter by business for business users, show all for super admin
    const filter = req.user?.userType === 'super_admin' ? {} : { businessId: req.user?.businessId };

    const teams = await Team.find(filter)
      .populate({
        path: 'roleId',
        select: 'roleName -_id', // Only get roleName
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    // Add isDeletable field to each team member
    const teamsWithDeletable = await Promise.all(
      teams.map(async (team) => {
        // Check if team member is referenced in any quotations (owner field)
        const quotationCount = await Quotation.countDocuments({
          owner: team._id,
          businessId: team.businessId
        });

        // Check if team member is referenced in any logs (userId, assignedBy, or assignedTo fields)
        const logCount = await Logs.countDocuments({
          $or: [
            { userId: team._id },
            { assignedBy: team._id },
            { assignedTo: team._id }
          ],
          businessId: team.businessId
        });

        return {
          ...team.toObject(),
          isDeletable: quotationCount === 0 && logCount === 0
        };
      })
    );

    res.status(200).json(teamsWithDeletable);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams', message: errorMessage });
  }
};

export const getTeamById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const team = await Team.findOne(filter)
      .populate({
        path: 'roleId',
        select: 'roleName -_id',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }
    res.status(200).json({ team });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to fetch team by ID', message: errorMessage });
  }
};

export const updateTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    // Don't allow updating businessId through this endpoint
    const updateData = { ...req.body };
    delete updateData.businessId;

    const team = await Team.findOneAndUpdate(filter, updateData, { new: true })
      .populate({
        path: 'roleId',
        select: 'roleName -_id',
      })
      .populate({
        path: 'businessId',
        select: 'businessName businessType',
      });

    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }
    res.status(200).json({ team });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to update team', message: errorMessage });
  }
};

export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    // Build filter based on user type
    const filter: any = { _id: req.params.id };
    if (req.user?.userType !== 'super_admin') {
      filter.businessId = req.user?.businessId;
    }

    const id = req.params.id;

    const team = await Team.findByIdAndUpdate(id, {isDeleted: true}, { new: true, runValidators: true });
    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }
    res.status(200).json({ message: 'Team deleted' });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
    res.status(500).json({ error: 'Failed to delete team', message: errorMessage });
  }
};


// Helper function to validate teams data
const validateTeamsData = (data: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Required fields validation
  if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!data.designation || typeof data.designation !== 'string' || data.designation.trim() === '') {
    errors.push('Designation is required and must be a non-empty string');
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
  if (data.status && !['Former', 'Current'].includes(data.status)) {
    errors.push('Status must be one of: Former, Current');
  }

  if (data.dateOfBirth && isNaN(Date.parse(data.dateOfBirth))) {
    errors.push('DateOfBirth must be a valid date');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};


export const bulkUploadTeams = async (req: Request, res: Response): Promise<void> => {
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
        const validation = validateTeamsData(rowData);

        if (!validation.isValid) {
          result.errors.push({
            row: rowIndex,
            data: rowData,
            error: validation.errors.join(', ')
          });
          result.failedRecords++;
          continue;
        }

        const teamData = {
          name: rowData.name.trim(),
          email: rowData.email.trim().toLowerCase(),
          dateOfBirth: rowData.dateOfBirth ? new Date(rowData.dateOfBirth) : undefined,
          gender: rowData.gender || undefined,
          emergencyContact: rowData.emergencyContact || undefined,
          alias: rowData.alias || undefined,
          designation: rowData.designation.tirm(),
          dateOfJoining: rowData.dateOfJoining ? new Date(rowData.dateOfJoining) : undefined,
          dateOfLeaving: rowData.dateOfLeaving ? new Date(rowData.dateOfLeaving) : undefined,
          phone: rowData.phone.trim(),
          address: rowData.gender || undefined,
          businessId: businessId,
          roleId: rowData.roleId.trim(),
          status: rowData.status.trim()
        }

        // Create team
        const team = await Team.create(teamData);
        result.createdCustomers.push(team);
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
      message: `Bulk upload completed. ${result.successfulRecords} employees created successfully, ${result.failedRecords} failed.`
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
      name: "Amit Sharma",
      email: "amit.sharma@example.com",
      dateOfBirth: "1990-03-12",
      gender: "male",
      emergencyContact: "+919876543210",
      alias: "Amit",
      designation: "Sales Executive",
      dateOfJoining: "2020-05-15",
      dateOfLeaving: "",
      phone: "+919812345678",
      address: "123 Main Street, New Delhi",
      roleId: "ROL1001",
      status: "active"
    },
    {
      name: "Sneha Kapoor",
      email: "sneha.kapoor@example.com",
      dateOfBirth: "1994-08-25",
      gender: "female",
      emergencyContact: "+918888222111",
      alias: "",
      designation: "HR Manager",
      dateOfJoining: "2019-09-10",
      dateOfLeaving: "",
      phone: "+917777444333",
      address: "Tower B, Sector 62, Noida",
      roleId: "ROL1002",
      status: "active"
    },
    {
      name: "Rakesh Verma",
      email: "rakesh.verma@example.com",
      dateOfBirth: "1988-12-05",
      gender: "male",
      emergencyContact: "+919999888777",
      alias: "RV",
      designation: "Accountant",
      dateOfJoining: "2018-01-20",
      dateOfLeaving: "2024-02-01",
      phone: "+919652341890",
      address: "MG Road, Bengaluru",
      roleId: "ROL1003",
      status: "inactive"
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
          "name",
          "email",
          "dateOfBirth",
          "gender",
          "emergencyContact",
          "alias",
          "designation",
          "dateOfJoining",
          "dateOfLeaving",
          "phone",
          "address",
          "roleId",
          "status"
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
        { wch: 20 }, // name
        { wch: 25 }, // email
        { wch: 15 }, // dateOfBirth
        { wch: 10 }, // gender
        { wch: 18 }, // emergencyContact
        { wch: 12 }, // alias
        { wch: 20 }, // designation
        { wch: 15 }, // dateOfJoining
        { wch: 15 }, // dateOfLeaving
        { wch: 15 }, // phone
        { wch: 35 }, // address
        { wch: 12 }, // roleId
        { wch: 10 }  // status
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
