import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Configure multer for document uploads
const storage = multer.memoryStorage();

// File filter to allow common document types
const documentFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    // PDF
    'application/pdf',
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    // Text
    'text/plain',
  ];

  const allowedExtensions = [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.gif',
    '.webp',
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.txt',
  ];

  const fileExtension = file.originalname
    .toLowerCase()
    .substring(file.originalname.lastIndexOf('.'));

  if (
    allowedMimeTypes.includes(file.mimetype) ||
    allowedExtensions.includes(fileExtension)
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Allowed types: PDF, JPG, PNG, GIF, WEBP, DOC, DOCX, XLS, XLSX, TXT'
      )
    );
  }
};

// Configure multer for document uploads
const documentUpload = multer({
  storage: storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit per file
    files: 3, // Maximum 3 files
  },
});

// Middleware to upload up to 3 documents
export const uploadQuotationDocuments = documentUpload.array('documents', 3);

// Wrapper to handle multer errors in the upload middleware
export const handleDocumentUploadError = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadQuotationDocuments(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size allowed is 5MB per file.',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files. Maximum 3 documents are allowed.',
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected field name. Use "documents" as the field name.',
          });
        }
      }

      if (
        err.message ===
        'Invalid file type. Allowed types: PDF, JPG, PNG, GIF, WEBP, DOC, DOCX, XLS, XLSX, TXT'
      ) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error uploading documents',
        error: err.message,
      });
    }
    next();
  });
};

// Image-only filter for profile images
const imageFileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed'));
  }
};

// Configure multer for profile image uploads (single file)
const profileImageUpload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit for profile images
    files: 1,
  },
});

// Middleware to upload single profile image
export const uploadProfileImageMiddleware = profileImageUpload.single('profileImage');

// Wrapper to handle profile image upload errors
export const handleProfileImageUploadError = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  uploadProfileImageMiddleware(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'File too large. Maximum size allowed is 2MB for profile images.',
          });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return res.status(400).json({
            success: false,
            message: 'Unexpected field name. Use "profileImage" as the field name.',
          });
        }
      }

      if (err.message === 'Invalid file type. Only JPEG, PNG, GIF, and WEBP images are allowed') {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: 'Error uploading profile image',
        error: err.message,
      });
    }
    next();
  });
};
